export interface ExamClassOrganization {
  id: number;
  name: string;
}

export interface ExamClassProgram {
  id: number;
  name: string;
  training_type: string;
}

export interface ExamClass {
  id: number;
  name: string;
  organization_id: number;
  program_id: number;
  status: string;

  organization: ExamClassOrganization;
  program: ExamClassProgram;
}

export interface ExamDetailsTemplate {
  id: number;
  title: string;
  description: string | null;
}

export interface ExamDetails {

  id: number;

  title: string;

  description: string | null;

  available_from: string;

  available_until: string;

  duration_minutes: number;

  time_zone: string;

  exam_template_id: number | null;

  exam_template: ExamDetailsTemplate | null;

  classes: ExamClass[];

  exam_user_access: ExamAssignedUser[];
}

export interface ExamAssignedUser {
  id: number;

  users: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}