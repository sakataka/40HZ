export function EvidencePanel() {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="section-label">免責と出典</p>
          <h2>合法だが、効能は売らない</h2>
        </div>
      </div>

      <div className="evidence-grid">
        <article className="evidence-card">
          <small className="evidence-pill evidence-limited">限定的な人でのデータ</small>
          <h3>音だけの一般利用を裏づける証拠は限定的です</h3>
          <p>
            ここで参照している研究は参考資料です。治療設定ではなく、控えめな初期値と停止しやすい操作を優先します。
          </p>
        </article>

        <article className="evidence-card">
          <small className="evidence-pill evidence-limited">限定的な人でのデータ</small>
          <h3>目を閉じた状態で反応が強まった研究があります</h3>
          <p>
            一部の EEG 研究では、目を閉じた低覚醒の条件で 40 Hz 反応が強まっています。体感や臨床効果を保証するものではありません。
          </p>
        </article>

        <article className="evidence-card">
          <small className="evidence-pill evidence-experimental">試験的</small>
          <h3>年齢や性別による自動調整はしません</h3>
          <p>
            反応差に関する知見はまだばらつきが大きいため、製品としての自動調整には使っていません。代わりに簡単なトーン確認を使います。
          </p>
        </article>
      </div>

      <div className="sources-card">
        <p className="section-label">出典</p>
        <ul className="source-list">
          <li>
            <a href="https://pubmed.ncbi.nlm.nih.gov/37007205/" target="_blank" rel="noreferrer">
              Han et al., 2023
            </a>
            {' — '}
            目を閉じた条件での EEG 同調研究
          </li>
          <li>
            <a href="https://pubmed.ncbi.nlm.nih.gov/36454969/" target="_blank" rel="noreferrer">
              Chan et al., 2022
            </a>
            {' — '}
            軽度 AD における音と光の予備研究
          </li>
          <li>
            <a href="https://pubmed.ncbi.nlm.nih.gov/38402805/" target="_blank" rel="noreferrer">
              Wang et al., 2024
            </a>
            {' — '}
            MCI における受け入れやすさの研究
          </li>
          <li>
            <a href="https://pubmed.ncbi.nlm.nih.gov/41671727/" target="_blank" rel="noreferrer">
              Mockevičius et al., 2026
            </a>
            {' — '}
            ASSR の個人差に関するレビュー
          </li>
        </ul>
      </div>
    </section>
  );
}
