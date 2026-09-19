import { useState } from 'react';
import type {
  SessionSettings,
  SessionState,
  UserContext,
} from '../features/session/types';
import { getRecommendationProfile, RECOMMENDATION_PROFILES } from '../features/session/presets';
import { SESSION_LIMITS } from '../lib/settings';

const DURATION_OPTIONS = [10, 15, 20, 30] as const;
const LIMITED_PROFILES = RECOMMENDATION_PROFILES.filter(
  (profile) => profile.evidenceLevel === 'limited',
);
const EXPERIMENTAL_PROFILES = RECOMMENDATION_PROFILES.filter(
  (profile) => profile.evidenceLevel === 'experimental',
);

type PlayerPanelProps = {
  readyToStart: boolean;
  settings: SessionSettings;
  sessionState: SessionState;
  userContext: UserContext;
  onApplyProfile: (profileId: string) => void;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
  onUpdateSettings: (updates: Partial<SessionSettings>) => void;
  onResetCalibration: () => Promise<void>;
};

export function PlayerPanel({
  readyToStart,
  settings,
  sessionState,
  userContext,
  onApplyProfile,
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
              onClick={() => void onStart()}
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
            <strong>{activeProfile.label}</strong>
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
            <div className="preset-grid">
              {LIMITED_PROFILES.map((profile) => (
                <button
                  key={profile.id}
                  aria-pressed={activeProfile.id === profile.id}
                  className={`preset-card ${activeProfile.id === profile.id ? 'preset-active' : ''}`}
                  type="button"
                  disabled={sessionState.status !== 'idle'}
                  onClick={() => onApplyProfile(profile.id)}
                >
                  <div className="preset-head">
                    <span>{profile.label}</span>

                  </div>

                  <small>{profile.description}</small>
                </button>
              ))}
            </div>

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
                {EXPERIMENTAL_PROFILES.map((profile) => (
                  <button
                    key={profile.id}
                    aria-pressed={activeProfile.id === profile.id}
                    className={`preset-card ${activeProfile.id === profile.id ? 'preset-active' : ''}`}
                    type="button"
                    disabled={sessionState.status !== 'idle'}
                    onClick={() => onApplyProfile(profile.id)}
                  >
                    <div className="preset-head">
                      <span>{profile.label}</span>
                      <small className="evidence-pill evidence-experimental">試験的</small>
                    </div>

                    <small>{profile.description}</small>
                  </button>
                ))}
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
