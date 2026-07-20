import axios from "axios";
import Auth from "@/utils/auth";
import { apiPrefix } from "@/utils/globalVariables";
import { ExamTemplate, ExamTemplateQuestion } from "@/interfaces/ExamTemplate";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${Auth.getToken()}`,
});

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