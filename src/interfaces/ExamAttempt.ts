export interface ExamAttemptUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface ExamAttemptExam {
  id: number;
  title: string;
  description: string;
  available_from: string;
  available_until: string;
  duration_minutes: number;
  time_zone: string;
  exam_template_id: number;
}

export interface ExamAttemptAnswer {
  question_id: number;
  selected_option_ids: string[];
  updated_at: string;
}

export interface ExamAttemptQuestion {
  question_id: number;
  question_text: string;
  options: Record<string, string>;
  correct_answers: string[];
  user_answer: ExamAttemptAnswer | null;
  is_correct?: boolean;
}

export interface ExamAttemptResponse {
  user: ExamAttemptUser;
  exam: ExamAttemptExam;
  score: number;
  submitted_at: string;
  questions: ExamAttemptQuestion[];
  attempt_number: number;
  organization: string | null;
}