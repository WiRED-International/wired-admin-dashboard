export interface ExamResultResponseInterface {
  exam_id: number;
  organization_id: number;
  exam_title: string | null;
  organization_name: string | null;
  results: {
    session_id: number;
    attempt_number: number;
    score: number | null;
    submitted_at: string | null;
    active: boolean;
    user: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    }
  }[];
}