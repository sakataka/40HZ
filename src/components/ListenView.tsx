import { useState } from 'react';
import {
  EVIDENCE_LABELS,
  getRecommendationProfile,
  MOOD_GROUPS,
  RECOMMENDATION_PROFILES,
  suggestForHour,
} from '../features/session/presets';
import type { RecommendationProfile } from '../features/session/types';
import { SoundIcon } from './SoundIcon';

const EXPERIMENTAL_PROFILES = RECOMMENDATION_PROFILES.filter(
  (profile) => profile.evidenceLevel === 'experimental',
);

type ListenViewProps = {
  activeProfileId: string;
  playing: boolean;
  locked: boolean;
  blind: boolean;
  onSelect: (profileId: string) => void;
  onOpenRecords: () => void;
};

export function ListenView({ activeProfileId, playing, locked, blind, onSelect, onOpenRecords }: ListenViewProps) {
  const [showExploratory, setShowExploratory] = useState(false);
  const [suggestion] = useState(() => suggestForHour(new Date().getHours()));

  function renderTile(profile: RecommendationProfile) {
    const active = activeProfileId === profile.id;
    const isPlaying = active && playing;
    return (
      <button
        key={profile.id}
        aria-pressed={active}
        className={`sound-tile mood-${profile.mood}${active ? ' is-active' : ''}${isPlaying ? ' is-playing' : ''}`}
        type="button"
        disabled={locked}
        onClick={() => onSelect(profile.id)}
      >
        <span className="tile-icon">
          {isPlaying ? <Equalizer /> : <SoundIcon profileId={profile.id} />}
        </span>
        <span className="tile-body">
          <span className="tile-title">{profile.label}</span>
          <span className="tile-summary">{profile.summary}</span>
          <span className="tile-meta">
            {isPlaying ? <span className="tile-now">再生中・タップで停止</span> : `${profile.durationMinutes}分`}
            {profile.evidenceLevel !== 'limited' ? (
              <small className={`evidence-pill evidence-${profile.evidenceLevel}`}>
                {EVIDENCE_LABELS[profile.evidenceLevel]}
              </small>
            ) : null}
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className="view listen-view">
      <header className="view-header">
        <p className="eyebrow">{suggestion.label}</p>
        <h1 id="app-title">{suggestion.note}</h1>
      </header>

      {blind ? (
        <div className="notice-card" role="note">
          <strong>ブラインド比較中</strong>
          <p>音は「40 Hz／対照」に固定されています。どちらが流れたかは終了後に表示されます。</p>
          <button className="text-button" type="button" onClick={onOpenRecords}>
            記録の設定を開く
          </button>
        </div>
      ) : (
        <div className="suggestion-row" role="group" aria-label="今のおすすめ">
          {suggestion.profileIds.map((profileId) => {
            const profile = getRecommendationProfile(profileId);
            const isPlaying = activeProfileId === profileId && playing;
            return (
              <button
                key={profileId}
                className={`suggestion-card mood-${profile.mood}${isPlaying ? ' is-playing' : ''}`}
                type="button"
                disabled={locked}
                onClick={() => onSelect(profileId)}
              >
                <span className="suggestion-icon">
                  {isPlaying ? <Equalizer /> : <SoundIcon profileId={profileId} size={28} />}
                </span>
                <span className="suggestion-title">{profile.label}</span>
                <span className="suggestion-summary">{profile.summary}</span>
                <span className="suggestion-play" aria-hidden="true">
                  {isPlaying ? '再生中' : `▶ ${profile.durationMinutes}分`}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="sound-library" role="group" aria-label="サウンド一覧">
        {MOOD_GROUPS.map((group) => (
          <section className={`sound-group mood-${group.mood}`} key={group.mood} aria-labelledby={`mood-${group.mood}`}>
            <div className="group-head">
              <h2 id={`mood-${group.mood}`}>{group.label}</h2>
              <p>{group.note}</p>
            </div>
            <div className="tile-grid">
              {RECOMMENDATION_PROFILES.filter(
                (profile) => profile.mood === group.mood && profile.evidenceLevel !== 'experimental',
              ).map(renderTile)}
            </div>
          </section>
        ))}

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
              {EXPERIMENTAL_PROFILES.map(renderTile)}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function Equalizer() {
  return (
    <span className="equalizer" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}
