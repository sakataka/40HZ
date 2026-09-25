// program: 0 = 40 Hz pulses, 1 = breath guide, 2 = noise only.
// modulationMode: 0 = sine, 1 = gated, 2 = aperiodic pulses with a 25 ms mean interval (blind sham).
// noiseColor: 0 = pink, 1 = brown, 2 = ocean swell.
const OCEAN_SWELL_SEC = 9;
const INHALE_PEAK_WITH_TOP_UP = 0.8;

class IsochronicProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'carrierHz', defaultValue: 220, minValue: 180, maxValue: 520 },
      { name: 'modulationMode', defaultValue: 0, minValue: 0, maxValue: 2 },
      { name: 'noiseLevel', defaultValue: 0.08, minValue: 0, maxValue: 0.4 },
      { name: 'program', defaultValue: 0, minValue: 0, maxValue: 2 },
      { name: 'noiseColor', defaultValue: 0, minValue: 0, maxValue: 2 },
      { name: 'inhaleSec', defaultValue: 4.5, minValue: 1, maxValue: 12 },
      { name: 'topUpSec', defaultValue: 0, minValue: 0, maxValue: 4 },
      { name: 'exhaleSec', defaultValue: 6.5, minValue: 1, maxValue: 12 },
    ];
  }

  constructor() {
    super();
    this.phase = 0;
    this.pulsePhase = 0;
    this.pulseHz = 40;
    this.envelope = 0;
    this.frame = 0;
    this.brown = 0;
    this.b0 = 0;
    this.b1 = 0;
    this.b2 = 0;
    this.b3 = 0;
    this.b4 = 0;
    this.b5 = 0;
    this.b6 = 0;
  }

  process(_inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output?.length) {
      return true;
    }

    const channelCount = output.length;
    const frames = output[0].length;
    const sampleRateValue = globalThis.sampleRate ?? 48000;

    for (let i = 0; i < frames; i += 1) {
      const program = Math.round(readParam(parameters.program, i));
      const noiseLevel = readParam(parameters.noiseLevel, i);
      const seconds = this.frame / sampleRateValue;
      this.frame += 1;

      let sample;
      if (program === 1) {
        sample = this.breathSample(parameters, i, seconds, noiseLevel, sampleRateValue);
      } else if (program === 2) {
        sample = this.noiseSample(Math.round(readParam(parameters.noiseColor, i)), seconds);
      } else {
        sample = this.pulseSample(parameters, i, noiseLevel, sampleRateValue);
      }

      for (let channel = 0; channel < channelCount; channel += 1) {
        output[channel][i] = sample;
      }
    }

    return true;
  }

  pulseSample(parameters, i, noiseLevel, sampleRateValue) {
    const carrierHz = readParam(parameters.carrierHz, i);
    const modulationMode = Math.round(readParam(parameters.modulationMode, i));

    this.advanceCarrier(carrierHz, sampleRateValue);
    this.pulsePhase += (modulationMode === 2 ? this.pulseHz : 40) / sampleRateValue;

    if (this.pulsePhase >= 1) {
      this.pulsePhase -= 1;
      // Same envelope shape and mean interval as the 40 Hz arm, but no fixed period.
      this.pulseHz = 1 / (0.0125 + Math.random() * 0.025);
    }

    const envelopeTarget =
      modulationMode !== 1
        ? 0.18 + 0.82 * ((Math.sin(this.pulsePhase * Math.PI * 2 - Math.PI / 2) + 1) * 0.5)
        : this.pulsePhase < 0.5
          ? 1
          : 0.05;
    const smoothing = envelopeTarget > this.envelope ? 0.022 : 0.008;
    this.envelope += (envelopeTarget - this.envelope) * smoothing;

    const tone = Math.sin(this.phase * Math.PI * 2) * this.envelope;
    return tone * 0.88 + this.createPinkNoise() * noiseLevel * 0.45;
  }

  breathSample(parameters, i, seconds, noiseLevel, sampleRateValue) {
    const level = breathLevel(
      seconds,
      readParam(parameters.inhaleSec, i),
      readParam(parameters.topUpSec, i),
      readParam(parameters.exhaleSec, i),
    );
    const carrierHz = readParam(parameters.carrierHz, i) * (0.75 + 0.25 * level);

    this.advanceCarrier(carrierHz, sampleRateValue);

    const tone = Math.sin(this.phase * Math.PI * 2) * (0.12 + 0.6 * level);
    const wind = this.createPinkNoise() * (0.2 + 0.8 * level) * (0.45 + noiseLevel * 5);
    return tone + wind;
  }

  noiseSample(noiseColor, seconds) {
    const pink = this.createPinkNoise();
    if (noiseColor === 0) {
      return pink * 1.6;
    }

    const white = Math.random() * 2 - 1;
    this.brown = (this.brown + 0.02 * white) / 1.02;
    const brown = this.brown * 5.2;
    if (noiseColor === 1) {
      return brown;
    }

    const swell = 0.5 - 0.5 * Math.cos((seconds / OCEAN_SWELL_SEC) * Math.PI * 2);
    return brown * (0.45 + 0.9 * swell ** 1.6) + pink * 0.35 * swell;
  }

  advanceCarrier(carrierHz, sampleRateValue) {
    this.phase += carrierHz / sampleRateValue;
    if (this.phase >= 1) {
      this.phase -= 1;
    }
  }

  createPinkNoise() {
    const white = Math.random() * 2 - 1;
    this.b0 = 0.99886 * this.b0 + white * 0.0555179;
    this.b1 = 0.99332 * this.b1 + white * 0.0750759;
    this.b2 = 0.969 * this.b2 + white * 0.153852;
    this.b3 = 0.8665 * this.b3 + white * 0.3104856;
    this.b4 = 0.55 * this.b4 + white * 0.5329522;
    this.b5 = -0.7616 * this.b5 - white * 0.016898;
    const pink =
      this.b0 + this.b1 + this.b2 + this.b3 + this.b4 + this.b5 + this.b6 + white * 0.5362;
    this.b6 = white * 0.115926;
    return pink * 0.11;
  }
}

// Keep in sync with breathPointAt() in src/features/session/breath.ts.
function breathLevel(seconds, inhaleSec, topUpSec, exhaleSec) {
  const cycle = inhaleSec + topUpSec + exhaleSec;
  const position = seconds % cycle;
  const inhalePeak = topUpSec > 0 ? INHALE_PEAK_WITH_TOP_UP : 1;

  if (position < inhaleSec) {
    return inhalePeak * ease(position / inhaleSec);
  }

  if (position < inhaleSec + topUpSec) {
    return inhalePeak + (1 - inhalePeak) * ease((position - inhaleSec) / topUpSec);
  }

  return 1 - ease((position - inhaleSec - topUpSec) / exhaleSec);
}

function ease(progress) {
  return 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, progress)));
}

function readParam(param, index) {
  return param.length === 1 ? param[0] : param[index];
}

registerProcessor('isochronic-processor', IsochronicProcessor);
