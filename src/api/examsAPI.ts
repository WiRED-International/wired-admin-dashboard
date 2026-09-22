import axios from "axios";
import Auth from "@/utils/auth";
import { apiPrefix } from "@/utils/globalVariables";
import { UpcomingExam } from "@/interfaces/UpcomingExamInterface";
import { AllExamResultsResponse, ExamResultsQuery } from "@/interfaces/AllExamResultsInterface";
import { ExamTemplate } from "@/interfaces/ExamTemplate";
import { ExamKpiResponse } from "@/interfaces/Exam";
import { ExamListItem } from "@/interfaces/ExamListItemInterface";
import { ExamAnalyticsResponse, QuestionAnalyticsResponse, } from "@/interfaces/Exam";

// -----------------------------------------------------
// Build query string
// -----------------------------------------------------
function buildQueryString(params: ExamResultsQuery): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      query.append(key, String(value));
    }
  });

  return query.toString();
}

// -----------------------------------------------------
// Global Exam Results (requires backend implementation!)
// -----------------------------------------------------
export async function getAllExamResults(
  params: ExamResultsQuery
): Promise<AllExamResultsResponse> {

  const token = Auth.getToken();
  if (!token) throw new Error("Not authenticated.");

  const queryString = buildQueryString(params);

  const url = `${apiPrefix}api/admin/exams/results${queryString ? `?${queryString}` : ""}`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data as AllExamResultsResponse;
}

