import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router';
import { NotFound } from '../../NotFound';
import type { AwsQuestion, AwsQuestionReview, AwsQuestionReviewData } from './AwsQuestion';
import { importQuestion, type QuestionImportResult } from './importQuestion';
import { AwsQuestionImportPage } from './AwsQuestionImportPage';
import { AwsQuestionReviewPage } from './AwsQuestionReviewPage';
import { AwsQuestionNoteEntryPage } from './AwsQuestionNoteEntryPage';
import { AwsQuestionSessionStartPage, type QuestionSessionMode } from './AwsQuestionSessionStartPage';
import {
  loadAwsQuestionReview,
  publishAwsQuestions,
  saveAwsQuestionReview,
  synchronizeAwsQuestions,
} from './awsQuestionReviewStorage';
import './AwsQuestionReview.css';

type AwsQuestionNoteEntryRouteProps = {
  readonly questions: readonly AwsQuestion[];
  readonly reviewsByQuestion: AwsQuestionReviewData['reviewsByQuestion'];
  readonly onSave: (question: AwsQuestion, note: string) => void;
};

type ActiveQuestionSession = {
  readonly mode: QuestionSessionMode;
  readonly questions: readonly AwsQuestion[];
};

function shuffleQuestionOrder(questions: readonly AwsQuestion[]): readonly AwsQuestion[] {
  const shuffledQuestions = [...questions];
  for (let index = shuffledQuestions.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledQuestions[index], shuffledQuestions[swapIndex]] = [
      shuffledQuestions[swapIndex],
      shuffledQuestions[index],
    ];
  }
  return shuffledQuestions;
}

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
  const [activeSession, setActiveSession] = useState<ActiveQuestionSession>();
  const navigate = useNavigate();
  const canImportQuestions = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  const reviewQuestions = reviewData.questions.filter(
    (question) => reviewData.reviewsByQuestion[question.question]?.marked === true,
  );

  useEffect(() => {
    let active = true;
    void synchronizeAwsQuestions(reviewData.questions, canImportQuestions).then((questions) => {
      if (!active || questions.length === reviewData.questions.length) return;
      const nextData = { ...loadAwsQuestionReview(), questions };
      saveAwsQuestionReview(nextData);
      setReviewData(nextData);
    });
    return () => { active = false; };
  }, []);

  function updateReviewData(nextData: AwsQuestionReviewData) {
    saveAwsQuestionReview(nextData);
    setReviewData(nextData);
    if (canImportQuestions && nextData.questions !== reviewData.questions) {
      void publishAwsQuestions(nextData.questions);
    }
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

  function startSession(mode: QuestionSessionMode, shuffle: boolean) {
    const questions = mode === 'review' ? reviewQuestions : reviewData.questions;
    setActiveSession({
      mode,
      questions: shuffle ? shuffleQuestionOrder(questions) : questions,
    });
    navigate(mode === 'review' ? '/aws-question-review/review' : '/aws-question-review');
  }

  function restartSession() {
    setActiveSession(undefined);
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
              canImportQuestions={canImportQuestions}
              onStart={startSession}
            />
          )}
        />
        <Route
          path="note"
          element={(
            <AwsQuestionNoteEntryRoute
              questions={activeSession?.mode === 'all' ? activeSession.questions : reviewData.questions}
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
              canImportQuestions={canImportQuestions}
            />
          )}
        />
        <Route
          path="review"
          element={(
            <AwsQuestionReviewPage
              questions={activeSession?.mode === 'review' ? activeSession.questions : reviewQuestions}
              reviewsByQuestion={reviewData.reviewsByQuestion}
              onReviewChange={handleReviewChange}
              onRestart={restartSession}
              canImportQuestions={canImportQuestions}
            />
          )}
        />
        <Route path="import" element={canImportQuestions ? <AwsQuestionImportPage onImport={handleImport} /> : <Navigate to="/aws-question-review/start" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
