import { useEffect, useState } from 'react';
import { breathPointAt, breathsPerMinute, type BreathPoint } from '../features/session/breath';
import type { BreathPattern } from '../features/session/types';

const STAGE_LABELS: Record<BreathPoint['stage'], string> = {
  inhale: '吸う',
  topUp: 'もう少し吸う',
  exhale: '吐く',
};

type BreathGuideProps = {
  pattern: BreathPattern;
  startedAt: number;
};

export function BreathGuide({ pattern, startedAt }: BreathGuideProps) {
  const [point, setPoint] = useState(() => breathPointAt((Date.now() - startedAt) / 1000, pattern));

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      setPoint(breathPointAt((Date.now() - startedAt) / 1000, pattern));
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [pattern, startedAt]);

  return (
    <div className="breath-guide">
      <div className="breath-orb" style={{ transform: `scale(${0.45 + 0.55 * point.level})` }} aria-hidden="true" />
      <div>
        <strong>{STAGE_LABELS[point.stage]}</strong>
        <span>毎分 {breathsPerMinute(pattern)} 回 ・ 鼻から吸って、口からゆっくり吐く</span>
      </div>
    </div>
  );
}
