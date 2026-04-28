import { useState } from 'react';
import type {
  RecommendationProfile,
  SessionSettings,
  SessionState,
  UserContext,
} from '../features/session/types';
import { formatCountdown, formatOutputMode, formatPercent, formatSensitivity } from '../lib/format';

type PlayerPanelProps = {
  profiles: RecommendationProfile[];
  activeProfile: RecommendationProfile;
  activeBaseToneHz: number;
  readyToStart: boolean;
  settings: SessionSettings;
  sessionState: SessionState;
  userContext: UserContext;
  onApplyProfile: (profileId: string) => void;
  onStart: () => Promise<boolean>;
  onStop: () => Promise<void>;
  onUpdateSettings: (updates: Partial<SessionSettings>) => void;
  onResetCalibration: () => Promise<void>;
};

export function PlayerPanel({
  profiles,
  activeProfile,
  activeBaseToneHz,
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
  const limitedProfiles = profiles.filter((profile) => profile.evidenceLevel === 'limited');
  const experimentalProfiles = profiles.filter((profile) => profile.evidenceLevel === 'experimental');

  return (
    <section className={`panel player-panel session-${sessionState.status}`}>
      <div className="panel-header">
        <div>
          <p className="section-label">運用制御</p>
          <h2>照射許可と遮断</h2>
        </div>
      </div>

      <div className="panel-signal-row">
        <div className="signal-visualizer" aria-hidden="true">
          {Array.from({ length: 11 }, (_, index) => (
            <span key={index} />
          ))}
        </div>
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
              セッション開始
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
            <span>残り滞在時間</span>
            <strong>{formatCountdown(sessionState.remainingMs)}</strong>
          </div>
        </div>

        <p className="context-label">現在の許可条件</p>
        <div className="context-chip-row" aria-label="現在の設定">
          <div className="duration-chip">
            <span>プロトコル</span>
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
            <strong>{activeBaseToneHz}Hz</strong>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="section-head">
          <div>
            <p className="section-label">許容範囲</p>
            <h3>稼働中も触れるつまみ</h3>
          </div>
          <p>気分が悪い、めまい、頭痛、妙な圧迫感があれば即時遮断してください。</p>
        </div>

        <div className="settings-grid">
          <div className="settings-column">
            <div className="preset-grid">
              {limitedProfiles.map((profile) => (
                <button
                  key={profile.id}
                  className={`preset-card ${activeProfile.id === profile.id ? 'preset-active' : ''}`}
                  type="button"
                  onClick={() => onApplyProfile(profile.id)}
                >
                  <div className="preset-head">
                    <span>{profile.label}</span>
                    <small className="evidence-pill evidence-limited">限定的な人でのデータ</small>
                  </div>
                  <strong>{profile.summary}</strong>
                  <small>{profile.description}</small>
                </button>
              ))}
            </div>

            <div className="collapse-row">
              <button className="inline-toggle" type="button" onClick={() => setShowExploratory((value) => !value)}>
                {showExploratory ? '試験的な設定を隠す' : '試験的な設定を表示'}
              </button>
            </div>

            {showExploratory ? (
              <div className="exploratory-card">
                {experimentalProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    className={`preset-card ${activeProfile.id === profile.id ? 'preset-active' : ''}`}
                    type="button"
                    onClick={() => onApplyProfile(profile.id)}
                  >
                    <div className="preset-head">
                      <span>{profile.label}</span>
                      <small className="evidence-pill evidence-experimental">試験的</small>
                    </div>
                    <strong>{profile.summary}</strong>
                    <small>{profile.description}</small>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="settings-column">
            <div className="duration-row" role="group" aria-label="セッションの長さ">
              {[10, 20, 30].map((minutes) => (
                <button
                  key={minutes}
                  className={`duration-chip ${settings.durationMinutes === minutes ? 'duration-active' : ''}`}
                  type="button"
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
                min={0.05}
                max={0.9}
                step={0.01}
                displayValue={formatPercent(settings.masterVolume)}
                onChange={(value) => onUpdateSettings({ masterVolume: value })}
              />
            </div>

            <div className="collapse-row">
              <button
                className="inline-toggle"
                type="button"
                onClick={() => setShowAdvanced((value) => !value)}
              >
                {showAdvanced ? '詳細設定を隠す' : '詳細設定を表示'}
              </button>
            </div>

            {showAdvanced ? (
              <div className="advanced-card">
                <div className="advanced-control-grid">
                  <RangeControl
                    label="基準音（詳細）"
                    value={settings.carrierHz}
                    min={180}
                    max={520}
                    step={10}
                    displayValue={`${settings.carrierHz}Hz`}
                    onChange={(value) => onUpdateSettings({ carrierHz: value })}
                  />
                  <RangeControl
                    label="背景ノイズ"
                    value={settings.backgroundNoiseLevel}
                    min={0}
                    max={0.3}
                    step={0.01}
                    displayValue={formatPercent(settings.backgroundNoiseLevel)}
                    onChange={(value) => onUpdateSettings({ backgroundNoiseLevel: value })}
                  />
                </div>

                <div className="advanced-actions">
                  <p>
                    年齢や性別による自動調整は行いません。トーンチェックは、この機器と聞こえ方に合わせるための簡易確認です。
                  </p>
                  <button className="ghost-button" type="button" onClick={() => void onResetCalibration()}>
                    トーンチェックをやり直す
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
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
