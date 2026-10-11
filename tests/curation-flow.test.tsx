import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest as vi } from 'bun:test';
import App from '../src/App';
import type { AudioEngine } from '../src/audio/engine';

function mockEngine(): AudioEngine {
  return { start: vi.fn().mockResolvedValue(undefined), stop: vi.fn().mockResolvedValue(undefined), update: vi.fn() };
}

beforeEach(() => window.localStorage.clear());

describe('browse before playback setup', () => {
  it('lets a new listener browse, filter and read sources before any audio setup', () => {
    const engine = mockEngine();
    render(<App engine={engine} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '眠る前に', exact: true }));
    expect(screen.getByRole('heading', { name: '眠る前の音のよりみち' })).toBeInTheDocument();
    fireEvent.click(screen.getByText('音と研究について', { exact: true }));
    expect(screen.getByRole('link', { name: /Houら/ })).toHaveAttribute('href', 'https://pubmed.ncbi.nlm.nih.gov/42389090/');
    expect(engine.start).not.toHaveBeenCalled();
  });

  it('opens setup only on play and returns focus to the chosen sound when cancelled', async () => {
    const engine = mockEngine();
    render(<App engine={engine} />);
    const play = screen.getByRole('button', { name: '波を聴いてみる' });
    play.focus();
    fireEvent.click(play);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(engine.start).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '音選びに戻る' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(play).toHaveFocus());
    expect(engine.start).not.toHaveBeenCalled();
  });

  it('keeps the selected sound through setup and starts only with a new play gesture', async () => {
    const engine = mockEngine();
    render(<App engine={engine} />);
    fireEvent.click(screen.getByRole('button', { name: '雨音に包まれるを再生' }));
    fireEvent.click(screen.getByRole('button', { name: 'この設定で進む' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(engine.start).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'セッション開始' }));
    await waitFor(() => expect(engine.start).toHaveBeenCalledWith(expect.objectContaining({ profileId: 'noise-rain' }), {}));
    fireEvent.click(screen.getByRole('button', { name: '停止' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('停止中'));
    const library = screen.getByRole('group', { name: 'サウンド一覧' });
    fireEvent.click(within(library).getByRole('button', { name: /40 Hz やさしめ/ }));
    await waitFor(() => expect(engine.start).toHaveBeenLastCalledWith(expect.objectContaining({ profileId: 'gentle' }), {}));
  });
});
