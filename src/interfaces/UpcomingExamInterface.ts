export interface UpcomingExam {
  id: number;
  title: string;
  org: string;
  duration: string;
  from: string;
  to: string;
  timeZone: string;
  enrolled: {
    current: number;
    total: number;
  };
  progress: number;
}