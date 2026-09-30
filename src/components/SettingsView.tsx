import type { OutputMode, SoundSensitivity, UserContext } from '../features/session/types';
import { EvidencePanel } from './EvidencePanel';
import { SAFETY_POINTS } from './OnboardingModal';

type SettingsViewProps = {
  userContext: UserContext;
  carrierHz: number;
  locked: boolean;
  onChangeContext: (context: Omit<UserContext, 'completedAt'>) => void;
  onResetCalibration: () => Promise<void>;
};

export function SettingsView({ userContext, carrierHz, locked, onChangeContext, onResetCalibration }: SettingsViewProps) {
  const { soundSensitivity, outputMode } = userContext;

  return (
    <div className="view settings-view">
      <header className="view-header">
        <p className="eyebrow">聞き方と、このアプリについて</p>
        <h1>設定</h1>
      </header>

      <section className="card" aria-labelledby="listening-title">
        <h2 id="listening-title">聞く環境</h2>
        <Choice<OutputMode>
          label="出力"
          name="settingsOutputMode"
          value={outputMode}
          disabled={locked}
          options={[
            { value: 'headphones', label: 'ヘッドホン' },
            { value: 'speaker', label: 'スピーカー' },
          ]}
          onChange={(value) => onChangeContext({ soundSensitivity, outputMode: value })}
        />
        <Choice<SoundSensitivity>
          label="音への敏感さ"
          name="settingsSensitivity"
          value={soundSensitivity}
          disabled={locked}
          options={[
            { value: 'standard', label: '標準' },
            { value: 'sensitive', label: '音に敏感' },
          ]}
          onChange={(value) => onChangeContext({ soundSensitivity: value, outputMode })}
        />
        <p className="fine-print">変更すると、音量と背景ノイズを控えめな初期値に選び直します。</p>

        <div className="setting-row">
          <div>
            <span className="setting-label">基準音</span>
            <strong>{carrierHz}Hz</strong>
          </div>
          <button className="secondary-button" type="button" disabled={locked} onClick={() => void onResetCalibration()}>
            トーンチェックをやり直す
          </button>
        </div>
        {locked ? <p className="fine-print">再生中は変更できません。</p> : null}
      </section>

      <section className="card" aria-labelledby="safety-title">
        <h2 id="safety-title">安全のために</h2>
        <ul className="safety-list">
          {SAFETY_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </section>

      <EvidencePanel />
    </div>
  );
}

type ChoiceProps<T extends string> = {
  label: string;
  name: string;
  value: T;
  disabled: boolean;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

function Choice<T extends string>({ label, name, value, disabled, options, onChange }: ChoiceProps<T>) {
  return (
    <div className="choice-row">
      <span className="setting-label" id={`${name}-label`}>{label}</span>
      <div className="segmented" role="radiogroup" aria-labelledby={`${name}-label`}>
        {options.map((option) => (
          <label key={option.value} className={value === option.value ? 'is-selected' : ''}>
            <input
              type="radio"
              name={name}
              checked={value === option.value}
              disabled={disabled}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}
