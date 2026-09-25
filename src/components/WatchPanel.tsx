import { useState } from 'react';
import { SHORTCUT_NAME, parseHealthText } from '../features/tracking/health';
import type { HealthSample } from '../features/tracking/types';
import { formatDateTime } from '../lib/format';

type WatchPanelProps = {
  healthSamples: HealthSample[];
  onImport: (samples: HealthSample[]) => number;
  onClear: () => void;
};

const SHORTCUT_URL = `shortcuts://run-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}`;

export function WatchPanel({ healthSamples, onImport, onClear }: WatchPanelProps) {
  const [pasted, setPasted] = useState('');
  const [message, setMessage] = useState('');
  const heartRateCount = healthSamples.filter((sample) => sample.kind === 'hr').length;
  const hrvCount = healthSamples.length - heartRateCount;
  const latest = healthSamples.at(-1);
  const appUrl = typeof window === 'undefined' ? '' : `${window.location.origin}${window.location.pathname}`;

  function importText(text: string) {
    const samples = parseHealthText(text);
    if (samples.length === 0) {
      setMessage('心拍データが見つかりませんでした。「HR,日時,値」の形式か確認してください。');
      return;
    }
    const added = onImport(samples);
    setMessage(`${samples.length}件を読み取り、新しく${added}件を追加しました。`);
    setPasted('');
  }

  async function importFromClipboard() {
    try {
      importText(await navigator.clipboard.readText());
    } catch {
      setMessage('クリップボードを読み取れませんでした。下の欄に貼り付けてください。');
    }
  }

  return (
    <details className="panel evidence-panel watch-panel">
      <summary>Apple Watch 連携</summary>
      <p>
        Webアプリはヘルスケアに直接アクセスできないため、iPhoneのショートカットで心拍数と心拍変動（HRV）をコピーして取り込みます。取り込んだデータはこのブラウザ内だけに保存されます。
      </p>

      <div className="watch-status">
        <div className="duration-chip"><span>心拍数</span><strong>{heartRateCount}件</strong></div>
        <div className="duration-chip"><span>HRV</span><strong>{hrvCount}件</strong></div>
        <div className="duration-chip">
          <span>最新</span><strong>{latest ? formatDateTime(latest.at) : '–'}</strong>
        </div>
      </div>

      <div className="history-actions">
        <a className="ghost-button link-button" href={SHORTCUT_URL}>
          ショートカットを実行
        </a>
        <button className="primary-button" type="button" onClick={() => void importFromClipboard()}>
          クリップボードから取り込む
        </button>
      </div>

      <label className="paste-field">
        <span>または貼り付け</span>
        <textarea
          aria-label="ヘルスケアデータの貼り付け"
          placeholder={'HR,2026-09-25T10:15:00+09:00,68\nHRV,2026-09-25T10:20:00+09:00,42'}
          rows={3}
          value={pasted}
          onChange={(event) => setPasted(event.currentTarget.value)}
        />
      </label>
      <div className="history-actions">
        <button className="ghost-button" type="button" disabled={!pasted.trim()} onClick={() => importText(pasted)}>
          貼り付けたテキストを取り込む
        </button>
        <button
          className="ghost-button danger-button"
          type="button"
          disabled={healthSamples.length === 0}
          onClick={() => {
            if (window.confirm('取り込んだ心拍データを削除しますか？')) {
              onClear();
              setMessage('');
            }
          }}
        >
          心拍データを削除
        </button>
      </div>
      {message ? <p className="block-note" role="status">{message}</p> : null}

      <div className="watch-guide">
        <h3>使い方</h3>
        <ol>
          <li>再生と同時に、Apple Watchの「ワークアウト」で「マインド＆ボディ」を開始します。心拍が数秒おきに記録されます（開始しなくても数分おきの記録で集計はできます）。</li>
          <li>セッション後、iPhoneで「ショートカットを実行」→「クリップボードから取り込む」。</li>
          <li>記録一覧に「開始前15分」と「再生中」の平均心拍が表示され、ブラインド比較にも「心拍の低下」が加わります。</li>
        </ol>

        <h3>ショートカット「{SHORTCUT_NAME}」の作り方</h3>
        <ol>
          <li>ショートカットAppで新規作成し、名前を「{SHORTCUT_NAME}」にします。</li>
          <li>「ヘルスケアサンプルを検索」を追加。種類「心拍数」、条件「開始日」が「過去1日以内」、並び順「開始日」。</li>
          <li>「各項目を繰り返す」を追加し、中に「テキスト」を置いて <code>HR,</code>［繰り返し項目の開始日］<code>,</code>［繰り返し項目の値］ と入力。開始日は変数をタップして日付フォーマットを「ISO 8601」（時刻を含める）にします。</li>
          <li>2〜3を「心拍変動」でもう一度作り、先頭を <code>HRV,</code> にします。</li>
          <li>「テキスト」に2つの「繰り返しの結果」を改行で並べ、「クリップボードにコピー」を追加します。</li>
          <li>任意：最後に「URLを開く」で <code>{appUrl || 'このページのURL'}</code> を開くと、自動でこの画面に戻れます。</li>
        </ol>
        <p className="block-note">
          iOSのバージョンでアクション名が少し違う場合があります。日付は「2026/09/25 10:15」形式でも読み取れます。MacにはヘルスケアAppがないため、取り込みはiPhoneで行ってください。
        </p>
      </div>
    </details>
  );
}
