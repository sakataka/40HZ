export type StopReason = 'manual' | 'timer' | 'error';

export type EvidenceLevel = 'limited' | 'experimental';

export type SoundSensitivity = 'standard' | 'sensitive';

export type OutputMode = 'headphones' | 'speaker';

export type ModulationStyle = 'sine' | 'gated';

export type RecommendationProfile = {
  id: string;
  label: string;
  summary: string;
  description: string;
  evidenceLevel: EvidenceLevel;
  modulationStyle: ModulationStyle;
  durationMinutes: number;
};

export type UserContext = {
  soundSensitivity: SoundSensitivity;
  outputMode: OutputMode;
  completedAt: number | null;
};

export type CalibrationResult = {
  preferredBaseToneHz: number;
  completedAt: number | null;
  skipped: boolean;
};

export type SessionSettings = {
  pulseHz: 40;
  carrierHz: number;
  masterVolume: number;
  durationMinutes: number;
  fadeInSec: number;
  fadeOutSec: number;
  backgroundNoiseLevel: number;
  profileId: string;
  modulationStyle: ModulationStyle;
};

export type SessionStateStatus = 'idle' | 'starting' | 'running' | 'stopping';

export type SessionState = {
  status: SessionStateStatus;
  startedAt: number | null;
  endsAt: number | null;
  remainingMs: number;
  acceptedSafetyNotice: boolean;
};

export type AudioEngineState = {
  status: SessionStateStatus | 'error';
  lastReason: StopReason;
  error?: string;
};
