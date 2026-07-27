import { getRecommendationProfile } from '../features/session/presets';
import type {
  OutputMode,
  SessionSettings,
  SoundSensitivity,
  UserContext,
} from '../features/session/types';

export const DEFAULT_USER_CONTEXT: UserContext = {
  soundSensitivity: 'standard',
  outputMode: 'headphones',
  completedAt: null,
};

export const SESSION_LIMITS = {
  carrierHz: { min: 180, max: 520 },
  masterVolume: { min: 0.05, max: 0.9 },
  durationMinutes: { min: 1, max: 60 },
  backgroundNoiseLevel: { min: 0, max: 0.3 },
} as const;

export function deriveSessionSettings(
  profileId: string,
  userContext: UserContext,
  carrierHz = 220,
): SessionSettings {
  const profile = getRecommendationProfile(profileId);
  const sensitivity = userContext.soundSensitivity;
  const outputMode = userContext.outputMode;

  return validateSessionSettings({
    carrierHz,
    masterVolume: getStartingVolume(profile.id, sensitivity, outputMode),
    durationMinutes: profile.durationMinutes,
    backgroundNoiseLevel: getNoiseLevel(profile.id, outputMode),
    profileId: profile.id,
  });
}

export function deriveCalibrationPreviewSettings(
  userContext: UserContext,
  carrierHz: number,
): SessionSettings {
  return validateSessionSettings({
    ...deriveSessionSettings('recommended', userContext, carrierHz),
    durationMinutes: 1,
  });
}

export function validateSessionSettings(input: SessionSettings): SessionSettings {
  return {
    carrierHz: normalizeBaseToneHz(input.carrierHz),
    masterVolume: round(
      clamp(input.masterVolume, SESSION_LIMITS.masterVolume.min, SESSION_LIMITS.masterVolume.max),
    ),
    durationMinutes: Math.round(
      clamp(
        input.durationMinutes,
        SESSION_LIMITS.durationMinutes.min,
        SESSION_LIMITS.durationMinutes.max,
      ),
    ),
    backgroundNoiseLevel: round(
      clamp(
        input.backgroundNoiseLevel,
        SESSION_LIMITS.backgroundNoiseLevel.min,
        SESSION_LIMITS.backgroundNoiseLevel.max,
      ),
    ),
    profileId: getRecommendationProfile(input.profileId).id,
  };
}

export function mergeSessionSettings(
  current: SessionSettings,
  updates: Partial<SessionSettings>,
): SessionSettings {
  return validateSessionSettings({
    ...current,
    ...updates,
  });
}

function normalizeBaseToneHz(value: number | null | undefined): number {
  return Math.round(
    clamp(value ?? 220, SESSION_LIMITS.carrierHz.min, SESSION_LIMITS.carrierHz.max),
  );
}

function getStartingVolume(
  profileId: string,
  sensitivity: SoundSensitivity,
  outputMode: OutputMode,
): number {
  const base =
    profileId === 'gentle'
      ? 0.18
      : profileId === 'exploratory'
        ? 0.22
        : 0.24;

  const sensitivityOffset = sensitivity === 'sensitive' ? -0.05 : 0;
  const outputOffset = outputMode === 'speaker' ? 0.03 : 0;

  return round(base + sensitivityOffset + outputOffset);
}

function getNoiseLevel(profileId: string, outputMode: OutputMode): number {
  const base =
    profileId === 'gentle'
      ? 0.03
      : profileId === 'exploratory'
        ? 0.02
        : 0.025;

  return outputMode === 'speaker' ? round(base + 0.015) : base;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
