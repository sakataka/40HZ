import { useRef, useState } from 'react';
import { getRecommendationProfile } from '../features/session/presets';
import { sessionHeartRate } from '../features/tracking/health';
import {
  MIN_PER_ARM,
  METRICS,
  compareExperiment,
  countArms,
  mean,
  summarizeByProfile,
  verdictOf,
  type ArmComparison,
  type Verdict,
} from '../features/tracking/stats';
import { createExportBundle, parseExportBundle } from '../features/tracking/storage';
import type { HealthSample, SessionRecord } from '../features/tracking/types';
import { formatDateTime, formatSigned } from '../lib/format';

const RECENT_LIMIT = 12;

const VERDICT_LABELS: Record<Verdict, string> = {
  pending: '集計待ち',
  favorsActive: '40 Hzが上回る',
  favorsSham: '対照が上回る',
  noDifference: '差は確認できない',
};

type HistoryPanelProps = {
  records: SessionRecord[];
  healthSamples: HealthSample[];
  onDelete: (id: string) => void;
  onClear: () => void;
  onImport: (records: SessionRecord[], healthSamples: HealthSample[]) => void;
};

export function HistoryPanel({ records, healthSamples, onDelete, onClear, onImport }: HistoryPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const hasExperiment = records.some((record) => record.condition);
  const profileSummaries = summarizeByProfile(records, healthSamples);
  const recent = [...records].sort((a, b) => b.startedAt - a.startedAt).slice(0, RECENT_LIMIT);

  function exportData() {
    const bundle = createExportBundle(records, healthSamples);
    const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `40hz-records-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importData(file: File) {
    const parsed = parseExportBundle(await file.text());
    if (!parsed) {
      setMessage('読み込めませんでした。このアプリで書き出したJSONを選んでください。');
      return;
    }
    onImport(parsed.records, parsed.healthSamples);
    setMessage(`${parsed.records.length}件の記録を読み込みました。`);
  }

  return (
    <section className="panel history-panel" aria-labelledby="history-title">
      <div className="panel-header">
        <h2 id="history-title">記録と比較</h2>
        <span className="header-note">{records.length}件</span>
      </div>

      {records.length === 0 ? (
        <p className="empty-note">
          まだ記録がありません。再生の前後に状態を記録すると、ここで集計されます。
        </p>
      ) : null}

      {hasExperiment ? <ExperimentSummary records={records} healthSamples={healthSamples} /> : null}

      {profileSummaries.length ? (
        <div className="history-block">
          <h3>プリセット別の平均的な変化</h3>
          <p className="block-note">ブラインドなしの記録です。期待や慣れの影響を含みます。</p>
          <div className="table-scroll">
            <table className="stats-table">
              <thead>
                <tr>
                  <th scope="col">プリセット</th>
                  <th scope="col">回数</th>
                  {METRICS.map((metric) => (
                    <th scope="col" key={metric.key}>{metric.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profileSummaries.map((summary) => (
                  <tr key={summary.profileId}>
                    <th scope="row">{getRecommendationProfile(summary.profileId).label}</th>
                    <td>{summary.count}</td>
                    {METRICS.map((metric) => {
                      const value = summary.averages[metric.key];
                      return (
                        <td key={metric.key} className={toneClass(value)}>
                          {value == null ? '–' : `${formatSigned(value, metric.unit === '点' ? 1 : 0)}${metric.unit === '点' ? '' : ` ${metric.unit}`}`}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {recent.length ? (
        <div className="history-block">
          <h3>最近のセッション</h3>
          <ul className="history-list">
            {recent.map((record) => (
              <RecordRow key={record.id} record={record} healthSamples={healthSamples} onDelete={onDelete} />
            ))}
          </ul>
        </div>
      ) : null}

      <div className="history-actions">
        <button className="ghost-button" type="button" onClick={exportData} disabled={records.length === 0}>
          書き出し（JSON）
        </button>
        <button className="ghost-button" type="button" onClick={() => fileInputRef.current?.click()}>
          読み込み
        </button>
        <button
          className="ghost-button danger-button"
          type="button"
          disabled={records.length === 0}
          onClick={() => {
            if (window.confirm('すべての記録を削除します。書き出していない記録は元に戻せません。')) {
              onClear();
            }
          }}
        >
          すべて削除
        </button>
        <input
          ref={fileInputRef}
          hidden
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            if (file) {
              void importData(file);
            }
          }}
        />
      </div>
      {message ? <p className="block-note" role="status">{message}</p> : null}
    </section>
  );
}

function ExperimentSummary({ records, healthSamples }: { records: SessionRecord[]; healthSamples: HealthSample[] }) {
  const arms = countArms(records);
  const comparisons = compareExperiment(records, healthSamples).filter(
    (comparison) => comparison.active.length + comparison.sham.length > 0,
  );
  const remaining = Math.max(0, MIN_PER_ARM - arms.active) + Math.max(0, MIN_PER_ARM - arms.sham);

  return (
    <div className="history-block experiment-block">
      <h3>ブラインド比較：40 Hz vs ランダム脈動</h3>
      <p className="block-note">
        完了したセッション: 40 Hz {arms.active}回 / 対照 {arms.sham}回。
        {remaining > 0
          ? ` 各${MIN_PER_ARM}回以上で信頼区間を表示します（あと${remaining}回）。`
          : ' 数値は「40 Hzの改善 − 対照の改善」と95%信頼区間です。区間が0をまたぐうちは差があるとは言えません。'}
      </p>
      <div className="table-scroll">
        <table className="stats-table experiment-table">
          <thead>
            <tr>
              <th scope="col">項目</th>
              <th scope="col">40 Hz</th>
              <th scope="col">対照</th>
              <th scope="col">差 [95%CI]・判定</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((comparison) => (
              <ComparisonRow key={comparison.metric.key} comparison={comparison} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComparisonRow({ comparison }: { comparison: ArmComparison }) {
  const { metric } = comparison;
  const digits = metric.unit === '点' ? 1 : 0;
  const activeMean = mean(comparison.active);
  const shamMean = mean(comparison.sham);
  const verdict = verdictOf(comparison);

  return (
    <tr>
      <th scope="row">{metric.label}</th>
      <td>{activeMean == null ? '–' : formatSigned(activeMean, digits)}</td>
      <td>{shamMean == null ? '–' : formatSigned(shamMean, digits)}</td>
      <td>
        <div className="ci-cell">
          {comparison.diff == null ? null : (
            <>
              <span>
                {formatSigned(comparison.diff, digits)} [{formatSigned(comparison.low!, digits)}, {formatSigned(comparison.high!, digits)}]
              </span>
              <IntervalBar diff={comparison.diff} low={comparison.low!} high={comparison.high!} />
            </>
          )}
          <span className={`verdict verdict-${verdict}`}>{VERDICT_LABELS[verdict]}</span>
        </div>
      </td>
    </tr>
  );
}

function IntervalBar({ diff, low, high }: { diff: number; low: number; high: number }) {
  const extent = Math.max(Math.abs(low), Math.abs(high), 0.001) * 1.15;
  const toPercent = (value: number) => 50 + (value / extent) * 50;

  return (
    <span className="ci-bar" aria-hidden="true">
      <span className="ci-zero" />
      <span className="ci-range" style={{ left: `${toPercent(low)}%`, width: `${toPercent(high) - toPercent(low)}%` }} />
      <span className="ci-point" style={{ left: `${toPercent(diff)}%` }} />
    </span>
  );
}

function RecordRow({
  record,
  healthSamples,
  onDelete,
}: {
  record: SessionRecord;
  healthSamples: HealthSample[];
  onDelete: (id: string) => void;
}) {
  const profile = getRecommendationProfile(record.profileId);
  const minutes = Math.max(1, Math.round((record.endedAt - record.startedAt) / 60_000));
  const heartRate = sessionHeartRate(record, healthSamples);
  const changes = record.pre && record.post
    ? [
        `スッキリ ${formatSigned(record.post.clarity - record.pre.clarity)}`,
        `気分 ${formatSigned(record.post.mood - record.pre.mood)}`,
        `疲れ ${formatSigned(record.post.fatigue - record.pre.fatigue)}`,
        ...(record.pre.reaction && record.post.reaction
          ? [`反応 ${formatSigned(record.post.reaction.medianMs - record.pre.reaction.medianMs)}ms`]
          : []),
      ]
    : ['チェックなし'];

  return (
    <li className="history-item">
      <div className="history-item-main">
        <strong>
          {profile.label}
          {record.condition ? (
            <small className={`condition-tag condition-${record.condition}`}>
              {record.condition === 'active' ? '40 Hz' : '対照'}
            </small>
          ) : null}
        </strong>
        <span>
          {formatDateTime(record.startedAt)} ・ {minutes}分{record.completed ? '' : '（途中停止）'}
        </span>
        <span className="history-changes">{changes.join(' / ')}</span>
        {heartRate.before != null || heartRate.during != null || heartRate.hrv != null ? (
          <span className="history-health">
            心拍 {formatBpm(heartRate.before)} → {formatBpm(heartRate.during)}
            {heartRate.hrv != null ? ` ・ HRV ${Math.round(heartRate.hrv)} ms` : ''}
          </span>
        ) : null}
      </div>
      <button
        aria-label={`${formatDateTime(record.startedAt)}の記録を削除`}
        className="inline-toggle delete-button"
        type="button"
        onClick={() => {
          if (window.confirm('この記録を削除しますか？')) {
            onDelete(record.id);
          }
        }}
      >
        削除
      </button>
    </li>
  );
}

function formatBpm(value: number | null): string {
  return value == null ? '–' : `${Math.round(value)}`;
}

function toneClass(value: number | undefined): string {
  if (value == null || Math.abs(value) < 0.05) {
    return '';
  }
  return value > 0 ? 'is-better' : 'is-worse';
}
