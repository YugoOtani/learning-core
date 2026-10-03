export type AwsQuestion = {
  readonly question: string;
  readonly choices: readonly {
    readonly label: string;
    readonly text: string;
  }[];
  readonly correctAnswers: readonly string[];
};

export type AwsQuestionAnswerState = {
  readonly selectedAnswers: readonly string[];
  readonly isSubmitted: boolean;
};

export type AwsQuestionReview = {
  readonly marked: boolean;
  readonly note: string;
};

export type AwsQuestionReviewData = {
  readonly questions: readonly AwsQuestion[];
  readonly reviewsByQuestion: Readonly<Record<string, AwsQuestionReview>>;
};
