export function EvidencePanel() {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="section-label">Evidence and Limits</p>
          <h2>What this app is based on</h2>
        </div>
      </div>

      <div className="evidence-grid">
        <article className="evidence-card">
          <small className="evidence-pill evidence-limited">Limited human data</small>
          <h3>Evidence for audio-only consumer use is limited</h3>
          <p>
            The audio-only studies cited here are informative but limited in scope. This app uses conservative defaults rather than claiming validated treatment settings.
          </p>
        </article>

        <article className="evidence-card">
          <small className="evidence-pill evidence-limited">Limited human data</small>
          <h3>Eyes-closed listening may help in some EEG paradigms</h3>
          <p>
            Some studies observed stronger 40 Hz responses in eyes-closed or low-arousal conditions. That does not guarantee a better listening experience or any clinical effect, so treat it as an optional comfort tip.
          </p>
        </article>

        <article className="evidence-card">
          <small className="evidence-pill evidence-experimental">Experimental</small>
          <h3>No age- or sex-based tuning</h3>
          <p>
            The literature on age, sex, and related response differences is too heterogeneous to support product-ready auto-tuning. This app uses a simple tone preference check instead.
          </p>
        </article>
      </div>

      <div className="sources-card">
        <p className="section-label">Sources</p>
        <ul className="source-list">
          <li>
            <a href="https://pubmed.ncbi.nlm.nih.gov/37007205/" target="_blank" rel="noreferrer">
              Han et al., 2023
            </a>
            {' — '}
            Eyes-closed EEG entrainment study
          </li>
          <li>
            <a href="https://pubmed.ncbi.nlm.nih.gov/36454969/" target="_blank" rel="noreferrer">
              Chan et al., 2022
            </a>
            {' — '}
            Audiovisual pilot study in mild AD
          </li>
          <li>
            <a href="https://pubmed.ncbi.nlm.nih.gov/38402805/" target="_blank" rel="noreferrer">
              Wang et al., 2024
            </a>
            {' — '}
            MCI acceptability study
          </li>
          <li>
            <a href="https://pubmed.ncbi.nlm.nih.gov/41671727/" target="_blank" rel="noreferrer">
              Mockevičius et al., 2026
            </a>
            {' — '}
            ASSR variability review
          </li>
        </ul>
      </div>
    </section>
  );
}
