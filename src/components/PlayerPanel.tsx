import { useState } from 'react';
import type {
  RecommendationProfile,
  SessionSettings,
  SessionState,
  UserContext,
} from '../features/session/types';
import {
  EVIDENCE_LABELS,
  getRecommendationProfile,
  MOOD_GROUPS,
  RECOMMENDATION_PROFILES,
  suggestForHour,
} from '../features/session/presets';
import type { TrackingMode, TrackingPrefs } from '../features/tracking/types';
import { SESSION_LIMITS } from '../lib/settings';
import { BreathGuide } from './BreathGuide';

const DURATION_OPTIONS = [5, 10, 15, 20, 30] as const;
const TRACKING_MODES: { mode: TrackingMode; label: string; hint: string }[] = [
  { mode: 'off', label: '記録なし', hint: '再生するだけで、何も記録しません。' },
  { mode: 'checkin', label: '前後チェック', hint: '再生の前後に、疲れ・気分・頭のスッキリを記録します。' },
  {
    mode: 'experiment',
    label: 'ブラインド比較',
    hint: '再生ごとに「40 Hzの脈動」か「平均速度が同じランダムな脈動」を自動で割り当て、終了後に明かします。音は「40 Hz」に固定されます。',
  },
];
const EXPERIMENTAL_PROFILES = RECOMMENDATION_PROFILES.filter(
  (profile) => profile.evidenceLevel === 'experimental',
);

type PlayerPanelProps = {
  readyToStart: boolean;
  settings: SessionSettings;
  sessionState: SessionState;
  userContext: UserContext;
  trackingPrefs: TrackingPrefs;
  onSelectProfile: (profileId: string) => void;
  onChangeTrackingPrefs: (updates: Partial<TrackingPrefs>) => void;
  onStart: () => void;
  onStop: () => Promise<void>;
  onUpdateSettings: (updates: Partial<SessionSettings>) => void;
  onResetCalibration: () => Promise<void>;
};

