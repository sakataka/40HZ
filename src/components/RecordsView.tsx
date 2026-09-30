import type { HealthSample, SessionRecord, TrackingMode, TrackingPrefs } from '../features/tracking/types';
import { HistoryPanel } from './HistoryPanel';
import { WatchPanel } from './WatchPanel';

const TRACKING_MODES: { mode: TrackingMode; label: string; hint: string }[] = [
  { mode: 'off', label: '記録なし', hint: '再生するだけで、何も記録しません。' },
  { mode: 'checkin', label: '前後チェック', hint: '再生の前後に、疲れ・気分・頭のスッキリを記録します。' },
  {
    mode: 'experiment',
    label: 'ブラインド比較',
    hint: '再生ごとに「40 Hzの脈動」か「平均速度が同じランダムな脈動」を自動で割り当て、終了後に明かします。音は「40 Hz」に固定されます。',
  },
];

type RecordsViewProps = {
  prefs: TrackingPrefs;
  prefsLocked: boolean;
  records: SessionRecord[];
  healthSamples: HealthSample[];
  onChangePrefs: (updates: Partial<TrackingPrefs>) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onImport: (records: SessionRecord[], healthSamples: HealthSample[]) => void;
  onImportHealth: (samples: HealthSample[]) => number;
  onClearHealth: () => void;
};

export function RecordsView({
  prefs,
  prefsLocked,
  records,
  healthSamples,
  onChangePrefs,
  onDelete,
  onClear,
  onImport,
  onImportHealth,
  onClearHealth,
}: RecordsViewProps) {
  const activeMode = TRACKING_MODES.find((option) => option.mode === prefs.mode)!;

  return (
    <div className="view records-view">
      <header className="view-header">
        <p className="eyebrow">任意 ・ このブラウザ内にだけ保存</p>
        <h1>記録と比較</h1>
      </header>

      <section className="card" aria-labelledby="tracking-mode-title">
        <h2 id="tracking-mode-title">記録のしかた</h2>
        <div className="segmented" role="radiogroup" aria-label="記録モード">
          {TRACKING_MODES.map((option) => (
            <label key={option.mode} className={prefs.mode === option.mode ? 'is-selected' : ''}>
              <input
                type="radio"
                name="trackingMode"
                checked={prefs.mode === option.mode}
                disabled={prefsLocked}
                onChange={() => onChangePrefs({ mode: option.mode })}
              />
              {option.label}
            </label>
          ))}
        </div>
        <p className="fine-print">{activeMode.hint}</p>
        {prefs.mode !== 'off' ? (
          <label className="check-label">
            <input
              type="checkbox"
              checked={prefs.reactionTest}
              disabled={prefsLocked}
              onChange={(event) => onChangePrefs({ reactionTest: event.currentTarget.checked })}
            />
            反応テスト（60秒）も行う
          </label>
        ) : null}
        {prefsLocked ? <p className="fine-print">再生中は変更できません。</p> : null}
      </section>

      <HistoryPanel
        records={records}
        healthSamples={healthSamples}
        onDelete={onDelete}
        onClear={onClear}
        onImport={onImport}
      />

      <WatchPanel healthSamples={healthSamples} onImport={onImportHealth} onClear={onClearHealth} />
    </div>
  );
}
