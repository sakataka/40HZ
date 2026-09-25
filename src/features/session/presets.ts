import type { EvidenceLevel, Program, RecommendationProfile } from './types';

export const RECOMMENDATION_PROFILES: RecommendationProfile[] = [
  {
    id: 'breath-resonance',
    label: '共鳴呼吸',
    summary: '1分間に約5.5回のゆっくり呼吸',
    description: '上がる音で吸い、下がる音で吐く。4.5秒吸って6.5秒吐く。',
    evidenceLevel: 'moderate',
    program: 'breath',
    modulationStyle: 'sine',
    breath: { inhaleSec: 4.5, topUpSec: 0, exhaleSec: 6.5 },
    durationMinutes: 10,
  },
  {
    id: 'breath-sigh',
    label: 'サイクリック・サイ',
    summary: '二段吸いと長い吐く息',
    description: '吸って、もう一度少し吸い、長く吐く。5分が目安。',
    evidenceLevel: 'moderate',
    program: 'breath',
    modulationStyle: 'sine',
    breath: { inhaleSec: 2.5, topUpSec: 1, exhaleSec: 5.5 },
    durationMinutes: 5,
  },
  {
    id: 'recommended',
    label: 'おすすめ',
    summary: 'なめらかな40 Hzの脈動',
    description: 'なめらかな脈動で、20分の再生。',
    evidenceLevel: 'limited',
    program: 'gamma',
    modulationStyle: 'sine',
    durationMinutes: 20,
  },
  {
    id: 'gentle',
    label: 'やさしめ',
    summary: '音量を抑えた慎重な入口',
    description: '同じ脈動で、初期音量を控えめに。',
    evidenceLevel: 'limited',
    program: 'gamma',
    modulationStyle: 'sine',
    durationMinutes: 20,
  },
  {
    id: 'noise-pink',
    label: 'ピンクノイズ',
    summary: '高音を抑えたザーッという音',
    description: '周囲の音を覆う定番のマスキング音。',
    evidenceLevel: 'limited',
    program: 'noise',
    modulationStyle: 'sine',
    noiseColor: 'pink',
    durationMinutes: 20,
  },
  {
    id: 'noise-brown',
    label: 'ブラウンノイズ',
    summary: 'さらに低く、こもった音',
    description: '低音中心で、耳あたりのやわらかいノイズ。',
    evidenceLevel: 'limited',
    program: 'noise',
    modulationStyle: 'sine',
    noiseColor: 'brown',
    durationMinutes: 20,
  },
  {
    id: 'noise-ocean',
    label: '波（合成）',
    summary: 'ゆっくり満ち引きするノイズ',
    description: 'ブラウンノイズを約9秒周期でうねらせた合成音。',
    evidenceLevel: 'limited',
    program: 'noise',
    modulationStyle: 'sine',
    noiseColor: 'ocean',
    durationMinutes: 20,
  },
  {
    id: 'exploratory',
    label: '試験チェック',
    summary: '脈動感を強めにした比較用モード',
    description: '輪郭のはっきりした脈動を比較する設定です。',
    evidenceLevel: 'experimental',
    program: 'gamma',
    modulationStyle: 'gated',
    durationMinutes: 15,
  },
];

export const PROGRAM_GROUPS: { program: Program; label: string; note: string }[] = [
  { program: 'breath', label: '呼吸ガイド', note: '音に合わせて呼吸する' },
  { program: 'gamma', label: '40 Hz 脈動', note: '聞き流す' },
  { program: 'noise', label: 'ノイズ', note: '作業や休憩の背景に' },
];

export const EVIDENCE_LABELS: Record<EvidenceLevel, string> = {
  moderate: '根拠: 中程度',
  limited: '根拠: 限定的',
  experimental: '試験的',
};

export function getRecommendationProfile(profileId: string): RecommendationProfile {
  return (
    RECOMMENDATION_PROFILES.find((profile) => profile.id === profileId)
    ?? RECOMMENDATION_PROFILES.find((profile) => profile.id === 'recommended')!
  );
}
