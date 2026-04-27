import type { RecommendationProfile } from './types';

export const RECOMMENDATION_PROFILES: RecommendationProfile[] = [
  {
    id: 'recommended',
    label: 'おすすめ',
    summary: '40 Hz のサイン波に近い標準プロトコル',
    description: '20分のセッションを基準に、限定的な人でのデータを踏まえた控えめな設定で始めます。',
    evidenceLevel: 'limited',
    modulationStyle: 'sine',
    durationMinutes: 20,
  },
  {
    id: 'gentle',
    label: 'やさしめ',
    summary: '音量を抑え、フェードを長めにした入口',
    description: '刺激感を抑えて、より慎重に始めたい人向けの設定です。',
    evidenceLevel: 'limited',
    modulationStyle: 'sine',
    durationMinutes: 20,
  },
  {
    id: 'exploratory',
    label: '試験チェック',
    summary: '脈動感を強めにした比較用モード',
    description: '標準のおすすめではありません。強めのパルス感を比較したい場合だけ使ってください。',
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
