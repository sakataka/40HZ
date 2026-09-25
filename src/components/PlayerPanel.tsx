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
  PROGRAM_GROUPS,
  RECOMMENDATION_PROFILES,
} from '../features/session/presets';
import type { TrackingMode, TrackingPrefs } from '../features/tracking/types';
import { SESSION_LIMITS } from '../lib/settings';
import { BreathGuide } from './BreathGuide';

const DURATION_OPTIONS = [5, 10, 15, 20, 30] as const;
const TRACKING_MODES: { mode: TrackingMode; label: string }[] = [
  { mode: 'off', label: '記録なし' },
  { mode: 'checkin', label: '前後チェック' },
  { mode: 'experiment', label: 'ブラインド比較' },
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
  onApplyProfile: (profileId: string) => void;
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
  onApplyProfile,
  onChangeTrackingPrefs,
  onStart,
  onStop,
  onUpdateSettings,
  onResetCalibration,
}: PlayerPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showExploratory, setShowExploratory] = useState(false);
  const canStart = readyToStart && sessionState.status === 'idle';
  const canStop = sessionState.status === 'running';
  const activeProfile = getRecommendationProfile(settings.profileId);
  const blind = trackingPrefs.mode === 'experiment';
  const presetsLocked = sessionState.status !== 'idle' || blind;
  const startedAt = sessionState.endsAt == null
    ? null
    : sessionState.endsAt - settings.durationMinutes * 60_000;

  function renderPreset(profile: RecommendationProfile) {
    return (
      <button
        key={profile.id}
        aria-pressed={activeProfile.id === profile.id}
        className={`preset-card ${activeProfile.id === profile.id ? 'preset-active' : ''}`}
        type="button"
        disabled={presetsLocked}
        onClick={() => onApplyProfile(profile.id)}
      >
        <div className="preset-head">
          <span>{profile.label}</span>
          {profile.evidenceLevel === 'experimental' ? (
            <small className="evidence-pill evidence-experimental">試験的</small>
          ) : null}
        </div>

        <small>{profile.description}</small>
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


        <div className="context-chip-row" aria-label="現在の設定">
          <div className="duration-chip">
            <span>プリセット</span>
            <strong>{blind ? '40 Hz／対照（非表示）' : activeProfile.label}</strong>
          </div>
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
        </div>

        {activeProfile.breath && canStop && startedAt != null ? (
          <BreathGuide pattern={activeProfile.breath} startedAt={startedAt} />
        ) : null}

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
          {trackingPrefs.mode !== 'off' ? (
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
        {blind ? (
          <p className="player-hint">
            ブラインド比較では、再生ごとに「40 Hzの脈動」か「平均速度が同じランダムな脈動」を自動で割り当て、終了後に明かします。プリセットは「おすすめ」に固定されます。
          </p>
        ) : null}
      </div>

      <div className="settings-section">
        <div className="section-head">
          <div>
            <h3>再生設定</h3>
          </div>
          <p>プリセットと時間は停止中に変更できます。</p>
        </div>

        <div className="settings-grid">
          <div className="settings-column">
            {PROGRAM_GROUPS.map((group) => {
              const profiles = RECOMMENDATION_PROFILES.filter(
                (profile) => profile.program === group.program && profile.evidenceLevel !== 'experimental',
              );
              return (
                <div className="preset-group" key={group.program}>
                  <div className="preset-group-head">
                    <span>{group.label}</span>
                    <small className={`evidence-pill evidence-${profiles[0].evidenceLevel}`}>
                      {EVIDENCE_LABELS[profiles[0].evidenceLevel]}
                    </small>
                  </div>
                  <div className="preset-grid">{profiles.map(renderPreset)}</div>
                </div>
              );
            })}

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
              <div className="exploratory-card" id="exploratory-settings">
                {EXPERIMENTAL_PROFILES.map(renderPreset)}
              </div>
            ) : null}
          </div>

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

            <div className="control-grid">
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

            <div className="collapse-row">
              <button
                aria-controls="advanced-settings"
                aria-expanded={showAdvanced}
                className="inline-toggle"
                type="button"
                onClick={() => setShowAdvanced((value) => !value)}
              >
                {showAdvanced ? 'チューニングを閉じる' : 'チューニング'}
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
                    脈動は40 Hz固定です。音の高さと背景ノイズは再生中も調整できます。
                  </p>
                  <button className="ghost-button" type="button" disabled={sessionState.status !== 'idle'} onClick={() => void onResetCalibration()}>
                    トーンチェックをやり直す
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
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
