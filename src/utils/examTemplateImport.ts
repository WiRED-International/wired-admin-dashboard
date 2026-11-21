import type { ExamTemplateImportPreview, ImportDiagnostic } from "@/interfaces/ExamTemplateImport";

export const MAX_EXAM_DOCUMENT_BYTES = 10 * 1024 * 1024;

// Display-only filtering: retain the complete parser response and draft unchanged.
export function visibleImportDiagnostics(diagnostics: ImportDiagnostic[]): ImportDiagnostic[] {
  return diagnostics.filter(diagnostic => typeof diagnostic === "string"
    ? !/^EXPLANATION_IGNORED(?:$|\s*:)/.test(diagnostic.trim())
    : diagnostic?.code !== "EXPLANATION_IGNORED");
}

export function validateExamDocument(file: Pick<File, "name" | "size">): string | null {
  if (!file.name.toLowerCase().endsWith(".docx")) {
    return "Choose a Word document with the .docx extension.";
  }
  if (file.size > MAX_EXAM_DOCUMENT_BYTES) {
    return "This document exceeds the 10 MiB limit. Choose a smaller file.";
  }
  if (file.size === 0) return "This document is empty. Choose another file.";
  return null;
}

export function formatImportDiagnostic(diagnostic: ImportDiagnostic): string {
  if (typeof diagnostic === "string") return diagnostic;
  if (!diagnostic || typeof diagnostic !== "object") return String(diagnostic);
  const { code, message, ...details } = diagnostic;
  const label = [code, message].filter(value => value !== undefined)
    .map(value => typeof value === "string" ? value : JSON.stringify(value)).join(": ");
  // Keep source locations and any additional backend details visible as well.
  const extra = Object.keys(details).length > 0 ? JSON.stringify(details) : "";
  return [label, extra].filter(Boolean).join(" · ") || JSON.stringify(diagnostic);
}

export function isImportPreview(value: unknown): value is ExamTemplateImportPreview {
  if (!value || typeof value !== "object") return false;
  const data = value as ExamTemplateImportPreview;
  return typeof data.title === "string" && typeof data.valid === "boolean"
    && Array.isArray(data.errors) && Array.isArray(data.warnings)
    && Array.isArray(data.questions) && data.questions.every(question =>
      question && typeof question.question_text === "string"
      && typeof question.question_type === "string" && typeof question.order === "number"
      && question.options !== null && typeof question.options === "object"
      && !Array.isArray(question.options)
      && Object.values(question.options).every(option => typeof option === "string")
      && Array.isArray(question.correct_answers)
      && question.correct_answers.every(answer => typeof answer === "string")
      && Array.isArray(question.errors) && Array.isArray(question.warnings));
}

export function hasImportErrors(preview: ExamTemplateImportPreview): boolean {
  return !preview.valid || preview.errors.length > 0
    || preview.questions.some(question => question.errors.length > 0);
}

export function importFailureMessage(status?: number): string {
  switch (status) {
    case 401: return "Your session has expired. Sign in again, then retry the preview.";
    case 403: return "You do not have permission to import templates. Super-admin access is required.";
    case 413: return "The server rejected the document as too large. The maximum size is 10 MiB.";
    case 400:
    case 415:
    case 422: return "The document could not be previewed. Check that it is a valid, supported .docx exam and try again.";
    default: return "The preview could not be loaded. Check your connection and try again.";
  }
}
