export type AwsQuestion = {
  readonly question: string;
  readonly choices: readonly {
    readonly label: string;
    readonly text: string;
  }[];
  readonly correctAnswers: readonly string[];
};
