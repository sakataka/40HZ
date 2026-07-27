import { beforeEach, describe, expect, it } from 'vitest';
import {
  hydrateStoredPreferences,
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
        carrierHz: 220,
        masterVolume: 0.21,
        durationMinutes: 20,
        backgroundNoiseLevel: 0.03,
        profileId: 'recommended',
      },
      userContext: {
        soundSensitivity: 'sensitive' as const,
        outputMode: 'headphones' as const,
        completedAt: 1000,
      },
      calibration: {
        completedAt: 2000,
      },
    };

    saveStoredPreferences(preferences);

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeTruthy();
    expect(loadStoredPreferences()).toEqual(preferences);
  });

  it('hydrates stored preferences into normalized runtime values', () => {
    const hydrated = hydrateStoredPreferences({
      settings: {
        carrierHz: 1000,
        masterVolume: 0.01,
        durationMinutes: 20,
        backgroundNoiseLevel: -1,
        profileId: 'recommended',
      },
      userContext: {
        soundSensitivity: 'sensitive' as const,
        outputMode: 'speaker' as const,
        completedAt: null,
      },
      calibration: {
        completedAt: null,
      },
    });

    expect(hydrated.settings).toEqual(
      expect.objectContaining({
        carrierHz: 520,
        masterVolume: 0.05,
        backgroundNoiseLevel: 0,
        profileId: 'recommended',
      }),
    );
  });

  it('keeps storage failures from escaping into the session flow', () => {
    const originalStorage = window.localStorage;
    const failingStorage = {
      ...originalStorage,
      getItem() {
        throw new Error('storage blocked');
      },
      setItem() {
        throw new Error('storage full');
      },
    };

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: failingStorage,
    });

    try {
      const fallbackPreferences = hydrateStoredPreferences(null);
      expect(loadStoredPreferences()).toBeNull();
      expect(() =>
        saveStoredPreferences({
          settings: fallbackPreferences.settings,
          userContext: fallbackPreferences.userContext,
          calibration: fallbackPreferences.calibration,
        }),
      ).not.toThrow();
    } finally {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        value: originalStorage,
      });
    }
  });
});
