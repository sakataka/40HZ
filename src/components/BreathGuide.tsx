import { useEffect, useState } from 'react';
import { breathPointAt, type BreathPoint } from '../features/session/breath';
import type { BreathPattern } from '../features/session/types';

export const STAGE_LABELS: Record<BreathPoint['stage'], string> = {
  inhale: '吸う',
  topUp: 'もう少し吸う',
  exhale: '吐く',
};

/** Follows the same breath envelope as the audio, one animation frame at a time. */
export function useBreathPoint(pattern: BreathPattern | undefined, startedAt: number | null): BreathPoint | null {
  const [point, setPoint] = useState<BreathPoint | null>(null);

  useEffect(() => {
    if (!pattern || startedAt == null) {
      setPoint(null);
      return;
    }

    let frame = 0;
    const tick = () => {
      setPoint(breathPointAt((Date.now() - startedAt) / 1000, pattern));
      frame = window.requestAnimationFrame(tick);
    };
    tick();
    return () => window.cancelAnimationFrame(frame);
  }, [pattern, startedAt]);

  return point;
}
