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

export interface UserDataInterface {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  CME_Credits?: number;
  remainingCredits?: number;
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
