import type { ReactionSummary } from './types';

export const REACTION_TEST_SEC = 60;
export const LAPSE_MS = 500;
export const NO_RESPONSE_MS = 3000;
export const MIN_VALID_MS = 100;

/** Inter-stimulus interval of the brief PVT (PVT-B): 1–4 s. */
export function nextStimulusDelayMs(random: () => number = Math.random): number {
  return 1000 + random() * 3000;
}

export function summarizeReaction(reactionTimesMs: number[], falseStarts: number): ReactionSummary {
  const sorted = [...reactionTimesMs].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const medianMs = sorted.length === 0
    ? 0
    : sorted.length % 2
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;

  return {
    medianMs: Math.round(medianMs),
    lapses: reactionTimesMs.filter((value) => value >= LAPSE_MS).length,
    falseStarts,
    trials: reactionTimesMs.length,
  };
}