export function PlayerPanel({
  readyToStart,
  settings,
  sessionState,
  userContext,
  trackingPrefs,
  onSelectProfile,
  onChangeTrackingPrefs,
  onStart,
  onStop,
  onUpdateSettings,
  onResetCalibration,
}: PlayerPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showExploratory, setShowExploratory] = useState(false);
  const [showTracking, setShowTracking] = useState(trackingPrefs.mode !== 'off');
  const [suggestion] = useState(() => suggestForHour(new Date().getHours()));
  const canStart = readyToStart && sessionState.status === 'idle';
  const canStop = sessionState.status === 'running';
  const activeProfile = getRecommendationProfile(settings.profileId);
  const blind = trackingPrefs.mode === 'experiment';
  const tracking = trackingPrefs.mode !== 'off';
  // Without recording, tapping a sound while playing switches to it on the fly.
  const soundsLocked = !readyToStart
    || blind
    || sessionState.status === 'starting'
    || sessionState.status === 'stopping'
    || (canStop && tracking);
  const startedAt = sessionState.endsAt == null
    ? null
    : sessionState.endsAt - settings.durationMinutes * 60_000;
  const activeTrackingMode = TRACKING_MODES.find((option) => option.mode === trackingPrefs.mode)!;

  function renderSound(profile: RecommendationProfile) {
    const active = activeProfile.id === profile.id;
    const playing = active && canStop;
    return (
      <button
        key={profile.id}
        aria-pressed={active}
        className={`sound-card ${active ? 'sound-active' : ''} ${playing ? 'sound-playing' : ''}`}
        type="button"
        disabled={soundsLocked}
        onClick={() => onSelectProfile(profile.id)}
      >
        <span className="sound-head">
          <span className="sound-icon" aria-hidden="true">{playing ? '❚❚' : '▶'}</span>
          <span className="sound-title">{profile.label}</span>
          {profile.evidenceLevel === 'experimental' ? (
            <small className="evidence-pill evidence-experimental">試験的</small>
          ) : null}
        </span>
        <small>{playing ? '再生中・タップで停止' : profile.summary}</small>
      </button>
    );
  }

  return (
    <section className={`panel player-panel session-${sessionState.status}`}>
      <div className="panel-header">
        <h2>プレーヤー</h2>
        <span className={`playback-status ${canStop ? 'is-playing' : ''}`} role="status">
          {({ idle: '停止中', starting: '準備中', running: '再生中', stopping: '停止しています' })[sessionState.status]}
        </span>
      </div>

      <div className="playback-console">
        <div className="now-playing">
          <span>{canStop ? '再生中' : '選択中'}</span>
          <strong>{blind ? '40 Hz／対照（非表示）' : activeProfile.label}</strong>
          <p>
            {blind ? 'ブラインド比較中。どちらの音かは終了後に表示されます。' : activeProfile.description}
            {' '}
            <small className={`evidence-pill evidence-${activeProfile.evidenceLevel}`}>
              {EVIDENCE_LABELS[activeProfile.evidenceLevel]}
            </small>
          </p>
        </div>

        <div className="timer-strip">
          <div className="button-row">
            <button
              aria-label="セッション開始"
              className="primary-button"
              type="button"
              onClick={onStart}
              disabled={!canStart}
            >
              再生
            </button>
            <button
              aria-label="停止"
              className="ghost-button stop-button"
              type="button"
              onClick={() => void onStop()}
              disabled={!canStop}
            >
              停止
            </button>
          </div>
          <div className="timer-readout">
            <span>{canStop ? '残り時間' : '再生時間'}</span>
            <strong>{formatCountdown(sessionState.remainingMs)}</strong>
          </div>
        </div>

        {activeProfile.breath && canStop && startedAt != null ? (
          <BreathGuide pattern={activeProfile.breath} startedAt={startedAt} />
        ) : null}

        <div className="context-chip-row" aria-label="現在の設定">
          <div className="duration-chip">
            <span>出力</span>
            <strong>{formatOutputMode(userContext.outputMode)}</strong>
          </div>
          <div className="duration-chip">
            <span>感度</span>
            <strong>{formatSensitivity(userContext.soundSensitivity)}</strong>
          </div>
          <div className="duration-chip">
            <span>基準音</span>
            <strong>{settings.carrierHz}Hz</strong>
          </div>
          {tracking ? (
            <div className="duration-chip">
              <span>記録</span>
              <strong>{activeTrackingMode.label}</strong>
            </div>
          ) : null}
        </div>
      </div>

      <div className="suggestion-strip" role="group" aria-label="今のおすすめ">
        <div className="suggestion-copy">
          <span>今のおすすめ（{suggestion.label}）</span>
          <small>{suggestion.note}</small>
        </div>
        <div className="suggestion-actions">
          {suggestion.profileIds.map((profileId) => {
            const profile = getRecommendationProfile(profileId);
            return (
              <button
                key={profileId}
                className="suggestion-button"
                type="button"
                disabled={soundsLocked}
                onClick={() => onSelectProfile(profileId)}
              >
                <span aria-hidden="true">▶</span> {profile.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sound-library" role="group" aria-label="サウンド一覧">
        {MOOD_GROUPS.map((group) => (
          <div className="sound-group" key={group.mood}>
            <div className="sound-group-head">
              <h3>{group.label}</h3>
              <small>{group.note}</small>
            </div>
            <div className="sound-grid">
              {RECOMMENDATION_PROFILES.filter(
                (profile) => profile.mood === group.mood && profile.evidenceLevel !== 'experimental',
              ).map(renderSound)}
            </div>
          </div>
        ))}

        <div className="collapse-row">
          <button
            aria-controls="exploratory-settings"
            aria-expanded={showExploratory}
            className="inline-toggle"
            type="button"
            onClick={() => setShowExploratory((value) => !value)}
          >
            {showExploratory ? '試験的な設定を隠す' : '試験的な設定を表示'}
          </button>
        </div>

        {showExploratory ? (
          <div className="sound-grid" id="exploratory-settings">
            {EXPERIMENTAL_PROFILES.map(renderSound)}
          </div>
        ) : null}
      </div>

      <div className="settings-section">
        <div className="settings-grid">
          <div className="settings-column">
            <p className="control-label">タイマー</p>
            <div className="duration-row" role="group" aria-label="セッションの長さ">
              {DURATION_OPTIONS.map((minutes) => (
                <button
                  key={minutes}
                  aria-pressed={settings.durationMinutes === minutes}
                  className={`duration-chip ${settings.durationMinutes === minutes ? 'duration-active' : ''}`}
                  type="button"
                  disabled={sessionState.status !== 'idle'}
                  onClick={() => onUpdateSettings({ durationMinutes: minutes })}
                >
                  {minutes}分
                </button>
              ))}
            </div>
          </div>

          <div className="settings-column">
            <RangeControl
              label="音量"
              value={settings.masterVolume}
              min={SESSION_LIMITS.masterVolume.min}
              max={SESSION_LIMITS.masterVolume.max}
              step={0.01}
              displayValue={formatPercent(settings.masterVolume)}
              onChange={(value) => onUpdateSettings({ masterVolume: value })}
            />
          </div>
        </div>

        <div className="toggle-row">
          <button
            aria-controls="advanced-settings"
            aria-expanded={showAdvanced}
            className="inline-toggle"
            type="button"
            onClick={() => setShowAdvanced((value) => !value)}
          >
            {showAdvanced ? 'チューニングを閉じる' : 'チューニング'}
          </button>
          <button
            aria-controls="tracking-settings"
            aria-expanded={showTracking}
            className="inline-toggle"
            type="button"
            onClick={() => setShowTracking((value) => !value)}
          >
            {showTracking ? '記録と比較を閉じる' : '記録と比較（任意）'}
          </button>
        </div>

        {showAdvanced ? (
          <div className="advanced-card" id="advanced-settings">
            <div className="advanced-control-grid">
              <RangeControl
                label="音の高さ"
                value={settings.carrierHz}
                min={SESSION_LIMITS.carrierHz.min}
                max={SESSION_LIMITS.carrierHz.max}
                step={10}
                displayValue={`${settings.carrierHz}Hz`}
                onChange={(value) => onUpdateSettings({ carrierHz: value })}
              />
              <RangeControl
                label="背景ノイズ"
                value={settings.backgroundNoiseLevel}
                min={SESSION_LIMITS.backgroundNoiseLevel.min}
                max={SESSION_LIMITS.backgroundNoiseLevel.max}
                step={0.01}
                displayValue={formatPercent(settings.backgroundNoiseLevel)}
                onChange={(value) => onUpdateSettings({ backgroundNoiseLevel: value })}
              />
            </div>

            <div className="advanced-actions">
              <p>
                音の高さと背景ノイズは、40 Hzと呼吸ガイドの音に使われます。再生中も調整できます。
              </p>
              <button className="ghost-button" type="button" disabled={sessionState.status !== 'idle'} onClick={() => void onResetCalibration()}>
                トーンチェックをやり直す
              </button>
            </div>
          </div>
        ) : null}

        {showTracking ? (
          <div className="advanced-card" id="tracking-settings">
            <div className="tracking-row">
              <div className="segmented" role="radiogroup" aria-label="記録モード">
                {TRACKING_MODES.map((option) => (
                  <label key={option.mode} className={trackingPrefs.mode === option.mode ? 'is-selected' : ''}>
                    <input
                      type="radio"
                      name="trackingMode"
                      checked={trackingPrefs.mode === option.mode}
                      disabled={sessionState.status !== 'idle'}
                      onChange={() => onChangeTrackingPrefs({ mode: option.mode })}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {tracking ? (
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={trackingPrefs.reactionTest}
                    disabled={sessionState.status !== 'idle'}
                    onChange={(event) => onChangeTrackingPrefs({ reactionTest: event.currentTarget.checked })}
                  />
                  反応テスト（60秒）も行う
                </label>
              ) : null}
            </div>
            <p className="player-hint">{activeTrackingMode.hint}</p>
          </div>
        ) : null}
      </div>
      <p className="player-note">小さな音量から始め、不快に感じたら停止してください。</p>
    </section>
  );
}

type RangeControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (value: number) => void;
};

function RangeControl({ label, value, min, max, step, displayValue, onChange }: RangeControlProps) {
  return (
    <label className="control-card">
      <div className="control-meta">
        <span>{label}</span>
        <strong>{displayValue}</strong>
      </div>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}

function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatOutputMode(value: UserContext['outputMode']): string {
  return value === 'headphones' ? 'ヘッドホン' : 'スピーカー';
}

function formatSensitivity(value: UserContext['soundSensitivity']): string {
  return value === 'sensitive' ? '音に敏感' : '標準';
}
