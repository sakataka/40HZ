import { useEffect, useRef, useState } from 'react';
import type { AudioEngine } from '../../audio/engine';
import { getRecommendationProfile } from './presets';
import { loadStoredPreferences, saveStoredPreferences } from './storage';
import type {
  CalibrationResult,
  SessionSettings,
  SessionState,
  StopReason,
  UserContext,
} from './types';
import {
  DEFAULT_CALIBRATION,
  DEFAULT_SETTINGS,
  DEFAULT_USER_CONTEXT,
  deriveCalibrationPreviewSettings,
  deriveSessionSettings,
  mergeSessionSettings,
  validateSessionSettings,
} from '../../lib/settings';

const TICK_MS = 250;

export function useSession(engine: AudioEngine) {
  const stored = loadStoredPreferences();
  const [userContext, setUserContext] = useState<UserContext>(() =>
    stored?.userContext ? normalizeUserContext(stored.userContext) : DEFAULT_USER_CONTEXT,
  );
  const [calibration, setCalibration] = useState<CalibrationResult>(() =>
    stored?.calibration ? normalizeCalibration(stored.calibration) : DEFAULT_CALIBRATION,
  );
  const [settings, setSettings] = useState<SessionSettings>(() =>
    stored?.settings
      ? validateSessionSettings(stored.settings)
      : deriveSessionSettings('recommended', userContext, calibration),
  );
  const [sessionState, setSessionState] = useState<SessionState>(() => ({
    status: 'idle',
    startedAt: null,
    endsAt: null,
    remainingMs: settings.durationMinutes * 60_000,
    acceptedSafetyNotice: stored?.acceptedSafetyNotice ?? false,
  }));
  const [previewBaseToneHz, setPreviewBaseToneHz] = useState<number | null>(null);

  const settingsRef = useRef(settings);
  const sessionStateRef = useRef(sessionState);
  const userContextRef = useRef(userContext);
  const calibrationRef = useRef(calibration);
  const previewBaseToneHzRef = useRef(previewBaseToneHz);

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
    calibrationRef.current = calibration;
  }, [calibration]);

  useEffect(() => {
    previewBaseToneHzRef.current = previewBaseToneHz;
  }, [previewBaseToneHz]);

  useEffect(() => {
    saveStoredPreferences({
      settings,
      acceptedSafetyNotice: sessionState.acceptedSafetyNotice,
      userContext,
      calibration,
    });
  }, [settings, sessionState.acceptedSafetyNotice, userContext, calibration]);

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
      void stopSession('timer');
    }
  }, [sessionState.remainingMs, sessionState.status]);

  const setupComplete = sessionState.acceptedSafetyNotice && userContext.completedAt != null;
  const calibrationComplete = calibration.completedAt != null;
  const activeProfile = getRecommendationProfile(settings.profileId);

  async function startSession(): Promise<boolean> {
    if (!setupComplete || !calibrationComplete) {
      return false;
    }

    await stopPreviewIfNeeded();

    const activeSettings = settingsRef.current;
    await engine.start(activeSettings);

    const now = Date.now();
    setSessionState((current) => ({
      ...current,
      status: 'running',
      startedAt: now,
      endsAt: now + activeSettings.durationMinutes * 60_000,
      remainingMs: activeSettings.durationMinutes * 60_000,
    }));

    return true;
  }

  async function stopSession(reason: StopReason = 'manual'): Promise<void> {
    const current = sessionStateRef.current;
    if (current.status === 'idle') {
      return;
    }

    setSessionState((previous) => ({
      ...previous,
      status: 'stopping',
    }));

    await engine.stop(reason);

    const refreshedSettings = settingsRef.current;
    setSessionState((previous) => ({
      ...previous,
      status: 'idle',
      startedAt: null,
      endsAt: null,
      remainingMs: refreshedSettings.durationMinutes * 60_000,
    }));
  }

  function updateSettings(updates: Partial<SessionSettings>): void {
    setSettings((current) => mergeSessionSettings(current, updates));
  }

  function applyProfile(profileId: string): void {
    const derived = deriveSessionSettings(profileId, userContextRef.current, calibrationRef.current);
    setSettings(derived);
  }

  function completeOnboarding(nextContext: Omit<UserContext, 'completedAt'>): void {
    const completedContext: UserContext = {
      ...nextContext,
      completedAt: Date.now(),
    };

    setUserContext(completedContext);
    setSessionState((current) => ({
      ...current,
      acceptedSafetyNotice: true,
    }));
    setSettings(deriveSessionSettings(settingsRef.current.profileId, completedContext, calibrationRef.current));
  }

  async function previewCalibration(carrierHz: number): Promise<void> {
    if (sessionStateRef.current.status === 'running') {
      return;
    }

    const previewSettings = deriveCalibrationPreviewSettings(userContextRef.current, carrierHz);
    await engine.start(previewSettings);
    setPreviewBaseToneHz(carrierHz);
  }

  async function completeCalibration(carrierHz: number, skipped: boolean): Promise<void> {
    await stopPreviewIfNeeded();

    const nextCalibration: CalibrationResult = {
      preferredBaseToneHz: carrierHz,
      completedAt: Date.now(),
      skipped,
    };

    setCalibration(nextCalibration);
    setSettings((current) => mergeSessionSettings(current, { carrierHz }));
  }

  async function resetCalibration(): Promise<void> {
    await stopPreviewIfNeeded();
    setCalibration((current) => ({
      ...current,
      completedAt: null,
      skipped: false,
    }));
  }

  async function stopPreviewIfNeeded(): Promise<void> {
    if (previewBaseToneHzRef.current == null) {
      return;
    }

    await engine.stop('manual');
    setPreviewBaseToneHz(null);
  }

  return {
    activeProfile,
    calibration,
    calibrationComplete,
    completeCalibration,
    completeOnboarding,
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

function normalizeUserContext(value: UserContext): UserContext {
  return {
    soundSensitivity: value.soundSensitivity ?? DEFAULT_USER_CONTEXT.soundSensitivity,
    outputMode: value.outputMode ?? DEFAULT_USER_CONTEXT.outputMode,
    completedAt: value.completedAt ?? null,
  };
}

function normalizeCalibration(value: CalibrationResult): CalibrationResult {
  return {
    preferredBaseToneHz: value.preferredBaseToneHz || DEFAULT_CALIBRATION.preferredBaseToneHz,
    completedAt: value.completedAt ?? null,
    skipped: value.skipped ?? false,
  };
}
