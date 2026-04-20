import type { CalibrationResult, SessionSettings, UserContext } from './types';

export type StoredSessionPreferences = {
  settings: SessionSettings;
  acceptedSafetyNotice: boolean;
  userContext: UserContext;
  calibration: CalibrationResult;
};

export const STORAGE_KEY = 'forty-hz-session-preferences';

export function loadStoredPreferences(): StoredSessionPreferences | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredSessionPreferences;
  } catch {
    return null;
  }
}

export function saveStoredPreferences(preferences: StoredSessionPreferences): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}
