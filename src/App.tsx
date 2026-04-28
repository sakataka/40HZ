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
        <p className="eyebrow">合法音響観測室 / non-medical</p>
        <h1 id="app-title">
          40 Hz
          <span>灰色聴取プロトコル</span>
        </h1>
        <p className="title-copy">
          治療ではない、保証もしない。ただ 40 Hz の脈動を、静かな部屋で慎重に扱うための制御盤です。
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
