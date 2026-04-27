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

      <section className="hero-card">
        <p className="eyebrow">40 Hz 管理リスニング室</p>
        <div className="hero-grid">
          <div>
            <h1>40 Hz セッション制御盤</h1>
            <p className="hero-copy">
              音量を抑え、短い確認を挟みながら使う、自分用のリスニング制御パネルです。
            </p>
          </div>
          <div className="hero-metrics" aria-label="session summary">
            <div className="metric">
              <span>パルス</span>
              <strong>{settings.pulseHz}Hz</strong>
            </div>
            <div className="metric">
              <span>長さ</span>
              <strong>{formatDurationLabel(settings.durationMinutes)}</strong>
            </div>
            <div className="metric">
              <span>モード</span>
              <strong>{activeProfile.label}</strong>
            </div>
            <div className="metric">
              <span>出力</span>
              <strong>{formatOutputMode(userContext.outputMode)}</strong>
            </div>
          </div>
        </div>
      </section>

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
