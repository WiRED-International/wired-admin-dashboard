import Auth from "../utils/auth";

export const fetchGoogleAPIKey = async (): Promise<string> => {
    try {
        const response = await fetch('/api/googleAPIKey', {
            headers: {
                Authorization: `Bearer ${Auth.getToken()}`,
            }
        });
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json") || !response.ok) {
            throw new Error("Failed to fetch Google API Key");
        }
        const data = await response.json();
        if(!response.ok) {
            throw new Error(data.message || 'Failed to fetch Google API Key');
        }
        return data.googleAPIKey;
    } catch(err) {
        console.error('Error from fetchGoogleAPIKey: ', err);
        throw err;
    }
}