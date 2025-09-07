import { CountryInterface } from "../interfaces/CountryInterface";
import { apiPrefix } from "../utils/globalVariables";
//fetch all countries
export const fetchAllCountries = async (): Promise<CountryInterface[]> => {
    try {
        const response = await fetch(`${apiPrefix}countries`);
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const data = await response.json();
        return data.countries;
    } catch (error) {
        console.error("Error fetching countries:", error);
        return [];
    }
};
