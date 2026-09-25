import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import type { AudioEngine } from '../src/audio/engine';
import { ReactionTest } from '../src/components/ReactionTest';
import { TRACKING_STORAGE_KEY } from '../src/features/tracking/storage';

function createMockEngine(): AudioEngine {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    update: vi.fn(),
  };
}

async function finishSetup() {
  fireEvent.click(screen.getByRole('button', { name: 'この設定で進む' }));
  fireEvent.click(screen.getByRole('button', { name: 'スキップして 220 Hz を使う' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'セッション開始' })).toBeEnabled());
}

function storedTracking() {
  return JSON.parse(window.localStorage.getItem(TRACKING_STORAGE_KEY) ?? '{}');
}

describe('tracked sessions', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('records a check-in before and after playback and shows the change', async () => {
    const engine = createMockEngine();
    render(<App engine={engine} />);
    await finishSetup();

    fireEvent.click(screen.getByRole('button', { name: 'セッション開始' }));
    expect(screen.getByRole('heading', { name: 'いまの状態を記録する' })).toBeInTheDocument();
    expect(engine.start).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('頭のスッキリ'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: '記録して再生' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('再生中'));
    expect(engine.start).toHaveBeenCalledWith(expect.objectContaining({ profileId: 'recommended' }), {
      condition: undefined,
    });

    fireEvent.click(screen.getByRole('button', { name: '停止' }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: '終わった直後の状態は？' })).toBeInTheDocument(),
    );
    expect(screen.getByLabelText('頭のスッキリ')).toHaveValue('3');
    fireEvent.change(screen.getByLabelText('頭のスッキリ'), { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: '記録を保存' }));

    expect(screen.getByRole('heading', { name: 'おすすめの前後比較' })).toBeInTheDocument();
    expect(screen.getByText('+3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));

    await waitFor(() => expect(storedTracking().records).toHaveLength(1));
    expect(storedTracking().records[0]).toEqual(
      expect.objectContaining({ completed: false, pre: expect.objectContaining({ clarity: 3 }), post: expect.objectContaining({ clarity: 6 }) }),
    );
    expect(screen.getByText('最近のセッション')).toBeInTheDocument();
  });

  it('can skip recording and play right away', async () => {
    const engine = createMockEngine();
    render(<App engine={engine} />);
    await finishSetup();

    fireEvent.click(screen.getByRole('button', { name: 'セッション開始' }));
    fireEvent.click(screen.getByRole('button', { name: '記録せずに再生' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('再生中'));
    fireEvent.click(screen.getByRole('button', { name: '停止' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'セッション開始' })).toBeEnabled());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('runs a blind comparison with a hidden arm that is revealed afterwards', async () => {
    const engine = createMockEngine();
    render(<App engine={engine} />);
    await finishSetup();

    fireEvent.click(screen.getByRole('button', { name: /共鳴呼吸/ }));
    fireEvent.click(screen.getByRole('radio', { name: 'ブラインド比較' }));
    expect(screen.getByRole('button', { name: /おすすめ/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /共鳴呼吸/ })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'セッション開始' }));
    expect(screen.getByText(/ブラインド比較中です/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '記録して再生' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('再生中'));

    const [, options] = vi.mocked(engine.start).mock.calls[0];
    expect(['active', 'sham']).toContain(options?.condition);

    fireEvent.click(screen.getByRole('button', { name: '停止' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '記録を保存' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: '記録を保存' }));

    expect(
      screen.getByText(options?.condition === 'active' ? '40 Hzの脈動（本物）' : 'ランダムな脈動（対照）'),
    ).toBeInTheDocument();
    await waitFor(() => expect(storedTracking().experimentQueue).toHaveLength(3));
  });

  it('imports Apple Watch heart rate text', async () => {
    const engine = createMockEngine();
    render(<App engine={engine} />);
    await finishSetup();

    fireEvent.click(screen.getByText('Apple Watch 連携'));
    fireEvent.change(screen.getByLabelText('ヘルスケアデータの貼り付け'), {
      target: { value: 'HR,2026-09-25T10:15:00+09:00,68\nHRV,2026-09-25T10:20:00+09:00,42' },
    });
    fireEvent.click(screen.getByRole('button', { name: '貼り付けたテキストを取り込む' }));

    expect(screen.getByText('2件を読み取り、新しく2件を追加しました。')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('forty-hz-health-samples') ?? '[]')).toHaveLength(2);
  });
});

describe('ReactionTest', () => {
  it('measures the delay between the stimulus and the response', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    vi.spyOn(Math, 'random').mockReturnValue(1);
    const onComplete = vi.fn();
    render(<ReactionTest durationSec={0} onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: '反応テストを始める' }));
    fireEvent.pointerDown(screen.getByRole('button', { name: '光るまで待つ' }));
    expect(screen.getByText(/フライング/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    act(() => {
      vi.advanceTimersByTime(250);
    });
    fireEvent.pointerDown(screen.getByRole('button', { name: '今すぐ押す' }));

    expect(onComplete).toHaveBeenCalledWith({ medianMs: 250, lapses: 0, falseStarts: 1, trials: 1 });
    vi.mocked(Math.random).mockRestore();
  });
});
