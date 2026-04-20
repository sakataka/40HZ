type SafetyNoticeProps = {
  onAccept: () => void;
};

const SAFETY_POINTS = [
  'This app is not a medical treatment and does not guarantee clinical benefit.',
  'Stop immediately if you feel discomfort, dizziness, or a headache.',
  'Do not use it while driving, working, or in any situation where you need to stay alert to your surroundings.',
  'Avoid high volume and start with short sessions.',
  'If you have a history of seizures or other relevant medical conditions, talk to a clinician before using it.',
];

export function SafetyNotice({ onAccept }: SafetyNoticeProps) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="safety-title">
      <div className="modal-card">
        <p className="section-label">Safety Information</p>
        <h2 id="safety-title">Please review the safety information before you begin</h2>
        <ul className="safety-list">
          {SAFETY_POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <button className="primary-button" type="button" onClick={onAccept}>
          I understand, continue
        </button>
      </div>
    </div>
  );
}
