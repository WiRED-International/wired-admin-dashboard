export interface ExamTemplateQuestion {
  id: number;

  exam_template_id: number;

  question_type: string;

  question_text: string;

  options: Record<string, string>;

  correct_answers: string[];

  order: number;

  attempts?: number;

  correct?: number;

  correctRate?: number;
  
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'No Data';

  createdAt?: string;

  updatedAt?: string;
}

export interface ExamTemplate {
  id: number;

  title: string;

  description: string | null;

  questionCount?: number;

  exam_template_questions?: ExamTemplateQuestion[];
}