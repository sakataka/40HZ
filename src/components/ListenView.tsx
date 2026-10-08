import { useState } from 'react';
import {
  EVIDENCE_LABELS,
  getRecommendationProfile,
  MOOD_GROUPS,
  RECOMMENDATION_PROFILES,
} from '../features/session/presets';
import {
  SCENES,
  SOUND_DESTINATIONS,
  SOUND_STORIES,
  type ListeningScene,
} from '../features/session/curation';
import type { RecommendationProfile } from '../features/session/types';
import lake from '../assets/atmosphere/quiet-lake.jpg';
import rain from '../assets/atmosphere/rain-leaves.jpg';
import dusk from '../assets/atmosphere/dusk-horizon.jpg';
import forest from '../assets/atmosphere/forest-light.jpg';
import { PlayGlyph } from './NowPlaying';
import { SoundIcon } from './SoundIcon';
import { SoundResearch } from './SoundResearch';

const IMAGES = { lake, rain, dusk, forest };
const PICK_TITLES: Record<ListeningScene, string> = {
  all: '今日の音のよりみち',
  calm: '気持ちをゆるめたいときに',
  busy: '考えごとを休めたいときに',
  sleep: '眠る前の音のよりみち',
  focus: '集中のそばに置きたい音',
};

type ListenViewProps = {
  activeProfileId: string;
  playing: boolean;
  locked: boolean;
  blind: boolean;
  onSelect: (profileId: string) => void;
  onOpenRecords: () => void;
};

type SoundChoiceProps = Pick<ListenViewProps, 'locked' | 'onSelect'> & {
  profile: RecommendationProfile;
  active: boolean;
  playing: boolean;
};

function SoundPick({ profile, playing, locked, onSelect }: SoundChoiceProps) {
  const story = SOUND_STORIES[profile.id];
  return (
    <article className="sound-pick">
      <div className="pick-image">
        <img src={IMAGES[story.image]} alt="" loading="lazy" style={{ objectPosition: story.position }} />
      </div>
      <div className="pick-title-row">
        <div>
          <h3>{story.title}</h3>
          <p>{story.kind} · {profile.durationMinutes}分</p>
        </div>
        <button
          className="pick-play"
          type="button"
          aria-label={`${story.title}を${playing ? '停止' : '再生'}`}
          disabled={locked}
          onClick={() => onSelect(profile.id)}
        >
          <PlayGlyph stop={playing} />
        </button>
      </div>
      <p className="pick-reason">{story.reason}</p>
    </article>
  );
}

function SoundTile({ profile, active, playing, locked, onSelect }: SoundChoiceProps) {
  return (
    <button
      aria-pressed={active}
      className={`sound-tile mood-${profile.mood}${active ? ' is-active' : ''}${playing ? ' is-playing' : ''}`}
      type="button"
      disabled={locked}
      onClick={() => onSelect(profile.id)}
    >
      <span className="tile-icon">{playing ? <Equalizer /> : <SoundIcon profileId={profile.id} />}</span>
      <span className="tile-body">
        <span className="tile-title">{profile.label}</span>
        <span className="tile-summary">{profile.summary}</span>
      </span>
      <span className="tile-meta">
        <span>{playing ? '再生中' : `${profile.durationMinutes}分`}</span>
        {profile.evidenceLevel !== 'limited' ? (
          <small className={`evidence-pill evidence-${profile.evidenceLevel}`}>
            {EVIDENCE_LABELS[profile.evidenceLevel]}
          </small>
        ) : null}
      </span>
    </button>
  );
}

