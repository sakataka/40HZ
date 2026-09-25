import { useEffect } from 'react';
import { PlayerPanel } from './components/PlayerPanel';
import { CalibrationModal } from './components/CalibrationModal';
import { CheckInModal } from './components/CheckInModal';
import { EvidencePanel } from './components/EvidencePanel';
import { HistoryPanel } from './components/HistoryPanel';
import { OnboardingModal } from './components/OnboardingModal';
import { ResultModal } from './components/ResultModal';
import { WatchPanel } from './components/WatchPanel';
import { sharedAudioEngine, type AudioEngine } from './audio/engine';
import { useSession } from './features/session/useSession';
import { countArms } from './features/tracking/stats';
import type { CheckIn, TrackingPrefs } from './features/tracking/types';
import { useTracking } from './features/tracking/useTracking';

const MODAL_FOCUSABLE_SELECTOR = [
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const BLIND_PROFILE_ID = 'recommended';

type AppProps = {
  engine?: AudioEngine;
  reactionDurationSec?: number;
};

export default function App({ engine = sharedAudioEngine, reactionDurationSec }: AppProps) {
  const tracking = useTracking();
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
  } = useSession(engine, { onSessionEnd: tracking.handleSessionEnd });
  const { flow } = tracking;
  const trackingModalOpen = flow.step === 'pre' || flow.step === 'post' || flow.step === 'result';
  const modalOpen = !setupComplete || !calibrationComplete || trackingModalOpen;
  const blind = tracking.prefs.mode === 'experiment';

  function handleStart() {
    if (tracking.prefs.mode === 'off') {
      void startSession();
      return;
    }
    tracking.beginPre();
  }

  async function startTrackedSession(pre: CheckIn | undefined) {
    const condition = tracking.beginRun(settings.profileId, pre);
    const started = await startSession({ condition });
    if (!started) {
      tracking.cancel();
    }
  }

  function changeTrackingPrefs(updates: Partial<TrackingPrefs>) {
    tracking.updatePrefs(updates);
    if (updates.mode === 'experiment' && settings.profileId !== BLIND_PROFILE_ID) {
      applyProfile(BLIND_PROFILE_ID);
    }
  }

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
  }, [calibrationComplete, flow.step, modalOpen, setupComplete]);

  return (
    <main className="app-shell">
      <div className="app-content" aria-hidden={modalOpen || undefined} inert={modalOpen}>
        <header className="app-header">
          <div>
            <h1 id="app-title">40 Hz <span>Audio</span></h1>
            <p>音を流す。好みに合わせて調整する。</p>
          </div>
          <span className="header-note">音声プレーヤー</span>
        </header>

        <PlayerPanel
          readyToStart={setupComplete && calibrationComplete}
          sessionState={sessionState}
          settings={settings}
          userContext={userContext}
          trackingPrefs={tracking.prefs}
          onApplyProfile={applyProfile}
          onChangeTrackingPrefs={changeTrackingPrefs}
          onStart={handleStart}
          onStop={stopSession}
          onResetCalibration={resetCalibration}
          onUpdateSettings={updateSettings}
        />

        <HistoryPanel
          records={tracking.records}
          healthSamples={tracking.healthSamples}
          onDelete={tracking.deleteRecord}
          onClear={tracking.clearRecords}
          onImport={(records, healthSamples) => {
            tracking.importRecords(records);
            tracking.importHealth(healthSamples);
          }}
        />

        <WatchPanel
          healthSamples={tracking.healthSamples}
          onImport={tracking.importHealth}
          onClear={tracking.clearHealth}
        />

        <EvidencePanel />
      </div>

      {flow.step === 'pre' ? (
        <CheckInModal
          phase="pre"
          blind={blind}
          reactionTest={tracking.prefs.reactionTest}
          reactionDurationSec={reactionDurationSec}
          onSubmit={(checkIn) => void startTrackedSession(checkIn)}
          onSkip={() => {
            tracking.cancel();
            void startSession();
          }}
          onCancel={tracking.cancel}
        />
      ) : null}

      {flow.step === 'post' ? (
        <CheckInModal
          phase="post"
          blind={false}
          reactionTest={Boolean(flow.draft.pre?.reaction)}
          reactionDurationSec={reactionDurationSec}
          initial={flow.draft.pre}
          onSubmit={tracking.submitPost}
          onSkip={() => tracking.submitPost(undefined)}
        />
      ) : null}

      {flow.step === 'result' ? (
        <ResultModal record={flow.record} arms={countArms(tracking.records)} onClose={tracking.cancel} />
      ) : null}

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
