import { Link } from 'react-router';
import type { AwsQuestion } from './AwsQuestion';
import { QuestionCard } from './QuestionCard';

type AwsQuestionReviewPageProps = {
  readonly questions: readonly AwsQuestion[];
};

export function AwsQuestionReviewPage({ questions }: AwsQuestionReviewPageProps) {
  return (
    <main className="page-shell main-content aws-review-page">
      <div className="aws-page-heading">
        <h1>AWS問題の復習</h1>
        <Link className="aws-text-link" to="/aws-question-review/import">問題を取り込む</Link>
      </div>
      {questions.length === 0 ? (
        <p className="aws-empty">問題はまだ取り込まれていません。</p>
      ) : (
        <div className="aws-question-list">
          {questions.map((question) => (
            <QuestionCard
              key={question.question}
              question={{ question: question.question, choices: question.choices }}
            />
          ))}
        </div>
      )}
    </main>
  );
}