export function ListenView({ activeProfileId, playing, locked, blind, onSelect, onOpenRecords }: ListenViewProps) {
  const [sceneId, setSceneId] = useState<ListeningScene>('all');
  const [showExploratory, setShowExploratory] = useState(false);
  const scene = SCENES.find((item) => item.id === sceneId)!;
  const heroPlaying = playing && activeProfileId === scene.profileId;
  const profiles = RECOMMENDATION_PROFILES.filter(
    (profile) => profile.evidenceLevel !== 'experimental'
      && (sceneId === 'all' || scene.picks.includes(profile.id)),
  );
  const destinations = SOUND_DESTINATIONS.filter(
    (item) => sceneId === 'all' || item.scenes.includes(sceneId),
  );

  function renderTile(profile: RecommendationProfile) {
    return (
      <SoundTile
        key={profile.id}
        profile={profile}
        active={activeProfileId === profile.id}
        playing={activeProfileId === profile.id && playing}
        locked={locked}
        onSelect={onSelect}
      />
    );
  }

  return (
    <div className="view listen-view">
      <section className="curation-intro" aria-labelledby="app-title">
        <h1 id="app-title">いまの気分に、ひとつの音。</h1>
        <p>忙しい日にも、ひと息つける場所を。</p>
      </section>

      {blind ? (
        <div className="notice-card" role="note">
          <strong>ブラインド比較中</strong>
          <p>音は「40 Hz／対照」に固定されています。どちらが流れたかは終了後に表示されます。</p>
          <button className="text-button" type="button" onClick={onOpenRecords}>記録の設定を開く</button>
        </div>
      ) : (
        <section className="sound-feature" aria-labelledby="feature-title">
          <img src={lake} alt="朝霧に包まれた静かな湖と森" fetchPriority="high" />
          <div className="feature-copy">
            <h2 id="feature-title">{scene.title}</h2>
            <p>{scene.note}</p>
            <button className="feature-play" type="button" disabled={locked} onClick={() => onSelect(scene.profileId)}>
              <PlayGlyph stop={heroPlaying} />
              {heroPlaying ? 'この音を止める' : scene.action}
            </button>
          </div>
        </section>
      )}

      <div className="scene-filter" role="group" aria-label="いまの気分で選ぶ">
        {SCENES.map((item) => (
          <button type="button" key={item.id} aria-pressed={item.id === sceneId} onClick={() => setSceneId(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      <section className="curated-picks" aria-labelledby="picks-title">
        <div className="curation-heading">
          <h2 id="picks-title">{PICK_TITLES[sceneId]}</h2>
          <a href="#sound-library">この場所で聴ける音 <Arrow direction="down" /></a>
        </div>
        <div className="pick-grid" role="group" aria-label="今のおすすめ">
          {scene.picks.map((id) => (
            <SoundPick
              key={id}
              profile={getRecommendationProfile(id)}
              active={activeProfileId === id}
              playing={activeProfileId === id && playing}
              locked={locked}
              onSelect={onSelect}
            />
          ))}
        </div>
        <p className="selection-note">場面と音の特徴から選んだ提案です。気分を測定したり、効果を予測したりするものではありません。</p>
      </section>

      <section className="sound-destinations" aria-labelledby="destinations-title">
        <div className="curation-heading">
          <h2 id="destinations-title">もっと音を探したいときに</h2>
          <span>外部のサービス</span>
        </div>
        <div className="destination-list">
          {destinations.map((item) => (
            <a key={item.name} className="destination" href={item.href} target="_blank" rel="noreferrer">
              <img src={IMAGES[item.image]} alt="" loading="lazy" />
              <div>
                <h3>{item.name}<span> · {item.title}</span></h3>
                <p>{item.description}</p>
                <small>{item.note}</small>
              </div>
              <Arrow direction="external" />
              <span className="visually-hidden">（別タブで開く）</span>
            </a>
          ))}
        </div>
        <p className="selection-note">2026年10月8日、公式情報を確認。紹介先の音はここでは再生されません。利用条件は各サイトでご確認ください。</p>
      </section>

      <div className="sound-library" id="sound-library" role="group" aria-label="サウンド一覧">
        <div className="curation-heading">
          <h2>この場所で聴ける音</h2>
          <span>{profiles.length}種類の音・ガイド</span>
        </div>
        <p className="selection-note">自然音はブラウザで作る合成音です。音楽や実録の自然音は、上の紹介先から探せます。</p>
        {MOOD_GROUPS.map((group) => {
          const groupProfiles = profiles.filter((profile) => profile.mood === group.mood);
          return groupProfiles.length ? (
            <section className={`sound-group mood-${group.mood}`} key={group.mood} aria-labelledby={`mood-${group.mood}`}>
              <div className="group-head">
                <h3 id={`mood-${group.mood}`}>{group.label}</h3>
                <p>{group.note}</p>
              </div>
              <div className="tile-grid">{groupProfiles.map(renderTile)}</div>
            </section>
          ) : null;
        })}
        <div className="exploratory">
          <button
            aria-controls="exploratory-settings"
            aria-expanded={showExploratory}
            className="text-button"
            type="button"
            onClick={() => setShowExploratory((value) => !value)}
          >
            {showExploratory ? '試験的な設定を隠す' : '試験的な設定を表示'}
          </button>
          {showExploratory ? (
            <div className="tile-grid" id="exploratory-settings">
              {RECOMMENDATION_PROFILES.filter((profile) => profile.evidenceLevel === 'experimental').map(renderTile)}
            </div>
          ) : null}
        </div>
      </div>
      <SoundResearch />
      <footer className="curation-footer">
        <span>40Hz <small>音のよりみち</small></span>
        <p>心地よさは、あなたの感じ方で。</p>
      </footer>
    </div>
  );
}

function Arrow({ direction }: { direction: 'down' | 'external' }) {
  return (
    <svg className="link-arrow" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {direction === 'down' ? <path d="M12 4v16m-6-6 6 6 6-6" /> : <path d="M6 18 18 6M6 6h12v12" />}
    </svg>
  );
}

export function Equalizer() {
  return <span className="equalizer" aria-hidden="true"><span /><span /><span /></span>;
}