// -----------------------------------------------------
// Upcoming Exams
// -----------------------------------------------------
export async function getUpcomingExams(): Promise<UpcomingExam[]> {
  const token = Auth.getToken();
  const res = await axios.get(`${apiPrefix}api/admin/exams/upcoming`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return res.data;
}

// -----------------------------------------------------
// Results for single exam + single org (legacy endpoint)
// -----------------------------------------------------
// export async function getExamResultsForOrg(examId: number, orgId: number) {
//   const token = Auth.getToken();

//   const res = await axios.get(
//     `${apiPrefix}api/admin/exams/${examId}/organizations/${orgId}/results`,
//     { headers: { Authorization: `Bearer ${token}` } }
//   );

//   return res.data;
// }

// -----------------------------------------------------
// All exams for dropdown
// -----------------------------------------------------
export async function getAllExams(): Promise<ExamListItem[]> {
  const token = Auth.getToken();
  if (!token) throw new Error("Not authenticated.");

  const url = `${apiPrefix}api/admin/exams`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log(response.data);
  return Array.isArray(response.data)
    ? response.data
    : response.data.exams || [];
}

// -----------------------------------------------------
// Admin-accessible organizations
// -----------------------------------------------------
export async function getAccessibleOrganizations():
  Promise<{ id: number; name: string; userCount: number; }[]> {

  const token = Auth.getToken();
  if (!token) throw new Error("Not authenticated.");

  const url = `${apiPrefix}/api/admin/organizations/accessible`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log("Accessible Org Response:", response.data);

  return response.data.organizations ?? [];
}


// -----------------------------------------------------
// Get All Exam Templates
// -----------------------------------------------------
export async function getExamTemplates(): Promise<ExamTemplate[]> {
  const token = Auth.getToken();

  const response = await axios.get(
    `${apiPrefix}/api/admin/exams/templates`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

// -----------------------------------------------------
// Schedule Exam
// -----------------------------------------------------
export async function scheduleExam(payload: {
  exam_template_id: number;
  title: string;
  description: string;
  localStart: string;
  localEnd: string;
  timeZone: string;
  duration_minutes: number;
  classes: number[];
  users: number[];
}) {

  const token = Auth.getToken();

  if (!token) {
    throw new Error("Not authenticated.");
  }

  // 1️⃣ Create exam
  const createResponse = await axios.post(
    `${apiPrefix}/api/admin/exams`,
    {
      title: payload.title,
      description: payload.description,
      localStart: payload.localStart,
      localEnd: payload.localEnd,
      timeZone: payload.timeZone,
      duration_minutes: payload.duration_minutes,
      exam_template_id: payload.exam_template_id,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const examId = createResponse.data.exam.id;

  // 2️⃣ Assign classes
  for (const classId of payload.classes) {
    await axios.post(
      `${apiPrefix}/api/admin/exams/${examId}/assign-class/${classId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }

  // 3️⃣ Assign individual users
  if (payload.users.length > 0) {
    await axios.post(
      `${apiPrefix}/api/admin/exams/${examId}/assign`,
      {
        user_ids: payload.users,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }

  return examId;
}

export interface ScheduledExam {
  id: number;
  title: string;
  description: string;
  available_from: string;
  available_until: string;
  time_zone: string;
  duration_minutes: number;
  participant_count: number;
  status: string;

  classes: {
    id: number;
    name: string;
    organization_id: number;
    program_id: number;
    status: string;

    organization: {
      id: number;
      name: string;
    };

    program: {
      id: number;
      name: string;
      training_type: string;
    };
  }[];
}

export interface ScheduledExamResponse {
  exams: ScheduledExam[];
  totalCount: number;
  page: number;
  pageCount: number;
}

export async function getScheduledExams(params?: {
  status?: string;
  search?: string;
  organizationId?: number | null;
  programId?: number | null;
  classId?: number | null;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}): Promise<ScheduledExamResponse> {
  const token = Auth.getToken();

  const query = new URLSearchParams();

  if (params?.status && params.status !== "All") {
    query.append("status", params.status);
  }

  if (params?.search && params.search.trim()) {
    query.append("search", params.search.trim());
  }

  if (params?.organizationId) {
    query.append(
      "organizationId",
      String(params.organizationId)
    );
  }

  if (params?.programId) {
    query.append(
      "programId",
      String(params.programId)
    );
  }

  if (params?.classId) {
    query.append(
      "classId",
      String(params.classId)
    );
  }

  if (params?.page) {
    query.append(
      "page",
      String(params.page)
    );
  }

  if (params?.limit) {
    query.append(
      "limit",
      String(params.limit)
    );
  }

  if (params?.sortBy) {
    query.append(
      "sortBy",
      params.sortBy
    );
  }

  if (params?.sortOrder) {
    query.append(
      "sortOrder",
      params.sortOrder
    );
  }

  const queryString = query.toString();

  const response = await axios.get(
    `${apiPrefix}/api/admin/exams/scheduled${
      queryString ? `?${queryString}` : ""
    }`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function getExamDetails(
  examId: number
) {

  const token = Auth.getToken();

  const response = await axios.get(
    `${apiPrefix}/api/admin/exams/${examId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function updateExam(
  examId: number,
  payload: {
    title: string;
    description: string;
    localStart: string;
    localEnd: string;
    timeZone: string;
    duration_minutes: number;
    exam_template_id: number | null;
  }
) {

  const token = Auth.getToken();

  const response = await axios.put(
    `${apiPrefix}/api/admin/exams/${examId}`,
    payload,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function deleteExam(
  examId: number
) {

  const token =
    Auth.getToken();

  const response =
    await axios.delete(
      `${apiPrefix}/api/admin/exams/${examId}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  return response.data;
}

// export async function removeOrganizationFromExam(
//   examId: number,
//   orgId: number
// ) {

//   const token =
//     Auth.getToken();

//   const response =
//     await axios.delete(
//       `${apiPrefix}/api/admin/exams/${examId}/organizations/${orgId}`,
//       {
//         headers: {
//           Authorization:
//             `Bearer ${token}`,
//         },
//       }
//     );

//   return response.data;
// }

// export async function assignOrganizationToExam(
//   examId: number,
//   orgId: number
// ) {

//   const token =
//     Auth.getToken();

//   const response =
//     await axios.post(
//       `${apiPrefix}/api/admin/exams/${examId}/assign-org/${orgId}`,
//       {},
//       {
//         headers: {
//           Authorization:
//             `Bearer ${token}`,
//         },
//       }
//     );

//   return response.data;
// }

export async function assignClassToExam(
  examId: number,
  classId: number
) {
  const token = Auth.getToken();

  const response = await axios.post(
    `${apiPrefix}/api/admin/exams/${examId}/assign-class/${classId}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function removeClassFromExam(
  examId: number,
  classId: number
) {
  const token = Auth.getToken();

  const response = await axios.delete(
    `${apiPrefix}/api/admin/exams/${examId}/classes/${classId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function searchUsersForExam(
  query: string
) {
  const token = Auth.getToken();

  const response = await axios.get(
    `${apiPrefix}/users/search/broad`,
    {
      params: {
        query,
        rowsPerPage: 25,
        pageNumber: 1,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  console.log(
    "SEARCH RESPONSE:",
    response.data
  );

  return response.data.users;
}

export async function assignUserToExam(
  examId: number,
  userId: number
) {

  const token =
    Auth.getToken();

  return axios.post(
    `${apiPrefix}/api/admin/exams/${examId}/assign`,
    {
      user_ids: [userId],
    },
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );
}

export async function removeUserFromExam(
  examId: number,
  userId: number
) {

  const token =
    Auth.getToken();

  return axios.delete(
    `${apiPrefix}/api/admin/exams/${examId}/users/${userId}`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );
}

export async function getExamAttemptDetails(
  sessionId: number
) {
  const token = Auth.getToken();

  const response = await axios.get(
    `${apiPrefix}/api/admin/exams/sessions/${sessionId}/details`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export async function getExamKpis(
  params: ExamResultsQuery
): Promise<ExamKpiResponse> {

  const token = Auth.getToken();

  if (!token) {
    throw new Error("Not authenticated.");
  }

  const queryString =
    buildQueryString(params);

  const url =
    `${apiPrefix}api/admin/exams/kpis${
      queryString
        ? `?${queryString}`
        : ""
    }`;

  const response =
    await axios.get(url, {
      headers: {
        Authorization:
          `Bearer ${token}`
      }
    });

  return response.data;
}

export async function getExamAnalytics(
  params: ExamResultsQuery
): Promise<ExamAnalyticsResponse> {

  const token = Auth.getToken();

  if (!token) {
    throw new Error("Not authenticated.");
  }

  const queryString =
    buildQueryString(params);

  const url =
    `${apiPrefix}api/admin/exams/analytics${
      queryString
        ? `?${queryString}`
        : ""
    }`;

  const response =
    await axios.get(url, {
      headers: {
        Authorization:
          `Bearer ${token}`
      }
    });

  return response.data;
}

export async function getQuestionAnalytics(
  questionId: number
): Promise<QuestionAnalyticsResponse> {

  const token = Auth.getToken();

  if (!token) {
    throw new Error(
      "Not authenticated."
    );
  }

  const url =
    `${apiPrefix}api/admin/exams/question-analytics/${questionId}`;

  const response =
    await axios.get(url, {
      headers: {
        Authorization:
          `Bearer ${token}`
      }
    });

  return response.data;
}

export interface HistoricalUnassignedExamSession {
  id: number;
  exam_id: number;
  exam_title: string | null;
  exam_template_id: number | null;
  class_id: number | null;
  attempt_number: number;
  score: number | null;
  submitted_at: string;
}

export interface HistoricalUnassignedExamResponse {
  user: {
    id: number;
    wired_user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    organization_id: number | null;
  };

  sessions: HistoricalUnassignedExamSession[];
}

export async function getHistoricalUnassignedExams(
  userId: number
): Promise<HistoricalUnassignedExamResponse> {

  const token = Auth.getToken();

  if (!token) {
    throw new Error("Not authenticated.");
  }

  const response = await axios.get(
    `${apiPrefix}/api/admin/exams/historical-unassigned/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}

export interface HistoricalExamAssignmentResponse {
  message: string;

  session: {
    id: number;
    exam_id: number;
    user_id: number;
    class_id: number;
    attempt_number: number;
    score: number | null;
    submitted_at: string;
  };

  exam_class: {
    exam_id: number;
    class_id: number;
  };
}

export async function assignHistoricalExamToClass(
  sessionId: number,
  classId: number
): Promise<HistoricalExamAssignmentResponse> {

  const token = Auth.getToken();

  if (!token) {
    throw new Error("Not authenticated.");
  }

  const response = await axios.post(
    `${apiPrefix}/api/admin/exams/historical-assign`,
    {
      sessionId,
      classId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}