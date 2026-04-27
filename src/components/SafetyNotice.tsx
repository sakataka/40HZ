type SafetyNoticeProps = {
  onAccept: () => void;
};

const SAFETY_POINTS = [
  'このアプリは医療行為ではなく、臨床的な効果を保証しません。',
  '不快感、めまい、頭痛があればすぐ停止してください。',
  '運転中、作業中、周囲への注意が必要な状況では使わないでください。',
  '静かな環境で、音量を上げすぎず、短いセッションから始めてください。',
  '発作歴など気になる医療上の事情がある場合は、使用前に専門家へ相談してください。',
];

export function SafetyNotice({ onAccept }: SafetyNoticeProps) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="safety-title">
      <div className="modal-card">
        <p className="section-label">安全情報</p>
        <h2 id="safety-title">始める前に安全上の注意を確認してください</h2>
        <ul className="safety-list">
          {SAFETY_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <button className="primary-button" type="button" onClick={onAccept}>
          理解して進む
        </button>
      </div>
    </div>
  );
}
