import { getRecommendationProfile } from '../features/session/presets';
import type { BlindCondition, SessionSettings, StartOptions } from '../features/session/types';

export interface AudioEngine {
  start(settings: SessionSettings, options?: StartOptions): Promise<void>;
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
  private condition: BlindCondition | undefined;

  async start(settings: SessionSettings, options: StartOptions = {}): Promise<void> {
    this.latestSettings = settings;
    this.condition = options.condition;

    if (this.nodes) {
      this.applyToNode(settings);
      this.nodes.output.gain.setValueAtTime(settings.masterVolume, this.nodes.context.currentTime);
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

    const soundChanged = this.latestSettings.profileId !== nextSettings.profileId;
    this.latestSettings = nextSettings;

    if (!this.nodes) {
      return;
    }

    const { context, output } = this.nodes;
    const now = context.currentTime;
    output.gain.cancelScheduledValues(now);

    if (soundChanged) {
      // Dip to silence so switching programs mid-playback does not click.
      output.gain.setValueAtTime(output.gain.value, now);
      output.gain.linearRampToValueAtTime(0, now + SWITCH_FADE_SEC);
      this.applyToNode(nextSettings, now + SWITCH_FADE_SEC);
      output.gain.linearRampToValueAtTime(nextSettings.masterVolume, now + SWITCH_FADE_SEC * 2.5);
      return;
    }

    this.applyToNode(nextSettings);
    output.gain.linearRampToValueAtTime(nextSettings.masterVolume, now + 0.12);
  }

  private applyToNode(settings: SessionSettings, at?: number): void {
    if (!this.nodes) {
      return;
    }

    const { context, node } = this.nodes;
    const profile = getRecommendationProfile(settings.profileId);
    const time = at ?? context.currentTime;
    const setParam = (name: string, value: number) =>
      node.parameters.get(name)?.setValueAtTime(value, time);

    setParam('carrierHz', settings.carrierHz);
    setParam('modulationMode', this.getModulationMode(profile.modulationStyle));
    setParam('noiseLevel', settings.backgroundNoiseLevel);
    setParam('program', PROGRAM_CODES[profile.program]);
    setParam('noiseColor', NOISE_COLOR_CODES[profile.noiseColor ?? 'pink']);

    if (profile.breath) {
      setParam('inhaleSec', profile.breath.inhaleSec);
      setParam('topUpSec', profile.breath.topUpSec);
      setParam('exhaleSec', profile.breath.exhaleSec);
    }
  }

  private getModulationMode(style: 'sine' | 'gated'): number {
    if (this.condition === 'sham') {
      return 2;
    }

    return style === 'gated' ? 1 : 0;
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

const PROGRAM_CODES = { gamma: 0, breath: 1, noise: 2 } as const;
const NOISE_COLOR_CODES = { pink: 0, brown: 1, ocean: 2, rain: 3, wind: 4, fire: 5 } as const;
const SWITCH_FADE_SEC = 0.2;

function hasSameAudioSettings(current: SessionSettings, next: SessionSettings): boolean {
  return (
    current.carrierHz === next.carrierHz &&
    current.profileId === next.profileId &&
    current.backgroundNoiseLevel === next.backgroundNoiseLevel &&
    current.masterVolume === next.masterVolume
  );
}

export const sharedAudioEngine = new IsochronicAudioEngine();
