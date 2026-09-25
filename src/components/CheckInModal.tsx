import { useState } from 'react';
import type { CheckIn, ReactionSummary } from '../features/tracking/types';
import { ReactionTest } from './ReactionTest';

type Ratings = Pick<CheckIn, 'fatigue' | 'mood' | 'clarity'>;

const SCALES: { key: keyof Ratings; label: string; low: string; high: string }[] = [
  { key: 'clarity', label: '頭のスッキリ', low: 'ぼんやり', high: '冴えている' },
  { key: 'mood', label: '気分', low: 'とても悪い', high: 'とても良い' },
  { key: 'fatigue', label: '疲れ', low: 'まったくない', high: 'とても疲れた' },
];

const NEUTRAL: Ratings = { fatigue: 5, mood: 5, clarity: 5 };

type CheckInModalProps = {
  phase: 'pre' | 'post';
  blind: boolean;
  reactionTest: boolean;
  initial?: Ratings;
  reactionDurationSec?: number;
  onSubmit: (checkIn: CheckIn) => void;
  onSkip: () => void;
  onCancel?: () => void;
};

export function CheckInModal({
  phase,
  blind,
  reactionTest,
  initial,
  reactionDurationSec,
  onSubmit,
  onSkip,
  onCancel,
}: CheckInModalProps) {
  const [ratings, setRatings] = useState<Ratings>(() => ({ ...NEUTRAL, ...pickRatings(initial) }));
  const [step, setStep] = useState<'ratings' | 'reaction' | 'ready'>('ratings');
  const [reaction, setReaction] = useState<ReactionSummary | undefined>();
  const isPre = phase === 'pre';
  const submitLabel = isPre ? '記録して再生' : '記録を保存';

  function submit(nextReaction = reaction) {
    onSubmit({ ...ratings, ...(nextReaction ? { reaction: nextReaction } : {}) });
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="checkin-title">
      <div className="modal-card">
        <p className="section-label">{isPre ? '再生前チェック' : '再生後チェック'}</p>
        <h2 id="checkin-title">{isPre ? 'いまの状態を記録する' : '終わった直後の状態は？'}</h2>
        {blind && isPre ? (
          <p className="hero-copy blind-note">
            ブラインド比較中です。40 Hzの脈動か、同じ平均速度のランダムな脈動のどちらかが流れます。結果は終了後に表示します。
          </p>
        ) : null}

        {step === 'ratings' ? (
          <>
            <div className="scale-grid">
              {SCALES.map((scale) => (
                <label className="control-card scale-card" key={scale.key}>
                  <div className="control-meta">
                    <span>{scale.label}</span>
                    <strong>{ratings[scale.key]}</strong>
                  </div>
                  <input
                    aria-label={scale.label}
                    data-initial-focus={scale.key === 'clarity' || undefined}
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={ratings[scale.key]}
                    onChange={(event) => {
                      const value = Number(event.currentTarget.value);
                      setRatings((current) => ({ ...current, [scale.key]: value }));
                    }}
                  />
                  <div className="scale-ends">
                    <span>0 {scale.low}</span>
                    <span>10 {scale.high}</span>
                  </div>
                </label>
              ))}
            </div>
            <div className="modal-footer">
              <button
                className="primary-button"
                type="button"
                onClick={() => (reactionTest ? setStep('reaction') : submit())}
              >
                {reactionTest ? '次へ（反応テスト）' : submitLabel}
              </button>
              <div className="button-row modal-secondary">
                <button className="inline-toggle" type="button" onClick={onSkip}>
                  {isPre ? '記録せずに再生' : '記録しない'}
                </button>
                {onCancel ? (
                  <button className="inline-toggle" type="button" onClick={onCancel}>
                    キャンセル
                  </button>
                ) : null}
              </div>
            </div>
          </>
        ) : null}

        {step === 'reaction' ? (
          <ReactionTest
            durationSec={reactionDurationSec}
            onComplete={(summary) => {
              setReaction(summary);
              if (isPre) {
                setStep('ready');
              } else {
                submit(summary);
              }
            }}
          />
        ) : null}

        {step === 'ready' ? (
          <div className="modal-footer">
            <p className="hero-copy">
              中央値 {reaction?.medianMs ?? '-'} ms ・ 見逃し {reaction?.lapses ?? 0} 回
            </p>
            <button className="primary-button" type="button" onClick={() => submit()} data-initial-focus>
              再生を始める
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function pickRatings(checkIn: Ratings | undefined): Partial<Ratings> {
  return checkIn ? { fatigue: checkIn.fatigue, mood: checkIn.mood, clarity: checkIn.clarity } : {};
}
