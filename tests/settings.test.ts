import { describe, expect, it } from 'vitest';
import {
  deriveSessionSettings,
  validateSessionSettings,
  DEFAULT_CALIBRATION,
  DEFAULT_USER_CONTEXT,
} from '../src/lib/settings';

describe('session settings', () => {
  it('clamps values into supported ranges', () => {
    const result = validateSessionSettings({
      pulseHz: 40,
      carrierHz: 1000,
      masterVolume: 1.4,
      durationMinutes: 90,
      fadeInSec: 0.2,
      fadeOutSec: 12,
      backgroundNoiseLevel: -1,
      profileId: '',
      modulationStyle: 'gated',
    });

    expect(result).toEqual({
      pulseHz: 40,
      carrierHz: 520,
      masterVolume: 0.9,
      durationMinutes: 60,
      fadeInSec: 0,
      fadeOutSec: 0,
      backgroundNoiseLevel: 0,
      profileId: 'recommended',
      modulationStyle: 'gated',
    });
  });

  it('makes the starting volume more conservative for sound-sensitive users', () => {
    const standard = deriveSessionSettings('recommended', DEFAULT_USER_CONTEXT, DEFAULT_CALIBRATION);
    const sensitive = deriveSessionSettings(
      'recommended',
      { ...DEFAULT_USER_CONTEXT, soundSensitivity: 'sensitive' },
      DEFAULT_CALIBRATION,
    );

    expect(sensitive.masterVolume).toBeLessThan(standard.masterVolume);
    expect(sensitive.fadeInSec).toBe(0);
    expect(sensitive.fadeOutSec).toBe(0);
  });
});
