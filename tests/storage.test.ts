import { beforeEach, describe, expect, it } from 'vitest';
import {
  STORAGE_KEY,
  loadStoredPreferences,
  saveStoredPreferences,
} from '../src/features/session/storage';

describe('session storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('round-trips onboarding and calibration state via localStorage', () => {
    const preferences = {
      settings: {
        pulseHz: 40 as const,
        carrierHz: 220,
        masterVolume: 0.21,
        durationMinutes: 20,
        fadeInSec: 5,
        fadeOutSec: 5,
        backgroundNoiseLevel: 0.03,
        profileId: 'recommended',
        modulationStyle: 'sine' as const,
      },
      acceptedSafetyNotice: true,
      userContext: {
        soundSensitivity: 'sensitive' as const,
        outputMode: 'headphones' as const,
        completedAt: 1000,
      },
      calibration: {
        preferredBaseToneHz: 220,
        completedAt: 2000,
        skipped: true,
      },
    };

    saveStoredPreferences(preferences);

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    expect(loadStoredPreferences()).toEqual(preferences);
  });
});
