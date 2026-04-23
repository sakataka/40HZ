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
  const statusLabel =
    sessionState.status === 'starting'
      ? 'Starting'
      : sessionState.status === 'running'
        ? 'Playing'
        : sessionState.status === 'stopping'
          ? 'Stopping'
          : 'Ready';

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="section-label">Recommended Controls</p>
          <h2>Simple playback controls</h2>
        </div>
        <div className={`status-pill status-${sessionState.status}`}>{statusLabel}</div>
      </div>

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
              <small className="evidence-pill evidence-limited">Limited human data</small>
            </div>
            <strong>{profile.summary}</strong>
            <small>{profile.description}</small>
          </button>
        ))}
      </div>

      <div className="collapse-row">
        <button className="inline-toggle" type="button" onClick={() => setShowExploratory((value) => !value)}>
          {showExploratory ? 'Hide exploratory options' : 'Show exploratory options'}
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
                <small className="evidence-pill evidence-experimental">Experimental</small>
              </div>
              <strong>{profile.summary}</strong>
              <small>{profile.description}</small>
            </button>
          ))}
        </div>
      ) : null}

      <div className="context-strip">
        <div>
          <span>Listening setup</span>
          <strong>{formatOutputMode(userContext.outputMode)}</strong>
        </div>
        <div>
          <span>Sensitivity</span>
          <strong>{formatSensitivity(userContext.soundSensitivity)}</strong>
        </div>
        <div>
          <span>Base tone</span>
          <strong>{activeBaseToneHz}Hz</strong>
        </div>
      </div>

      <div className="timer-strip">
        <div>
          <span>Time left</span>
          <strong>{formatCountdown(sessionState.remainingMs)}</strong>
        </div>
        <div className="button-row">
          <button className="primary-button" type="button" onClick={() => void onStart()} disabled={!canStart}>
            Start session
          </button>
          <button className="ghost-button" type="button" onClick={() => void onStop()} disabled={!canStop}>
            Stop
          </button>
        </div>
      </div>

      <div className="duration-row" role="group" aria-label="Session length">
        {[10, 20, 30].map((minutes) => (
          <button
            key={minutes}
            className={`duration-chip ${settings.durationMinutes === minutes ? 'duration-active' : ''}`}
            type="button"
            onClick={() => onUpdateSettings({ durationMinutes: minutes })}
          >
            {minutes} min
          </button>
        ))}
      </div>

      <div className="guide-card">
        <p className="section-label">Best Practices</p>
        <ul className="guide-list">
          <li>Start in a quiet place and keep the first session short.</li>
          <li>Some EEG studies observed stronger 40 Hz responses in eyes-closed or low-arousal conditions. If comfortable, you can try listening with your eyes closed.</li>
          <li>Keep the volume no higher than clearly audible and comfortable.</li>
        </ul>
      </div>

      <div className="control-grid">
        <RangeControl
          label="Volume"
          value={settings.masterVolume}
          min={0.05}
          max={0.9}
          step={0.01}
          displayValue={formatPercent(settings.masterVolume)}
          onChange={(value) => onUpdateSettings({ masterVolume: value })}
        />
        <RangeControl
          label="Fade"
          value={settings.fadeInSec}
          min={1}
          max={10}
          step={0.5}
          displayValue={`${settings.fadeInSec.toFixed(1)} s`}
          onChange={(value) => onUpdateSettings({ fadeInSec: value, fadeOutSec: value })}
        />
        <RangeControl
          label="Background noise"
          value={settings.backgroundNoiseLevel}
          min={0}
          max={0.3}
          step={0.01}
          displayValue={formatPercent(settings.backgroundNoiseLevel)}
          onChange={(value) => onUpdateSettings({ backgroundNoiseLevel: value })}
        />
      </div>

      <div className="collapse-row">
        <button className="inline-toggle" type="button" onClick={() => setShowAdvanced((value) => !value)}>
          {showAdvanced ? 'Hide advanced settings' : 'Show advanced settings'}
        </button>
      </div>

      {showAdvanced ? (
        <div className="advanced-card">
          <RangeControl
            label="Base tone (advanced)"
            value={settings.carrierHz}
            min={180}
            max={520}
            step={10}
            displayValue={`${settings.carrierHz}Hz`}
            onChange={(value) => onUpdateSettings({ carrierHz: value })}
          />
          <div className="advanced-actions">
            <p>
              This app does not auto-adjust by age or sex. The tone check is a usability shortcut, not a research-based optimization step. You can run it again at any time.
            </p>
            <button className="ghost-button" type="button" onClick={() => void onResetCalibration()}>
              Run tone check again
            </button>
          </div>
        </div>
      ) : null}
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
