import { useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import { NotFound } from '../../NotFound';
import type { AwsQuestion, AwsQuestionReview, AwsQuestionReviewData } from './AwsQuestion';
import { importQuestion, type QuestionImportResult } from './importQuestion';
import { AwsQuestionImportPage } from './AwsQuestionImportPage';
import { AwsQuestionReviewPage } from './AwsQuestionReviewPage';
import { AwsQuestionNoteEntryPage } from './AwsQuestionNoteEntryPage';
import { AwsQuestionSessionStartPage, type QuestionSessionMode } from './AwsQuestionSessionStartPage';
import { loadAwsQuestionReview, saveAwsQuestionReview } from './awsQuestionReviewStorage';
import './AwsQuestionReview.css';

type AwsQuestionNoteEntryRouteProps = {
  readonly questions: readonly AwsQuestion[];
  readonly reviewsByQuestion: AwsQuestionReviewData['reviewsByQuestion'];
  readonly onSave: (question: AwsQuestion, note: string) => void;
};

function AwsQuestionNoteEntryRoute({ questions, reviewsByQuestion, onSave }: AwsQuestionNoteEntryRouteProps) {
  const location = useLocation();
  const state = location.state;
  const questionText = typeof state === 'object' && state !== null && 'question' in state
    && typeof state.question === 'string'
    ? state.question
    : undefined;
  const question = questions.find((item) => item.question === questionText);

  if (!question) {
    return <Navigate to="/aws-question-review/start" replace />;
  }

  const review = reviewsByQuestion[question.question] ?? { marked: false, note: '' };
  return (
    <AwsQuestionNoteEntryPage
      key={question.question}
      question={question}
      initialNote={review.note}
      onSave={(note) => onSave(question, note)}
    />
  );
}

export function AwsQuestionReviewTool() {
  const [reviewData, setReviewData] = useState(loadAwsQuestionReview);
  const navigate = useNavigate();
  const reviewQuestions = reviewData.questions.filter(
    (question) => reviewData.reviewsByQuestion[question.question]?.marked === true,
  );

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

  function startSession(mode: QuestionSessionMode) {
    navigate(mode === 'review' ? '/aws-question-review/review' : '/aws-question-review');
  }

  function restartSession() {
    navigate('/aws-question-review/start');
  }

  function saveImportedQuestionNote(question: AwsQuestion, note: string) {
    const review = reviewData.reviewsByQuestion[question.question] ?? { marked: false, note: '' };
    handleReviewChange(question, { ...review, note });
    navigate('/aws-question-review/start');
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
          path="start"
          element={(
            <AwsQuestionSessionStartPage
              reviewQuestionCount={reviewQuestions.length}
              allQuestionCount={reviewData.questions.length}
              onStart={startSession}
            />
          )}
        />
        <Route
          path="note"
          element={(
            <AwsQuestionNoteEntryRoute
              questions={reviewData.questions}
              reviewsByQuestion={reviewData.reviewsByQuestion}
              onSave={saveImportedQuestionNote}
            />
          )}
        />
        <Route
          index
          element={(
            <AwsQuestionReviewPage
              questions={reviewData.questions}
              reviewsByQuestion={reviewData.reviewsByQuestion}
              onReviewChange={handleReviewChange}
              onRestart={restartSession}
            />
          )}
        />
        <Route
          path="review"
          element={(
            <AwsQuestionReviewPage
              questions={reviewQuestions}
              reviewsByQuestion={reviewData.reviewsByQuestion}
              onReviewChange={handleReviewChange}
              onRestart={restartSession}
            />
          )}
        />
        <Route path="import" element={<AwsQuestionImportPage onImport={handleImport} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
