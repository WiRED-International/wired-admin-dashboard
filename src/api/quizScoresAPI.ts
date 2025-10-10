import { apiPrefix } from "../utils/globalVariables";
import Auth from "../utils/auth";

export const fetchAllQuizScores = async (userId?: number): Promise<any[]> => {
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