import { useState } from 'react';
import { Link, Route, Routes } from 'react-router';
import { NotFound } from '../../NotFound';
import type { AwsQuestion, AwsQuestionReview, AwsQuestionReviewData } from './AwsQuestion';
import { importQuestion, type QuestionImportResult } from './importQuestion';
import { AwsQuestionImportPage } from './AwsQuestionImportPage';
import { AwsQuestionReviewPage } from './AwsQuestionReviewPage';
import { loadAwsQuestionReview, saveAwsQuestionReview } from './awsQuestionReviewStorage';
import './AwsQuestionReview.css';

export function AwsQuestionReviewTool() {
  const [reviewData, setReviewData] = useState(loadAwsQuestionReview);

  function updateReviewData(nextData: AwsQuestionReviewData) {
    saveAwsQuestionReview(nextData);
    setReviewData(nextData);
  }

  function handleImport(input: string): QuestionImportResult {
    // 正常に取り込めた場合だけ保存済みの問題一覧を更新する
    const result = importQuestion(input, reviewData.questions);
    if (result.status === 'imported') {
      updateReviewData({ ...reviewData, questions: result.questions });
    }
    return result;
  }

  function handleReviewChange(question: AwsQuestion, review: AwsQuestionReview) {
    updateReviewData({
      ...reviewData,
      reviewsByQuestion: { ...reviewData.reviewsByQuestion, [question.question]: review },
    });
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
        <Route
          index
          element={(
            <AwsQuestionReviewPage
              questions={reviewData.questions}
              reviewsByQuestion={reviewData.reviewsByQuestion}
              onReviewChange={handleReviewChange}
            />
          )}
        />
        <Route path="import" element={<AwsQuestionImportPage onImport={handleImport} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
