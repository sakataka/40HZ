export type SoundSensitivity = 'standard' | 'sensitive';

export type OutputMode = 'headphones' | 'speaker';

export type Program = 'gamma' | 'breath' | 'noise';

export type EvidenceLevel = 'moderate' | 'limited' | 'experimental';

export type NoiseColor = 'pink' | 'brown' | 'ocean' | 'rain' | 'wind' | 'fire';

/** What the listener wants right now; used to group the sound library. */
export type Mood = 'calm' | 'focus' | 'rest';

export type BreathPattern = {
  inhaleSec: number;
  topUpSec: number;
  exhaleSec: number;
};

export type RecommendationProfile = {
  id: string;
  label: string;
  summary: string;
  description: string;
  evidenceLevel: EvidenceLevel;
  program: Program;
  mood: Mood;
  modulationStyle: 'sine' | 'gated';
  breath?: BreathPattern;
  noiseColor?: NoiseColor;
  durationMinutes: number;
};

/** Blind comparison arm: real 40 Hz pulses or aperiodic pulses with the same average rate. */
export type BlindCondition = 'active' | 'sham';

export type StartOptions = {
  condition?: BlindCondition;
};

export type UserContext = {
  soundSensitivity: SoundSensitivity;
  outputMode: OutputMode;
  completedAt: number | null;
};

export type CalibrationResult = {
  completedAt: number | null;
};

export type SessionSettings = {
  carrierHz: number;
  masterVolume: number;
  durationMinutes: number;
  backgroundNoiseLevel: number;
  profileId: string;
};

export type SessionState = {
  status: 'idle' | 'starting' | 'running' | 'stopping';
  endsAt: number | null;
  remainingMs: number;
};

export type SessionEndInfo = {
  startedAt: number;
  endedAt: number;
  plannedMinutes: number;
  completed: boolean;
};
