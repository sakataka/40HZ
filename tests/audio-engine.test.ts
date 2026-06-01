import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IsochronicAudioEngine } from '../src/audio/engine';
import type { SessionSettings } from '../src/features/session/types';

const BASE_SETTINGS: SessionSettings = {
  pulseHz: 40,
  carrierHz: 220,
  masterVolume: 0.24,
  durationMinutes: 20,
  fadeInSec: 0,
  fadeOutSec: 0,
  backgroundNoiseLevel: 0.025,
  profileId: 'recommended',
  modulationStyle: 'sine',
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
    ['pulseHz', new FakeAudioParam()],
    ['modulationMode', new FakeAudioParam()],
    ['noiseLevel', new FakeAudioParam()],
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
    const gainParam = lastGainNode?.gain;
    expect(carrierParam?.setValueAtTime).toHaveBeenCalledTimes(1);
    expect(gainParam?.linearRampToValueAtTime).not.toHaveBeenCalled();

    engine.update({ durationMinutes: 30 });

    expect(carrierParam?.setValueAtTime).toHaveBeenCalledTimes(1);
    expect(gainParam?.linearRampToValueAtTime).not.toHaveBeenCalled();

    engine.update({ masterVolume: 0.3 });

    expect(carrierParam?.setValueAtTime).toHaveBeenCalledTimes(2);
    expect(gainParam?.linearRampToValueAtTime).toHaveBeenCalledWith(0.3, 1.12);

    await engine.stop();
  });
});
