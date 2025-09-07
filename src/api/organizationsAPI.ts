import { OrganizationInterface } from "../interfaces/OrganizationsInterface";
import { apiPrefix } from "../utils/globalVariables";

//get all organizations
export const fetchAllOrganizations = async (): Promise<OrganizationInterface[]> => {
    const response = await fetch(`${apiPrefix}organizations`);
    if (!response.ok) {
        throw new Error("Failed to fetch organizations");
    }
    return response.json();
};