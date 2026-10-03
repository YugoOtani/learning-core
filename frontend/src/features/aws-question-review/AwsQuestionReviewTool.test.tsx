import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';
import sampleJson from '../../../../sample/problem.json?raw';
import { App } from '../../App';
import type { AwsQuestion } from './AwsQuestion';

afterEach(cleanup);

function openPage(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
}

function submitQuestion(input: string) {
  fireEvent.change(screen.getByRole('textbox', { name: '問題データ（JSON）' }), { target: { value: input } });
  fireEvent.click(screen.getByRole('button', { name: '問題を取り込む' }));
}

function openReviewWithSampleQuestion() {
  openPage('/aws-question-review/import');
  submitQuestion(sampleJson);
}

describe('AWS問題の取り込みと表示', () => {
  it('未取り込みの復習画面から、空の編集可能なJSON入力欄を開ける', () => {
    openPage('/aws-question-review');

    fireEvent.click(screen.getByRole('link', { name: '問題を取り込む' }));

    expect(screen.getByRole('heading', { level: 1, name: '問題を取り込む' })).toBeTruthy();
    const input = screen.getByRole<HTMLTextAreaElement>('textbox', { name: '問題データ（JSON）' });
    expect(input.value).toBe('');
    expect(input.readOnly).toBe(false);
  });

  it('問題がない場合は未取り込みの案内を表示する', () => {
    openPage('/aws-question-review');

    expect(screen.getByText('問題はまだ取り込まれていません。')).toBeTruthy();
    expect(screen.queryByRole('article')).toBeNull();
    expect(screen.getByRole('link', { name: '問題を取り込む' }).getAttribute('href')).toBe('/aws-question-review/import');
  });

  it('基準例を取り込むと復習画面に移り、改行を保った問題文と全選択肢を順番に表示する', () => {
    const question: AwsQuestion = JSON.parse(sampleJson);
    openPage('/aws-question-review/import');

    submitQuestion(sampleJson);

    expect(screen.getByRole('heading', { level: 1, name: 'AWS問題の復習' })).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
    const card = screen.getByRole('article');
    expect(within(card).getByRole('heading', { name: '問題文' })).toBeTruthy();
    expect(within(card).getByRole('heading', { name: '選択肢' })).toBeTruthy();
    expect(within(card).getByText((_, element) => element?.tagName === 'P').textContent).toBe(question.question);
    expect(within(card).getAllByRole('listitem').map((item) => item.textContent))
      .toEqual(question.choices.map((choice) => `${choice.label}${choice.text}`));
    expect(screen.queryByText(/正解/)).toBeNull();
  });

  it('正解ラベルだけが違っても、表示するDOMと読み上げ用属性は同じになる', () => {
    const question: AwsQuestion = JSON.parse(sampleJson);
    render(
      <>
        <section aria-label="比較1"><MemoryRouter initialEntries={['/aws-question-review/import']}><App /></MemoryRouter></section>
        <section aria-label="比較2"><MemoryRouter initialEntries={['/aws-question-review/import']}><App /></MemoryRouter></section>
      </>,
    );
    const firstPage = within(screen.getByRole('region', { name: '比較1' }));
    const secondPage = within(screen.getByRole('region', { name: '比較2' }));
    const firstInput = JSON.stringify({ ...question, correctAnswers: ['A'] });
    const secondInput = JSON.stringify({ ...question, correctAnswers: ['B', 'D'] });

    fireEvent.change(firstPage.getByRole('textbox'), { target: { value: firstInput } });
    fireEvent.click(firstPage.getByRole('button', { name: '問題を取り込む' }));
    fireEvent.change(secondPage.getByRole('textbox'), { target: { value: secondInput } });
    fireEvent.click(secondPage.getByRole('button', { name: '問題を取り込む' }));

    expect(firstPage.getByRole('main').outerHTML).toBe(secondPage.getByRole('main').outerHTML);
    expect(firstPage.queryByText(/正解/)).toBeNull();
  });

  it('画面を往復して追加した問題を、既存問題の後ろに表示する', () => {
    openReviewWithSampleQuestion();
    fireEvent.click(screen.getByRole('link', { name: '問題を取り込む' }));
    const nextQuestion = { question: '次の問題', choices: [{ label: 'A', text: '次の選択肢' }], correctAnswers: ['A'] };

    submitQuestion(JSON.stringify(nextQuestion));

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText(/大手グローバル旅行会社/)).toBeTruthy();
    expect(within(cards[1]).getByText('次の問題')).toBeTruthy();
    expect(within(cards[1]).getByRole('listitem').textContent).toBe('A次の選択肢');
  });

  it('復習画面へ戻るリンクで、取り込み済みの問題を確認できる', () => {
    openReviewWithSampleQuestion();
    fireEvent.click(screen.getByRole('link', { name: '問題を取り込む' }));

    fireEvent.click(screen.getByRole('link', { name: '復習画面に戻る' }));

    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByText(/大手グローバル旅行会社/)).toBeTruthy();
  });

  it.each([
    ['JSONの構文が不正', '{', 'JSONの構文'],
    ['必須項目が不足', '{"question":"別の問題"}', 'choices'],
    ['問題の配列', `[${sampleJson}]`, '単一の問題オブジェクト'],
    ['同じ問題文が取り込み済み', sampleJson, '同じ問題文の問題は取り込み済みです。'],
  ])('%sなら、理由を案内して入力と既存問題を維持する', (_, input, reason) => {
    openReviewWithSampleQuestion();
    fireEvent.click(screen.getByRole('link', { name: '問題を取り込む' }));

    submitQuestion(input);

    expect(screen.getByRole('heading', { level: 1, name: '問題を取り込む' })).toBeTruthy();
    const textbox = screen.getByRole<HTMLTextAreaElement>('textbox', { name: '問題データ（JSON）' });
    expect(textbox.value).toBe(input);
    const notice = screen.getByRole('alert');
    expect(notice.textContent).toContain(reason);
    expect(textbox.getAttribute('aria-describedby')?.split(' ')).toContain(notice.id);
  });

  it.each([['不正なJSON', '{'], ['重複する問題', sampleJson]])('%sの取り込み後に戻っても、既存問題が置き換わったり増えたりしない', (_, input) => {
    openReviewWithSampleQuestion();
    fireEvent.click(screen.getByRole('link', { name: '問題を取り込む' }));
    submitQuestion(input);

    fireEvent.click(screen.getByRole('link', { name: '復習画面に戻る' }));

    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByText(/大手グローバル旅行会社/)).toBeTruthy();
  });

  it('不正な入力を修正して再送信すると取り込める', () => {
    openPage('/aws-question-review/import');
    submitQuestion('{');

    submitQuestion(sampleJson);

    expect(screen.getByRole('heading', { level: 1, name: 'AWS問題の復習' })).toBeTruthy();
    expect(screen.getByRole('article')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('ツール配下の未定義パスにも既存の見つからないページを表示する', () => {
    openPage('/aws-question-review/unknown');

    expect(screen.getByRole('heading', { level: 1, name: 'ページが見つかりません' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'ホームに戻る' }).getAttribute('href')).toBe('/home');
  });
});
