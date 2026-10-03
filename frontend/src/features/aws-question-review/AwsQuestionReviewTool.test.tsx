import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import sampleJson from '../../../../sample/problem.json?raw';
import { App } from '../../App';
import type { AwsQuestion } from './AwsQuestion';

beforeEach(() => window.localStorage.clear());
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
  it('複数の問題から選んだ問題だけを整形テキストでコピーする', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    openPage('/aws-question-review/import');
    submitQuestion(JSON.stringify({
      question: '1問目',
      choices: [{ label: 'A', text: '1問目の選択肢' }],
      correctAnswers: ['A'],
    }));
    fireEvent.click(screen.getByRole('link', { name: '問題を取り込む' }));
    submitQuestion(JSON.stringify({
      question: '2問目',
      choices: [{ label: 'B', text: '2問目の選択肢' }, { label: 'C', text: '別の選択肢' }],
      correctAnswers: ['C'],
    }));

    const cards = screen.getAllByRole('article');
    fireEvent.click(within(cards[1]).getByRole('button', { name: '問題をコピー' }));

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith(
      '問題文:\n2問目\n\n選択肢:\nB. 2問目の選択肢\nC. 別の選択肢\n\n正解:\nC',
    ));
    expect(writeText).toHaveBeenCalledTimes(1);
  });

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
    expect(screen.queryByRole('textbox', { name: '問題データ（JSON）' })).toBeNull();
    const card = screen.getByRole('article');
    expect(within(card).getByRole('heading', { name: '問題文' })).toBeTruthy();
    expect(within(card).getByRole('group', { name: '選択肢' })).toBeTruthy();
    expect(within(card).getByText((_, element) => element?.tagName === 'P').textContent).toBe(question.question);
    expect(within(card).getAllByRole('listitem').map((item) => item.textContent))
      .toEqual(question.choices.map((choice) => `${choice.label}${choice.text}`));
    expect(screen.queryByText(/正解/)).toBeNull();
    expect(within(card).getByRole('button', { name: '回答する' }).hasAttribute('disabled')).toBe(true);
  });

  it('複数の選択肢を回答すると、選んだ回答を保ったまま正解ラベルを表示する', () => {
    openReviewWithSampleQuestion();
    const card = screen.getByRole('article');
    const checkboxes = within(card).getAllByRole<HTMLInputElement>('checkbox');

    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    fireEvent.click(within(card).getByRole('button', { name: '回答する' }));

    const choices = within(card).getAllByRole('listitem');
    expect(checkboxes[0].checked).toBe(true);
    expect(checkboxes[1].checked).toBe(true);
    expect(within(card).getByRole('group', { name: '選択肢' }).hasAttribute('disabled')).toBe(true);
    expect(choices[0].classList.contains('aws-choice--incorrect-selected')).toBe(true);
    expect(choices[1].classList.contains('aws-choice--correct')).toBe(true);
    expect(choices[3].classList.contains('aws-choice--correct')).toBe(true);
    expect(within(card).getByRole('status').textContent).toBe('正解: B、D');
    expect(within(card).getByRole('button', { name: '回答する' }).hasAttribute('disabled')).toBe(true);
  });

  it('11問以上は10問ずつ表示し、ページを戻ると回答状態も維持する', () => {
    openPage('/aws-question-review/import');
    for (let index = 1; index <= 11; index += 1) {
      if (index > 1) {
        fireEvent.click(screen.getByRole('link', { name: '問題を取り込む' }));
      }
      submitQuestion(JSON.stringify({
        question: `問題 ${index}`,
        choices: [{ label: 'A', text: `選択肢 ${index}` }],
        correctAnswers: ['A'],
      }));
    }

    expect(screen.getAllByRole('article')).toHaveLength(10);
    expect(screen.getByText('問題 1')).toBeTruthy();
    expect(screen.getByText('問題 10')).toBeTruthy();
    expect(screen.queryByText('問題 11')).toBeNull();
    expect(screen.getByText('1 / 2 ページ')).toBeTruthy();

    const firstQuestion = screen.getAllByRole('article')[0];
    const firstCheckbox = within(firstQuestion).getAllByRole('checkbox')[0];
    fireEvent.click(firstCheckbox);
    fireEvent.click(within(firstQuestion).getByRole('button', { name: '回答する' }));
    fireEvent.click(screen.getByRole('button', { name: '次へ' }));

    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByText('問題 11')).toBeTruthy();
    expect(screen.getByText('2 / 2 ページ')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '前へ' }));

    const returnedFirstQuestion = screen.getAllByRole('article')[0];
    expect(within(returnedFirstQuestion).getByRole('status').textContent).toBe('正解: A');
    expect(within(returnedFirstQuestion).getAllByRole<HTMLInputElement>('checkbox')[0].checked).toBe(true);
  });

  it('問題ごとの復習マークとメモを保存し、画面の再初期化後もそれぞれ復元する', () => {
    openPage('/aws-question-review/import');
    submitQuestion(JSON.stringify({
      question: '1問目',
      choices: [{ label: 'A', text: '選択肢A' }],
      correctAnswers: ['A'],
    }));
    fireEvent.click(screen.getByRole('link', { name: '問題を取り込む' }));
    submitQuestion(JSON.stringify({
      question: '2問目',
      choices: [{ label: 'B', text: '選択肢B' }],
      correctAnswers: ['B'],
    }));

    const cards = screen.getAllByRole('article');
    fireEvent.click(within(cards[0]).getByRole('button', { name: '復習マークを付ける' }));
    expect(within(cards[0]).getByRole('button', { name: '復習マークを外す' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(within(cards[1]).getByRole('button', { name: '復習マークを付ける' }));
    expect(within(cards[1]).getByRole('button', { name: '復習マークを外す' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(within(cards[1]).getByRole('button', { name: '復習マークを外す' }));
    expect(within(cards[1]).getByRole('button', { name: '復習マークを付ける' }).getAttribute('aria-pressed')).toBe('false');
    fireEvent.change(within(cards[0]).getByRole('textbox', { name: 'メモ' }), { target: { value: '1問目の確認メモ' } });
    fireEvent.change(within(cards[1]).getByRole('textbox', { name: 'メモ' }), { target: { value: '2問目の復習メモ' } });

    cleanup();
    openPage('/aws-question-review');

    const restoredCards = screen.getAllByRole('article');
    expect(restoredCards).toHaveLength(2);
    expect(within(restoredCards[0]).getByText('1問目')).toBeTruthy();
    expect(within(restoredCards[1]).getByText('2問目')).toBeTruthy();
    expect(within(restoredCards[0]).getByRole('button', { name: '復習マークを外す' }).getAttribute('aria-pressed')).toBe('true');
    expect(within(restoredCards[1]).getByRole('button', { name: '復習マークを付ける' }).getAttribute('aria-pressed')).toBe('false');
    expect((within(restoredCards[0]).getByRole('textbox', { name: 'メモ' }) as HTMLTextAreaElement).value)
      .toBe('1問目の確認メモ');
    expect((within(restoredCards[1]).getByRole('textbox', { name: 'メモ' }) as HTMLTextAreaElement).value)
      .toBe('2問目の復習メモ');
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

    expect(firstPage.getByRole('main').textContent).toBe(secondPage.getByRole('main').textContent);
    expect(firstPage.getAllByRole<HTMLInputElement>('checkbox').map((checkbox) => checkbox.checked))
      .toEqual(secondPage.getAllByRole<HTMLInputElement>('checkbox').map((checkbox) => checkbox.checked));
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
