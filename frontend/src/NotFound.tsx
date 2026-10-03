import { Link } from 'react-router';

export function NotFound() {
  return (
    <main className="page-shell main-content">
      <h1>ページが見つかりません</h1>
      <p>指定されたページはありません。</p>
      <Link to="/home">ホームに戻る</Link>
    </main>
  );
}
