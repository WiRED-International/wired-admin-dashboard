import type { ExamType } from "@/interfaces/ExamTemplate";
import type { ExamTemplateImportPreview } from "@/interfaces/ExamTemplateImport";

export const IMPORT_PROGRAMS = ["Basic Training", "ACT", "Specialization"] as const;
export const IMPORT_EXAM_TYPES: { value: ExamType; label: string }[] = [
  { value: "general", label: "General / Other" },
  { value: "basic_qualifying", label: "Basic Qualifying Exam" },
  { value: "act_final", label: "ACT Final Exam" },
  { value: "specialization_final", label: "Specialization Final Exam" },
];
export const IMPORT_QUESTION_TYPES = ["single", "multiple", "true_false"] as const;
const PROGRAM_BY_TYPE: Partial<Record<ExamType, string>> = {
  basic_qualifying: "Basic Training", act_final: "ACT", specialization_final: "Specialization",
};

export interface ImportDraftOption { localId: string; id: string; text: string }
export interface ImportDraftQuestion {
  localId: string;
  sourceIndex: number;
  order: number;
  question_text: string;
  question_type: string;
  options: ImportDraftOption[];
  correct_answers: string[];
}
export interface ExamTemplateImportDraft {
  title: string;
  description: string;
  program: string;
  exam_type: ExamType | "";
  idempotency_key: string;
  questions: ImportDraftQuestion[];
}

export function mappedImportProgram(type: ExamType | ""): string | undefined {
  return type ? PROGRAM_BY_TYPE[type] : undefined;
}

export function createImportDraft(preview: ExamTemplateImportPreview, idempotencyKey: string): ExamTemplateImportDraft {
  return {
    title: preview.title, description: "", program: "Basic Training", exam_type: "",
    idempotency_key: idempotencyKey,
    questions: preview.questions.map((question, index) => ({
      localId: `${idempotencyKey}-question-${index}`, sourceIndex: index, order: index + 1,
      question_text: question.question_text, question_type: question.question_type,
      options: Object.entries(question.options).map(([id, text], optionIndex) => ({
        localId: `${idempotencyKey}-question-${index}-option-${optionIndex}`, id, text,
      })),
      correct_answers: [...question.correct_answers],
    })),
  };
}

export function changeImportExamType(draft: ExamTemplateImportDraft, type: ExamType | ""): ExamTemplateImportDraft {
  return { ...draft, exam_type: type, program: mappedImportProgram(type) ?? draft.program };
}

export function removeImportQuestion(draft: ExamTemplateImportDraft, localId: string): ExamTemplateImportDraft {
  return { ...draft, questions: draft.questions.filter(question => question.localId !== localId)
    .map((question, index) => ({ ...question, order: index + 1 })) };
}

export function selectImportAnswer(question: ImportDraftQuestion, id: string, checked: boolean): ImportDraftQuestion {
  const answers = question.question_type === "multiple"
    ? checked ? [...new Set([...question.correct_answers, id])] : question.correct_answers.filter(answer => answer !== id)
    : [id];
  return { ...question, correct_answers: answers };
}

export function renameImportOption(question: ImportDraftQuestion, localId: string, id: string): ImportDraftQuestion {
  const option = question.options.find(item => item.localId === localId);
  if (!option) return question;
  // Duplicate/empty IDs remain visible and invalid until corrected; do not overwrite a choice.
  return { ...question,
    options: question.options.map(item => item.localId === localId ? { ...item, id } : item),
    correct_answers: question.correct_answers.map(answer => answer === option.id ? id : answer),
  };
}

export function validateImportQuestion(question: ImportDraftQuestion): string[] {
  const errors: string[] = [];
  if (!question.question_text.trim()) errors.push("Enter question text.");
  if (!IMPORT_QUESTION_TYPES.some(type => type === question.question_type)) errors.push("Choose a supported question type.");
  if (question.options.length === 0) errors.push("Add at least one answer choice.");
  const ids = question.options.map(option => option.id);
  if (ids.some(id => !id.trim())) errors.push("Give every answer choice a nonempty ID.");
  if (new Set(ids).size !== ids.length) errors.push("Answer choice IDs must be unique.");
  question.options.forEach((option, index) => {
    if (!option.text.trim()) errors.push(`Enter text for choice ${option.id || index + 1}.`);
  });
  if (new Set(question.correct_answers).size !== question.correct_answers.length) errors.push("Select each correct answer only once.");
  if (question.correct_answers.some(answer => !ids.includes(answer))) errors.push("Remove correct-answer IDs that do not match an existing choice, or restore those choices.");
  if ((question.question_type === "single" || question.question_type === "true_false") && question.correct_answers.length !== 1) {
    errors.push("Select exactly one correct answer.");
  }
  if (question.question_type === "multiple" && question.correct_answers.length < 2) errors.push("Select at least two correct answers for a multiple-answer question.");
  return errors;
}

export function validateImportDraft(draft: ExamTemplateImportDraft) {
  const metadata: string[] = [];
  if (!draft.title.trim()) metadata.push("Enter a template title.");
  if (!IMPORT_EXAM_TYPES.some(type => type.value === draft.exam_type)) metadata.push("Choose an exam type.");
  if (!IMPORT_PROGRAMS.some(program => program === draft.program)) metadata.push("Choose a supported program.");
  const mapped = mappedImportProgram(draft.exam_type);
  if (mapped && mapped !== draft.program) metadata.push(`This exam type requires the ${mapped} program.`);
  if (draft.questions.length === 0) metadata.push("Include at least one question. Replace the document if all questions have been removed.");
  const questions = Object.fromEntries(draft.questions.map(question => [question.localId, validateImportQuestion(question)]));
  return { metadata, questions, valid: metadata.length === 0 && Object.values(questions).every(errors => errors.length === 0) };
}

// Explicit allowlist shared by submission and retry preparation.
export function buildImportSavePayload(draft: ExamTemplateImportDraft) {
  if (!validateImportDraft(draft).valid) throw new Error("Correct the draft validation errors before preparing a save payload.");
  if (!draft.idempotency_key.trim()) throw new Error("An idempotency key is required.");
  return {
    title: draft.title, description: draft.description, program: draft.program,
    exam_type: draft.exam_type as ExamType, idempotency_key: draft.idempotency_key,
    questions: draft.questions.map(question => ({
      question_text: question.question_text, question_type: question.question_type,
      options: Object.fromEntries(question.options.map(option => [option.id, option.text])),
      correct_answers: [...question.correct_answers],
    })),
  };
}

export type ImportSavePayload = ReturnType<typeof buildImportSavePayload>;
