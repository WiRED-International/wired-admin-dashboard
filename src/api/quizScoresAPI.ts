import { apiPrefix } from "../utils/globalVariables";
import Auth from "../utils/auth";
import { QuizScoreInterface, QuizScoreUpdateResponseInterface } from "../interfaces/UserDataInterface";

export const fetchAllQuizScores = async (userId?: number): Promise<QuizScoreInterface[]> => {
    const url = userId ? `${apiPrefix}quiz-scores?userId=${userId}` : `${apiPrefix}quiz-scores`;
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Auth.getToken()}` 
        }
    });
    if (!response.ok) {
        throw new Error("Failed to fetch quiz scores");
    }
    return response.json();
}

export const updateQuizScore = async (quizScoreId: number, updatedData: any): Promise<QuizScoreUpdateResponseInterface> => {
    const response = await fetch(`${apiPrefix}quiz-scores/${quizScoreId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Auth.getToken()}` 
        },
        body: JSON.stringify(updatedData)
    });
    if (!response.ok) {
        throw new Error("Failed to update quiz score");
    }
    return response.json();
}