import type { RecommendationProfile } from './types';

export const RECOMMENDATION_PROFILES: RecommendationProfile[] = [
  {
    id: 'recommended',
    label: 'おすすめ',
    summary: 'なめらかな40 Hzの脈動',
    description: 'なめらかな脈動で、20分の再生。',
    evidenceLevel: 'limited',
    modulationStyle: 'sine',
    durationMinutes: 20,
  },
  {
    id: 'gentle',
    label: 'やさしめ',
    summary: '音量を抑えた慎重な入口',
    description: '同じ脈動で、初期音量を控えめに。',
    evidenceLevel: 'limited',
    modulationStyle: 'sine',
    durationMinutes: 20,
  },
  {
    id: 'exploratory',
    label: '試験チェック',
    summary: '脈動感を強めにした比較用モード',
    description: '輪郭のはっきりした脈動を比較する設定です。',
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
