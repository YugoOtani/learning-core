import type { AwsQuestion } from './AwsQuestion';

export type QuestionImportResult =
  | { readonly status: 'imported'; readonly question: AwsQuestion; readonly questions: readonly AwsQuestion[] }
  | { readonly status: 'duplicate' }
  | { readonly status: 'invalid'; readonly message: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateQuestion(value: unknown):
  | { readonly question: AwsQuestion }
  | { readonly message: string } {
  // 問題の基本項目が取り込み可能な形式かを確認する
  if (!isObject(value)) {
    return { message: '単一の問題オブジェクトを入力してください。問題の配列は取り込めません。' };
  }
  if (!isNonBlankString(value.question)) {
    return { message: 'questionには空白だけではない問題文を入力してください。' };
  }
  if (!Array.isArray(value.choices) || value.choices.length === 0) {
    return { message: 'choicesには1つ以上の選択肢を配列で入力してください。' };
  }

  // 選択肢を検証し、重複しないラベルを持つ内部データへ組み立てる
  const choices: AwsQuestion['choices'][number][] = [];
  const labels = new Set<string>();
  for (const choice of value.choices) {
    if (!isObject(choice) || !isNonBlankString(choice.label) || !isNonBlankString(choice.text)) {
      return { message: '各選択肢のlabelとtextには空白だけではない文字列を入力してください。' };
    }
    if (labels.has(choice.label)) {
      return { message: '選択肢のlabelは重複しないようにしてください。' };
    }
    labels.add(choice.label);
    choices.push({ label: choice.label, text: choice.text });
  }

  // 正解ラベルが選択肢と対応し、重複していないことを確認する
  if (!Array.isArray(value.correctAnswers) || value.correctAnswers.length === 0) {
    return { message: 'correctAnswersには1つ以上の正解ラベルを配列で入力してください。' };
  }
  const correctAnswers: string[] = [];
  for (const answer of value.correctAnswers) {
    if (typeof answer !== 'string' || !labels.has(answer)) {
      return { message: 'correctAnswersにはchoicesに含まれるlabelを入力してください。' };
    }
    if (correctAnswers.includes(answer)) {
      return { message: 'correctAnswersの正解ラベルは重複しないようにしてください。' };
    }
    correctAnswers.push(answer);
  }

  // 検証済みの項目だけで復習用の問題データを返す
  return { question: { question: value.question, choices, correctAnswers } };
}

/** 単一問題のJSONを検証し、同じ問題文がなければ既存一覧の末尾に追加した一覧を返す。 */
export function importQuestion(
  input: string,
  existingQuestions: readonly AwsQuestion[],
): QuestionImportResult {
  // 入力文字列をJSONとして読み込み、構文エラーを利用者向けの結果へ変換する
  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch {
    return { status: 'invalid', message: 'JSONの構文が正しくありません。括弧や引用符などを確認してください。' };
  }

  // 問題の形式を確認してから、既存一覧との重複を判定する
  const validation = validateQuestion(value);
  if ('message' in validation) {
    return { status: 'invalid', message: validation.message };
  }
  if (existingQuestions.some((question) => question.question === validation.question.question)) {
    return { status: 'duplicate' };
  }

  // 既存問題を保ったまま、新しい問題を一覧の末尾へ追加する
  return {
    status: 'imported',
    question: validation.question,
    questions: [...existingQuestions, validation.question],
  };
}
