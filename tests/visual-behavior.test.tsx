import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ListenView } from '../src/components/ListenView';
import { ResonanceTrace } from '../src/components/ResonanceTrace';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('scene-based sound curation', () => {
  it('changes both the sound picks and external destinations without starting audio', () => {
    const select = vi.fn();
    render(<ListenView activeProfileId="recommended" playing={false} locked={false} blind={false} onSelect={select} onOpenRecords={vi.fn()} />);
    expect(screen.getByText('雨音に包まれる')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '眠る前に', exact: true }));
    expect(screen.getByRole('heading', { name: '一日の終わりを、静かに。' })).toBeInTheDocument();
    expect(screen.getByText('低い音に、ひと休み')).toBeInTheDocument();
    expect(screen.queryByText('雨音に包まれる')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /myNoise/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Calm/ })).toBeInTheDocument();
    expect(select).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '低いノイズを聴く' }));
    expect(select).toHaveBeenCalledWith('noise-brown');
    fireEvent.click(screen.getByRole('button', { name: 'すべて', exact: true }));
    expect(screen.getByText('雨音に包まれる')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /myNoise/ })).toBeInTheDocument();
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
