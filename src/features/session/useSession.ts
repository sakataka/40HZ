import { useEffect, useRef, useState } from 'react';
import type { AudioEngine } from '../../audio/engine';
import {
  hydrateStoredPreferences,
  loadStoredPreferences,
  saveStoredPreferences,
} from './storage';
import type {
  CalibrationResult,
  SessionSettings,
  SessionState,
  UserContext,
} from './types';
import {
  deriveCalibrationPreviewSettings,
  deriveSessionSettings,
  mergeSessionSettings,
} from '../../lib/settings';

const TICK_MS = 250;

type AudioOperation = 'idle' | 'starting' | 'stopping' | 'previewing' | 'calibrating';

export function useSession(engine: AudioEngine) {
  const [initialPreferences] = useState(() =>
    hydrateStoredPreferences(loadStoredPreferences()),
  );
  const [userContext, setUserContext] = useState<UserContext>(() =>
    initialPreferences.userContext,
  );
  const [calibration, setCalibration] = useState<CalibrationResult>(() =>
    initialPreferences.calibration,
  );
  const [settings, setSettings] = useState<SessionSettings>(() =>
    initialPreferences.settings,
  );
  const [sessionState, setSessionState] = useState<SessionState>(() => ({
    status: 'idle',
    endsAt: null,
    remainingMs: settings.durationMinutes * 60_000,
  }));
  const [previewBaseToneHz, setPreviewBaseToneHz] = useState<number | null>(null);
  const [audioOperation, setAudioOperation] = useState<AudioOperation>('idle');

  const settingsRef = useRef(settings);
  const sessionStateRef = useRef(sessionState);
  const userContextRef = useRef(userContext);
  const previewBaseToneHzRef = useRef(previewBaseToneHz);
  const audioOperationRef = useRef<AudioOperation>('idle');

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    sessionStateRef.current = sessionState;
  }, [sessionState]);

  useEffect(() => {
    userContextRef.current = userContext;
  }, [userContext]);

  useEffect(() => {
    previewBaseToneHzRef.current = previewBaseToneHz;
  }, [previewBaseToneHz]);

  useEffect(() => {
    saveStoredPreferences({
      settings,
      userContext,
      calibration,
    });
  }, [settings, userContext, calibration]);

  useEffect(() => {
    if (sessionState.status === 'running') {
      return;
    }

    setSessionState((current) => ({
      ...current,
      remainingMs: settings.durationMinutes * 60_000,
    }));
  }, [settings.durationMinutes, sessionState.status]);

  useEffect(() => {
    if (sessionState.status !== 'running') {
      return;
    }

    engine.update(settings);
  }, [engine, settings, sessionState.status]);

  useEffect(() => {
    if (sessionState.status !== 'running') {
      return;
    }

    const timer = window.setInterval(() => {
      setSessionState((current) => {
        if (current.status !== 'running' || current.endsAt == null) {
          return current;
        }

        const remainingMs = Math.max(0, current.endsAt - Date.now());
        if (remainingMs === current.remainingMs) {
          return current;
        }

        return { ...current, remainingMs };
      });
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, [sessionState.status]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const current = sessionStateRef.current;
      if (document.visibilityState !== 'visible' || current.status !== 'running' || current.endsAt == null) {
        return;
      }

      const endsAt = current.endsAt;

      setSessionState((previous) => ({
        ...previous,
        remainingMs: Math.max(0, endsAt - Date.now()),
      }));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (sessionState.status === 'running' && sessionState.remainingMs <= 0) {
      void stopSession();
    }
  }, [sessionState.remainingMs, sessionState.status]);

  const setupComplete = userContext.completedAt != null;
  const calibrationComplete = calibration.completedAt != null;
  const calibrationBusy = audioOperation === 'previewing' || audioOperation === 'calibrating';

  async function startSession(): Promise<void> {
    const current = sessionStateRef.current;
    if (current.status !== 'idle' || !beginAudioOperation('starting')) {
      return;
    }

    if (!setupComplete || !calibrationComplete) {
      endAudioOperation();
      return;
    }

    setSessionState((previous) => ({
      ...previous,
      status: 'starting',
    }));

    try {
      await stopPreviewAudio();

      const activeSettings = settingsRef.current;
      await engine.start(activeSettings);

      const now = Date.now();
      setSessionState((previous) => ({
        ...previous,
        status: 'running',
        endsAt: now + activeSettings.durationMinutes * 60_000,
        remainingMs: activeSettings.durationMinutes * 60_000,
      }));

    } catch {
      const refreshedSettings = settingsRef.current;
      setSessionState((previous) => ({
        ...previous,
        status: 'idle',
        endsAt: null,
        remainingMs: refreshedSettings.durationMinutes * 60_000,
      }));
    } finally {
      endAudioOperation();
    }
  }

  async function stopSession(): Promise<void> {
    const current = sessionStateRef.current;
    if (current.status !== 'running' || !beginAudioOperation('stopping')) {
      return;
    }

    setSessionState((previous) => ({
      ...previous,
      status: 'stopping',
    }));

    try {
      await engine.stop();
    } catch {
      // Keep the UI recoverable even if the browser audio stack rejects a stop call.
    } finally {
      const refreshedSettings = settingsRef.current;
      setSessionState((previous) => ({
        ...previous,
        status: 'idle',
        endsAt: null,
        remainingMs: refreshedSettings.durationMinutes * 60_000,
      }));
      endAudioOperation();
    }
  }

  function updateSettings(updates: Partial<SessionSettings>): void {
    setSettings((current) => mergeSessionSettings(current, updates));
  }

  function applyProfile(profileId: string): void {
    setSettings(
      deriveSessionSettings(profileId, userContextRef.current, settingsRef.current.carrierHz),
    );
  }

  function completeOnboarding(nextContext: Omit<UserContext, 'completedAt'>): void {
    const completedContext: UserContext = {
      ...nextContext,
      completedAt: Date.now(),
    };

    setUserContext(completedContext);
    setSettings(
      deriveSessionSettings(
        settingsRef.current.profileId,
        completedContext,
        settingsRef.current.carrierHz,
      ),
    );
  }

  async function previewCalibration(carrierHz: number): Promise<void> {
    if (sessionStateRef.current.status !== 'idle' || !beginAudioOperation('previewing')) {
      return;
    }

    try {
      await stopPreviewAudio();

      const previewSettings = deriveCalibrationPreviewSettings(userContextRef.current, carrierHz);
      await engine.start(previewSettings);
      setPreviewBaseToneHz(carrierHz);
    } catch {
      setPreviewBaseToneHz(null);
    } finally {
      endAudioOperation();
    }
  }

  async function completeCalibration(carrierHz: number): Promise<void> {
    if (!beginAudioOperation('calibrating')) {
      return;
    }

    try {
      await stopPreviewAudio();

      const nextCalibration: CalibrationResult = { completedAt: Date.now() };

      setCalibration(nextCalibration);
      setSettings((current) => mergeSessionSettings(current, { carrierHz }));
    } finally {
      endAudioOperation();
    }
  }

  async function resetCalibration(): Promise<void> {
    if (!beginAudioOperation('calibrating')) {
      return;
    }

    try {
      await stopPreviewAudio();
      setCalibration((current) => ({
        ...current,
        completedAt: null,
      }));
    } finally {
      endAudioOperation();
    }
  }

  async function stopPreviewAudio(): Promise<void> {
    if (previewBaseToneHzRef.current == null) {
      return;
    }

    try {
      await engine.stop();
    } catch {
      // Keep calibration controls recoverable if the browser audio stack rejects a stop call.
    } finally {
      setPreviewBaseToneHz(null);
    }
  }

  function beginAudioOperation(operation: Exclude<AudioOperation, 'idle'>): boolean {
    if (audioOperationRef.current !== 'idle') {
      return false;
    }

    audioOperationRef.current = operation;
    setAudioOperation(operation);
    return true;
  }

  function endAudioOperation(): void {
    audioOperationRef.current = 'idle';
    setAudioOperation('idle');
  }

  return {
    calibrationComplete,
    completeCalibration,
    completeOnboarding,
    calibrationBusy,
    previewCalibration,
    previewBaseToneHz,
    resetCalibration,
    sessionState,
    settings,
    setupComplete,
    startSession,
    stopSession,
    updateSettings,
    applyProfile,
    userContext,
  };
}
