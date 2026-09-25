import { getRecommendationProfile } from '../features/session/presets';
import type { SessionRecord } from '../features/tracking/types';
import { formatSigned } from '../lib/format';

type ResultModalProps = {
  record: SessionRecord;
  arms: { active: number; sham: number };
  onClose: () => void;
};

export function ResultModal({ record, arms, onClose }: ResultModalProps) {
  const { pre, post } = record;
  const rows = pre && post
    ? [
        { label: '頭のスッキリ', before: pre.clarity, after: post.clarity, better: post.clarity - pre.clarity, unit: '' },
        { label: '気分', before: pre.mood, after: post.mood, better: post.mood - pre.mood, unit: '' },
        { label: '疲れ', before: pre.fatigue, after: post.fatigue, better: pre.fatigue - post.fatigue, unit: '' },
        ...(pre.reaction && post.reaction
          ? [{
              label: '反応時間',
              before: pre.reaction.medianMs,
              after: post.reaction.medianMs,
              better: pre.reaction.medianMs - post.reaction.medianMs,
              unit: ' ms',
            }]
          : []),
      ]
    : [];

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <div className="modal-card">
        <p className="section-label">記録しました</p>
        <h2 id="result-title">{getRecommendationProfile(record.profileId).label}の前後比較</h2>

        {record.condition ? (
          <p className={`reveal-card reveal-${record.condition}`}>
            今回流れていたのは <strong>{record.condition === 'active' ? '40 Hzの脈動（本物）' : 'ランダムな脈動（対照）'}</strong> でした。
            <span>比較の蓄積: 40 Hz {arms.active}回 / 対照 {arms.sham}回</span>
          </p>
        ) : null}

        <table className="stats-table">
          <thead>
            <tr>
              <th scope="col">項目</th>
              <th scope="col">前</th>
              <th scope="col">後</th>
              <th scope="col">改善</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.before}{row.unit}</td>
                <td>{row.after}{row.unit}</td>
                <td className={row.better > 0 ? 'is-better' : row.better < 0 ? 'is-worse' : ''}>
                  {formatSigned(row.better)}{row.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!record.completed ? (
          <p className="hero-copy">途中で停止したため、集計からは除外されます。</p>
        ) : null}

        <div className="modal-footer">
          <button className="primary-button" type="button" onClick={onClose} data-initial-focus>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
