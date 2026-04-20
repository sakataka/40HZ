import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import type { AudioEngine } from '../src/audio/engine';
import { STORAGE_KEY } from '../src/features/session/storage';

function createMockEngine(): AudioEngine {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    update: vi.fn(),
    getState: vi.fn().mockReturnValue({ status: 'idle', lastReason: 'manual' }),
  };
}

function getStoredPreferences() {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
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
});
