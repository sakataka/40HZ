import { useEffect, useRef, useState } from 'react';
import {
  MIN_VALID_MS,
  NO_RESPONSE_MS,
  REACTION_TEST_SEC,
  nextStimulusDelayMs,
  summarizeReaction,
} from '../features/tracking/reaction';
import type { ReactionSummary } from '../features/tracking/types';

type Phase = 'intro' | 'waiting' | 'stimulus' | 'done';

type ReactionTestProps = {
  durationSec?: number;
  onComplete: (summary: ReactionSummary) => void;
};

export function ReactionTest({ durationSec = REACTION_TEST_SEC, onComplete }: ReactionTestProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [feedback, setFeedback] = useState('');
  const [trialCount, setTrialCount] = useState(0);
  const timesRef = useRef<number[]>([]);
  const falseStartsRef = useRef(0);
  const stimulusAtRef = useRef(0);
  const deadlineRef = useRef(0);
  const timerRef = useRef<number | undefined>(undefined);
  const phaseRef = useRef<Phase>('intro');

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  function moveTo(next: Phase) {
    phaseRef.current = next;
    setPhase(next);
  }

  function begin() {
    timesRef.current = [];
    falseStartsRef.current = 0;
    deadlineRef.current = performance.now() + durationSec * 1000;
    setTrialCount(0);
    setFeedback('');
    scheduleStimulus();
  }

  function scheduleStimulus() {
    moveTo('waiting');
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(showStimulus, nextStimulusDelayMs());
  }

  function showStimulus() {
    stimulusAtRef.current = performance.now();
    moveTo('stimulus');
    timerRef.current = window.setTimeout(() => recordTrial(NO_RESPONSE_MS, '反応なし'), NO_RESPONSE_MS);
  }

  function recordTrial(reactionMs: number, message: string) {
    window.clearTimeout(timerRef.current);
    timesRef.current.push(reactionMs);
    setTrialCount(timesRef.current.length);
    setFeedback(message);

    if (performance.now() >= deadlineRef.current) {
      moveTo('done');
      onComplete(summarizeReaction(timesRef.current, falseStartsRef.current));
      return;
    }

    scheduleStimulus();
  }

  function respond() {
    const current = phaseRef.current;

    if (current === 'waiting') {
      falseStartsRef.current += 1;
      setFeedback('フライング。光ってから押してください');
      scheduleStimulus();
      return;
    }

    if (current !== 'stimulus') {
      return;
    }

    const reactionMs = performance.now() - stimulusAtRef.current;
    if (reactionMs < MIN_VALID_MS) {
      falseStartsRef.current += 1;
      setFeedback('フライング。光ってから押してください');
      scheduleStimulus();
      return;
    }

    recordTrial(Math.round(reactionMs), `${Math.round(reactionMs)} ms`);
  }

  if (phase === 'intro') {
    return (
      <div className="reaction-intro">
        <p className="hero-copy">
          {durationSec}秒間、枠が青く光ったらすぐに押します。眠気や集中の指標として使われる反応時間テスト（PVT）の簡易版です。
        </p>
        <button className="primary-button" type="button" onClick={begin} data-initial-focus>
          反応テストを始める
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    return <p className="reaction-done" role="status">反応テスト完了（{trialCount}回）</p>;
  }

  return (
    <div className="reaction-wrap">
      <button
        aria-label={phase === 'stimulus' ? '今すぐ押す' : '光るまで待つ'}
        className={`reaction-area ${phase === 'stimulus' ? 'is-lit' : ''}`}
        type="button"
        onPointerDown={(event) => {
          event.preventDefault();
          respond();
        }}
        onKeyDown={(event) => {
          if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            if (!event.repeat) {
              respond();
            }
          }
        }}
        autoFocus
      >
        {phase === 'stimulus' ? '押す！' : '待つ…'}
      </button>
      <p className="reaction-feedback" aria-live="polite">
        {feedback || 'スペースキーでも反応できます'} ・ {trialCount}回
      </p>
    </div>
  );
}
