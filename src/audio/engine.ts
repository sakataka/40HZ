import { getRecommendationProfile } from '../features/session/presets';
import type { SessionSettings } from '../features/session/types';

export interface AudioEngine {
  start(settings: SessionSettings): Promise<void>;
  stop(): Promise<void>;
  update(settings: Partial<SessionSettings>): void;
}

type RunningNodes = {
  context: AudioContext;
  node: AudioWorkletNode;
  output: GainNode;
};

export class IsochronicAudioEngine implements AudioEngine {
  private nodes: RunningNodes | null = null;
  private latestSettings: SessionSettings | null = null;

  async start(settings: SessionSettings): Promise<void> {
    this.latestSettings = settings;

    if (this.nodes) {
      this.update(settings);
      await this.nodes.context.resume();
      return;
    }

    try {
      const context = new AudioContext();
      const workletUrl = new URL('./worklets/isochronic-processor.js', import.meta.url);
      await context.audioWorklet.addModule(workletUrl);

      const node = new AudioWorkletNode(context, 'isochronic-processor', {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [2],
      });

      const output = context.createGain();
      output.gain.setValueAtTime(0, context.currentTime);

      node.connect(output);
      output.connect(context.destination);

      this.nodes = { context, node, output };
      this.applyToNode(settings);
      await context.resume();

      output.gain.cancelScheduledValues(context.currentTime);
      output.gain.setValueAtTime(settings.masterVolume, context.currentTime);

    } catch (error) {
      await this.forceClose();
      throw error;
    }
  }

  async stop(): Promise<void> {
    const active = this.nodes;

    if (!active) {
      return;
    }

    active.output.gain.cancelScheduledValues(active.context.currentTime);
    active.output.gain.setValueAtTime(0, active.context.currentTime);
    await this.forceClose();
  }

  update(settings: Partial<SessionSettings>): void {
    if (!this.latestSettings) {
      return;
    }

    const nextSettings = { ...this.latestSettings, ...settings };
    if (hasSameAudioSettings(this.latestSettings, nextSettings)) {
      return;
    }

    this.latestSettings = nextSettings;

    if (!this.nodes) {
      return;
    }

    this.applyToNode(this.latestSettings);

    const { context, output } = this.nodes;
    output.gain.cancelScheduledValues(context.currentTime);
    output.gain.linearRampToValueAtTime(
      this.latestSettings.masterVolume,
      context.currentTime + 0.12,
    );
  }

  private applyToNode(settings: SessionSettings): void {
    if (!this.nodes) {
      return;
    }

    const { context, node } = this.nodes;
    node.parameters.get('carrierHz')?.setValueAtTime(settings.carrierHz, context.currentTime);
    node.parameters
      .get('modulationMode')
      ?.setValueAtTime(
        getRecommendationProfile(settings.profileId).modulationStyle === 'gated' ? 1 : 0,
        context.currentTime,
      );
    node.parameters
      .get('noiseLevel')
      ?.setValueAtTime(settings.backgroundNoiseLevel, context.currentTime);
  }

  private async forceClose(): Promise<void> {
    if (!this.nodes) {
      return;
    }

    const { context, node, output } = this.nodes;
    node.disconnect();
    output.disconnect();
    this.nodes = null;
    await context.close();
  }
}

function hasSameAudioSettings(current: SessionSettings, next: SessionSettings): boolean {
  return (
    current.carrierHz === next.carrierHz &&
    current.profileId === next.profileId &&
    current.backgroundNoiseLevel === next.backgroundNoiseLevel &&
    current.masterVolume === next.masterVolume
  );
}

export const sharedAudioEngine = new IsochronicAudioEngine();
