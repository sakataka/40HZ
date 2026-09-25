import type { BlindCondition, Program } from '../session/types';

export type TrackingMode = 'off' | 'checkin' | 'experiment';

export type ReactionSummary = {
  medianMs: number;
  lapses: number;
  falseStarts: number;
  trials: number;
};

/** Self-ratings on a 0–10 scale. */
export type CheckIn = {
  fatigue: number;
  mood: number;
  clarity: number;
  reaction?: ReactionSummary;
};

export type SessionRecord = {
  id: string;
  startedAt: number;
  endedAt: number;
  plannedMinutes: number;
  profileId: string;
  program: Program;
  condition?: BlindCondition;
  completed: boolean;
  pre?: CheckIn;
  post?: CheckIn;
};

export type TrackingPrefs = {
  mode: TrackingMode;
  reactionTest: boolean;
};

export type TrackingData = {
  prefsVersion?: number;
  prefs: TrackingPrefs;
  records: SessionRecord[];
  experimentQueue: BlindCondition[];
};

export type HealthSample = {
  kind: 'hr' | 'hrv';
  at: number;
  value: number;
};
