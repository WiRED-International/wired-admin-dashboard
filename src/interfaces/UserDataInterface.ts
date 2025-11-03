//make an interface based off this const columns = [
//   { key: "firstName", label: "First Name" },
//   { key: "lastName", label: "Last Name" },
//   { key: "email", label: "Email" },
//   { key: "CME_Credits", label: "CME Credits" },
//   { key: "remainingCredits", label: "Remaining Credits" },
//   { key: "specializations", label: "Specializations" },
//   { key: "role", label: "Role" },
//   { key: "country", label: "Country" },
//   { key: "city", label: "City" },
//   { key: "organization", label: "Organization" },
// ];

export interface ModuleInterface {
  id?: number;
  name: string;
  module_id: string;
  description?: string;
  version?: string;
  downloadLink?: string;
  language?: string | null;
  packageSize?: string | null;
  redirect_module_id?: number | null;
  credit_type?: string | null;
  //categories array is needed for "basic" module filtering 
  categories?: string[];
}

export interface QuizScoreInterface {
  id: number;
  score: number;
  date_taken: string;
  module: ModuleInterface;
}

export interface QuizScoreUpdateResponseInterface {
  message: string;
  quizScore: QuizScoreInterface;
}

export interface UserDataInterface {
  id: number;
  first_name: string;
  last_name: string;
  email: string;

  CME_Credits?: number;
  basicCompletionPercent?: number;
  quizScores?: QuizScoreInterface[];
  specializations: {name: string, id: number}[];

  role: {name: "SuperAdmin" | "Admin" | "User", id: number};
  country: { name: string, id: number };
  city: {name: string, id: number};
  organization: {name: string,  id: number};
}

export interface UserSearchBroadResponse {
  users: UserDataInterface[];
  totalCount: number;
  totalPages: number;
  pageCount: number;
}
