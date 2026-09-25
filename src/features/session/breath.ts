import type { BreathPattern } from './types';

export type BreathStage = 'inhale' | 'topUp' | 'exhale';

export type BreathPoint = {
  stage: BreathStage;
  /** 0 = empty lungs, 1 = full. Mirrors the envelope in isochronic-processor.js. */
  level: number;
};

const INHALE_PEAK_WITH_TOP_UP = 0.8;

export function breathCycleSec(pattern: BreathPattern): number {
  return pattern.inhaleSec + pattern.topUpSec + pattern.exhaleSec;
}

export function breathsPerMinute(pattern: BreathPattern): number {
  return Math.round((600 / breathCycleSec(pattern))) / 10;
}

export function breathPointAt(elapsedSec: number, pattern: BreathPattern): BreathPoint {
  const cycle = breathCycleSec(pattern);
  const position = ((elapsedSec % cycle) + cycle) % cycle;
  const inhalePeak = pattern.topUpSec > 0 ? INHALE_PEAK_WITH_TOP_UP : 1;

  if (position < pattern.inhaleSec) {
    return { stage: 'inhale', level: inhalePeak * ease(position / pattern.inhaleSec) };
  }

  if (position < pattern.inhaleSec + pattern.topUpSec) {
    const progress = (position - pattern.inhaleSec) / pattern.topUpSec;
    return { stage: 'topUp', level: inhalePeak + (1 - inhalePeak) * ease(progress) };
  }

  const progress = (position - pattern.inhaleSec - pattern.topUpSec) / pattern.exhaleSec;
  return { stage: 'exhale', level: 1 - ease(progress) };
}

function ease(progress: number): number {
  return 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, progress)));
}
