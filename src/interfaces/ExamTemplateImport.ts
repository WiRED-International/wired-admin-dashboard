// Diagnostics may be codes/messages or structured backend details.
export type ImportDiagnostic = string | Record<string, unknown>;

export interface ExamTemplateImportQuestion {
  question_text: string;
  question_type: string;
  options: Record<string, string>;
  correct_answers: string[];
  order: number;
  source: { table: number; row: number };
  errors: ImportDiagnostic[];
  warnings: ImportDiagnostic[];
}

export interface ExamTemplateImportPreview {
  title: string;
  questions: ExamTemplateImportQuestion[];
  errors: ImportDiagnostic[];
  warnings: ImportDiagnostic[];
  valid: boolean;
}
