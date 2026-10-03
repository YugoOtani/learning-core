import type { AwsQuestionReviewData } from './AwsQuestion';

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
