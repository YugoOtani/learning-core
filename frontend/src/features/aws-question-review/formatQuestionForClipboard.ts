import type { AwsQuestion } from './AwsQuestion';

export function formatQuestionForClipboard(question: AwsQuestion): string {
  const choices = question.choices.map((choice) => `${choice.label}. ${choice.text}`).join('\n');

  return `問題文:\n${question.question}\n\n選択肢:\n${choices}\n\n正解:\n${question.correctAnswers.join('、')}`;
}
