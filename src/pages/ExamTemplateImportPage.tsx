import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Upload } from "lucide-react";
import type { DragEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import ImportQuestionEditor from "@/components/Exams/ImportQuestionEditor";
import type { ExamType } from "@/interfaces/ExamTemplate";
import {
  changeImportExamType, createImportDraft, IMPORT_EXAM_TYPES, IMPORT_PROGRAMS,
  mappedImportProgram, removeImportQuestion, validateImportDraft, buildImportSavePayload,
} from "@/utils/examTemplateImportDraft";
import type { ExamTemplateImportDraft, ImportDraftQuestion, ImportSavePayload } from "@/utils/examTemplateImportDraft";
import Auth from "@/utils/auth";
import { previewExamTemplateImport, saveExamTemplateImport } from "@/api/examTemplatesAPI";
import { clearImportSave, importSaveError, importSaveOwner, readImportSave, writeImportSave } from "@/utils/examTemplateImportSave";
import type { PendingImportSave } from "@/utils/examTemplateImportSave";
import type { ExamTemplateImportPreview, ImportDiagnostic } from "@/interfaces/ExamTemplateImport";
import {
  formatImportDiagnostic, importFailureMessage,
  isImportPreview, validateExamDocument, visibleImportDiagnostics,
} from "@/utils/examTemplateImport";
import "./ExamTemplateImportPage.css";

const PAGE_SIZE = 15;

function ImportPanel({ children }: { children: React.ReactNode }) {
  return <div className="exam-import-panel"><Panel>{children}</Panel></div>;
}

function ImportDiagnostics({ errors, warnings, label }: {
  errors: ImportDiagnostic[]; warnings: ImportDiagnostic[]; label: string;
}) {
  const visibleErrors = visibleImportDiagnostics(errors);
  const visibleWarnings = visibleImportDiagnostics(warnings);
  return <>
    {visibleErrors.length > 0 && <section className="exam-import-diagnostics exam-import-parser-errors" aria-label={`${label} original parser errors`}>
      <strong>{label} · Original parser errors ({visibleErrors.length})</strong>
      <ul>{visibleErrors.map((item, index) => <li key={index}>{formatImportDiagnostic(item)}</li>)}</ul>
    </section>}
    {visibleWarnings.length > 0 && <section className="exam-import-diagnostics exam-import-warnings" aria-label={`${label} warnings`}>
      <strong>{label} · Original parser warnings — informational ({visibleWarnings.length})</strong>
      <ul>{visibleWarnings.map((item, index) => <li key={index}>{formatImportDiagnostic(item)}</li>)}</ul>
    </section>}
  </>;
}

export default function ExamTemplateImportPage() {
  const [file, setFile] = useState<File | null>(null);
  // Keep the entire response, without normalizing option keys, answers or order.
  const [preview, setPreview] = useState<ExamTemplateImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [accessDenied, setAccessDenied] = useState(false);
  const request = useRef<AbortController | null>(null);
  const [draft, setDraft] = useState<ExamTemplateImportDraft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [recovery] = useState(() => {
    try { return { attempt: Auth.isSuperAdmin() ? readImportSave(window.sessionStorage) : null, error: "" }; }
    catch { return { attempt: null, error: "Pending-save recovery is unavailable. Enable session storage and reload before saving; do not start another import if a previous save may be unresolved." }; }
  });
  const [pendingSave, setPendingSave] = useState<PendingImportSave | null>(recovery.attempt);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const pendingSaveRef = useRef(pendingSave);
  const savingRef = useRef(false);
  const savedRef = useRef(false);
  const mountedRef = useRef(true);
  const navigate = useNavigate();
  let owner = "";
  try { if (Auth.isSuperAdmin()) owner = importSaveOwner(Auth.getProfile()); } catch { /* Saving stays disabled until authentication is readable. */ }

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; request.current?.abort(); };
  }, []);
  useEffect(() => {
    if (!dirty && !pendingSave) return;
    const warn = (event: BeforeUnloadEvent) => { if (!savedRef.current) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, pendingSave]);

  function confirmDiscard() {
    if (savedRef.current) return true;
    if (savingRef.current) return false;
    if (pendingSaveRef.current) return window.confirm("This save may already have created a template. The original request will remain available for recovery in this tab. Leave this page?");
    return !dirty || window.confirm("Discard your unsaved review edits? No changes have been saved.");
  }

  function acceptPreview(data: ExamTemplateImportPreview) {
    setPreview(data);
    setDraft(createImportDraft(data, crypto.randomUUID()));
    setDirty(false);
  }

  function editDraft(update: (current: ExamTemplateImportDraft) => ExamTemplateImportDraft) {
    if (savingRef.current || savedRef.current) return;
    setDraft(current => current ? update(current) : current);
    setDirty(true);
  }

  function editQuestion(updated: ImportDraftQuestion) {
    editDraft(current => ({ ...current, questions: current.questions.map(question => question.localId === updated.localId ? updated : question) }));
  }

  function removeQuestion(localId: string) {
    if (savingRef.current || savedRef.current) return;
    if (!draft || !window.confirm("Remove this question from the draft? The original preview will be retained.")) return;
    const next = removeImportQuestion(draft, localId);
    editDraft(() => next);
    setPage(current => Math.min(current, Math.max(0, Math.ceil(next.questions.length / PAGE_SIZE) - 1)));
  }

  const [dragActive, setDragActive] = useState(false);

  function dragDocument(event: DragEvent<HTMLDivElement>) {
    if (!Array.from(event.dataTransfer.types).includes("Files")) return;
    event.preventDefault();
    const items = Array.from(event.dataTransfer.items);
    const valid = !savingRef.current && !pendingSaveRef.current && !savedRef.current
      && items.length === 1 && items[0].kind === "file"
      && (!items[0].type || items[0].type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    event.dataTransfer.dropEffect = valid ? "copy" : "none";
    setDragActive(valid);
  }

  function dropDocument(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    if (savingRef.current || pendingSaveRef.current || savedRef.current) {
      setError("Document replacement is unavailable while a save is in progress or unresolved.");
      return;
    }
    const files = Array.from(event.dataTransfer.files);
    if (files.length !== 1) {
      setError("Drop exactly one .docx document at a time.");
      return;
    }
    selectDocument(files[0]);
  }

  function selectDocument(selected: File | undefined) {
    if (savingRef.current || pendingSaveRef.current || savedRef.current) return;
    if (!selected) return;
    const validationError = validateExamDocument(selected);
    if (validationError) { setError(validationError); return; }
    if (!confirmDiscard()) return;
    request.current?.abort();
    request.current = null;
    setLoading(false);
    setPreview(null);
    setDraft(null);
    setDirty(false);
    setPage(0);
    setFile(selected);
    setError(validateExamDocument(selected));
  }

  async function loadPreview() {
    if (savingRef.current || pendingSaveRef.current || savedRef.current) return;
    if (!file || loading || request.current || accessDenied || !Auth.isSuperAdmin()) return;
    const validationError = validateExamDocument(file);
    if (validationError) { setError(validationError); return; }
    if (!confirmDiscard()) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError(null);
    setPreview(null);
    setDraft(null);
    setDirty(false);
    setPage(0);
    try {
      const data = await previewExamTemplateImport(file, controller.signal);
      if (!controller.signal.aborted && Auth.isSuperAdmin()) acceptPreview(data);
    } catch (failure) {
      if (controller.signal.aborted) return;
      if (axios.isAxiosError(failure)) {
        const status = failure.response?.status;
        if (status === 401 || status === 403) {
          setAccessDenied(true);
          setPreview(null);
          setDraft(null);
        }
        // Some validation failures may return the same full preview contract.
        if ((status === 400 || status === 422) && isImportPreview(failure.response?.data)) {
          acceptPreview(failure.response.data);
        }
        setError(importFailureMessage(status));
      } else {
        setError(failure instanceof Error ? failure.message : importFailureMessage());
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        setLoading(false);
      }
    }
  }

  function clearPendingSave() {
    clearImportSave(window.sessionStorage);
    pendingSaveRef.current = null;
    setPendingSave(null);
  }

  async function submitSave(retry = false) {
    if (savingRef.current || savedRef.current || !Auth.isSuperAdmin() || !owner || recovery.error) return;
    if (pendingSaveRef.current && (!retry || pendingSaveRef.current.owner !== owner)) return;
    let attempt = pendingSaveRef.current;
    if (!attempt) {
      if (retry || !draft || !validateImportDraft(draft).valid) {
        setSaveError("Correct the current draft errors before saving. Use the question links to review every affected question.");
        return;
      }
      try {
        attempt = { owner, body: JSON.stringify(buildImportSavePayload({ ...draft, idempotency_key: crypto.randomUUID() })) };
        // Persist BEFORE sending: a lost response or reload must never cause a new key.
        writeImportSave(window.sessionStorage, attempt);
        pendingSaveRef.current = attempt;
        setPendingSave(attempt);
      } catch {
        setSaveError("The request could not be prepared for safe retry. No save was sent. Check browser session storage and try again.");
        return;
      }
    }
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const result = await saveExamTemplateImport(attempt.body);
      if (!mountedRef.current || !Auth.isSuperAdmin() || importSaveOwner(Auth.getProfile()) !== attempt.owner) return;
      clearPendingSave();
      savedRef.current = true;
      setDirty(false);
      navigate(`/exams/templates/${result.template.id}`, {
        replace: true, state: { successMessage: result.replayed ? "Exam template import confirmed successfully." : "Exam template imported successfully." },
      });
    } catch (failure) {
      const status = axios.isAxiosError(failure) ? failure.response?.status : undefined;
      const rejected = status !== undefined && [400, 413, 401, 403, 422].includes(status);
      // Rejecting a retry does not prove that the earlier, uncertain request failed.
      if (rejected && !retry) {
        try { clearPendingSave(); }
        catch { setSaveError("The server rejected the request, but recovery state could not be cleared. Retry the original request or restore session storage before resolving it."); return; }
      }
      const message = importSaveError(status, axios.isAxiosError(failure) ? failure.response?.data : undefined);
      setSaveError(rejected && retry ? `The retry was rejected; the original save is still unresolved. ${message}` : message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function resolvePendingSave() {
    if (savingRef.current || !pendingSaveRef.current || pendingSaveRef.current.owner !== owner) return;
    if (!window.confirm("Only resolve after checking existing templates or confirming the outcome with an administrator. If the original save succeeded, saving this draft again can create a duplicate. Have you verified the outcome and want to release this pending attempt?")) return;
    try { clearPendingSave(); setSaveError(null); }
    catch { setSaveError("Recovery state could not be cleared. Restore session storage before starting another save."); }
  }

  // Defense in depth: never render answer keys if local super-admin access is lost.
  if (!Auth.isSuperAdmin()) return <Navigate to="/exams" replace />;

  const validation = draft ? validateImportDraft(draft) : null;
  const pages = draft ? Math.ceil(draft.questions.length / PAGE_SIZE) : 0;
  const questions = draft?.questions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) ?? [];
  const pendingPayload = pendingSave?.owner === owner ? JSON.parse(pendingSave.body) as ImportSavePayload : null;

  return <PageContainer>
    <div className="exam-import">
      <Link className="exam-import-back" to="/exams/templates" onClick={event => { if (!confirmDiscard()) event.preventDefault(); }}>← Back to Exam Templates</Link>
      <PageHeader title="Import Exam Template" subtitle="Upload a Word exam and review the extracted questions and answers." />
      <ImportPanel>
        <section className="exam-import-upload" aria-labelledby="exam-document-heading" aria-busy={loading}>
          <span className="exam-import-eyebrow">Word document</span>
          <h2 id="exam-document-heading">Upload your exam</h2>
          <p>One .docx file, up to 10 MiB. Review the extracted content, then choose Save Template.</p>
          <div className={`exam-import-dropzone${dragActive ? " is-dragging" : ""}`}
            onDragEnter={dragDocument} onDragOver={dragDocument}
            onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragActive(false); }}
            onDrop={dropDocument} aria-disabled={saving || !!pendingSave}>
          <Upload className="exam-import-upload-icon" size={36} aria-hidden="true" />
          <p className="exam-import-drop-instruction">Drag and drop your Word document here.</p>
          <p className="exam-import-help">One .docx document · Maximum 10 MiB</p>
          <label className="exam-import-file-label" htmlFor="exam-document">Word exam document</label>
          <input id="exam-document" type="file" disabled={saving || !!pendingSave} accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={event => {
              selectDocument(event.target.files?.[0]);
              event.target.value = "";
            }} aria-describedby="exam-document-help" />
          <p id="exam-document-help" className="exam-import-help">Use the file picker again to replace your document. You’ll be asked before any review edits are discarded.</p>
          </div>
          {file && <div className="exam-import-file" aria-live="polite">
            <strong>{file.name}</strong>
            <span>{(file.size / (1024 * 1024)).toFixed(2)} MiB ({file.size.toLocaleString()} bytes)</span>
          </div>}
          <Button onClick={loadPreview} disabled={!file || loading || saving || !!pendingSave || accessDenied || !!(file && validateExamDocument(file))}>
            {loading ? "Generating preview…" : "Preview document"}
          </Button>
          {loading && <p role="status">Extracting questions and answers. Large exams may take a moment.</p>}
          {error && <div className="exam-import-diagnostics exam-import-errors" role="alert">{error}</div>}
          {accessDenied && <Link to="/login">Sign in with a super-admin account</Link>}
        </section>
      </ImportPanel>

      {(saveError || recovery.error || pendingSave) && <div className="exam-import-preview"><ImportPanel>
        {(saveError || recovery.error) && <p role="alert" className="exam-import-diagnostics exam-import-errors">{saveError || recovery.error}</p>}
        {pendingSave && <section aria-label="Pending template save">
          <h2>Resolve the pending save</h2>
          {pendingSave.owner === owner ? <>
            {pendingPayload && <p><strong>{pendingPayload.title}</strong> · {pendingPayload.questions.length} questions in the original save request.</p>}
            <p>The original request and key are retained in this tab. Retry Save sends that exact request, even if you have edited the draft. Changes cannot be saved until this attempt is resolved.</p>
            <Button disabled={saving} onClick={() => submitSave(true)}>{saving ? "Saving…" : "Retry Save"}</Button>{" "}
            <Link to="/exams/templates" target="_blank" rel="noopener noreferrer">Check existing templates</Link>{" "}
            <Button variant="secondary" disabled={saving} onClick={resolvePendingSave}>I verified the outcome — resolve attempt</Button>
          </> : <p>Sign in as the super admin who submitted this request to recover or resolve it. A new import is blocked to prevent a duplicate.</p>}
        </section>}
      </ImportPanel></div>}

      {preview && draft && validation && !accessDenied && <div className="exam-import-preview">
        <ImportPanel>
          <header className="exam-import-summary" aria-live="polite">
            <div><span className="exam-import-eyebrow">Extracted template</span>
              <h2>{draft.title || "Untitled template"}</h2>
              <p>{draft.questions.length} questions · {dirty ? "Unsaved review edits" : "Review draft"}</p>
            </div>
            <span className={`exam-import-status ${validation.valid ? "exam-import-ready" : "exam-import-errors"}`}>
              {validation.valid ? "Draft passes validation" : "Draft needs corrections"}
            </span>
          </header>
          <p className="exam-import-help">Review the template details and questions below. Current validation updates as you edit; original parser diagnostics remain available for reference.</p>
          <div className="exam-import-savebar" role="region" aria-label="Save reviewed template">
            <div><strong>Review and save</strong><span>{pendingSave ? "Resolve the pending save before saving changes." : validation.valid ? "All questions pass validation. Your template is ready to save." : "Complete the required fields and correct the flagged questions."}</span></div>
            <Button style={{ backgroundColor: "#508432" }} disabled={!validation.valid || saving || !!pendingSave || !!recovery.error || !owner} onClick={() => submitSave()}>{saving ? "Saving…" : "Save Template"}</Button>
          </div>
          <fieldset className="exam-import-review-fields" disabled={saving}>
          <div className="exam-import-form exam-import-metadata">
            <label>Template Title (required)<input required value={draft.title} onChange={event => editDraft(current => ({ ...current, title: event.target.value }))} /></label>
            <label className="exam-import-description">Description<textarea value={draft.description} onChange={event => editDraft(current => ({ ...current, description: event.target.value }))} /></label>
            <label>Program<select value={draft.program} disabled={!!mappedImportProgram(draft.exam_type)} onChange={event => editDraft(current => ({ ...current, program: event.target.value }))}>
              {IMPORT_PROGRAMS.map(program => <option key={program} value={program}>{program}</option>)}
            </select></label>
            <label>Exam Type (required)<select required value={draft.exam_type} onChange={event => editDraft(current => changeImportExamType(current, event.target.value as ExamType | ""))}>
              <option value="">Select an exam type</option>
              {IMPORT_EXAM_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select></label>
          </div>
          {validation.metadata.length > 0 && <section className="exam-import-diagnostics exam-import-errors" aria-label="Draft metadata validation"><strong>Current draft errors</strong><ul>{validation.metadata.map(message => <li key={message}>{message}</li>)}</ul></section>}
          <p role="status">{Object.values(validation.questions).filter(errors => errors.length > 0).length} questions need corrections.</p>
          {!validation.valid && <nav aria-label="Questions needing corrections"><ul>{draft.questions.filter(question => validation.questions[question.localId].length > 0).map(question => <li key={question.localId}>
            <a href={`#${question.localId}`} onClick={() => { setPage(Math.floor((question.order - 1) / PAGE_SIZE)); window.setTimeout(() => {
              const card = document.getElementById(question.localId) as HTMLDetailsElement | null;
              if (card) { card.open = true; card.scrollIntoView({ block: "center" }); card.querySelector("textarea")?.focus(); }
            }, 0); }}>Question {question.order}: {validation.questions[question.localId].join(" ")}</a>
          </li>)}</ul></nav>}
          {!preview.valid && <p>The original document was marked invalid by the parser. Correct the draft using the current validation messages; the original parser status is retained for reference.</p>}
          <ImportDiagnostics label="Document" errors={preview.errors} warnings={preview.warnings} />
          <h3>Review questions</h3>
          <p className="exam-import-help">Expand a question to edit its choices and correct answers. Your edits are kept when changing pages.</p>
          {draft.questions.length === 0 && <p>No questions remain in this draft. Replace the document and try again.</p>}
          {questions.map(question => <details id={question.localId} className="exam-import-question" key={question.localId}>
            <summary>
              <span className="exam-import-question-heading">Question {question.order} · {question.question_type}</span>
              <span className="exam-import-question-snippet">{question.question_text || "(Empty question text)"}</span>
              <span className="exam-import-question-flags">
                {validation.questions[question.localId].length > 0 ? <span className="exam-import-error-text">{validation.questions[question.localId].length} current draft errors</span> : <span className="exam-import-valid-text">Valid draft question</span>}
                {visibleImportDiagnostics(preview.questions[question.sourceIndex].warnings).length > 0 && <span className="exam-import-warning-text">{visibleImportDiagnostics(preview.questions[question.sourceIndex].warnings).length} original parser warnings</span>}
              </span>
            </summary>
            <div className="exam-import-question-body">
              {preview.questions[question.sourceIndex].source && <p className="exam-import-source">Original source: table {preview.questions[question.sourceIndex].source.table}, row {preview.questions[question.sourceIndex].source.row}</p>}
              <ImportQuestionEditor question={question} onChange={editQuestion} />
              {validation.questions[question.localId].length > 0 && <section className="exam-import-diagnostics exam-import-errors" aria-label={`Question ${question.order} draft validation`}><strong>Current question errors</strong><ul>{validation.questions[question.localId].map(message => <li key={message}>{message}</li>)}</ul></section>}
              <ImportDiagnostics label="Question" errors={preview.questions[question.sourceIndex].errors} warnings={preview.questions[question.sourceIndex].warnings} />
              <Button variant="danger" onClick={() => removeQuestion(question.localId)}>Remove question {question.order}</Button>
            </div>
          </details>)}
          {pages > 1 && <nav className="exam-import-pagination" aria-label="Question preview pages">
            <Button variant="secondary" disabled={page === 0} onClick={() => setPage(current => current - 1)}>Previous</Button>
            <span role="status">Page {page + 1} of {pages} · Questions {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, draft.questions.length)} of {draft.questions.length}</span>
            <Button variant="secondary" disabled={page + 1 >= pages} onClick={() => setPage(current => current + 1)}>Next</Button>
          </nav>}
          </fieldset>
        </ImportPanel>
      </div>}
    </div>
  </PageContainer>;
}
