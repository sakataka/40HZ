import { getRecommendationProfile } from '../features/session/presets';
import type {
  CalibrationResult,
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

export const DEFAULT_CALIBRATION: CalibrationResult = {
  preferredBaseToneHz: 220,
  completedAt: null,
  skipped: false,
};

export const BASE_TONE_LIMITS = {
  min: 180,
  max: 520,
} as const;

const LIMITS = {
  carrierHz: BASE_TONE_LIMITS,
  masterVolume: { min: 0.05, max: 0.9 },
  durationMinutes: { min: 1, max: 60 },
  backgroundNoiseLevel: { min: 0, max: 0.3 },
} as const;

export function deriveSessionSettings(
  profileId: string,
  userContext: UserContext,
  calibration: CalibrationResult,
): SessionSettings {
  const profile = getRecommendationProfile(profileId);
  const sensitivity = userContext.soundSensitivity;
  const outputMode = userContext.outputMode;

  return validateSessionSettings({
    pulseHz: 40,
    carrierHz: normalizeBaseToneHz(calibration.preferredBaseToneHz),
    masterVolume: getStartingVolume(profile.id, sensitivity, outputMode),
    durationMinutes: profile.durationMinutes,
    fadeInSec: 0,
    fadeOutSec: 0,
    backgroundNoiseLevel: getNoiseLevel(profile.id, outputMode),
    profileId: profile.id,
    modulationStyle: profile.modulationStyle,
  });
}

export function deriveCalibrationPreviewSettings(
  userContext: UserContext,
  carrierHz: number,
): SessionSettings {
  return validateSessionSettings({
    ...deriveSessionSettings('recommended', userContext, {
      preferredBaseToneHz: carrierHz,
      completedAt: Date.now(),
      skipped: false,
    }),
    durationMinutes: 1,
    fadeInSec: 0,
    fadeOutSec: 0,
  });
}

export function validateSessionSettings(input: SessionSettings): SessionSettings {
  return {
    pulseHz: 40,
    carrierHz: normalizeBaseToneHz(input.carrierHz),
    masterVolume: round(clamp(input.masterVolume, LIMITS.masterVolume.min, LIMITS.masterVolume.max)),
    durationMinutes: Math.round(
      clamp(input.durationMinutes, LIMITS.durationMinutes.min, LIMITS.durationMinutes.max),
    ),
    fadeInSec: 0,
    fadeOutSec: 0,
    backgroundNoiseLevel: round(
      clamp(input.backgroundNoiseLevel, LIMITS.backgroundNoiseLevel.min, LIMITS.backgroundNoiseLevel.max),
    ),
    profileId: input.profileId || 'recommended',
    modulationStyle: input.modulationStyle ?? 'sine',
  };
}

export function mergeSessionSettings(
  current: SessionSettings,
  updates: Partial<SessionSettings>,
): SessionSettings {
  return validateSessionSettings({
    ...current,
    ...updates,
    pulseHz: 40,
  });
}

export function normalizeBaseToneHz(value: number | null | undefined): number {
  return Math.round(
    clamp(value ?? DEFAULT_CALIBRATION.preferredBaseToneHz, BASE_TONE_LIMITS.min, BASE_TONE_LIMITS.max),
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
