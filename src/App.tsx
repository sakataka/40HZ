import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { CalibrationModal } from './components/CalibrationModal';
import { CheckInModal } from './components/CheckInModal';
import { ListenView } from './components/ListenView';
import { MiniPlayer } from './components/MiniPlayer';
import { NowPlaying } from './components/NowPlaying';
import { OnboardingModal } from './components/OnboardingModal';
import { RecordsView } from './components/RecordsView';
import { ResultModal } from './components/ResultModal';
import { SettingsView } from './components/SettingsView';
import { TabBar, type AppTab } from './components/TabBar';
import { sharedAudioEngine, type AudioEngine } from './audio/engine';
import { getRecommendationProfile } from './features/session/presets';
import { tracePath } from './features/session/trace';
import { useSession } from './features/session/useSession';
import { countArms } from './features/tracking/stats';
import type { CheckIn, TrackingPrefs } from './features/tracking/types';
import { useTracking } from './features/tracking/useTracking';
import { useMediaQuery } from './lib/useMediaQuery';

const MODAL_FOCUSABLE_SELECTOR = [
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const BLIND_PROFILE_ID = 'recommended';
const BRAND_PATH = tracePath('lissajous', 24, 0);

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
  const compact = useMediaQuery('(max-width: 959px)');
  const [tab, setTab] = useState<AppTab>('listen');
  const [playerOpen, setPlayerOpen] = useState(false);
  const sheetOpen = compact && playerOpen;
  const miniOpenRef = useRef<HTMLDivElement>(null);
  const readyToStart = setupComplete && calibrationComplete;
  const activeProfile = getRecommendationProfile(settings.profileId);
  const idle = sessionState.status === 'idle';
  const running = sessionState.status === 'running';
  // Without recording, tapping a sound while playing switches to it on the fly.
  const soundsLocked = !readyToStart
    || blind
    || sessionState.status === 'starting'
    || sessionState.status === 'stopping'
    || (running && tracking.prefs.mode !== 'off');

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

  /** One tap plays the chosen sound; while playing it switches, and tapping the current one stops. */
  function selectProfile(profileId: string) {
    if (sessionState.status === 'running') {
      if (profileId === settings.profileId) {
        void stopSession();
      } else if (tracking.prefs.mode === 'off') {
        applyProfile(profileId);
      }
      return;
    }

    if (sessionState.status !== 'idle') {
      return;
    }

    applyProfile(profileId);
    handleStart();
    // Breath guides are followed visually, so bring the full player up on phones.
    if (compact && getRecommendationProfile(profileId).breath) {
      setPlayerOpen(true);
    }
  }

  /** Cross-fades between tabs where the browser supports view transitions. */
  function changeTab(next: AppTab) {
    if (next === tab) {
      return;
    }
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduceMotion) {
      setTab(next);
      return;
    }
    document.startViewTransition(() => flushSync(() => setTab(next)));
  }

  function closePlayer() {
    setPlayerOpen(false);
    queueMicrotask(() => miniOpenRef.current?.querySelector<HTMLButtonElement>('.mini-open')?.focus());
  }

  function changeTrackingPrefs(updates: Partial<TrackingPrefs>) {
    tracking.updatePrefs(updates);
    if (updates.mode === 'experiment' && settings.profileId !== BLIND_PROFILE_ID) {
      applyProfile(BLIND_PROFILE_ID);
    }
  }

  useEffect(() => {
    if (!sheetOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.querySelector<HTMLElement>('.now-playing .icon-button')?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !document.querySelector('[role="dialog"]')) {
        setPlayerOpen(false);
      }
    }

    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [sheetOpen]);

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

  const nowPlaying = (
    <NowPlaying
      profile={activeProfile}
      settings={settings}
      sessionState={sessionState}
      readyToStart={readyToStart}
      blind={blind}
      trackingMode={tracking.prefs.mode}
      sheet={compact}
      onClose={closePlayer}
      onStart={handleStart}
      onStop={stopSession}
      onUpdateSettings={updateSettings}
    />
  );

  return (
    <main className={`app-shell${compact ? ' is-compact' : ''}`}>
      <div className="app-content" aria-hidden={modalOpen || undefined} inert={modalOpen}>
        <div className="app-main" aria-hidden={sheetOpen || undefined} inert={sheetOpen}>
          <header className="app-bar">
            <span className="brand" aria-label="40 Hz Audio">
              <svg aria-hidden="true" width="26" height="26" viewBox="-2 -2 28 28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
                <path d={BRAND_PATH} />
              </svg>
              <span className="brand-name">40 Hz</span>
              <span className="brand-sub">Audio</span>
            </span>
            {compact ? null : <TabBar current={tab} onChange={changeTab} />}
          </header>

          {tab === 'listen' ? (
            <ListenView
              activeProfileId={settings.profileId}
              playing={running}
              locked={soundsLocked}
              blind={blind}
              onSelect={selectProfile}
              onOpenRecords={() => changeTab('records')}
            />
          ) : null}

          <div hidden={tab !== 'records'}>
            <RecordsView
              prefs={tracking.prefs}
              prefsLocked={!idle}
              records={tracking.records}
              healthSamples={tracking.healthSamples}
              onChangePrefs={changeTrackingPrefs}
              onDelete={tracking.deleteRecord}
              onClear={tracking.clearRecords}
              onImport={(records, healthSamples) => {
                tracking.importRecords(records);
                tracking.importHealth(healthSamples);
              }}
              onImportHealth={tracking.importHealth}
              onClearHealth={tracking.clearHealth}
            />
          </div>

          {tab === 'settings' ? (
            <SettingsView
              userContext={userContext}
              carrierHz={settings.carrierHz}
              locked={!idle}
              onChangeContext={completeOnboarding}
              onResetCalibration={resetCalibration}
            />
          ) : null}
        </div>

        {compact ? (
          <>
            {sheetOpen ? <div className="player-sheet">{nowPlaying}</div> : null}
            <div className="dock" ref={miniOpenRef} aria-hidden={sheetOpen || undefined} inert={sheetOpen}>
              <MiniPlayer
                profile={activeProfile}
                sessionState={sessionState}
                durationMinutes={settings.durationMinutes}
                readyToStart={readyToStart}
                blind={blind}
                onOpen={() => setPlayerOpen(true)}
                onStart={handleStart}
                onStop={stopSession}
              />
              <TabBar current={tab} onChange={changeTab} />
            </div>
          </>
        ) : (
          <aside className="player-column">{nowPlaying}</aside>
        )}
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
