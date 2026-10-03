import './App.css';
import { Link, Navigate, NavLink, Route, Routes } from 'react-router';
import { NotFound } from './NotFound';
import { AwsQuestionReviewTool } from './features/aws-question-review/AwsQuestionReviewTool';

type LearningTool = {
  title: string;
  description: string;
  icon: string;
  color: 'mint' | 'peach' | 'lavender' | 'blue';
};

const learningTools: LearningTool[] = [
  {
    title: 'AtCoderの問題に挑戦',
    description: '今日の一問。実際にコードを書いて、解き方を考えてみましょう。',
    icon: '⌘',
    color: 'mint',
  },
  {
    title: 'AIに関する最新ニュース',
    description: '今週の注目ニュースを読み、技術の動きをつかみましょう。',
    icon: '✦',
    color: 'peach',
  },
  {
    title: 'データで見る世界の人口',
    description: 'インタラクティブな地図を動かしながら、人口の変化を見てみます。',
    icon: '◉',
    color: 'lavender',
  },
  {
    title: '「なぜ空は青い？」を考える',
    description: '身近な疑問から出発して、光の性質をたどってみましょう。',
    icon: '↗',
    color: 'blue',
  },
];

function LearningHome() {
  return (
    <>
      <header className="site-header">
        <div className="page-shell topbar">
          <Link className="brand" to="/home" aria-label="manabi ホーム">
            <span className="brand-mark" aria-hidden="true">学</span>
            <span>manabi</span>
          </Link>
          <nav className="navigation" aria-label="メインナビゲーション">
            <NavLink className="navigation-current" to="/home" end>ホーム</NavLink>
            <span className="navigation-optional">学習ツール</span>
            <span className="navigation-optional">学習履歴</span>
            <span className="avatar" role="img" aria-label="プロフィール">A</span>
          </nav>
        </div>
      </header>

      <main className="page-shell main-content">
        <h1>今日の学び</h1>
        <section className="tools-section" aria-labelledby="tools-title">
          <div className="tools-heading">
            <h2 id="tools-title">ツール一覧</h2>
          </div>
          <div className="tools-grid">
            {learningTools.map((tool) => (
              <article className="tool-card" key={tool.title}>
                <div className="tool-card-heading">
                  <span className={`tool-icon ${tool.color}`} aria-hidden="true">
                    {tool.icon}
                  </span>
                  <h3>{tool.title}</h3>
                </div>
                <p>{tool.description}</p>
              </article>
            ))}
            <article>
              <Link className="tool-card" to="/aws-question-review">
                <div className="tool-card-heading">
                  <span className="tool-icon mint" aria-hidden="true">☁</span>
                  <h3>AWS問題の復習</h3>
                </div>
                <p>取り込んだAWSの問題文と選択肢を確認します。</p>
              </Link>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<LearningHome />} />
      <Route path="/aws-question-review/*" element={<AwsQuestionReviewTool />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
