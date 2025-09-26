import { QuizScoreInterface } from "../interfaces/UserDataInterface";

export const PASSING_SCORE = 80;
export const CREDITS_PER_PASS = 5;

export function calculateCmeCredits(
  quizScores: QuizScoreInterface[],
  currentYear: number = new Date().getFullYear()
): number {
  if (!quizScores || quizScores.length === 0) return 0;

  let credits = 0;

  for (let i = 0; i < quizScores.length; i++) {
    const q = quizScores[i];
    const quizYear = new Date(q.date_taken).getFullYear();

    if (q.score >= PASSING_SCORE && quizYear === currentYear) {
      credits += CREDITS_PER_PASS;
    }
  }

  return credits;
}