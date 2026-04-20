import type { SessionSettings, AudioEngineState, StopReason } from '../features/session/types';

export interface AudioEngine {
  start(settings: SessionSettings): Promise<void>;
  stop(reason?: StopReason): Promise<void>;
  update(settings: Partial<SessionSettings>): void;
  getState(): AudioEngineState;
}

type RunningNodes = {
  context: AudioContext;
  node: AudioWorkletNode;
  output: GainNode;
};

export class IsochronicAudioEngine implements AudioEngine {
  private nodes: RunningNodes | null = null;
  private state: AudioEngineState = {
    status: 'idle',
    lastReason: 'manual',
  };
  private latestSettings: SessionSettings | null = null;

  async start(settings: SessionSettings): Promise<void> {
    this.latestSettings = settings;

    if (this.nodes) {
      this.update(settings);
      await this.nodes.context.resume();
      this.state = { status: 'running', lastReason: 'manual' };
      return;
    }

    this.state = { status: 'starting', lastReason: 'manual' };

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
      output.gain.setValueAtTime(0, context.currentTime);
      output.gain.linearRampToValueAtTime(
        settings.masterVolume,
        context.currentTime + settings.fadeInSec,
      );

      this.state = { status: 'running', lastReason: 'manual' };
    } catch (error) {
      this.state = { status: 'error', lastReason: 'error', error: toErrorMessage(error) };
      await this.forceClose();
      throw error;
    }
  }

  async stop(reason: StopReason = 'manual'): Promise<void> {
    const active = this.nodes;
    const currentSettings = this.latestSettings;

    if (!active || !currentSettings) {
      this.state = { status: 'idle', lastReason: reason };
      return;
    }

    this.state = { status: 'stopping', lastReason: reason };

    const fadeOutAt = active.context.currentTime + currentSettings.fadeOutSec;
    active.output.gain.cancelScheduledValues(active.context.currentTime);
    active.output.gain.setValueAtTime(active.output.gain.value, active.context.currentTime);
    active.output.gain.linearRampToValueAtTime(0, fadeOutAt);
    await wait(currentSettings.fadeOutSec * 1000 + 50);
    await this.forceClose();
    this.state = { status: 'idle', lastReason: reason };
  }

  update(settings: Partial<SessionSettings>): void {
    if (!this.latestSettings) {
      return;
    }

    this.latestSettings = { ...this.latestSettings, ...settings };

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

  getState(): AudioEngineState {
    return this.state;
  }

  private applyToNode(settings: SessionSettings): void {
    if (!this.nodes) {
      return;
    }

    const { context, node } = this.nodes;
    node.parameters.get('carrierHz')?.setValueAtTime(settings.carrierHz, context.currentTime);
    node.parameters.get('pulseHz')?.setValueAtTime(settings.pulseHz, context.currentTime);
    node.parameters
      .get('modulationMode')
      ?.setValueAtTime(settings.modulationStyle === 'gated' ? 1 : 0, context.currentTime);
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

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown audio engine error';
}

export const sharedAudioEngine = new IsochronicAudioEngine();

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}
