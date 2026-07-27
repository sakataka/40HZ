export type SoundSensitivity = 'standard' | 'sensitive';

export type OutputMode = 'headphones' | 'speaker';

export type RecommendationProfile = {
  id: string;
  label: string;
  summary: string;
  description: string;
  evidenceLevel: 'limited' | 'experimental';
  modulationStyle: 'sine' | 'gated';
  durationMinutes: number;
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
