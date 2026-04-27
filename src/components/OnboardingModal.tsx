import { useState } from 'react';
import type { OutputMode, SoundSensitivity, UserContext } from '../features/session/types';

type OnboardingModalProps = {
  defaultContext: UserContext;
  onComplete: (context: Omit<UserContext, 'completedAt'>) => void;
};

const SAFETY_POINTS = [
  'このアプリは医療行為ではなく、臨床的な効果を保証しません。',
  '成人が静かな環境で自分用に使うことを前提にしています。',
  '不快感、めまい、頭痛があればすぐ停止してください。',
  '音量は低く、はっきり聞こえる最小限から始めてください。',
  '運転中、作業中、周囲への注意が必要な状況では使わないでください。',
  '発作歴など医療上の事情がある場合は、使用前に専門家へ相談してください。',
];

export function OnboardingModal({ defaultContext, onComplete }: OnboardingModalProps) {
  const [soundSensitivity, setSoundSensitivity] = useState<SoundSensitivity>(
    defaultContext.soundSensitivity,
  );
  const [outputMode, setOutputMode] = useState<OutputMode>(defaultContext.outputMode);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="setup-title">
      <div className="modal-card">
        <p className="section-label">初期設定</p>
        <h2 id="setup-title">最初に2つだけ確認します</h2>
        <div className="modal-grid">
          <fieldset className="option-group">
            <legend>音への敏感さ</legend>
            <label>
              <input
                checked={soundSensitivity === 'standard'}
                name="soundSensitivity"
                type="radio"
                onChange={() => setSoundSensitivity('standard')}
              />
              標準
            </label>
            <label>
              <input
                checked={soundSensitivity === 'sensitive'}
                name="soundSensitivity"
                type="radio"
                onChange={() => setSoundSensitivity('sensitive')}
              />
              音に敏感
            </label>
          </fieldset>

          <fieldset className="option-group">
            <legend>聞く環境</legend>
            <label>
              <input
                checked={outputMode === 'headphones'}
                name="outputMode"
                type="radio"
                onChange={() => setOutputMode('headphones')}
              />
              ヘッドホン
            </label>
            <label>
              <input
                checked={outputMode === 'speaker'}
                name="outputMode"
                type="radio"
                onChange={() => setOutputMode('speaker')}
              />
              スピーカー
            </label>
          </fieldset>
        </div>

        <ul className="safety-list" aria-label="安全上の注意">
          {SAFETY_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>

        <div className="modal-footer">
          <p className="hero-copy">ここでの回答は、控えめな初期値を選ぶためだけに使います。</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => onComplete({ soundSensitivity, outputMode })}
          >
            この設定で進む
          </button>
        </div>
      </div>
    </div>
  );
}
