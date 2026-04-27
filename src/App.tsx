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
    activeBaseToneHz,
    calibrationBusy,
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
        <p className="eyebrow">Controlled 40 Hz Listening Chamber</p>
        <div className="hero-grid">
          <div>
            <h1>Controlled 40 Hz playback.</h1>
            <p className="hero-copy">
              A bounded session console for legal, self-administered listening tests using conservative defaults, limited human EEG findings, and a short audibility check.
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
        activeBaseToneHz={activeBaseToneHz}
        readyToStart={setupComplete && calibrationComplete}
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
          busy={calibrationBusy}
          previewBaseToneHz={previewBaseToneHz}
          onPreview={previewCalibration}
          onChoose={(carrierHz) => completeCalibration(carrierHz, false)}
          onSkip={() => completeCalibration(220, true)}
        />
      ) : null}
    </main>
  );
}
