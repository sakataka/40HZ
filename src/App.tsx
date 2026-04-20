import { PlayerPanel } from './components/PlayerPanel';
import { CalibrationModal } from './components/CalibrationModal';
import { EvidencePanel } from './components/EvidencePanel';
import { OnboardingModal } from './components/OnboardingModal';
import { sharedAudioEngine, type AudioEngine } from './audio/engine';
import { RECOMMENDATION_PROFILES } from './features/session/presets';
import { useSession } from './features/session/useSession';
import { formatDurationLabel, formatOutputMode } from './lib/format';

type AppProps = {
  engine?: AudioEngine;
};

export default function App({ engine = sharedAudioEngine }: AppProps) {
  const {
    activeProfile,
    calibration,
    calibrationComplete,
    completeCalibration,
    completeOnboarding,
    previewCalibration,
    previewBaseToneHz,
    resetCalibration,
    settings,
    sessionState,
    applyProfile,
    startSession,
    stopSession,
    setupComplete,
    updateSettings,
    userContext,
  } = useSession(engine);

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">40 Hz Audio Sessions</p>
        <div className="hero-grid">
          <div>
            <h1>40 Hz stimulation, simplified.</h1>
            <p className="hero-copy">
              This player uses conservative defaults informed by limited human EEG and acceptability findings, plus a short listening check.
            </p>
          </div>
          <div className="hero-metrics" aria-label="session summary">
            <div className="metric">
              <span>Pulse rate</span>
              <strong>{settings.pulseHz}Hz</strong>
            </div>
            <div className="metric">
              <span>Session length</span>
              <strong>{formatDurationLabel(settings.durationMinutes)}</strong>
            </div>
            <div className="metric">
              <span>Current mode</span>
              <strong>{activeProfile.label}</strong>
            </div>
            <div className="metric">
              <span>Output</span>
              <strong>{formatOutputMode(userContext.outputMode)}</strong>
            </div>
          </div>
        </div>
      </section>

      <PlayerPanel
        profiles={RECOMMENDATION_PROFILES}
        activeProfile={activeProfile}
        calibration={calibration}
        sessionState={sessionState}
        settings={settings}
        userContext={userContext}
        onApplyProfile={applyProfile}
        onStart={startSession}
        onStop={stopSession}
        onResetCalibration={resetCalibration}
        onUpdateSettings={updateSettings}
      />

      <EvidencePanel />

      {!setupComplete ? (
        <OnboardingModal defaultContext={userContext} onComplete={completeOnboarding} />
      ) : null}

      {setupComplete && !calibrationComplete ? (
        <CalibrationModal
          previewBaseToneHz={previewBaseToneHz}
          onPreview={previewCalibration}
          onChoose={(carrierHz) => completeCalibration(carrierHz, false)}
          onSkip={() => completeCalibration(220, true)}
        />
      ) : null}
    </main>
  );
}
