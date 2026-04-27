import type { RecommendationProfile } from './types';

export const RECOMMENDATION_PROFILES: RecommendationProfile[] = [
  {
    id: 'recommended',
    label: 'Recommended',
    summary: 'A standard 40 Hz sine-style protocol for managed playback',
    description: 'Starts with a 20-minute controlled session and conservative defaults informed by limited human data.',
    evidenceLevel: 'limited',
    modulationStyle: 'sine',
    durationMinutes: 20,
  },
  {
    id: 'gentle',
    label: 'Gentle',
    summary: 'Lower starting volume and longer fades for a softer preflight',
    description: 'A gentler option for listeners who want a more conservative, controlled entry point.',
    evidenceLevel: 'limited',
    modulationStyle: 'sine',
    durationMinutes: 20,
  },
  {
    id: 'exploratory',
    label: 'Exploratory Check',
    summary: 'A more pronounced pulsed mode for controlled comparison',
    description: 'Not the default recommendation. Use it only if you want to compare a stronger pulsing effect in a managed setting.',
    evidenceLevel: 'experimental',
    modulationStyle: 'gated',
    durationMinutes: 15,
  },
];

export function getRecommendationProfile(profileId: string): RecommendationProfile {
  return (
    RECOMMENDATION_PROFILES.find((profile) => profile.id === profileId) ?? RECOMMENDATION_PROFILES[0]
  );
}
