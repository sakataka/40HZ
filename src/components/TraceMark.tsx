import { tracePath, type TraceKind } from '../features/session/trace';

type TraceMarkProps = {
  kind: TraceKind;
  className: string;
  /** Number of fading afterimages drawn behind the main line. */
  echoes?: number;
};

/** A still frame of the player's trace with its afterglow. */
export function TraceMark({ kind, className, echoes = 2 }: TraceMarkProps) {
  const layers = Array.from({ length: echoes + 1 }, (_, index) => index);
  return (
    <svg className={className} viewBox="-4 -4 108 108" aria-hidden="true">
      {layers.map((index) => {
        const lag = echoes - index;
        return (
          <path
            key={index}
            pathLength={1}
            d={tracePath(kind, 100, 3 - lag * 0.9, 0.75 - lag * 0.2)}
            opacity={(1 - lag / (echoes + 1)) ** 3}
          />
        );
      })}
    </svg>
  );
}
