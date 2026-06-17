export interface ExamResultRowInterface {
  firstName: string;
  lastName: string;
  title: string;
  score: string;
  date: string;
  time: string;
  status: "Passed" | "Failed" | "In Progress";
  organization: string;
}