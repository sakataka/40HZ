import { useState } from 'react';
import type { OutputMode, SoundSensitivity, UserContext } from '../features/session/types';

type OnboardingModalProps = {
  defaultContext: UserContext;
  onComplete: (context: Omit<UserContext, 'completedAt'>) => void;
};

const SAFETY_POINTS = [
  'This app is not a medical treatment and does not guarantee clinical benefit.',
  'It is designed for legal adult self-use in a controlled listening environment.',
  'Stop immediately if you feel discomfort, dizziness, or a headache.',
  'Keep the volume low and start with the minimum level that is clearly audible.',
];

export function OnboardingModal({ defaultContext, onComplete }: OnboardingModalProps) {
  const [soundSensitivity, setSoundSensitivity] = useState<SoundSensitivity>(
    defaultContext.soundSensitivity,
  );
  const [outputMode, setOutputMode] = useState<OutputMode>(defaultContext.outputMode);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="setup-title">
      <div className="modal-card">
        <p className="section-label">Controlled Setup</p>
        <h2 id="setup-title">Two quick preflight questions</h2>
        <div className="modal-grid">
          <fieldset className="option-group">
            <legend>Sound sensitivity</legend>
            <label>
              <input
                checked={soundSensitivity === 'standard'}
                name="soundSensitivity"
                type="radio"
                onChange={() => setSoundSensitivity('standard')}
              />
              Standard
            </label>
            <label>
              <input
                checked={soundSensitivity === 'sensitive'}
                name="soundSensitivity"
                type="radio"
                onChange={() => setSoundSensitivity('sensitive')}
              />
              Sensitive
            </label>
          </fieldset>

          <fieldset className="option-group">
            <legend>Listening setup</legend>
            <label>
              <input
                checked={outputMode === 'headphones'}
                name="outputMode"
                type="radio"
                onChange={() => setOutputMode('headphones')}
              />
              Headphones
            </label>
            <label>
              <input
                checked={outputMode === 'speaker'}
                name="outputMode"
                type="radio"
                onChange={() => setOutputMode('speaker')}
              />
              Speakers
            </label>
          </fieldset>
        </div>

        <ul className="safety-list" aria-label="Safety notes">
          {SAFETY_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>

        <div className="modal-footer">
          <p className="hero-copy">Used only to choose conservative starting settings.</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => onComplete({ soundSensitivity, outputMode })}
          >
            Use these settings
          </button>
        </div>
      </div>
    </div>
  );
}
