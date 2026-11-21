import axios from "axios";
import Auth from "@/utils/auth";
import { apiPrefix } from "@/utils/globalVariables";
import type { ExamTemplateImportPreview } from "@/interfaces/ExamTemplateImport";
import { isImportPreview } from "@/utils/examTemplateImport";
import type { ImportSavePayload } from "@/utils/examTemplateImportDraft";
import {
  ExamTemplate,
  ExamTemplateQuestion,
  ExamType,
} from "@/interfaces/ExamTemplate";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${Auth.getToken()}`,
});

export interface ImportSaveResult {
  template: { id: number; title: string; description: string | null; program: string; exam_type: ExamType };
  question_count: number;
  replayed: boolean;
}

// The serialized body is frozen before the first submission and reused verbatim on retry.
export async function saveExamTemplateImport(body: string): Promise<ImportSaveResult> {
  const payload = JSON.parse(body) as ImportSavePayload;
  const response = await axios.post(
    `${apiPrefix.replace(/\/$/, "")}/api/admin/exams/templates/import/save`,
    body,
    { headers: { ...getAuthHeaders(), "Content-Type": "application/json" }, timeout: 60000 }
  );
  const data = response.data as ImportSaveResult;
  if (![200, 201].includes(response.status) || !data || !data.template
    || !Number.isSafeInteger(data.template.id) || data.template.id <= 0
    || typeof data.template.title !== "string"
    || !(data.template.description === null || typeof data.template.description === "string")
    || typeof data.template.program !== "string"
    || !["general", "basic_qualifying", "act_final", "specialization_final"].includes(data.template.exam_type)
    || data.question_count !== payload.questions.length || typeof data.replayed !== "boolean") {
    throw new Error("The server returned an unconfirmed save response.");
  }
  return data;
}

export async function previewExamTemplateImport(
  file: File,
  signal?: AbortSignal
): Promise<ExamTemplateImportPreview> {
  const form = new FormData();
  form.append("file", file);
  const response = await axios.post(
    `${apiPrefix.replace(/\/$/, "")}/api/admin/exams/templates/import/preview`,
    form,
    { headers: getAuthHeaders(), signal }
  );
  if (!isImportPreview(response.data)) {
    throw new Error("The server returned an unexpected preview response. Please try again.");
  }
  return response.data;
}

export async function getExamTemplates(): Promise<ExamTemplate[]> {
  const response = await axios.get(
    `${apiPrefix}/api/admin/exams/templates`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
}

export async function getExamTemplate(
  templateId: number
): Promise<ExamTemplate> {
  const response = await axios.get(
    `${apiPrefix}/api/admin/exams/templates/${templateId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
}

export async function getExamTemplateQuestions(
  templateId: number,
  includeAnswers: boolean = true
) {
  const response = await axios.get(
    `${apiPrefix}/api/admin/exams/templates/${templateId}/questions`,
    {
      headers: getAuthHeaders(),
      params: {
        includeAnswers,
      },
    }
  );

  return response.data;
}

export async function createExamTemplate(data: {
  title: string;
  description?: string;
  program?: string;
  exam_type?: ExamType | null;
}) {
  const response = await axios.post(
    `${apiPrefix}/api/admin/exams/templates`,
    data,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
}

export async function updateExamTemplate(
  templateId: number,
  data: {
    title: string;
    description: string;
    program: string;
    exam_type?: ExamType | null;
  }
) {

  const response =
    await axios.put(
      `${apiPrefix}/api/admin/exams/templates/${templateId}`,
      data,
      {
        headers: {
          Authorization:
            `Bearer ${Auth.getToken()}`
        }
      }
    );

  return response.data;
}

export async function getExamTemplateQuestion(
  templateId: number,
  questionId: number
): Promise<ExamTemplateQuestion> {

  const response = await axios.get(
    `${apiPrefix}/api/admin/exams/templates/${templateId}/questions/${questionId}`,
    {
      headers: {
        Authorization:
          `Bearer ${Auth.getToken()}`
      }
    }
  );

  return response.data;
}

export async function updateExamTemplateQuestion(
  templateId: number,
  questionId: number,
  data: {
    question_text: string;
    options: Record<string, string>;
    correct_answers: string[];
    question_type: string;
  }
): Promise<ExamTemplateQuestion> {

  const response = await axios.put(
    `${apiPrefix}/api/admin/exams/templates/${templateId}/questions/${questionId}`,
    data,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data.question;
}

export async function createExamTemplateQuestion(
  templateId: number,
  data: {
    question_type: string;
    question_text: string;
    options: Record<string, string>;
    correct_answers: string[];
  }
): Promise<ExamTemplateQuestion> {

  const response = await axios.post(
    `${apiPrefix}/api/admin/exams/templates/${templateId}/question`,
    data,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data.question;
}

export async function deleteExamTemplateQuestion(
  templateId: number,
  questionId: number
): Promise<void> {

  await axios.delete(
    `${apiPrefix}/api/admin/exams/templates/${templateId}/questions/${questionId}`,
    {
      headers: getAuthHeaders(),
    }
  );

}

export async function deleteExamTemplate(
  templateId: number
) {
  const response = await axios.delete(
    `${apiPrefix}/api/admin/exams/templates/${templateId}`,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
}
