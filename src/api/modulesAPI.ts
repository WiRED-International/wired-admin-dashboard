//make fetch request to /modules/name
import Auth from "../utils/auth";
import { IdsAndNamesInterface } from "../interfaces/IdsAndNamesInterface";


export const fetchModuleAndPackageInfo = async (): Promise<IdsAndNamesInterface> => {
    try {
        const response = await fetch('/modules/names', {
            headers: {
                Authorization: `Bearer ${Auth.getToken()}`,
            }
        });
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json") || !response.ok) {
            throw new Error("Failed to fetch module names");
        }
        const moduleData = await response.json();
        if(!response.ok) {
            throw new Error(moduleData.message || 'Failed to fetch module names');
        }
        const packageFetchResponse = await fetch('/packages/names', {
            headers: {
                Authorization: `Bearer ${Auth.getToken()}`,
            }
        });
        const packageData = await packageFetchResponse.json();
        if(!packageFetchResponse.ok) {
            throw new Error(packageData.message || 'Failed to fetch package names');
        }
        return {
            modules: moduleData,
            packages: packageData
        }
    } catch(err) {
        console.error('Error from fetchModuleNames: ', err);
        throw err;
    }
}
