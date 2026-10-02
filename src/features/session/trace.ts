import type { NoiseColor, RecommendationProfile } from './types';

/**
 * The player draws each sound as an oscilloscope-style trace: a slowly drifting
 * Lissajous figure for the 40 Hz programs, a circle that follows the breath
 * envelope for the breath guides, and a wavering loop for the noises.
 * Everything here moves on a scale of seconds; nothing is drawn at the 40 Hz rate.
 */
export type TraceKind = 'lissajous' | 'gated' | 'breath' | NoiseColor;

const TAU = Math.PI * 2;

type Loop = {
  base: number;
  /** [harmonic, amplitude, phase speed in rad/s] */
  waves: [number, number, number][];
  swellSec?: number;
  swell?: number;
  gust?: boolean;
  lift?: number;
};

const LOOPS: Record<NoiseColor, Loop> = {
  pink: { base: 0.64, waves: [[3, 0.034, 0.31], [5, 0.024, -0.47], [8, 0.015, 0.6], [11, 0.009, -0.8]] },
  brown: { base: 0.6, waves: [[2, 0.05, 0.12], [3, 0.034, -0.17], [5, 0.014, 0.22]] },
  // The ocean preset swells on a 9-second cycle in the audio engine as well.
  ocean: { base: 0.5, swellSec: 9, swell: 0.2, waves: [[2, 0.04, 0.1], [3, 0.028, -0.14]] },
  rain: { base: 0.64, waves: [[3, 0.024, 0.25], [13, 0.011, 1.1], [19, 0.008, -1.4], [29, 0.005, 1.7]] },
  wind: { base: 0.6, gust: true, waves: [[2, 0.06, 0.2], [3, 0.04, -0.27], [4, 0.02, 0.33]] },
  fire: { base: 0.55, lift: 0.22, waves: [[2, 0.03, 0.3], [5, 0.032, -0.9], [7, 0.022, 1.2], [9, 0.013, -1.5]] },
};

export function traceKindOf(profile: Pick<RecommendationProfile, 'breath' | 'program' | 'noiseColor' | 'modulationStyle'>): TraceKind {
  if (profile.breath) {
    return 'breath';
  }
  if (profile.program === 'noise') {
    return profile.noiseColor ?? 'pink';
  }
  return profile.modulationStyle === 'gated' ? 'gated' : 'lissajous';
}

/**
 * A point on the trace, inside the unit circle, for parameter `u` in [0, 1)
 * at time `t` seconds. `breathLevel` (0 = empty, 1 = full) only affects the breath trace.
 */
export function tracePoint(kind: TraceKind, u: number, t: number, breathLevel: number): [number, number] {
  const theta = u * TAU;

  if (kind === 'lissajous') {
    const phase = (t * TAU) / 28;
    return [Math.sin(2 * theta + phase) * 0.8, Math.sin(3 * theta) * 0.8];
  }

  if (kind === 'gated') {
    const phase = (t * TAU) / 22;
    return [soften(Math.sin(3 * theta + phase)) * 0.78, soften(Math.sin(4 * theta)) * 0.78];
  }

  if (kind === 'breath') {
    const radius = (0.3 + 0.6 * breathLevel) * (1 + 0.004 * Math.sin(3 * theta + t * 0.5));
    return [Math.cos(theta) * radius, Math.sin(theta) * radius];
  }

  const loop = LOOPS[kind];
  const gust = loop.gust ? 0.55 + 0.45 * Math.sin(t * 0.31) * Math.sin(t * 0.17 + 1) : 1;
  const swell = loop.swellSec ? 1 + (loop.swell ?? 0) * (0.5 - 0.5 * Math.cos((TAU * t) / loop.swellSec)) : 1;
  let radius = loop.base * swell;
  for (const [harmonic, amplitude, speed] of loop.waves) {
    radius += amplitude * gust * Math.sin(harmonic * theta + speed * t + harmonic);
  }
  const x = Math.cos(theta) * radius;
  let y = Math.sin(theta) * radius;
  if (loop.lift && y < 0) {
    // Canvas y points down, so this stretches the top half into a flame.
    y *= 1 + loop.lift;
  }
  return [x, y];
}

/** Rounds the corners of a sine so the gated pulse reads as harder-edged. */
function soften(value: number): number {
  return Math.tanh(2.4 * value) / Math.tanh(2.4);
}

/** SVG path of the trace at a fixed moment, for static marks such as the app icon. */
export function tracePath(kind: TraceKind, size: number, t = 0, breathLevel = 0.6, steps = 180): string {
  const half = size / 2;
  const parts: string[] = [];
  for (let index = 0; index <= steps; index += 1) {
    const [x, y] = tracePoint(kind, index / steps, t, breathLevel);
    parts.push(`${index === 0 ? 'M' : 'L'}${(half + x * half).toFixed(2)} ${(half + y * half).toFixed(2)}`);
  }
  return `${parts.join('')}Z`;
}
