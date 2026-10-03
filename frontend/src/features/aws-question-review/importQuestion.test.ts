import { describe, expect, it } from 'vitest';
import sampleJson from '../../../../sample/problem.json?raw';
import type { AwsQuestion } from './AwsQuestion';
import { importQuestion } from './importQuestion';

function createQuestion(): AwsQuestion {
  return {
    question: 'どの対応を選びますか？',
    choices: [{ label: 'A', text: '容量を調整する' }, { label: 'B', text: '処理を分散する' }],
    correctAnswers: ['B'],
  };
}

describe('問題JSONの取り込み', () => {
  it('基準例の単一問題を正解ラベルも含めて取り込める', () => {
    const expectedQuestion = JSON.parse(sampleJson);

    const result = importQuestion(sampleJson, []);

    expect(result).toEqual({ status: 'imported', questions: [expectedQuestion] });
  });

  it('既存問題を変更せず、新しい問題を末尾に追加する', () => {
    const original = Object.freeze({
      question: '既存の問題',
      choices: Object.freeze([Object.freeze({ label: 'A', text: '既存の選択肢' })]),
      correctAnswers: Object.freeze(['A']),
    });
    const existingQuestions = Object.freeze([original]);
    const newQuestion = createQuestion();

    const result = importQuestion(JSON.stringify(newQuestion), existingQuestions);

    expect(result).toEqual({ status: 'imported', questions: [original, newQuestion] });
    expect(existingQuestions).toEqual([original]);
  });

  it('空白や改行を含む問題文・選択肢・ラベルを加工せず保持する', () => {
    const question: AwsQuestion = {
      question: '  問題文\n\n続き  ',
      choices: [{ label: ' A ', text: '  選択肢\n続き  ' }],
      correctAnswers: [' A '],
    };

    const result = importQuestion(JSON.stringify(question), []);

    expect(result).toEqual({ status: 'imported', questions: [question] });
  });

  it('選択肢や正解が違っても問題文が完全一致すれば重複として追加しない', () => {
    const original = createQuestion();
    const existingQuestions = Object.freeze([original]);
    const changedQuestion = {
      ...original,
      choices: [{ label: 'C', text: '別の選択肢' }],
      correctAnswers: ['C'],
    };

    const result = importQuestion(JSON.stringify(changedQuestion), existingQuestions);

    expect(result).toEqual({ status: 'duplicate' });
    expect(existingQuestions).toEqual([createQuestion()]);
  });

  it('問題文の空白が違う場合は別の問題として追加する', () => {
    const original = createQuestion();
    const changedQuestion = { ...original, question: ` ${original.question}` };

    const result = importQuestion(JSON.stringify(changedQuestion), [original]);

    expect(result).toEqual({ status: 'imported', questions: [original, changedQuestion] });
  });

  it.each(['', '   ', '{"question":', '{"question": "問題",}'])('JSON構文が不正なら理由を返す（%j）', (input) => {
    const existingQuestions = Object.freeze([createQuestion()]);

    const result = importQuestion(input, existingQuestions);

    expect(result).toEqual({ status: 'invalid', message: expect.stringContaining('JSONの構文') });
    expect(existingQuestions).toEqual([createQuestion()]);
  });

  it.each([null, 1, true, '問題', [], [createQuestion()]])('単一問題オブジェクト以外は取り込めない（%j）', (value) => {
    const input = JSON.stringify(value);

    const result = importQuestion(input, []);

    expect(result).toEqual({ status: 'invalid', message: expect.stringContaining('単一の問題オブジェクト') });
  });

  it.each([
    ['問題文がない', 'question', undefined, 'question'],
    ['問題文が文字列ではない', 'question', 1, 'question'],
    ['問題文が空文字', 'question', '', 'question'],
    ['問題文が空白だけ', 'question', ' \n\t　', 'question'],
    ['選択肢がない', 'choices', undefined, 'choices'],
    ['選択肢が配列ではない', 'choices', {}, 'choices'],
    ['選択肢が空配列', 'choices', [], 'choices'],
    ['選択肢がオブジェクトではない', 'choices', [null], 'labelとtext'],
    ['選択肢のラベルがない', 'choices', [{ text: '本文' }], 'labelとtext'],
    ['選択肢のラベルが数値', 'choices', [{ label: 1, text: '本文' }], 'labelとtext'],
    ['選択肢のラベルが空白だけ', 'choices', [{ label: '\t ', text: '本文' }], 'labelとtext'],
    ['選択肢の本文がない', 'choices', [{ label: 'A' }], 'labelとtext'],
    ['選択肢の本文が文字列ではない', 'choices', [{ label: 'A', text: false }], 'labelとtext'],
    ['選択肢の本文が空白だけ', 'choices', [{ label: 'A', text: '\n　' }], 'labelとtext'],
    ['選択肢のラベルが重複', 'choices', [{ label: 'A', text: '本文1' }, { label: 'A', text: '本文2' }], '重複'],
    ['正解ラベルがない', 'correctAnswers', undefined, 'correctAnswers'],
    ['正解ラベルが配列ではない', 'correctAnswers', 'B', 'correctAnswers'],
    ['正解ラベルが空配列', 'correctAnswers', [], 'correctAnswers'],
    ['正解ラベルが文字列ではない', 'correctAnswers', [1], 'choicesに含まれるlabel'],
    ['正解ラベルが選択肢にない', 'correctAnswers', ['C'], 'choicesに含まれるlabel'],
    ['正解ラベルに余分な空白がある', 'correctAnswers', [' B '], 'choicesに含まれるlabel'],
    ['正解ラベルが重複', 'correctAnswers', ['B', 'B'], '重複'],
  ] satisfies [string, string, unknown, string][])('%s場合は理由を返し、既存問題を維持する', (_, field, value, reason) => {
    const existingQuestions = Object.freeze([createQuestion()]);
    const input = JSON.stringify({ ...createQuestion(), [field]: value });

    const result = importQuestion(input, existingQuestions);

    expect(result).toEqual({ status: 'invalid', message: expect.stringContaining(reason) });
    expect(existingQuestions).toEqual([createQuestion()]);
  });
});
