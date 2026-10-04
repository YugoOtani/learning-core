import { useId, useState, type FormEvent } from 'react';
import type { AwsQuestion } from './AwsQuestion';
import { useAutoResizeTextArea } from './useAutoResizeTextArea';

type AwsQuestionNoteEntryPageProps = {
  readonly question: AwsQuestion;
  readonly initialNote: string;
  readonly onSave: (note: string) => void;
};

export function AwsQuestionNoteEntryPage({ question, initialNote, onSave }: AwsQuestionNoteEntryPageProps) {
  const [note, setNote] = useState(initialNote);
  const noteId = useId();
  const noteRef = useAutoResizeTextArea(note, true);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(note);
  }

  return (
    <main className="page-shell main-content aws-note-entry-page">
      <h1>取り込んだ問題のメモ</h1>
      <p className="aws-intro">問題を確認してメモを入力してください。正解は出題後に確認できます。</p>
      <form className="aws-panel aws-note-entry-form" onSubmit={handleSubmit}>
        <h2>問題文</h2>
        <p className="aws-question-text">{question.question}</p>
        <h2>選択肢</h2>
        <ul className="aws-choices">
          {question.choices.map((choice) => (
            <li className="aws-choice" key={choice.label}>
              <span className="aws-choice-label">{choice.label}</span>
              <span className="aws-choice-text">{choice.text}</span>
            </li>
          ))}
        </ul>
        <label className="aws-note-label" htmlFor={noteId}>メモ</label>
        <textarea
          id={noteId}
          ref={noteRef}
          className="aws-note-input"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <button className="aws-import-button" type="submit">メモを保存して出題開始</button>
      </form>
    </main>
  );
}
