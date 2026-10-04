import { useState } from 'react';
import { Link } from 'react-router';
import type { AwsQuestion, AwsQuestionAnswerState, AwsQuestionReview, AwsQuestionReviewData } from './AwsQuestion';
import { QuestionCard } from './QuestionCard';

const QUESTIONS_PER_PAGE = 10;
const EMPTY_ANSWER_STATE: AwsQuestionAnswerState = { selectedAnswers: [], isSubmitted: false };

type AwsQuestionReviewPageProps = {
  readonly questions: readonly AwsQuestion[];
  readonly reviewsByQuestion: AwsQuestionReviewData['reviewsByQuestion'];
  readonly onReviewChange: (question: AwsQuestion, review: AwsQuestionReview) => void;
  readonly onRestart: () => void;
};

export function AwsQuestionReviewPage({ questions, reviewsByQuestion, onReviewChange, onRestart }: AwsQuestionReviewPageProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [answerStates, setAnswerStates] = useState<Readonly<Record<string, AwsQuestionAnswerState>>>({});
  const pageCount = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const pageQuestions = questions.slice(
    currentPage * QUESTIONS_PER_PAGE,
    (currentPage + 1) * QUESTIONS_PER_PAGE,
  );

  function updateAnswerState(question: AwsQuestion, update: Partial<AwsQuestionAnswerState>) {
    setAnswerStates((states) => ({
      ...states,
      [question.question]: { ...(states[question.question] ?? EMPTY_ANSWER_STATE), ...update },
    }));
  }

  return (
    <main className="page-shell main-content aws-review-page">
      <div className="aws-page-heading">
        <h1>AWS問題の復習</h1>
        <div className="aws-review-page-actions">
          <button className="aws-restart-button" type="button" onClick={onRestart}>やり直し</button>
          <Link className="aws-text-link" to="/aws-question-review/import">問題を取り込む</Link>
        </div>
      </div>
      {questions.length === 0 ? (
        <p className="aws-empty">問題はまだ取り込まれていません。</p>
      ) : (
        <div className="aws-question-list">
          {pageQuestions.map((question) => (
            <QuestionCard
              key={question.question}
              question={question}
              answerState={answerStates[question.question] ?? EMPTY_ANSWER_STATE}
              onSelectedAnswersChange={(selectedAnswers) => updateAnswerState(question, { selectedAnswers })}
              onSubmit={() => updateAnswerState(question, { isSubmitted: true })}
              review={reviewsByQuestion[question.question] ?? { marked: false, note: '' }}
              onReviewChange={(review) => onReviewChange(question, review)}
            />
          ))}
        </div>
      )}
      {pageCount > 1 && (
        <nav className="aws-pagination" aria-label="問題ページ">
          <button
            className="aws-pagination-button"
            type="button"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((page) => page - 1)}
          >
            前へ
          </button>
          <span aria-current="page">{currentPage + 1} / {pageCount} ページ</span>
          <button
            className="aws-pagination-button"
            type="button"
            disabled={currentPage >= pageCount - 1}
            onClick={() => setCurrentPage((page) => page + 1)}
          >
            次へ
          </button>
        </nav>
      )}
    </main>
  );
}
