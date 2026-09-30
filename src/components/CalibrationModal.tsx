type CalibrationModalProps = {
  busy: boolean;
  previewBaseToneHz: number | null;
  onPreview: (carrierHz: number) => Promise<void>;
  onChoose: (carrierHz: number) => Promise<void>;
  onSkip: () => Promise<void>;
};

export function CalibrationModal({
  busy,
  previewBaseToneHz,
  onPreview,
  onChoose,
  onSkip,
}: CalibrationModalProps) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="calibration-title">
      <div className="modal-card">
        <p className="step-label">トーンチェック ・ 2 / 2</p>
        <h2 id="calibration-title">220 Hz と 440 Hz を比べる</h2>
        <p className="hero-copy">
          今の出力環境で聞き取りやすい基準音を選ぶための確認です。研究にもとづく最適化ではなく、耳との相性確認です。
        </p>

        <div className="calibration-grid">
          {[220, 440].map((carrierHz) => (
            <div className="calibration-card" key={carrierHz}>
              <div>
                <strong className="calibration-hz">{carrierHz}<small>Hz</small></strong>
                <p>{carrierHz === 220 ? '低めで柔らかい基準音' : '明るく輪郭が出やすい基準音'}</p>
              </div>
              <div className="button-row">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => void onPreview(carrierHz)}
                  disabled={busy}
                >
                  {previewBaseToneHz === carrierHz ? '試聴中' : '試聴'}
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => void onChoose(carrierHz)}
                  disabled={busy}
                >
                  このトーンを使う
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className="text-button" type="button" onClick={() => void onSkip()} disabled={busy}>
          スキップして 220 Hz を使う
        </button>
      </div>
    </div>
  );
}
