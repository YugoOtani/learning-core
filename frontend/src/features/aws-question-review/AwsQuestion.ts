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
