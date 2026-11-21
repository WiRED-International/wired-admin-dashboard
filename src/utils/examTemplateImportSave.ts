import type { ImportSavePayload } from "@/utils/examTemplateImportDraft";
import { createImportDraft, validateImportDraft } from "@/utils/examTemplateImportDraft";
import { isImportPreview } from "@/utils/examTemplateImport";

export const IMPORT_SAVE_STORAGE_KEY = "wired.exam-template-import.pending-save.v1";
export interface PendingImportSave { owner: string; body: string }
type SaveStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

// Bind recovery to the account claims, not the expiring bearer token. No token is stored.
export function importSaveOwner(profile: object): string {
  return JSON.stringify(Object.fromEntries(Object.entries(profile)
    .filter(([key]) => !["exp", "iat", "nbf", "jti"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))));
}

export function readImportSave(storage: SaveStorage): PendingImportSave | null {
  const raw = storage.getItem(IMPORT_SAVE_STORAGE_KEY);
  if (!raw) return null;
  const attempt = JSON.parse(raw) as PendingImportSave;
  if (!attempt || typeof attempt.owner !== "string" || typeof attempt.body !== "string") throw new Error("Invalid pending save record.");
  const payload = JSON.parse(attempt.body) as ImportSavePayload;
  const exactKeys = (value: object, keys: string[]) => Object.keys(value).sort().join() === keys.sort().join();
  if (!payload || typeof payload.title !== "string" || typeof payload.description !== "string"
    || typeof payload.idempotency_key !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.idempotency_key)
    || !exactKeys(payload, ["title", "description", "program", "exam_type", "idempotency_key", "questions"])
    || !Array.isArray(payload.questions) || payload.questions.some(question => !question || !exactKeys(question, ["question_text", "question_type", "options", "correct_answers"]))) {
    throw new Error("Invalid pending save payload.");
  }
  const preview = { title: payload.title, valid: true, errors: [], warnings: [], questions: payload.questions.map((question, index) => ({ ...question, order: index + 1, errors: [], warnings: [] })) };
  if (!isImportPreview(preview) || !validateImportDraft({ ...createImportDraft(preview, payload.idempotency_key), program: payload.program, exam_type: payload.exam_type }).valid) {
    throw new Error("Invalid pending save content.");
  }
  return attempt;
}

export function writeImportSave(storage: SaveStorage, attempt: PendingImportSave) {
  storage.setItem(IMPORT_SAVE_STORAGE_KEY, JSON.stringify(attempt));
}

export function clearImportSave(storage: SaveStorage) {
  storage.removeItem(IMPORT_SAVE_STORAGE_KEY);
}

export function importSaveError(status?: number, data?: unknown): string {
  let message: string;
  switch (status) {
    case 400:
    case 422: message = "The server rejected this draft. Correct the validation errors and save again."; break;
    case 413: message = "The save request is too large. Reduce its size before saving again."; break;
    case 401: message = "Your session has expired. Sign in again to save. Your draft has been retained."; break;
    case 403: message = "Super-admin authorization is required to save. Your draft has been retained."; break;
    case 409: message = "Idempotency-key conflict. The original request and key have been retained. Check existing templates and explicitly resolve this attempt before starting a changed import."; break;
    default: message = "The save outcome is uncertain. Retry Save sends the original request with the same key. Resolve this attempt before saving changes or replacing the document.";
  }
  if (data && typeof data === "object") {
    const details = data as { message?: unknown; error?: unknown; errors?: unknown };
    const text = [details.message, details.error, details.errors]
      .filter(value => value !== undefined)
      .map(value => typeof value === "string" ? value : JSON.stringify(value)).join(" · ");
    if (text) message += ` Server details: ${text}`;
  }
  return message;
}
