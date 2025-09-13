import { RoleInterface } from "../interfaces/rolesInterface";
import { apiPrefix } from "../utils/globalVariables";
//fetch all roles
export const fetchAllRoles = async (): Promise<RoleInterface[]> => {
    try {
        const response = await fetch(`${apiPrefix}roles`);
        if (!response.ok) {
            throw new Error('Failed to fetch roles');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching roles:", error);
        throw error;
    }
};