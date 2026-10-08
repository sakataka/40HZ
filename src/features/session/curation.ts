export type SoundImage = 'lake' | 'rain' | 'dusk' | 'forest';

export type ListeningScene = 'all' | 'calm' | 'busy' | 'sleep' | 'focus';

export const SCENES: { id: ListeningScene; label: string; title: string; note: string; profileId: string; action: string; picks: string[] }[] = [
  { id: 'all', label: 'すべて', title: '考えごとを、ひと休み。', note: '波のような音を、小さな音量で。', profileId: 'noise-ocean', action: '波を聴いてみる', picks: ['noise-rain', 'breath-resonance', 'gentle'] },
  { id: 'calm', label: '気持ちをゆるめたい', title: 'ひと息ついて、肩の力を。', note: '呼吸の合図に合わせて、無理のないペースで。', profileId: 'breath-resonance', action: '呼吸ガイドを聴く', picks: ['breath-resonance', 'noise-wind', 'breath-sigh'] },
  { id: 'busy', label: '考えごとを休めたい', title: '考えごとを、ひと休み。', note: '言葉のない音に、少し耳を向けてみる。', profileId: 'noise-ocean', action: '波を聴いてみる', picks: ['noise-ocean', 'noise-rain', 'noise-wind'] },
  { id: 'sleep', label: '眠る前に', title: '一日の終わりを、静かに。', note: '低い音やゆっくりした呼吸を、寝る前の時間に。', profileId: 'noise-brown', action: '低いノイズを聴く', picks: ['noise-brown', 'breath-bedtime', 'noise-fire'] },
  { id: 'focus', label: '集中のそばに', title: '目の前のことに、ゆっくり。', note: '周囲の音が気になるときの、小さな背景音。', profileId: 'noise-pink', action: 'ピンクノイズを聴く', picks: ['noise-pink', 'gentle', 'recommended'] },
];

export const SOUND_STORIES: Record<string, { title: string; kind: string; reason: string; image: SoundImage; position?: string }> = {
  'noise-rain': { title: '雨音に包まれる', kind: '合成の自然音', reason: '一定の雨音を、作業や休憩の背景に。', image: 'rain' },
  'noise-ocean': { title: '波のリズムに耳をすます', kind: '合成の自然音', reason: 'ゆっくり満ち引きする音。何もせず休む時間に。', image: 'lake' },
  'noise-wind': { title: 'そよ風のように', kind: '合成の自然音', reason: 'やわらかな風のゆらぎを、ひと休みのおともに。', image: 'rain', position: '70% 30%' },
  'breath-resonance': { title: 'ゆっくり息を吐く', kind: '呼吸ガイド', reason: '音が上がるときに吸って、下がるときに吐く。苦しければ自然な呼吸に戻して。', image: 'dusk', position: '20% 20%' },
  'breath-sigh': { title: '二段吸いと、長い吐く息', kind: '呼吸ガイド', reason: '吸って、少し吸い足して、ゆっくり吐く。無理に深く吸わなくて大丈夫。', image: 'dusk' },
  'breath-bedtime': { title: '寝る前のひと呼吸', kind: '呼吸ガイド', reason: '4秒吸って8秒吐く目安。ペースが合わなければ普段の呼吸で。', image: 'dusk', position: '10% 50%' },
  gentle: { title: 'やさしい40Hz', kind: '40Hzの脈動', reason: '40Hzを試してみたいときに。初期音量を控えめにした入口です。', image: 'forest', position: '100% 40%' },
  recommended: { title: '40Hzを聴いてみる', kind: '40Hzの脈動', reason: '220Hzなどの音を、1秒に40回の速さで脈動させます。癒しや集中への効果は未確立です。', image: 'forest', position: '100% 30%' },
  'noise-pink': { title: '周りの音をやわらげる', kind: 'ピンクノイズ', reason: '高音を抑えたノイズ。作業の背景に合うか、まず短く試して。', image: 'rain' },
  'noise-brown': { title: '低い音に、ひと休み', kind: 'ブラウンノイズ', reason: '低音中心のこもったノイズ。静かな夜の背景に。', image: 'lake' },
  'noise-fire': { title: '焚き火のそばで', kind: '合成の自然音', reason: '低い燃焼音と、薪がはぜるような音。夜の読書にも。', image: 'rain', position: '100% 100%' },
};

export const SOUND_DESTINATIONS: { name: string; title: string; description: string; note: string; href: string; scenes: ListeningScene[]; image: SoundImage }[] = [
  { name: 'myNoise', title: '自分に合う雨音を', description: '雨音の帯域ごとの音量を調整できるサウンドジェネレーター。単調な音が好きなときに。', note: 'ブラウザで聴く · 英語', href: 'https://mynoise.net/NoiseMachines/rainNoiseGenerator.php', scenes: ['busy', 'focus'], image: 'rain' },
  { name: 'Calm', title: '音楽と眠る前の時間', description: 'ピアノ、アンビエント、自然のサウンドスケープ。ノイズより音楽が心地よいときに。', note: '音楽ライブラリ · 一部有料 · 英語', href: 'https://www.calm.com/music', scenes: ['calm', 'sleep', 'focus'], image: 'dusk' },
  { name: 'Medito', title: '声のガイドと、ひと息', description: '呼吸や瞑想のガイド、睡眠向けの音・ストーリー。声の案内がほしいときに。', note: '無料アプリ · 英語中心', href: 'https://meditofoundation.org/medito-app/', scenes: ['calm', 'busy', 'sleep'], image: 'forest' },
];
