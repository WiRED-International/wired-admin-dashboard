import Auth from "../utils/auth";
import { apiPrefix } from "../utils/globalVariables";
import {SpecializationsInterface} from "../interfaces/SpecializationInterface";

//fetch all specializations
export const fetchAllSpecializations = async (): Promise<SpecializationsInterface[]> => {
    const url = `${apiPrefix}api/specializations`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${Auth.getToken()}`,
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch specializations');
        }

        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error('Error fetching specializations:', error);
        throw error;
    }
}