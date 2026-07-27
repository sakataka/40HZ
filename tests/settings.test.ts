import { describe, expect, it } from 'vitest';
import {
  deriveSessionSettings,
  validateSessionSettings,
  DEFAULT_USER_CONTEXT,
} from '../src/lib/settings';

describe('session settings', () => {
  it('clamps values into supported ranges', () => {
    const result = validateSessionSettings({
      carrierHz: 1000,
      masterVolume: 1.4,
      durationMinutes: 90,
      backgroundNoiseLevel: -1,
      profileId: '',
    });

    expect(result).toEqual({
      carrierHz: 520,
      masterVolume: 0.9,
      durationMinutes: 60,
      backgroundNoiseLevel: 0,
      profileId: 'recommended',
    });
  });

  it('makes the starting volume more conservative for sound-sensitive users', () => {
    const standard = deriveSessionSettings('recommended', DEFAULT_USER_CONTEXT);
    const sensitive = deriveSessionSettings(
      'recommended',
      { ...DEFAULT_USER_CONTEXT, soundSensitivity: 'sensitive' },
    );

    expect(sensitive.masterVolume).toBeLessThan(standard.masterVolume);
  });
});
