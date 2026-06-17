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
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
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