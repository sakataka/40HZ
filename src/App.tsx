import { PlayerPanel } from './components/PlayerPanel';
import { CalibrationModal } from './components/CalibrationModal';
import { EvidencePanel } from './components/EvidencePanel';
import { OnboardingModal } from './components/OnboardingModal';
import { sharedAudioEngine, type AudioEngine } from './audio/engine';
import { RECOMMENDATION_PROFILES } from './features/session/presets';
import { useSession } from './features/session/useSession';

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
      <section className="title-card" aria-labelledby="app-title">
        <p className="eyebrow">40 Hz 管理リスニング室</p>
        <h1 id="app-title">
          40 Hz
          <span>セッション制御盤</span>
        </h1>
        <p className="title-copy">
          残り時間と再生操作を最優先に置いた、40 Hz 用のリスニング制御パネルです。
        </p>
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
