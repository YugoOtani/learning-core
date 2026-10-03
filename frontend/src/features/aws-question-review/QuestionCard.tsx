import { useId } from 'react';
import type { AwsQuestion, AwsQuestionAnswerState, AwsQuestionReview } from './AwsQuestion';
import { formatQuestionForClipboard } from './formatQuestionForClipboard';

type QuestionCardProps = {
  readonly question: AwsQuestion;
  readonly answerState: AwsQuestionAnswerState;
  readonly onSelectedAnswersChange: (answers: readonly string[]) => void;
  readonly onSubmit: () => void;
  readonly review: AwsQuestionReview;
  readonly onReviewChange: (review: AwsQuestionReview) => void;
};

export function QuestionCard({
  question,
  answerState,
  onSelectedAnswersChange,
  onSubmit,
  review,
  onReviewChange,
}: QuestionCardProps) {
  const { selectedAnswers, isSubmitted } = answerState;
  const noteId = useId();

  return (
    <article className="aws-panel aws-question-card">
      <div className="aws-question-card-heading">
        <h2>問題文</h2>
        <div className="aws-question-card-actions">
          <button
            className="aws-copy-question-button"
            type="button"
            onClick={() => navigator.clipboard.writeText(formatQuestionForClipboard(question))}
          >
            問題をコピー
          </button>
          <button
            className={`aws-bookmark-button${review.marked ? ' aws-bookmark-button--marked' : ''}`}
            type="button"
            aria-label={review.marked ? '復習マークを外す' : '復習マークを付ける'}
            aria-pressed={review.marked}
            onClick={() => onReviewChange({ ...review, marked: !review.marked })}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6.25 3.75h11.5A1.25 1.25 0 0 1 19 5v15.25l-7-3.75-7 3.75V5a1.25 1.25 0 0 1 1.25-1.25Z" />
            </svg>
          </button>
        </div>
      </div>
      <p className="aws-question-text">{question.question}</p>
      <fieldset className="aws-answer-fieldset" disabled={isSubmitted}>
        <legend>選択肢</legend>
        <ul className="aws-choices">
          {question.choices.map((choice) => (
            <li
              className={`aws-choice${isSubmitted && question.correctAnswers.includes(choice.label)
                ? ' aws-choice--correct'
                : isSubmitted && selectedAnswers.includes(choice.label)
                  ? ' aws-choice--incorrect-selected'
                  : ''}`}
              key={choice.label}
            >
              <label className="aws-choice-label-row">
                <input
                  type="checkbox"
                  checked={selectedAnswers.includes(choice.label)}
                  onChange={(event) => {
                    onSelectedAnswersChange(event.target.checked
                      ? [...selectedAnswers, choice.label]
                      : selectedAnswers.filter((answer) => answer !== choice.label));
                  }}
                />
                <span className="aws-choice-label">{choice.label}</span>
                <span className="aws-choice-text">{choice.text}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <button
        className="aws-answer-button"
        type="button"
        disabled={isSubmitted || selectedAnswers.length === 0}
        onClick={onSubmit}
      >
        回答する
      </button>
      {isSubmitted && (
        <p className="aws-answer-result" role="status">
          正解: {question.correctAnswers.join('、')}
        </p>
      )}
      <div className="aws-question-review-details">
        <label className="aws-note-label" htmlFor={noteId}>メモ</label>
        <textarea
          id={noteId}
          className="aws-note-input"
          value={review.note}
          onChange={(event) => onReviewChange({ ...review, note: event.target.value })}
        />
      </div>
    </article>
  );
}
