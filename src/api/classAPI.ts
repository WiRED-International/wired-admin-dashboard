import Auth from "../utils/auth";
import { apiPrefix } from "../utils/globalVariables";


// Fetch all classes accessible to the logged-in user
export const fetchClasses = async () => {
  try {
    const response = await fetch(`${apiPrefix}api/admin/classes`, {
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch classes");
    }

    return data;
  } catch (error) {
    console.error("Error fetching classes:", error);
    throw error;
  }
};


// Fetch one class by ID
export const fetchClassById = async (classId: number) => {
  try {
    const response = await fetch(
      `${apiPrefix}api/admin/classes/${classId}`,
      {
        headers: {
          Authorization: `Bearer ${Auth.getToken()}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch class");
    }

    return data;
  } catch (error) {
    console.error("Error fetching class:", error);
    throw error;
  }
};