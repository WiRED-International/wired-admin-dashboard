import type { ImportDraftQuestion } from "@/utils/examTemplateImportDraft";
import { IMPORT_QUESTION_TYPES, renameImportOption, selectImportAnswer } from "@/utils/examTemplateImportDraft";

// Controlled, persistence-free form. The parent owns the full draft across pagination.
export default function ImportQuestionEditor({ question, onChange }: {
  question: ImportDraftQuestion; onChange: (question: ImportDraftQuestion) => void;
}) {
  return <div className="exam-import-form">
    <div className="exam-import-question-fields">
    <label>Question text
      <textarea rows={3} value={question.question_text} onChange={event => onChange({ ...question, question_text: event.target.value })} />
    </label>
    <div>
    <label>Question type
      <select value={question.question_type} onChange={event => onChange({ ...question, question_type: event.target.value })}>
        {!IMPORT_QUESTION_TYPES.some(type => type === question.question_type) && <option value={question.question_type}>Unsupported: {question.question_type || "(empty)"}</option>}
        <option value="single">Single Choice</option>
        <option value="multiple">Multiple Choice</option>
        <option value="true_false">True / False</option>
      </select>
    </label>
    <p className="exam-import-help">{question.question_type === "multiple" ? "Select at least two correct answers." : "Select one correct answer."} Type changes keep all choices and answers; check choice text when converting to true/false.</p>
    </div>
    </div>
    <fieldset className="exam-import-choices">
      <legend>Answer choices and correct answers</legend>
      <div className="exam-import-choice-head" aria-hidden="true"><span>Choice</span><span>Answer text</span><span>Correct</span><span /></div>
      {question.options.map(option => <div className={`exam-import-option-editor${question.correct_answers.includes(option.id) ? " is-correct" : ""}`} key={option.localId}>
        <label className="exam-import-choice-id"><span className="exam-import-sr-only">Choice ID</span>
          <input value={option.id} onChange={event => onChange(renameImportOption(question, option.localId, event.target.value))} />
        </label>
        <label className="exam-import-choice-text"><span className="exam-import-sr-only">Choice text</span>
          <input value={option.text} onChange={event => onChange({ ...question,
            options: question.options.map(item => item.localId === option.localId ? { ...item, text: event.target.value } : item),
          })} />
        </label>
        <label className="exam-import-answer-toggle">
          <input type={question.question_type === "multiple" ? "checkbox" : "radio"}
            name={`correct-${question.localId}`} checked={question.correct_answers.includes(option.id)}
            aria-label={`Correct answer for choice ${option.id || "without ID"}`}
            onChange={event => onChange(selectImportAnswer(question, option.id, event.target.checked))} /><span className="exam-import-sr-only">Correct answer</span>
        </label>
        <button className="exam-import-remove-choice" type="button" aria-label={`Remove choice ${option.id || "without ID"}`} onClick={() => onChange({ ...question,
          options: question.options.filter(item => item.localId !== option.localId),
          correct_answers: question.correct_answers.filter(answer => answer !== option.id),
        })}>Remove choice</button>
      </div>)}
      <button type="button" onClick={() => {
        let number = question.options.length + 1;
        while (question.options.some(option => option.id === `option_${number}`)) number++;
        onChange({ ...question, options: [...question.options, { localId: crypto.randomUUID(), id: `option_${number}`, text: "" }] });
      }}>Add answer choice</button>
    </fieldset>
    <div className="exam-import-answer-footer">
    <p>Selected answer IDs: {question.correct_answers.length ? question.correct_answers.join(", ") : "None"}</p>
    <button type="button" onClick={() => onChange({ ...question, correct_answers: [] })}>Clear answer selection</button>
    </div>
  </div>;
}
