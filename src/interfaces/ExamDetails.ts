export interface ExamOrganization {
  id: number;
  name: string;
}

export interface ExamDetails {

  id: number;

  title: string;

  description: string | null;

  available_from: string;

  available_until: string;

  duration_minutes: number;

  time_zone: string;

  organizations: ExamOrganization[];

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