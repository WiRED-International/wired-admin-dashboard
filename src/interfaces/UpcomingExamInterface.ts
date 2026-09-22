export interface UpcomingExamClassOrganization {
  id: number;
  name: string;
}

export interface UpcomingExamClassProgram {
  id: number;
  name: string;
  training_type: string;
}

export interface UpcomingExamClass {
  id: number;
  name: string;

  organization: UpcomingExamClassOrganization | null;

  program: UpcomingExamClassProgram | null;
}

export interface UpcomingExam {
  id: number;
  title: string;

  classes: UpcomingExamClass[];

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