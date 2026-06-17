export interface ExamUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface AllExamResultItem {
  session_id: number;
  exam_id: number;
  exam_title: string | null;
  organization_id: number | null;
  organization_name: string | null;
  attempt_number: number;
  score: number | null;
  submitted_at: string | null;
  active: boolean;
  user: ExamUser;
}

export interface AllExamResultsResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  results: AllExamResultItem[];
}

export interface ExamResultsQuery {
  page?: number;
  limit?: number;
  examId?: number | null;
  orgId?: number | null;
  status?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  sortBy?: string | null;
  sortOrder?: "ASC" | "DESC" | null;
}

export interface ExamFilters {
  examId: number | null;
  orgId: number | null;
  status: string | null;
  limit: number;
  dateFrom: string | null;
  dateTo: string | null;
}

export interface ExamResultRow {
  firstName: string;
  lastName: string;
  title: string;
  score: string;
  date: string;
  time: string;
  status: "Passed" | "Failed" | "In Progress";
  organization: string;
}

export interface ExamSort {
  sortBy: string | null;
  sortOrder: "ASC" | "DESC";
}

export interface ExamKpiResponse {
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  activeExams: number;
}

export interface MostMissedQuestion {
  questionId: number;
  examId: number;
  examTitle: string;
  questionText: string;
  missedCount: number;
  attemptCount: number;
  missRate: number;
}

export interface ExamAnalyticsResponse {
  distribution: {
    excellent: number;
    good: number;
    needsImprovement: number;
    totalCompleted: number;
  };

  mostMissedQuestions: MostMissedQuestion[];
}

export interface QuestionAnalyticsOption {
  optionId: string;
  optionText: string;
  count: number;
  percent: number;
  isCorrect: boolean;
}

export interface QuestionAnalyticsResponse {
  questionId: number;
  questionText: string;
  examTitle: string;
  attemptCount: number;
  distribution: QuestionAnalyticsOption[];
}