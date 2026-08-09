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

export interface ClassCreator {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface ClassItem {
  id: number;
  organization_id: number;
  program_id: number;

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
  created_by_user: ClassCreator | null;
}

export interface ClassesResponse {
  classes: ClassItem[];
}

export interface ClassResponse {
  class: ClassItem;
}