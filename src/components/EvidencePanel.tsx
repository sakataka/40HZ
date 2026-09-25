const SOURCES = [
  { href: 'https://pubmed.ncbi.nlm.nih.gov/36630953/', label: 'Balban et al., 2023', note: '5分の呼吸法（cyclic sighing）とマインドフルネスの比較' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/30245619/', label: 'Zaccaro et al., 2018', note: 'ゆっくりした呼吸の心理・生理的影響のレビュー' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/32385728/', label: 'Lehrer et al., 2020', note: 'HRVバイオフィードバック（共鳴呼吸）のメタ分析' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/36044424/', label: 'Albulescu et al., 2022', note: 'マイクロブレイクの効果のメタ分析' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/33753555/', label: 'Buxton et al., 2021', note: '自然音の健康効果の統合研究' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/38428577/', label: 'Nigg et al., 2024', note: 'ADHDとホワイト／ピンクノイズのメタ分析' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/37007205/', label: 'Han et al., 2023', note: '目を閉じた条件での EEG 同調研究' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/36454969/', label: 'Chan et al., 2022', note: '軽度 AD における音と光の予備研究' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/38402805/', label: 'Wang et al., 2024', note: 'MCI における受け入れやすさの研究' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/41671727/', label: 'Mockevičius et al., 2026', note: 'ASSR の個人差に関するレビュー' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/30879788/', label: 'Martorell et al., 2019', note: 'マウスでの40 Hz音・光刺激。対照にランダム周波数を使用' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/38418876/', label: 'Murdock et al., 2024', note: 'マウスでの40 Hz刺激とグリンパティック系' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/36879142/', label: 'Soula et al., 2023', note: '40 Hz光刺激の同調が再現されなかった報告（マウス）' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/22025811/', label: 'Basner et al., 2011', note: '短縮版反応時間テスト（PVT-B）の妥当性' },
];

export function EvidencePanel() {
  return (
    <details className="panel evidence-panel">
      <summary>このアプリについて・参考資料</summary>
      <p>
        音でリラックスや頭のリセットを試し、その効果を自分で確かめるためのツールです。医療機器ではなく、治療や効果を保証するものではありません。
      </p>

      <div className="evidence-grid">
        <article className="evidence-card">
          <small className="evidence-pill evidence-moderate">根拠: 中程度</small>
          <h3>呼吸ガイドは、手法のなかでは比較的しっかりした根拠があります</h3>
          <p>
            1分間に約6回のゆっくりした呼吸や、吐く息を長くする呼吸では、不安の軽減や心拍変動の増加が繰り返し報告されています。効いているのは音ではなく呼吸で、音はペースを合わせるための合図です。
          </p>
        </article>

        <article className="evidence-card">
          <small className="evidence-pill evidence-limited">限定的な人でのデータ</small>
          <h3>音だけの一般利用を裏づける証拠は限定的です</h3>
          <p>
            40 Hz刺激の目立った結果の多くはマウス（しかも光と音の併用）によるもので、再現できなかった報告もあります。健康な人が音だけを聞いた場合の効果ははっきりしていません。
          </p>
        </article>

        <article className="evidence-card">
          <small className="evidence-pill evidence-limited">限定的な人でのデータ</small>
          <h3>ノイズの効果は人によって分かれます</h3>
          <p>
            ADHD傾向のある人では課題成績が少し良くなるという報告がある一方、そうでない人では変わらないか、逆効果の場合もあります。本物の自然音には気分改善の報告がありますが、ここでの波の音は合成なので、その効果が当てはまるとは限りません。
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
          <h3>「自分に効くか」はブラインド比較で確かめる</h3>
          <p>
            ブラインド比較では、40 Hzの脈動と、平均間隔が同じランダムな脈動（研究で対照によく使われる条件）を4回ごとに2回ずつ、順番を伏せて割り当てます。前後の差の平均を比べ、95%信頼区間を表示します。自分1人の実験なので、日による体調の違いや、音を聞き分けてしまうことによる影響は残ります。
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
          {SOURCES.map((source) => (
            <li key={source.href}>
              <a href={source.href} target="_blank" rel="noreferrer">
                {source.label}
              </a>
              {' — '}
              {source.note}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
