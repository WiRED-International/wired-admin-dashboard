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
  firstName: string;
  lastName: string;
  email: string;
  CME_Credits: number;
  remainingCredits: number;
  specializations: string[];
  role: "SuperAdmin" | "Admin" | "User";
  country: string;
  city: string;
  organization: string;
}
