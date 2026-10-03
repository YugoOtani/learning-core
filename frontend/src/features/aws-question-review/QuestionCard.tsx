import type { AwsQuestion, AwsQuestionAnswerState } from './AwsQuestion';

type QuestionCardProps = {
  readonly question: AwsQuestion;
  readonly answerState: AwsQuestionAnswerState;
  readonly onSelectedAnswersChange: (answers: readonly string[]) => void;
  readonly onSubmit: () => void;
};

export function QuestionCard({ question, answerState, onSelectedAnswersChange, onSubmit }: QuestionCardProps) {
  const { selectedAnswers, isSubmitted } = answerState;

  return (
    <article className="aws-panel aws-question-card">
      <h2>問題文</h2>
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
    </article>
  );
}
