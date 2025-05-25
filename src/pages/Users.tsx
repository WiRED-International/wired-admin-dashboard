import DashboardHeader from "../components/DashboardHeader";
import UserSearchControls from "../components/UserSearchControls";
import UsersTable from "../components/UsersTable";
import { globalStyles } from "../globalStyles";
import { UserDataInterface } from "../interfaces/UserDataInterface";

const dummyUsers: UserDataInterface[]  = [
  {
    firstName: "Alice",
    lastName: "Smith",
    email: "alice.smith@example.com",
    CME_Credits: 12,
    remainingCredits: 4,
    specializations: ["Pediatrics", "Oncology"],
    role: "User",
    country: "Canada",
    city: "Toronto",
    organization: "MediCare North",
  },
  {
    firstName: "Bob",
    lastName: "Johnson",
    email: "bob.johnson@example.com",
    CME_Credits: 20,
    remainingCredits: 20,
    specializations: ["Orthopedics"],
    role: "Admin",
    country: "USA",
    city: "Chicago",
    organization: "OrthoLife",
  },
  {
    firstName: "Clara",
    lastName: "Zhou",
    email: "clara.zhou@example.com",
    CME_Credits: 8,
    remainingCredits: 3,
    specializations: ["Dermatology"],
    role: "User",
    country: "UK",
    city: "London",
    organization: "SkinHealth Ltd.",
  },
  {
    firstName: "David",
    lastName: "Nguyen",
    email: "david.nguyen@example.com",
    CME_Credits: 15,
    remainingCredits: 7,
    specializations: ["Radiology", "Pathology"],
    role: "SuperAdmin",
    country: "USA",
    city: "San Francisco",
    organization: "Radiant Labs",
  },
  {
    firstName: "Elena",
    lastName: "Garcia",
    email: "elena.garcia@example.com",
    CME_Credits: 10,
    remainingCredits: 10,
    specializations: ["Obstetrics", "Gynecology"],
    role: "User",
    country: "Spain",
    city: "Madrid",
    organization: "Clinica Vida",
  },
  {
    firstName: "Frank",
    lastName: "O'Neil",
    email: "frank.oneil@example.com",
    CME_Credits: 18,
    remainingCredits: 6,
    specializations: ["Emergency Medicine"],
    role: "Admin",
    country: "Ireland",
    city: "Dublin",
    organization: "EmergCare Ireland",
  },
  {
    firstName: "Grace",
    lastName: "Tanaka",
    email: "grace.tanaka@example.com",
    CME_Credits: 25,
    remainingCredits: 20,
    specializations: ["Internal Medicine", "Endocrinology, Endocrinology"],

    role: "SuperAdmin",
    country: "Japan",
    city: "Tokyo",
    organization: "Tokyo Med Group",
  },
  {
    firstName: "Henry",
    lastName: "Lee",
    email: "henry.lee@example.com",
    CME_Credits: 14,
    remainingCredits: 8,
    specializations: ["Psychiatry"],
    role: "User",
    country: "USA",
    city: "Seattle",
    organization: "MindCare Solutions",
  },
  {
    firstName: "Isabella",
    lastName: "Rossi",
    email: "isabella.rossi@example.com",
    CME_Credits: 16,
    remainingCredits: 5,
    specializations: ["Urology", "Nephrology"],
    role: "Admin",
    country: "Italy",
    city: "Milan",
    organization: "UroClinic Milan",
  },
  {
    firstName: "Jack",
    lastName: "Williams",
    email: "jack.williams@example.com",
    CME_Credits: 9,
    remainingCredits: 1,
    specializations: ["Anesthesiology"],
    role: "User",
    country: "Australia",
    city: "Sydney",
    organization: "AussieMed",
  }
]


const UsersPage = () => {
  return (
    <div style={globalStyles.pageContainer}>
      <DashboardHeader />
      <div style={styles.usersContainer}>
        <h1 style={styles.userHeader}>Registered Users</h1>
        <UserSearchControls />
        <UsersTable users={dummyUsers} />
      </div>
    </div>
  );
}
export default UsersPage;

const styles: { [key: string]: React.CSSProperties } = {
  usersContainer: {
    padding: "20px",
    backgroundColor: "#E4E4E4",
    width: "100%",
    height: "100%",
    overflowY: "auto",
  },
  usersHeader: {
    fontFamily: 'inter',
    fontWeight: 'bolder',
    fontSize: "48px",
  }
}
