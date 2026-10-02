import { useState, type CSSProperties } from 'react';
import { breathsPerMinute } from '../features/session/breath';
import { EVIDENCE_LABELS } from '../features/session/presets';
import type { RecommendationProfile, SessionSettings, SessionState } from '../features/session/types';
import type { TrackingMode } from '../features/tracking/types';
import { SESSION_LIMITS } from '../lib/settings';
import { traceKindOf } from '../features/session/trace';
import { STAGE_LABELS, useBreathPoint } from './BreathGuide';
import { ResonanceTrace } from './ResonanceTrace';

const DURATION_OPTIONS = [5, 10, 15, 20, 30] as const;
const STATUS_LABELS: Record<SessionState['status'], string> = {
  idle: '停止中',
  starting: '準備中',
  running: '再生中',
  stopping: '停止しています',
};
const TRACKING_LABELS: Record<TrackingMode, string> = {
  off: '',
  checkin: '前後チェックあり',
  experiment: 'ブラインド比較',
};
const TICK_COUNT = 60;
const TICKS = Array.from({ length: TICK_COUNT }, (_, index) => {
  const angle = (index / TICK_COUNT) * Math.PI * 2 - Math.PI / 2;
  const major = index % 5 === 0;
  const inner = major ? 44.2 : 45.6;
  return {
    major,
    x1: 50 + Math.cos(angle) * inner,
    y1: 50 + Math.sin(angle) * inner,
    x2: 50 + Math.cos(angle) * 48.4,
    y2: 50 + Math.sin(angle) * 48.4,
  };
});

type NowPlayingProps = {
  profile: RecommendationProfile;
  settings: SessionSettings;
  sessionState: SessionState;
  readyToStart: boolean;
  blind: boolean;
  trackingMode: TrackingMode;
  /** Phone layout: rendered as a full-screen sheet with a close button. */
  sheet: boolean;
  onClose: () => void;
  onStart: () => void;
  onStop: () => Promise<void>;
  onUpdateSettings: (updates: Partial<SessionSettings>) => void;
};

