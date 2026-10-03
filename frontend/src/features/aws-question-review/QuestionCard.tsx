import type { AwsQuestion } from './AwsQuestion';

type QuestionCardProps = {
  readonly question: Pick<AwsQuestion, 'question' | 'choices'>;
};

export function QuestionCard({ question }: QuestionCardProps) {
  return (
    <article className="aws-panel aws-question-card">
      <h2>問題文</h2>
      <p className="aws-question-text">{question.question}</p>
      <h2>選択肢</h2>
      <ul className="aws-choices">
        {question.choices.map((choice) => (
          <li className="aws-choice" key={choice.label}>
            <span className="aws-choice-label">{choice.label}</span>
            <span className="aws-choice-text">{choice.text}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
