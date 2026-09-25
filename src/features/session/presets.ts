import type { EvidenceLevel, Mood, RecommendationProfile } from './types';

export const RECOMMENDATION_PROFILES: RecommendationProfile[] = [
  {
    id: 'breath-resonance',
    label: '共鳴呼吸',
    summary: '1分間に約5.5回のゆっくり呼吸',
    description: '上がる音で吸い、下がる音で吐く。4.5秒吸って6.5秒吐く。',
    evidenceLevel: 'moderate',
    program: 'breath',
    mood: 'calm',
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
    mood: 'calm',
    modulationStyle: 'sine',
    breath: { inhaleSec: 2.5, topUpSec: 1, exhaleSec: 5.5 },
    durationMinutes: 5,
  },
  {
    id: 'noise-ocean',
    label: '波（合成）',
    summary: 'ゆっくり満ち引きするノイズ',
    description: 'ブラウンノイズを約9秒周期でうねらせた合成音。',
    evidenceLevel: 'limited',
    program: 'noise',
    mood: 'calm',
    modulationStyle: 'sine',
    noiseColor: 'ocean',
    durationMinutes: 20,
  },
  {
    id: 'noise-wind',
    label: 'そよ風（合成）',
    summary: '強まったり弱まったりする風',
    description: '不規則にゆらぐ低めの風音。ぼんやり休むときに。',
    evidenceLevel: 'limited',
    program: 'noise',
    mood: 'calm',
    modulationStyle: 'sine',
    noiseColor: 'wind',
    durationMinutes: 20,
  },
  {
    id: 'recommended',
    label: '40 Hz',
    summary: 'なめらかな40 Hzの脈動',
    description: 'なめらかな40 Hzの脈動を20分聞き流す。',
    evidenceLevel: 'limited',
    program: 'gamma',
    mood: 'focus',
    modulationStyle: 'sine',
    durationMinutes: 20,
  },
  {
    id: 'gentle',
    label: '40 Hz やさしめ',
    summary: '音量を抑えた慎重な入口',
    description: '同じ脈動で、初期音量を控えめに。',
    evidenceLevel: 'limited',
    program: 'gamma',
    mood: 'focus',
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
    mood: 'focus',
    modulationStyle: 'sine',
    noiseColor: 'pink',
    durationMinutes: 20,
  },
  {
    id: 'noise-rain',
    label: '雨（合成）',
    summary: 'サーッという雨と雨粒',
    description: 'ピンクノイズに不規則な雨粒を重ねた合成音。',
    evidenceLevel: 'limited',
    program: 'noise',
    mood: 'focus',
    modulationStyle: 'sine',
    noiseColor: 'rain',
    durationMinutes: 20,
  },
  {
    id: 'breath-bedtime',
    label: '寝る前の呼吸',
    summary: '4秒吸って8秒吐く',
    description: '吐く息を長くして、1分間に5回のペースへ落とす。',
    evidenceLevel: 'moderate',
    program: 'breath',
    mood: 'rest',
    modulationStyle: 'sine',
    breath: { inhaleSec: 4, topUpSec: 0, exhaleSec: 8 },
    durationMinutes: 10,
  },
  {
    id: 'noise-brown',
    label: 'ブラウンノイズ',
    summary: 'さらに低く、こもった音',
    description: '低音中心で、耳あたりのやわらかいノイズ。',
    evidenceLevel: 'limited',
    program: 'noise',
    mood: 'rest',
    modulationStyle: 'sine',
    noiseColor: 'brown',
    durationMinutes: 30,
  },
  {
    id: 'noise-fire',
    label: '焚き火（合成）',
    summary: '低いゴーッという音とパチパチ',
    description: '低い燃焼音に、ときどき薪のはぜる音が混ざる。',
    evidenceLevel: 'limited',
    program: 'noise',
    mood: 'rest',
    modulationStyle: 'sine',
    noiseColor: 'fire',
    durationMinutes: 30,
  },
  {
    id: 'exploratory',
    label: '試験チェック',
    summary: '脈動感を強めにした比較用モード',
    description: '輪郭のはっきりした脈動を比較する設定です。',
    evidenceLevel: 'experimental',
    program: 'gamma',
    mood: 'focus',
    modulationStyle: 'gated',
    durationMinutes: 15,
  },
];

export const MOOD_GROUPS: { mood: Mood; label: string; note: string }[] = [
  { mood: 'calm', label: '落ち着きたい', note: '呼吸を整える・気持ちをゆるめる' },
  { mood: 'focus', label: '集中したい', note: '作業や勉強の背景に' },
  { mood: 'rest', label: '休みたい・眠りたい', note: '一日の終わりに' },
];

export const EVIDENCE_LABELS: Record<EvidenceLevel, string> = {
  moderate: '根拠: 中程度',
  limited: '根拠: 限定的',
  experimental: '試験的',
};

export type TimeSuggestion = {
  label: string;
  note: string;
  profileIds: [string, string];
};

/** Light-touch suggestions by local time of day; nothing is measured or stored. */
export function suggestForHour(hour: number): TimeSuggestion {
  if (hour >= 5 && hour < 11) {
    return { label: '朝', note: '一日の始まりに、呼吸を整えてから', profileIds: ['breath-resonance', 'recommended'] };
  }
  if (hour >= 11 && hour < 17) {
    return { label: '日中', note: '作業の背景や、合間の切り替えに', profileIds: ['noise-pink', 'noise-rain'] };
  }
  if (hour >= 17 && hour < 22) {
    return { label: '夕方〜夜', note: '一日の緊張をほどくなら', profileIds: ['breath-sigh', 'noise-ocean'] };
  }
  return { label: '夜ふけ', note: '眠る前に', profileIds: ['breath-bedtime', 'noise-fire'] };
}

export function getRecommendationProfile(profileId: string): RecommendationProfile {
  return (
    RECOMMENDATION_PROFILES.find((profile) => profile.id === profileId)
    ?? RECOMMENDATION_PROFILES.find((profile) => profile.id === 'recommended')!
  );
}
