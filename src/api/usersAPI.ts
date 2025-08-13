//fetch users from /users
import { UserDataInterface } from "../interfaces/UserDataInterface";
import Auth from "../utils/auth";
import { apiPrefix } from "../utils/globalVariables";

// Fetch users from /users endpoint
export const fetchUsers = async (queries?: string): Promise<UserDataInterface[]> => {
    try {
        const fetchURL = queries ? `${apiPrefix}users?${queries}` : `${apiPrefix}users`;

        const response = await fetch(fetchURL, {
            headers: {
                Authorization: `Bearer ${Auth.getToken()}`,
            }
        });

        // Check if response is JSON, if not, throw a user-readable error
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json") || !response.ok) {
            throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch users');
        }

        return data;
    } catch (err) {
        console.error('Error from fetchUsers: ', err);
        throw err;
    }
}

//search users by first name, last name, email, using one search query
export const searchUsers = async (searchQuery: string): Promise<UserDataInterface[]> => {
    const query = encodeURIComponent(searchQuery);
    const url = `/api/admin/users/search?first_name=${query}&last_name=${query}&email=${query}`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${Auth.getToken()}`,
            }
        });

        if (!response.ok) {
            throw new Error('Failed to search users');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error searching users:', error);
        throw error;
    }
}

//search users by first name, last name, email, using one broad search query
export const searchUsersBroad = async (searchQuery: string): Promise<UserDataInterface[]> => {
    const query = encodeURIComponent(searchQuery);
    const url = `/users/search/broad?query=${query}`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${Auth.getToken()}`,
            }
        });

        if (!response.ok) {
            throw new Error('Failed to search users');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error searching users:', error);
        throw error;
    }
}