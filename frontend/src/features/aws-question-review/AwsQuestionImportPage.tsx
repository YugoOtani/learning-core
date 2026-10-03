import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import type { QuestionImportResult } from './importQuestion';

type AwsQuestionImportPageProps = {
  readonly onImport: (input: string) => QuestionImportResult;
};

export function AwsQuestionImportPage({ onImport }: AwsQuestionImportPageProps) {
  const [input, setInput] = useState('');
  const [notice, setNotice] = useState<{ readonly message: string; readonly invalid: boolean }>();
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // 取り込み結果に応じて復習画面へ進むか、入力欄に案内を表示する
    const result = onImport(input);
    if (result.status === 'imported') {
      navigate('/aws-question-review');
      return;
    }
    setNotice({
      message: result.status === 'invalid'
        ? result.message
        : '同じ問題文の問題は取り込み済みです。',
      invalid: result.status === 'invalid',
    });
  }

  return (
    <main className="page-shell main-content aws-import-page">
      <h1>問題を取り込む</h1>
      <p className="aws-intro">ブックマークレットでコピーした問題データを貼り付けます。</p>
      <form className="aws-panel aws-import-form" onSubmit={handleSubmit}>
        <label className="aws-input-label" htmlFor="aws-question-json">問題データ（JSON）</label>
        <p className="aws-hint" id="aws-json-hint">1問分のJSONを貼り付けてください。</p>
        <textarea
          id="aws-question-json"
          value={input}
          onChange={(event) => { setInput(event.target.value); setNotice(undefined); }}
          aria-describedby={notice ? 'aws-json-hint aws-import-notice' : 'aws-json-hint'}
          aria-invalid={notice?.invalid || undefined}
          spellCheck={false}
        />
        {notice && <p className="aws-import-notice" id="aws-import-notice" role="alert">{notice.message}</p>}
        <div className="aws-import-actions">
          <button className="aws-import-button" type="submit">問題を取り込む</button>
          <Link className="aws-text-link" to="/aws-question-review">復習画面に戻る</Link>
        </div>
      </form>
    </main>
  );
}
