import type { AwsQuestion, AwsQuestionReviewData } from './AwsQuestion';

const STORAGE_KEY = 'aws-question-review:data:v1';

const EMPTY_REVIEW_DATA: AwsQuestionReviewData = {
  questions: [],
  reviewsByQuestion: {},
};

export function loadAwsQuestionReview(): AwsQuestionReviewData {
  const storedData = window.localStorage.getItem(STORAGE_KEY);
  return storedData === null ? EMPTY_REVIEW_DATA : JSON.parse(storedData) as AwsQuestionReviewData;
}

export function saveAwsQuestionReview(data: AwsQuestionReviewData): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function mergeAwsQuestions(first: readonly AwsQuestion[], second: readonly AwsQuestion[]): readonly AwsQuestion[] {
  const merged = [...first];
  for (const question of second) {
    if (!merged.some((saved) => saved.question === question.question)) {
      merged.push(question);
    }
  }
  return merged;
}

export async function synchronizeAwsQuestions(
  localQuestions: readonly AwsQuestion[],
  publishLocalQuestions: boolean,
): Promise<readonly AwsQuestion[]> {
  try {
    const response = await fetch('/api/aws-question-review/questions');
    if (!response.ok) return localQuestions;

    const serverQuestions = await response.json() as AwsQuestion[];
    const mergedQuestions = mergeAwsQuestions(localQuestions, serverQuestions);
    if (publishLocalQuestions) {
      const saveResponse = await fetch('/api/aws-question-review/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mergedQuestions),
      });
      if (!saveResponse.ok) return mergedQuestions;
      return await saveResponse.json() as AwsQuestion[];
    }
    return mergedQuestions;
  } catch {
    return localQuestions;
  }
}

export async function publishAwsQuestions(questions: readonly AwsQuestion[]): Promise<void> {
  try {
    await fetch('/api/aws-question-review/questions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questions),
    });
  } catch {
    // バックエンドに届かない場合も、ブラウザー内の保存を続ける
  }
}
