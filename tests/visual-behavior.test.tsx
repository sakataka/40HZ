import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ListenView } from '../src/components/ListenView';
import { ResonanceTrace } from '../src/components/ResonanceTrace';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('time-of-day suggestions', () => {
  it('keeps suggestions aligned with the clock across an hour boundary and a background return', () => {
    vi.useFakeTimers();
    const morning = new Date();
    morning.setHours(10, 59, 50, 0);
    vi.setSystemTime(morning);
    render(<ListenView activeProfileId="recommended" playing={false} locked={false} blind={false} onSelect={vi.fn()} onOpenRecords={vi.fn()} />);
    expect(screen.getByText('朝', { exact: true })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(20_000));
    expect(screen.getByText('11:00', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('日中', { exact: true })).toBeInTheDocument();

    const evening = new Date(morning);
    evening.setHours(18, 0, 0, 0);
    vi.setSystemTime(evening);
    fireEvent(document, new Event('visibilitychange'));
    expect(screen.getByText('18:00', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('夕方〜夜', { exact: true })).toBeInTheDocument();
  });
});

describe('breath trace continuity', () => {
  it('eases between two running breath patterns before following the new pattern', () => {
    vi.useFakeTimers({ toFake: ['Date', 'performance'] });
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Chrome');
    const context = {
      beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(),
      stroke: vi.fn(), clearRect: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 200, height: 200 } as DOMRect);
    let callback: FrameRequestCallback;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((next) => { callback = next; return 1; });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    const drawFrame = () => {
      act(() => { vi.advanceTimersByTime(50); callback(performance.now()); });
      return context.moveTo.mock.calls.at(-1)![0] as number;
    };
    const startedAt = Date.now() - 6000;
    const resonance = { inhaleSec: 4.5, topUpSec: 0, exhaleSec: 6.5 };
    const sigh = { inhaleSec: 2.5, topUpSec: 1, exhaleSec: 5.5 };
    const view = render(<ResonanceTrace kind="breath" breath={resonance} startedAt={startedAt} live />);
    const before = drawFrame();
    view.rerender(<ResonanceTrace kind="breath" breath={sigh} startedAt={startedAt} live />);
    const after = drawFrame();
    expect(Math.abs(after - before)).toBeLessThan(2);
    let settled = after;
    for (let index = 0; index < 20; index += 1) settled = drawFrame();
    expect(settled).toBeLessThan(after - 20);
  });
});
