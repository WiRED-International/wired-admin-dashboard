import type { ClassProgressResponse } from "../interfaces/Class";

type Exam = ClassProgressResponse["exams"][number];
export type ExamCategory = "practice" | "final" | "other";

export function examCategory(exam: Exam): ExamCategory {
  const type = exam.exam_template?.exam_type;
  if (type === "practice") return "practice";
  if (type === "basic_qualifying" || type === "act_final" || type === "specialization_final") return "final";
  return "other";
}

export function examColumns(exams: Exam[]) {
  const categories: { category: ExamCategory; label: string }[] = [
    { category: "practice", label: "Practice Exam" },
    { category: "final", label: "Final Exam" },
    { category: "other", label: "General / Unclassified Exam" },
  ];
  return categories.filter(column => exams.length === 0
    ? column.category === "other"
    : exams.some(exam => examCategory(exam) === column.category));
}

export function latestCompletedExam(exams: Exam[], studentId: number, category: ExamCategory) {
  return exams.filter(exam => examCategory(exam) === category)
    .flatMap(exam => exam.exam_sessions)
    .filter(session => session.user_id === studentId && session.score != null
      && session.submitted_at != null && Number.isFinite(Date.parse(session.submitted_at)))
    .sort((a, b) => Date.parse(b.submitted_at!) - Date.parse(a.submitted_at!) || b.id - a.id)[0];
}
