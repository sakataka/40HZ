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
  fireEvent.click(screen.getByRole('button', { name: 'この設定で進む' }));
  fireEvent.click(screen.getByRole('button', { name: 'スキップして 220 Hz を使う' }));
  await waitFor(() =>
    expect(screen.queryByRole('button', { name: 'スキップして 220 Hz を使う' })).not.toBeInTheDocument(),
  );
  await waitFor(() => expect(screen.getByRole('button', { name: 'セッション開始' })).toBeEnabled());
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

    expect(screen.getAllByText('おすすめ').length).toBeGreaterThan(0);
    expect(screen.getAllByText('20分').length).toBeGreaterThan(0);
    expect(screen.queryByLabelText(/age/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/sex/i)).not.toBeInTheDocument();
  });

  it('stores 220Hz when calibration is skipped', async () => {
    const engine = createMockEngine();
    render(<App engine={engine} />);

    fireEvent.click(screen.getByRole('button', { name: 'この設定で進む' }));
    fireEvent.click(screen.getByRole('button', { name: 'スキップして 220 Hz を使う' }));

    await waitFor(() =>
      expect(getStoredPreferences().calibration).toEqual(
        expect.objectContaining({
          preferredBaseToneHz: 220,
          skipped: true,
        }),
      ),
    );
  });

  it('keeps session start disabled until calibration is complete', async () => {
    const engine = createMockEngine();
    render(<App engine={engine} />);

    expect(screen.getByRole('button', { name: 'セッション開始' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'この設定で進む' }));

    expect(screen.getByRole('button', { name: 'セッション開始' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'スキップして 220 Hz を使う' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'セッション開始' })).toBeEnabled());
  });

  it('keeps session start disabled while tone check is being rerun', async () => {
    const engine = createMockEngine();
    render(<App engine={engine} />);
    await finishSetup();

    fireEvent.click(screen.getByRole('button', { name: '詳細設定を表示' }));
    fireEvent.click(screen.getByRole('button', { name: 'トーンチェックをやり直す' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: '220 Hz と 440 Hz を比べる' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'セッション開始' })).toBeDisabled();
  });

  it('uses more conservative defaults for sound-sensitive users', async () => {
    const engine = createMockEngine();
    render(<App engine={engine} />);

    fireEvent.click(screen.getByLabelText('音に敏感'));
    fireEvent.click(screen.getByRole('button', { name: 'この設定で進む' }));
    fireEvent.click(screen.getByRole('button', { name: 'スキップして 220 Hz を使う' }));

    await waitFor(() => expect(screen.getByText('19%')).toBeInTheDocument());
    expect(screen.queryByText('5.0秒')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '詳細設定を表示' }));
    expect(screen.getByText('5.0秒')).toBeInTheDocument();
  });

  it('keeps non-volume range controls in advanced settings only', async () => {
    const engine = createMockEngine();
    render(<App engine={engine} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'この設定で進む' }));
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'スキップして 220 Hz を使う' }));
      await Promise.resolve();
    });

    expect(screen.queryByLabelText('基準音（詳細）')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('フェード')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('背景ノイズ')).not.toBeInTheDocument();
    expect(screen.getByLabelText('音量')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '詳細設定を表示' }));
    expect(screen.getByLabelText('基準音（詳細）')).toBeInTheDocument();
    expect(screen.getByLabelText('フェード')).toBeInTheDocument();
    expect(screen.getByLabelText('背景ノイズ')).toBeInTheDocument();
  });

  it('shows evidence notes separating supported and exploratory guidance', async () => {
    const engine = createMockEngine();
    render(<App engine={engine} />);

    expect(screen.getByText('音だけの一般利用を裏づける証拠は限定的です')).toBeInTheDocument();
    expect(screen.getAllByText('限定的な人でのデータ').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: '試験的な設定を表示' }));
    expect(screen.getAllByText('試験的').length).toBeGreaterThan(0);
  });

  it('stops automatically when the timer elapses and resets the countdown', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-29T00:00:00Z'));

    const engine = createMockEngine();
    render(<App engine={engine} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'この設定で進む' }));
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'スキップして 220 Hz を使う' }));
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole('button', { name: '10分' }));
    fireEvent.click(screen.getByRole('button', { name: 'セッション開始' }));

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

    fireEvent.click(screen.getByRole('button', { name: 'セッション開始' }));
    fireEvent.click(screen.getByRole('button', { name: 'セッション開始' }));

    await waitFor(() => expect(engine.start).toHaveBeenCalledTimes(1));
    expect(screen.getByText('起動中')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'セッション開始' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '停止' })).toBeDisabled();

    await act(async () => {
      deferredStart.resolve();
      await deferredStart.promise;
    });

    expect(screen.getByText('再生中')).toBeInTheDocument();
  });

  it('returns to a safe idle state when engine start fails', async () => {
    const engine = createMockEngine({
      start: vi.fn().mockRejectedValue(new Error('Audio denied')),
    });

    render(<App engine={engine} />);
    await finishSetup();

    fireEvent.click(screen.getByRole('button', { name: 'セッション開始' }));

    await waitFor(() => expect(screen.getByText('待機中')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'セッション開始' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '停止' })).toBeDisabled();
  });

  it('does not stop twice for the same stop transition', async () => {
    const deferredStop = createDeferred<void>();
    const engine = createMockEngine({
      stop: vi.fn().mockReturnValue(deferredStop.promise),
    });

    render(<App engine={engine} />);
    await finishSetup();

    fireEvent.click(screen.getByRole('button', { name: 'セッション開始' }));
    await waitFor(() => expect(screen.getByText('再生中')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: '停止' }));
    expect(screen.getByText('停止中')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '停止' }));

    expect(engine.stop).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferredStop.resolve();
      await deferredStop.promise;
    });

    expect(screen.getByText('待機中')).toBeInTheDocument();
  });

  it('keeps the live base tone in sync with advanced edits and profile changes', async () => {
    const engine = createMockEngine();
    render(<App engine={engine} />);
    await finishSetup();

    expect(screen.getByText('220Hz')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '詳細設定を表示' }));
    fireEvent.change(screen.getByLabelText('基準音（詳細）'), {
      target: { value: '300' },
    });

    await waitFor(() => expect(screen.getAllByText('300Hz').length).toBeGreaterThan(0));

    fireEvent.click(screen.getByRole('button', { name: /やさしめ/i }));

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

    fireEvent.click(screen.getByRole('button', { name: '詳細設定を表示' }));
    fireEvent.click(screen.getByRole('button', { name: 'トーンチェックをやり直す' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: '220 Hz と 440 Hz を比べる' })).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('button', { name: 'このトーンを使う' })[1]);

    await waitFor(() =>
      expect(getStoredPreferences().calibration).toEqual(
        expect.objectContaining({
          preferredBaseToneHz: 440,
          skipped: false,
        }),
      ),
    );

    expect(screen.getAllByText('440Hz').length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getByLabelText('基準音（詳細）')).toHaveValue('440'));
  });

  it('only starts one calibration preview while a preview transition is in flight', async () => {
    const deferredPreview = createDeferred<void>();
    const engine = createMockEngine({
      start: vi.fn().mockReturnValue(deferredPreview.promise),
    });

    render(<App engine={engine} />);
    fireEvent.click(screen.getByRole('button', { name: 'この設定で進む' }));

    const previewButtons = screen.getAllByRole('button', { name: '試聴' });
    fireEvent.click(previewButtons[0]);
    fireEvent.click(previewButtons[1]);

    await waitFor(() => expect(engine.start).toHaveBeenCalledTimes(1));
    expect(previewButtons[0]).toBeDisabled();
    expect(previewButtons[1]).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'このトーンを使う' })[0]).toBeDisabled();
    expect(screen.getByRole('button', { name: 'スキップして 220 Hz を使う' })).toBeDisabled();

    await act(async () => {
      deferredPreview.resolve();
      await deferredPreview.promise;
    });

    expect(screen.getByRole('button', { name: '試聴中' })).toBeEnabled();
    expect(screen.getAllByRole('button', { name: '試聴' })[0]).toBeEnabled();
  });

  it('stops the active preview before switching to another preview tone', async () => {
    const engine = createMockEngine();
    render(<App engine={engine} />);
    fireEvent.click(screen.getByRole('button', { name: 'この設定で進む' }));

    fireEvent.click(screen.getAllByRole('button', { name: '試聴' })[0]);
    await waitFor(() => expect(screen.getByRole('button', { name: '試聴中' })).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button', { name: '試聴' })[0]);

    await waitFor(() => expect(engine.stop).toHaveBeenCalledWith('manual'));
    expect(engine.start).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: '試聴中' })).toBeInTheDocument();
  });

  it('disables calibration actions while choosing a previewed tone', async () => {
    const deferredStop = createDeferred<void>();
    const engine = createMockEngine({
      stop: vi.fn().mockReturnValue(deferredStop.promise),
    });

    render(<App engine={engine} />);
    fireEvent.click(screen.getByRole('button', { name: 'この設定で進む' }));
    fireEvent.click(screen.getAllByRole('button', { name: '試聴' })[0]);
    await waitFor(() => expect(screen.getByRole('button', { name: '試聴中' })).toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('button', { name: 'このトーンを使う' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'スキップして 220 Hz を使う' }));

    expect(engine.stop).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: '試聴中' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'スキップして 220 Hz を使う' })).toBeDisabled();

    await act(async () => {
      deferredStop.resolve();
      await deferredStop.promise;
    });

    await waitFor(() =>
      expect(getStoredPreferences().calibration).toEqual(
        expect.objectContaining({
          preferredBaseToneHz: 220,
          skipped: false,
        }),
      ),
    );
  });

  it('recovers the calibration modal when preview start fails', async () => {
    const engine = createMockEngine({
      start: vi.fn().mockRejectedValue(new Error('Audio denied')),
    });

    render(<App engine={engine} />);
    fireEvent.click(screen.getByRole('button', { name: 'この設定で進む' }));
    fireEvent.click(screen.getAllByRole('button', { name: '試聴' })[0]);

    await waitFor(() => expect(screen.getAllByRole('button', { name: '試聴' })[0]).toBeEnabled());
    expect(screen.queryByRole('button', { name: '試聴中' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'スキップして 220 Hz を使う' })).toBeEnabled();
  });

  it('does not let calibration preview interrupt a pending session start', async () => {
    const deferredStart = createDeferred<void>();
    const engine = createMockEngine({
      start: vi.fn().mockReturnValue(deferredStart.promise),
    });

    render(<App engine={engine} />);
    await finishSetup();

    fireEvent.click(screen.getByRole('button', { name: '詳細設定を表示' }));
    fireEvent.click(screen.getByRole('button', { name: 'セッション開始' }));
    fireEvent.click(screen.getByRole('button', { name: 'トーンチェックをやり直す' }));

    await waitFor(() => expect(engine.start).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('heading', { name: '220 Hz と 440 Hz を比べる' })).not.toBeInTheDocument();

    await act(async () => {
      deferredStart.resolve();
      await deferredStart.promise;
    });

    expect(screen.getByText('再生中')).toBeInTheDocument();
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
    expect(screen.queryByText('1.0秒')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '詳細設定を表示' }));
    expect(screen.getByText('1.0秒')).toBeInTheDocument();
    expect(screen.getAllByText('スピーカー').length).toBeGreaterThan(0);
    expect(screen.getAllByText('音に敏感').length).toBeGreaterThan(0);
  });
});
