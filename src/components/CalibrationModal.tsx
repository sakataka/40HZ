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
        <p className="section-label">Controlled Tone Check</p>
        <h2 id="calibration-title">Compare 220 Hz and 440 Hz</h2>
        <p className="hero-copy">
          This is a comfort and audibility check for the current output device, not a research-based optimization step. Pick the tone that is easiest to hear without feeling harsh.
        </p>

        <div className="calibration-grid">
          {[220, 440].map((carrierHz) => (
            <div className="calibration-card" key={carrierHz}>
              <strong>{carrierHz}Hz</strong>
              <p>{carrierHz === 220 ? 'Lower, softer control tone' : 'Brighter, more defined control tone'}</p>
              <div className="button-row">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => void onPreview(carrierHz)}
                  disabled={busy}
                >
                  {previewBaseToneHz === carrierHz ? 'Previewing' : 'Preview'}
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => void onChoose(carrierHz)}
                  disabled={busy}
                >
                  Use this tone
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className="inline-toggle" type="button" onClick={() => void onSkip()} disabled={busy}>
          Skip and use 220 Hz
        </button>
      </div>
    </div>
  );
}
