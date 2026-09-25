import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IsochronicAudioEngine } from '../src/audio/engine';
import type { SessionSettings } from '../src/features/session/types';

const BASE_SETTINGS: SessionSettings = {
  carrierHz: 220,
  masterVolume: 0.24,
  durationMinutes: 20,
  backgroundNoiseLevel: 0.025,
  profileId: 'recommended',
};

class FakeAudioParam {
  cancelScheduledValues = vi.fn();
  linearRampToValueAtTime = vi.fn();
  setValueAtTime = vi.fn();
}

class FakeGainNode {
  connect = vi.fn();
  disconnect = vi.fn();
  gain = new FakeAudioParam();
}

class FakeAudioWorkletNode {
  connect = vi.fn();
  disconnect = vi.fn();
  parameters = new Map([
    ['carrierHz', new FakeAudioParam()],
    ['modulationMode', new FakeAudioParam()],
    ['noiseLevel', new FakeAudioParam()],
    ['program', new FakeAudioParam()],
    ['inhaleSec', new FakeAudioParam()],
  ]);

  constructor() {
    lastWorkletNode = this;
  }
}

class FakeAudioContext {
  audioWorklet = {
    addModule: vi.fn().mockResolvedValue(undefined),
  };
  close = vi.fn().mockResolvedValue(undefined);
  createGain = vi.fn(() => {
    lastGainNode = new FakeGainNode();
    return lastGainNode;
  });
  currentTime = 1;
  destination = {};
  resume = vi.fn().mockResolvedValue(undefined);
}

let lastGainNode: FakeGainNode | null = null;
let lastWorkletNode: FakeAudioWorkletNode | null = null;

describe('IsochronicAudioEngine', () => {
  beforeEach(() => {
    lastGainNode = null;
    lastWorkletNode = null;
    vi.stubGlobal('AudioContext', FakeAudioContext);
    vi.stubGlobal('AudioWorkletNode', FakeAudioWorkletNode);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('skips worklet and volume updates when settings do not affect audio output', async () => {
    const engine = new IsochronicAudioEngine();

    await engine.start(BASE_SETTINGS);

    const carrierParam = lastWorkletNode?.parameters.get('carrierHz');
    const modulationParam = lastWorkletNode?.parameters.get('modulationMode');
    const gainParam = lastGainNode?.gain;
    expect(carrierParam?.setValueAtTime).toHaveBeenCalledTimes(1);
    expect(modulationParam?.setValueAtTime).toHaveBeenLastCalledWith(0, 1);
    expect(gainParam?.linearRampToValueAtTime).not.toHaveBeenCalled();

    engine.update({ durationMinutes: 30 });

    expect(carrierParam?.setValueAtTime).toHaveBeenCalledTimes(1);
    expect(gainParam?.linearRampToValueAtTime).not.toHaveBeenCalled();

    engine.update({ masterVolume: 0.3 });

    expect(carrierParam?.setValueAtTime).toHaveBeenCalledTimes(2);
    expect(gainParam?.linearRampToValueAtTime).toHaveBeenCalledWith(0.3, 1.12);

    engine.update({ profileId: 'exploratory' });

    expect(modulationParam?.setValueAtTime).toHaveBeenLastCalledWith(1, 1);

    await engine.stop();
  });

  it('switches to aperiodic pulses for the blind sham arm and drives breath programs', async () => {
    const engine = new IsochronicAudioEngine();

    await engine.start(BASE_SETTINGS, { condition: 'sham' });
    expect(lastWorkletNode?.parameters.get('modulationMode')?.setValueAtTime).toHaveBeenLastCalledWith(2, 1);
    await engine.stop();

    await engine.start({ ...BASE_SETTINGS, profileId: 'breath-resonance' });
    expect(lastWorkletNode?.parameters.get('modulationMode')?.setValueAtTime).toHaveBeenLastCalledWith(0, 1);
    expect(lastWorkletNode?.parameters.get('program')?.setValueAtTime).toHaveBeenLastCalledWith(1, 1);
    expect(lastWorkletNode?.parameters.get('inhaleSec')?.setValueAtTime).toHaveBeenLastCalledWith(4.5, 1);
    await engine.stop();
  });
});