export function NowPlaying({
  profile,
  settings,
  sessionState,
  readyToStart,
  blind,
  trackingMode,
  sheet,
  onClose,
  onStart,
  onStop,
  onUpdateSettings,
}: NowPlayingProps) {
  const [showTuning, setShowTuning] = useState(false);
  const { status } = sessionState;
  const live = status === 'running' || status === 'stopping';
  const running = status === 'running';
  const totalMs = settings.durationMinutes * 60_000;
  const elapsedFraction = live ? Math.min(1, Math.max(0, 1 - sessionState.remainingMs / totalMs)) : 0;
  const startedAt = running && sessionState.endsAt != null ? sessionState.endsAt - totalMs : null;
  const breath = useBreathPoint(profile.breath, startedAt);
  const litTicks = live ? Math.round(elapsedFraction * TICK_COUNT) : 0;

  return (
    <section
      className={`now-playing mood-${blind ? 'focus' : profile.mood}${sheet ? ' is-sheet' : ''}${live ? ' is-live' : ''}`}
      aria-labelledby="now-playing-title"
    >
      {sheet ? (
        <div className="sheet-bar">
          <button className="icon-button" type="button" aria-label="プレーヤーを閉じる" onClick={onClose}>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
      ) : null}

      <div className="np-head">
        <span className={`np-status${running ? ' is-playing' : ''}`} role="status">
          {STATUS_LABELS[status]}
        </span>
        {trackingMode !== 'off' ? <span className="np-tag">{TRACKING_LABELS[trackingMode]}</span> : null}
      </div>

      <div className="np-visual">
        <svg className="np-dial" viewBox="0 0 100 100" aria-hidden="true">
          {TICKS.map((tick, index) => (
            <line
              key={index}
              className={`np-tick${tick.major ? ' is-major' : ''}${index < litTicks ? ' is-lit' : ''}`}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
            />
          ))}
        </svg>
        <ResonanceTrace
          kind={blind ? 'lissajous' : traceKindOf(profile)}
          breath={profile.breath}
          startedAt={startedAt}
          live={running}
          clearCenter={!breath}
        />
        <div className="np-center">
          {breath ? <strong className="np-stage" aria-live="off">{STAGE_LABELS[breath.stage]}</strong> : null}
          <Countdown className={breath ? 'np-time is-small' : 'np-time'} milliseconds={sessionState.remainingMs} />
          <span className="np-time-label">{live ? '残り' : 'タイマー'}</span>
        </div>
      </div>

      <div className="np-info">
        <h2 id="now-playing-title">{blind ? '40 Hz／対照（非表示）' : profile.label}</h2>
        <p>
          {blind ? 'どちらの音かは終了後に表示されます。' : profile.description}
          {' '}
          <small className={`evidence-pill evidence-${profile.evidenceLevel}`}>
            {EVIDENCE_LABELS[profile.evidenceLevel]}
          </small>
        </p>
        <p className="np-hint">{listeningHint(profile)}</p>
      </div>

      <button
        aria-label={live ? '停止' : 'セッション開始'}
        className={`play-button${live ? ' is-stop' : ''}`}
        type="button"
        disabled={live ? !running : !readyToStart || status !== 'idle'}
        onClick={() => (live ? void onStop() : onStart())}
      >
        <PlayGlyph stop={live} />
        {live ? '停止' : '再生'}
      </button>

      <div className="np-controls">
        <div>
          <p className="control-label" id="duration-label">タイマー</p>
          <div className="chip-row" role="group" aria-labelledby="duration-label">
            {DURATION_OPTIONS.map((minutes) => (
              <button
                key={minutes}
                aria-pressed={settings.durationMinutes === minutes}
                className="chip"
                type="button"
                disabled={status !== 'idle'}
                onClick={() => onUpdateSettings({ durationMinutes: minutes })}
              >
                {minutes}分
              </button>
            ))}
          </div>
        </div>

        <RangeControl
          label="音量"
          value={settings.masterVolume}
          min={SESSION_LIMITS.masterVolume.min}
          max={SESSION_LIMITS.masterVolume.max}
          step={0.01}
          displayValue={formatPercent(settings.masterVolume)}
          onChange={(value) => onUpdateSettings({ masterVolume: value })}
        />

        <div className="disclosure">
          <button
            aria-controls="tuning-settings"
            aria-expanded={showTuning}
            className="text-button disclosure-toggle"
            type="button"
            onClick={() => setShowTuning((value) => !value)}
          >
            {showTuning ? 'チューニングを閉じる' : 'チューニング'}
          </button>
          {showTuning ? (
            <div className="disclosure-body" id="tuning-settings">
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
              <p className="fine-print">音の高さと背景ノイズは、40 Hzと呼吸ガイドの音に使われます。再生中も調整できます。</p>
            </div>
          ) : null}
        </div>
      </div>

      <p className="fine-print np-safety">小さな音量から始め、不快に感じたら停止してください。</p>
    </section>
  );
}

function listeningHint(profile: RecommendationProfile): string {
  if (profile.breath) {
    return `毎分 ${breathsPerMinute(profile.breath)} 回 ・ 鼻から吸って、口からゆっくり吐く`;
  }
  if (profile.program === 'gamma') {
    return '楽な姿勢で、目を閉じて聞くのがおすすめです。';
  }
  return '作業や休憩の背景に、小さめの音で流しておけます。';
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

export function RangeControl({ label, value, min, max, step, displayValue, onChange }: RangeControlProps) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <label className="range-control">
      <span className="range-meta">
        <span>{label}</span>
        <strong>{displayValue}</strong>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--fill': `${fill}%` } as CSSProperties}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}

/** Each digit sits in a fixed-width cell so proportional display figures do not jitter. */
function Countdown({ milliseconds, className }: { milliseconds: number; className: string }) {
  const text = formatCountdown(milliseconds);
  return (
    <span className={className}>
      <span className="visually-hidden">{text}</span>
      {Array.from(text, (character, index) => (
        <span key={index} className={character === ':' ? 'digit-colon' : 'digit'} aria-hidden="true">
          {character}
        </span>
      ))}
    </span>
  );
}

export function PlayGlyph({ stop }: { stop: boolean }) {
  return (
    <svg className="play-glyph" aria-hidden="true" width="14" height="14" viewBox="0 0 14 14">
      {stop ? <rect x="2" y="2" width="10" height="10" rx="2" fill="currentColor" /> : <path d="M3.5 1.8v10.4a.8.8 0 0 0 1.2.7l8.3-5.2a.8.8 0 0 0 0-1.4L4.7 1.1a.8.8 0 0 0-1.2.7Z" fill="currentColor" />}
    </svg>
  );
}

export function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
