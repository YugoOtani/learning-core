import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router';
import { App } from './App';

afterEach(cleanup);

function CurrentPath() {
  return <output data-testid="current-path">{useLocation().pathname}</output>;
}

describe('学習ホーム', () => {
  it('ルートにアクセスするとホームへリダイレクトする', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
        <CurrentPath />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: '今日の学び' })).toBeTruthy();
    expect(screen.getByTestId('current-path').textContent).toBe('/home');
  });

  it('個別の学習体験をタイトルと説明付きで表示する', () => {
    render(
      <MemoryRouter initialEntries={['/home']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: '今日の学び' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'メインナビゲーション' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'ツール一覧' })).toBeTruthy();

    const cards = screen.getAllByRole('article');
    expect(cards.length).toBeGreaterThan(1);

    for (const card of cards) {
      expect(within(card).getByRole('heading', { level: 3 }).textContent).toBeTruthy();
      expect(within(card).getByText((_, element) => element?.tagName === 'P')).toBeTruthy();
    }

    expect(within(cards[0]).getByRole('heading', { level: 3, name: 'AtCoderの問題に挑戦' })).toBeTruthy();
    expect(within(cards[0]).getByText('今日の一問。実際にコードを書いて、解き方を考えてみましょう。')).toBeTruthy();
    expect(within(cards[1]).getByRole('heading', { level: 3, name: 'AIに関する最新ニュース' })).toBeTruthy();
    expect(within(cards[1]).getByText('今週の注目ニュースを読み、技術の動きをつかみましょう。')).toBeTruthy();
  });

  it('ホーム以外のパスでは学習ホームを表示しない', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('heading', { level: 1, name: '今日の学び' })).toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: 'ページが見つかりません' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'ホームに戻る' }).getAttribute('href')).toBe('/home');
  });
});
