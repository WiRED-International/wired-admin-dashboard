export interface Program {
  id: number;
  name: string;
  training_type: string;
  description: string | null;
  active: boolean;
}

export interface ClassOrganization {
  id: number;
  name: string;
  country_id: number | null;
  city_id: number | null;
}

export interface ClassLocation {
  id: number;
  name: string;
  country_id: number;
  location_type: string;
  parent_location_id: number | null;
}

export interface ClassCreator {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface ClassEnrollmentSummary {
  id: number;
}

export interface ClassItem {
  id: number;
  organization_id: number;
  program_id: number;
  location_id: number | null;

  name: string;
  description: string | null;

  start_date: string;
  end_date: string;
  enrollment_deadline: string | null;

  status: string;

  created_by_user_id: number | null;

  createdAt: string;
  updatedAt: string;

  program: Program;
  organization: ClassOrganization;
  location: ClassLocation | null;
  created_by_user: ClassCreator | null;

  class_enrollments?: ClassEnrollmentSummary[];
}

export interface ClassesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ClassesResponse {
  classes: ClassItem[];
  pagination: ClassesPagination;
}

export interface ClassResponse {
  class: ClassItem;
}

export interface ClassEnrollmentUser {
  id: number;
  wired_user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  organization_id: number | null;
}

export interface ClassEnrollment {
  id: number;
  user_id: number;
  class_id: number;
  status: string;
  enrolled_at: string;
  createdAt: string;
  updatedAt: string;
  user: ClassEnrollmentUser;

  specialization_selection: ClassEnrollmentSpecializationSelection | null;
}

export interface ClassEnrollmentsResponse {
  class: {
    id: number;
    name: string;
    organization_id: number;
    program_id: number;
  };

  enrollments: ClassEnrollment[];
}

export interface ClassProgramOption {
  id: number;
  name: string;
  training_type: string;
  description: string | null;
}

export interface ClassProgramsResponse {
  programs: ClassProgramOption[];
}

export interface ClassProgressModule {
  id: number;
  module_id: string | null;
  name: string;
  has_quiz: boolean;
}

export interface ClassProgressStudent {
  id: number;
  wired_user_id: string;
  first_name: string;
  last_name: string;
  email: string;

  class_enrollment_id: number;

  specialization_selection:
    ClassEnrollmentSpecializationSelection | null;

  modules?: ClassProgressModule[];
}

export interface ClassProgressQuizScore {
  id: number;
  user_id: number;
  module_id: number;
  score: number;
  date_taken: string;
}

export interface ClassProgressExamTemplate {
  id: number;
  title: string;
  program: string;
  exam_type:
    | "general"
    | "basic_qualifying"
    | "act_final"
    | "specialization_final"
    | null;
}

export interface ClassProgressExamSession {
  id: number;
  user_id: number;
  class_id: number;
  attempt_number: number;
  score: number | null;
  submitted_at: string | null;
  active: boolean;
}

export interface ClassProgressExam {
  id: number;
  title: string;
  exam_template_id: number | null;
  exam_template: ClassProgressExamTemplate | null;
  exam_sessions: ClassProgressExamSession[];
}

export interface ClassProgressResponse {
  class: {
    id: number;
    name: string;
    organization_id: number;
    program_id: number;
    program: {
      id: number;
      name: string;
      training_type: string;
    };
  };

  modules: ClassProgressModule[];
  students: ClassProgressStudent[];
  quizScores: ClassProgressQuizScore[];
  exams: ClassProgressExam[];
}

export interface ClassEnrollmentSpecialization {
  id: number;
  name: string;
}

export interface ClassEnrollmentSpecializationSelection {
  id: number;
  class_enrollment_id: number;
  specialization_id: number;
  selected_at: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  specialization: ClassEnrollmentSpecialization;
}

export interface SpecializationOption {
  id: number;
  name: string;
}

export interface ClassSpecializationsResponse {
  specializations: SpecializationOption[];
}

export interface SaveEnrollmentSpecializationResponse {
  message: string;

  specialization_selection: {
    id: number;
    class_enrollment_id: number;
    specialization_id: number;
    selected_at: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    specialization: SpecializationOption;
  };
}