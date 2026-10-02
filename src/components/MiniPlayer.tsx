import type { RecommendationProfile, SessionState } from '../features/session/types';
import { Equalizer } from './ListenView';
import { formatCountdown, PlayGlyph } from './NowPlaying';
import { SoundIcon } from './SoundIcon';

type MiniPlayerProps = {
  profile: RecommendationProfile;
  sessionState: SessionState;
  durationMinutes: number;
  readyToStart: boolean;
  blind: boolean;
  onOpen: () => void;
  onStart: () => void;
  onStop: () => Promise<void>;
};

/** Phone layout: a docked bar that keeps the current sound in reach from every tab. */
export function MiniPlayer({
  profile,
  sessionState,
  durationMinutes,
  readyToStart,
  blind,
  onOpen,
  onStart,
  onStop,
}: MiniPlayerProps) {
  const { status } = sessionState;
  const live = status === 'running' || status === 'stopping';
  const running = status === 'running';
  const totalMs = durationMinutes * 60_000;
  const progress = live ? Math.min(1, Math.max(0, 1 - sessionState.remainingMs / totalMs)) : 0;
  const title = blind ? '40 Hz／対照（非表示）' : profile.label;

  return (
    <div className={`mini-player mood-${blind ? 'focus' : profile.mood}`}>
      <span className="mini-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <button className="mini-open" type="button" aria-label={`プレーヤーを開く：${title}`} onClick={onOpen}>
        <span className="mini-icon">
          {running ? <Equalizer /> : <SoundIcon profileId={blind ? 'recommended' : profile.id} />}
        </span>
        <span className="mini-text">
          <strong>{title}</strong>
          <span role="status">
            {running
              ? `再生中 ・ 残り ${formatCountdown(sessionState.remainingMs)}`
              : status === 'starting'
                ? '準備中'
                : status === 'stopping'
                  ? '停止しています'
                  : `${durationMinutes}分 ・ タップで詳細`}
          </span>
        </span>
      </button>
      <button
        aria-label={live ? '停止（ミニプレーヤー）' : '再生（ミニプレーヤー）'}
        className={`mini-toggle${live ? ' is-stop' : ''}`}
        type="button"
        disabled={live ? !running : !readyToStart || status !== 'idle'}
        onClick={() => (live ? void onStop() : onStart())}
      >
        <PlayGlyph stop={live} />
      </button>
    </div>
  );
}
