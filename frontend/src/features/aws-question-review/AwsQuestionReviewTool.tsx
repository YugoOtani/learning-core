import { useState } from 'react';
import { Link, Route, Routes } from 'react-router';
import { NotFound } from '../../NotFound';
import type { AwsQuestion } from './AwsQuestion';
import { importQuestion, type QuestionImportResult } from './importQuestion';
import { AwsQuestionImportPage } from './AwsQuestionImportPage';
import { AwsQuestionReviewPage } from './AwsQuestionReviewPage';
import './AwsQuestionReview.css';

export function AwsQuestionReviewTool() {
  const [questions, setQuestions] = useState<readonly AwsQuestion[]>([]);

  function handleImport(input: string): QuestionImportResult {
    // 正常に取り込めた場合だけ一覧を更新し、結果を入力画面へ返す
    const result = importQuestion(input, questions);
    if (result.status === 'imported') {
      setQuestions(result.questions);
    }
    return result;
  }

  return (
    <>
      <header className="site-header">
        <div className="page-shell topbar">
          <Link className="brand" to="/home" aria-label="manabi ホーム">
            <span className="brand-mark" aria-hidden="true">学</span>
            <span>manabi</span>
          </Link>
          <Link className="aws-text-link" to="/home">ホーム</Link>
        </div>
      </header>
      <Routes>
        <Route index element={<AwsQuestionReviewPage questions={questions} />} />
        <Route path="import" element={<AwsQuestionImportPage onImport={handleImport} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
