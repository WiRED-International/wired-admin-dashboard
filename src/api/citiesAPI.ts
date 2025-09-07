import { CityInterface } from "../interfaces/CityInterface";
import { apiPrefix } from "../utils/globalVariables";

export const fetchAllCities = async (): Promise<CityInterface[]> => {
    const response = await fetch(`${apiPrefix}cities`);
    if (!response.ok) {
        throw new Error("Failed to fetch cities");
    }
    return response.json();
};
