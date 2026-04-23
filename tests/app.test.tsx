import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import type { AudioEngine } from '../src/audio/engine';
import { STORAGE_KEY } from '../src/features/session/storage';

function createMockEngine(overrides: Partial<AudioEngine> = {}): AudioEngine {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    update: vi.fn(),
    getState: vi.fn().mockReturnValue({ status: 'idle', lastReason: 'manual' }),
    ...overrides,
  };
}

function getStoredPreferences() {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, resolve, reject };
}

async function finishSetup() {
  fireEvent.click(screen.getByRole('button', { name: 'Use these settings' }));
  fireEvent.click(screen.getByRole('button', { name: 'Skip and use 220 Hz' }));
  await waitFor(() =>
    expect(screen.queryByRole('button', { name: 'Skip and use 220 Hz' })).not.toBeInTheDocument(),
  );
  await waitFor(() => expect(screen.getByRole('button', { name: 'Start session' })).toBeEnabled());
}

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('defaults to the recommended 20-minute flow without age or sex inputs', () => {
    const engine = createMockEngine();
    render(<App engine={engine} />);

    expect(screen.getAllByText('Recommended').length).toBeGreaterThan(0);
    expect(screen.getAllByText('20 min').length).toBeGreaterThan(0);
    expect(screen.queryByLabelText(/age/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/sex/i)).not.toBeInTheDocument();
  });

  it('stores 220Hz when calibration is skipped', async () => {
    const engine = createMockEngine();
    render(<App engine={engine} />);

    fireEvent.click(screen.getByRole('button', { name: 'Use these settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip and use 220 Hz' }));

    await waitFor(() =>
      expect(getStoredPreferences().calibration).toEqual(
        expect.objectContaining({
          preferredBaseToneHz: 220,
          skipped: true,
        }),
      ),
    );
  });

  it('uses more conservative defaults for sound-sensitive users', async () => {
    const engine = createMockEngine();
    render(<App engine={engine} />);

    fireEvent.click(screen.getByLabelText('Sensitive'));
    fireEvent.click(screen.getByRole('button', { name: 'Use these settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip and use 220 Hz' }));

    await waitFor(() => expect(screen.getByText('19%')).toBeInTheDocument());
    expect(screen.getByText('5.0 s')).toBeInTheDocument();
  });

  it('keeps carrier frequency in advanced settings only', async () => {
    const engine = createMockEngine();
    render(<App engine={engine} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Use these settings' }));
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Skip and use 220 Hz' }));
      await Promise.resolve();
    });

    expect(screen.queryByLabelText('Base tone (advanced)')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show advanced settings' }));
    expect(screen.getByLabelText('Base tone (advanced)')).toBeInTheDocument();
  });

  it('shows evidence notes separating supported and exploratory guidance', async () => {
    const engine = createMockEngine();
    render(<App engine={engine} />);

    expect(screen.getByText('Evidence for audio-only consumer use is limited')).toBeInTheDocument();
    expect(screen.getAllByText('Limited human data').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Show exploratory options' }));
    expect(screen.getAllByText('Experimental').length).toBeGreaterThan(0);
  });

  it('stops automatically when the timer elapses and resets the countdown', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-29T00:00:00Z'));

    const engine = createMockEngine();
    render(<App engine={engine} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Use these settings' }));
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Skip and use 220 Hz' }));
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole('button', { name: '10 min' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start session' }));

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      vi.setSystemTime(new Date('2026-03-29T00:10:01Z'));
      vi.advanceTimersByTime(300);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(engine.stop).toHaveBeenCalledWith('timer');
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('only starts once while a start transition is in flight', async () => {
    const deferredStart = createDeferred<void>();
    const engine = createMockEngine({
      start: vi.fn().mockReturnValue(deferredStart.promise),
    });

    render(<App engine={engine} />);
    await finishSetup();

    fireEvent.click(screen.getByRole('button', { name: 'Start session' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start session' }));

    await waitFor(() => expect(engine.start).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Starting')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start session' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Stop' })).toBeDisabled();

    await act(async () => {
      deferredStart.resolve();
      await deferredStart.promise;
    });

    expect(screen.getByText('Playing')).toBeInTheDocument();
  });

  it('returns to a safe idle state when engine start fails', async () => {
    const engine = createMockEngine({
      start: vi.fn().mockRejectedValue(new Error('Audio denied')),
    });

    render(<App engine={engine} />);
    await finishSetup();

    fireEvent.click(screen.getByRole('button', { name: 'Start session' }));

    await waitFor(() => expect(screen.getByText('Ready')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Start session' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Stop' })).toBeDisabled();
  });

  it('does not stop twice for the same stop transition', async () => {
    const deferredStop = createDeferred<void>();
    const engine = createMockEngine({
      stop: vi.fn().mockReturnValue(deferredStop.promise),
    });

    render(<App engine={engine} />);
    await finishSetup();

    fireEvent.click(screen.getByRole('button', { name: 'Start session' }));
    await waitFor(() => expect(screen.getByText('Playing')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(screen.getByText('Stopping')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));

    expect(engine.stop).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferredStop.resolve();
      await deferredStop.promise;
    });

    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('keeps the live base tone in sync with advanced edits and profile changes', async () => {
    const engine = createMockEngine();
    render(<App engine={engine} />);
    await finishSetup();

    expect(screen.getByText('220Hz')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show advanced settings' }));
    fireEvent.change(screen.getByLabelText('Base tone (advanced)'), {
      target: { value: '300' },
    });

    await waitFor(() => expect(screen.getAllByText('300Hz').length).toBeGreaterThan(0));

    fireEvent.click(screen.getByRole('button', { name: /Gentle/i }));

    expect(screen.getAllByText('300Hz').length).toBeGreaterThan(0);
    expect(getStoredPreferences().settings).toEqual(
      expect.objectContaining({
        carrierHz: 300,
        profileId: 'gentle',
      }),
    );
  });

  it('rerunning tone check replaces the remembered tone and active settings', async () => {
    const engine = createMockEngine();
    render(<App engine={engine} />);
    await finishSetup();

    fireEvent.click(screen.getByRole('button', { name: 'Show advanced settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run tone check again' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Compare 220 Hz and 440 Hz' })).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('button', { name: 'Use this tone' })[1]);

    await waitFor(() =>
      expect(getStoredPreferences().calibration).toEqual(
        expect.objectContaining({
          preferredBaseToneHz: 440,
          skipped: false,
        }),
      ),
    );

    expect(screen.getAllByText('440Hz').length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getByLabelText('Base tone (advanced)')).toHaveValue('440'));
  });

  it('hydrates persisted settings into a consistent state', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        acceptedSafetyNotice: true,
        userContext: {
          soundSensitivity: 'sensitive',
          outputMode: 'speaker',
          completedAt: 1000,
        },
        calibration: {
          preferredBaseToneHz: 10,
          completedAt: 2000,
          skipped: false,
        },
        settings: {
          pulseHz: 40,
          carrierHz: 1000,
          masterVolume: 0.01,
          durationMinutes: 20,
          fadeInSec: 0.5,
          fadeOutSec: 20,
          backgroundNoiseLevel: -1,
          profileId: 'recommended',
          modulationStyle: 'sine',
        },
      }),
    );

    const engine = createMockEngine();
    render(<App engine={engine} />);

    expect(screen.getAllByText('520Hz').length).toBeGreaterThan(0);
    expect(screen.getByText('5%')).toBeInTheDocument();
    expect(screen.getByText('1.0 s')).toBeInTheDocument();
    expect(screen.getAllByText('Speakers').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sensitive').length).toBeGreaterThan(0);
  });
});
