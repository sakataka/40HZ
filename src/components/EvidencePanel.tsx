const SOURCES = [
  { href: 'https://pubmed.ncbi.nlm.nih.gov/36630953/', label: 'Balban et al., 2023', note: '1日5分・1か月の呼吸法とマインドフルネスの比較。気分・呼吸数の改善を報告' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/30245619/', label: 'Zaccaro et al., 2018', note: 'ゆっくりした呼吸の心理・生理的影響のレビュー' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/32385728/', label: 'Lehrer et al., 2020', note: 'HRVバイオフィードバックのメタ分析。本アプリの固定ペースの呼吸ガイドとは異なる' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/36044424/', label: 'Albulescu et al., 2022', note: '10分以下の休憩のメタ分析。音の効果を検証した研究ではない' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/33753555/', label: 'Buxton et al., 2021', note: '自然音の健康効果の統合研究' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/38428577/', label: 'Nigg et al., 2024', note: '主に子ども・若年成人のADHD症状とホワイト／ピンクノイズのメタ分析' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/37007205/', label: 'Han et al., 2023', note: '目を閉じた条件での EEG 同調研究' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/36454969/', label: 'Chan et al., 2022', note: '軽度 AD における音と光の予備研究' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/38402805/', label: 'Wang et al., 2024', note: '軽度認知障害（MCI）における受け入れやすさの質的研究。音の不快感も報告' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/41671727/', label: 'Mockevičius et al., 2026', note: '40 Hz聴性定常反応（ASSR）の発達・加齢に関するレビュー' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/30879788/', label: 'Martorell et al., 2019', note: 'マウスでの40 Hz音刺激と光・音の併用。ランダム刺激を対照に使用' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/38418876/', label: 'Murdock et al., 2024', note: 'マウスでの40 Hz刺激とグリンパティック系' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/36879142/', label: 'Soula et al., 2023', note: '40 Hz光刺激の同調が再現されなかった報告（マウス）' },
  { href: 'https://pubmed.ncbi.nlm.nih.gov/22025811/', label: 'Basner et al., 2011', note: '3分版反応時間テスト（PVT-B）の検証。本アプリの60秒版の妥当性を示すものではない' },
];

export function EvidencePanel() {
  return (
    <details className="card disclosure-card evidence-panel">
      <summary>このアプリについて・参考資料</summary>
      <p>
        音でリラックスや頭のリセットを試し、前後の変化を自分で確かめるためのツールです。医療機器ではなく、治療や効果を保証するものではありません。根拠の表示は関連する手法の研究にもとづく目安で、本アプリ自体の検証結果ではありません。安全上の注意は使用時の予防的な案内で、掲載研究が本アプリの安全性を保証するものではありません。
      </p>

      <div className="evidence-grid">
        <article className="evidence-card">
          <small className="evidence-pill evidence-moderate">根拠: 中程度</small>
          <h3>呼吸法は、手法のなかでは比較的しっかりした根拠があります</h3>
          <p>
            1分間に約6回のゆっくりした呼吸では、不安の軽減や心拍変動の増加が報告されています。サイクリック・サイでは、1日5分を1か月続けた比較で気分と呼吸数の改善が報告されましたが、心拍変動や睡眠の有意な改善は確認されていません。本アプリの固定ペースや「寝る前の呼吸」の睡眠効果を直接検証したものではありません。研究対象は呼吸法で、音はペースを合わせるための合図です。
          </p>
        </article>

        <article className="evidence-card">
          <small className="evidence-pill evidence-limited">限定的な人でのデータ</small>
          <h3>音だけの一般利用を裏づける証拠は限定的です</h3>
          <p>
            40 Hz刺激による病理や認知課題の改善は、マウスで音のみや光と音の併用で報告されています。一方、光刺激では同調や病理の改善を再現できなかった報告もあります。人での光と音の予備研究もありますが、健康な人が音だけを聞いた場合の効果ははっきりしていません。
          </p>
        </article>

        <article className="evidence-card">
          <small className="evidence-pill evidence-limited">限定的な人でのデータ</small>
          <h3>ノイズの効果は人によって分かれます</h3>
          <p>
            主に子ども・若年成人の研究で、ADHDや強いADHD症状のある人ではホワイト／ピンクノイズで課題成績が少し良くなる一方、ADHDのない比較群では悪化が報告されています。このメタ分析にブラウンノイズの研究は含まれていません。自然音には気分改善の報告がありますが、ここでの波・雨・そよ風・焚き火は合成音なので、その効果が当てはまるとは限りません。
          </p>
        </article>

        <article className="evidence-card">
          <small className="evidence-pill evidence-limited">限定的な人でのデータ</small>
          <h3>目を閉じた状態で反応が強まった研究があります</h3>
          <p>
            Hanらの EEG 研究では、比較した条件のなかで、目を閉じて40 Hzの正弦波の音を聞く条件が最も強い前頭前野の40 Hz反応を示しました。本アプリの音や体感、臨床効果を検証したものではありません。
          </p>
        </article>

        <article className="evidence-card">
          <small className="evidence-pill evidence-experimental">試験的</small>
          <h3>前後の変化をブラインド比較で調べる</h3>
          <p>
            ブラインド比較では、40 Hzの脈動と、平均間隔が同じランダムな脈動を4回ごとに2回ずつ、順番を伏せて割り当てます。ランダム刺激を対照にする考え方はMartorellらのマウス研究を参考にしていますが、その刺激の再現ではありません。完了したセッションの前後差の平均を比べ、各条件でデータが3回以上そろった項目に95%信頼区間を表示します。自分1人の実験なので、日による体調の違いや、音を聞き分けてしまうことによる影響は残ります。
          </p>
        </article>

        <article className="evidence-card">
          <small className="evidence-pill evidence-experimental">試験的</small>
          <h3>年齢や性別による自動調整はしません</h3>
          <p>
            ASSRの加齢に伴う変化は研究によってばらつきがあります。年齢・性別に応じた本アプリの設定を裏づける根拠はないため、自動調整には使っていません。代わりに聞き取りやすさを選ぶ簡単なトーン確認を使います。
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
