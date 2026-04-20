class IsochronicProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'carrierHz', defaultValue: 160, minValue: 80, maxValue: 300 },
      { name: 'pulseHz', defaultValue: 40, minValue: 40, maxValue: 40 },
      { name: 'modulationMode', defaultValue: 0, minValue: 0, maxValue: 1 },
      { name: 'noiseLevel', defaultValue: 0.08, minValue: 0, maxValue: 0.4 },
    ];
  }

  constructor() {
    super();
    this.phase = 0;
    this.pulsePhase = 0;
    this.envelope = 0;
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
      const carrierHz = readParam(parameters.carrierHz, i);
      const pulseHz = readParam(parameters.pulseHz, i);
      const modulationMode = readParam(parameters.modulationMode, i);
      const noiseLevel = readParam(parameters.noiseLevel, i);

      this.phase += carrierHz / sampleRateValue;
      this.pulsePhase += pulseHz / sampleRateValue;

      if (this.phase >= 1) {
        this.phase -= 1;
      }

      if (this.pulsePhase >= 1) {
        this.pulsePhase -= 1;
      }

      const envelopeTarget =
        modulationMode < 0.5
          ? 0.18 + 0.82 * ((Math.sin(this.pulsePhase * Math.PI * 2 - Math.PI / 2) + 1) * 0.5)
          : this.pulsePhase < 0.5
            ? 1
            : 0.05;
      const smoothing = envelopeTarget > this.envelope ? 0.022 : 0.008;
      this.envelope += (envelopeTarget - this.envelope) * smoothing;

      const tone = Math.sin(this.phase * Math.PI * 2) * this.envelope;
      const pink = this.createPinkNoise();
      const sample = tone * 0.88 + pink * noiseLevel * 0.45;

      for (let channel = 0; channel < channelCount; channel += 1) {
        output[channel][i] = sample;
      }
    }

    return true;
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

function readParam(param, index) {
  return param.length === 1 ? param[0] : param[index];
}

registerProcessor('isochronic-processor', IsochronicProcessor);
