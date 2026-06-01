import {
  DEFAULT_CALIBRATION,
  DEFAULT_USER_CONTEXT,
  deriveSessionSettings,
  mergeSessionSettings,
  normalizeBaseToneHz,
} from '../../lib/settings';
import type { CalibrationResult, SessionSettings, UserContext } from './types';

export type StoredSessionPreferences = {
  settings: SessionSettings;
  acceptedSafetyNotice: boolean;
  userContext: UserContext;
  calibration: CalibrationResult;
};

export type HydratedSessionPreferences = StoredSessionPreferences;

export const STORAGE_KEY = 'forty-hz-session-preferences';

export function loadStoredPreferences(): StoredSessionPreferences | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as StoredSessionPreferences;
  } catch {
    return null;
  }
}

export function saveStoredPreferences(preferences: StoredSessionPreferences): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Storage can be unavailable or full; runtime state should remain usable.
  }
}

export function hydrateStoredPreferences(
  preferences: StoredSessionPreferences | null,
): HydratedSessionPreferences {
  const userContext = normalizeUserContext(preferences?.userContext);
  const calibration = normalizeCalibration(preferences?.calibration);
  const storedSettings = preferences?.settings;
  const profileId = storedSettings?.profileId || 'recommended';
  const settings = storedSettings
    ? mergeSessionSettings(deriveSessionSettings(profileId, userContext, calibration), storedSettings)
    : deriveSessionSettings(profileId, userContext, calibration);

  return {
    settings,
    acceptedSafetyNotice: preferences?.acceptedSafetyNotice ?? false,
    userContext,
    calibration,
  };
}

function normalizeUserContext(value: Partial<UserContext> | null | undefined): UserContext {
  return {
    soundSensitivity: value?.soundSensitivity ?? DEFAULT_USER_CONTEXT.soundSensitivity,
    outputMode: value?.outputMode ?? DEFAULT_USER_CONTEXT.outputMode,
    completedAt: value?.completedAt ?? null,
  };
}

function normalizeCalibration(
  value: Partial<CalibrationResult> | null | undefined,
): CalibrationResult {
  return {
    preferredBaseToneHz: normalizeBaseToneHz(value?.preferredBaseToneHz),
    completedAt: value?.completedAt ?? null,
    skipped: value?.skipped ?? false,
  };
}
