

import { ModuleDownloadInterface } from "../interfaces/ModuleDownloadInterface";
import Auth from "../utils/auth";
import { apiPrefix } from "../utils/globalVariables";


//fetch data from /downloads endpoint
export const fetchDownloads = async (queries?: string, signal?: AbortSignal): Promise<ModuleDownloadInterface[]> => {
    try {
        const fetchURL = queries ? `${apiPrefix.replace(/\/$/, "")}/api/downloads?${queries}` : `${apiPrefix.replace(/\/$/, "")}/api/downloads`;

        const response = await fetch(fetchURL, {
            signal,
            headers: {
                Authorization: `Bearer ${Auth.getToken()}`,
            }
        });
        //check if response is json, if not, throw a user-readable error
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json") || !response.ok) {
            throw new Error("Failed to fetch downloads");
        }
        const data = await response.json();
        if(!response.ok) {
            throw new Error(data.message || 'Failed to fetch downloads');
        }
        return data;
    } catch(err) {
        console.error('Error from getDownloads: ', err);
        throw err;
    }
}