import { useState } from 'react';
import { Link } from 'react-router';

export type QuestionSessionMode = 'review' | 'all';

type AwsQuestionSessionStartPageProps = {
  readonly reviewQuestionCount: number;
  readonly allQuestionCount: number;
  readonly canImportQuestions: boolean;
  readonly onStart: (mode: QuestionSessionMode, shuffle: boolean) => void;
};

export function AwsQuestionSessionStartPage({
  reviewQuestionCount,
  allQuestionCount,
  canImportQuestions,
  onStart,
}: AwsQuestionSessionStartPageProps) {
  const [shuffle, setShuffle] = useState(false);

  return (
    <main className="page-shell main-content aws-session-start-page">
      <h1>出題開始</h1>
      <p className="aws-intro">出題する範囲を選んでください。</p>
      <section className="aws-panel aws-session-options" aria-label="出題範囲">
        <label className="aws-shuffle-option">
          <input
            type="checkbox"
            checked={shuffle}
            onChange={(event) => setShuffle(event.currentTarget.checked)}
          />
          <span>出題順をシャッフルする</span>
        </label>
        <button
          className="aws-session-option"
          type="button"
          disabled={reviewQuestionCount === 0}
          onClick={() => onStart('review', shuffle)}
        >
          <span>復習問題から出題</span>
          <span className="aws-session-option-count">{reviewQuestionCount} 問</span>
        </button>
        {reviewQuestionCount === 0 && (
          <p className="aws-hint">復習マークが付いた問題はありません。</p>
        )}
        <button
          className="aws-session-option"
          type="button"
          disabled={allQuestionCount === 0}
          onClick={() => onStart('all', shuffle)}
        >
          <span>すべての問題から出題</span>
          <span className="aws-session-option-count">{allQuestionCount} 問</span>
        </button>
        {allQuestionCount === 0 && (
          <p className="aws-hint">問題はまだ取り込まれていません。</p>
        )}
        {canImportQuestions && <Link className="aws-text-link" to="/aws-question-review/import">問題を取り込む</Link>}
      </section>
    </main>
  );
}
