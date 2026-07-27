import { useEffect } from 'react';
import { PlayerPanel } from './components/PlayerPanel';
import { CalibrationModal } from './components/CalibrationModal';
import { EvidencePanel } from './components/EvidencePanel';
import { OnboardingModal } from './components/OnboardingModal';
import { sharedAudioEngine, type AudioEngine } from './audio/engine';
import { useSession } from './features/session/useSession';

const MODAL_FOCUSABLE_SELECTOR = [
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

type AppProps = {
  engine?: AudioEngine;
};

export default function App({ engine = sharedAudioEngine }: AppProps) {
  const {
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
  const modalOpen = !setupComplete || !calibrationComplete;

  useEffect(() => {
    if (!modalOpen) {
      return;
    }

    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    document.body.style.overflow = 'hidden';

    const getFocusableElements = () => dialog
      ? Array.from(dialog.querySelectorAll<HTMLElement>(MODAL_FOCUSABLE_SELECTOR))
      : [];
    const initialFocusableElements = getFocusableElements();

    (
      dialog?.querySelector<HTMLElement>('[data-initial-focus]')
      ?? initialFocusableElements[0]
    )?.focus();

    function keepFocusInsideDialog(event: KeyboardEvent) {
      const focusableElements = getFocusableElements();

      if (event.key !== 'Tab' || focusableElements.length === 0) {
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener('keydown', keepFocusInsideDialog);

    return () => {
      document.removeEventListener('keydown', keepFocusInsideDialog);
      document.body.style.overflow = previousOverflow;

      queueMicrotask(() => {
        const nextDialog = document.querySelector<HTMLElement>('[role="dialog"]');
        if (nextDialog) {
          return;
        }

        const startButton = document.querySelector<HTMLButtonElement>(
          'button[aria-label="セッション開始"]',
        );
        const restoreTarget = previousFocus?.isConnected && previousFocus !== document.body
          ? previousFocus
          : startButton;
        restoreTarget?.focus();
      });
    };
  }, [calibrationComplete, modalOpen, setupComplete]);

  return (
    <main className="app-shell">
      <div className="app-content" aria-hidden={modalOpen || undefined} inert={modalOpen}>
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
      </div>

      {!setupComplete ? (
        <OnboardingModal defaultContext={userContext} onComplete={completeOnboarding} />
      ) : null}

      {setupComplete && !calibrationComplete ? (
        <CalibrationModal
          busy={calibrationBusy}
          previewBaseToneHz={previewBaseToneHz}
          onPreview={previewCalibration}
          onChoose={completeCalibration}
          onSkip={() => completeCalibration(220)}
        />
      ) : null}
    </main>
  );
}
