import Auth from "../utils/auth";
import { apiPrefix } from "../utils/globalVariables";
import {
  ClassesResponse,
  ClassResponse,
  ClassEnrollmentsResponse,
  ClassProgramsResponse,
  ClassLocation,
  ClassProgressResponse,
  ClassSpecializationsResponse,
  SaveEnrollmentSpecializationResponse,
} from "../interfaces/Class";

export type ClassFilters = {
  search?: string;
  programId?: number;
  organizationId?: number;
  locationId?: number;
  status?: string;
  page?: number;
  limit?: number;
};

// Fetch all classes accessible to the logged-in user
export const fetchClasses = async (
  filters: ClassFilters = {}
): Promise<ClassesResponse> => {
  try {
    const params = new URLSearchParams();

    if (filters.search?.trim()) {
      params.set("search", filters.search.trim());
    }

    if (filters.programId !== undefined) {
      params.set("programId", String(filters.programId));
    }

    if (filters.organizationId !== undefined) {
      params.set("organizationId", String(filters.organizationId));
    }

    if (filters.locationId !== undefined) {
      params.set("locationId", String(filters.locationId));
    }

    if (filters.status && filters.status !== "all") {
      params.set("status", filters.status);
    }

    if (filters.page !== undefined) {
      params.set("page", String(filters.page));
    }

    if (filters.limit !== undefined) {
      params.set("limit", String(filters.limit));
    }

    const queryString = params.toString();

    const url = queryString
      ? `${apiPrefix}/api/admin/classes?${queryString}`
      : `${apiPrefix}/api/admin/classes`;

    const response = await fetch(url, {
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
export const fetchClassById = async (
  classId: number
): Promise<ClassResponse> => {
  try {
    const response = await fetch(
      `${apiPrefix}/api/admin/classes/${classId}`,
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

export const fetchClassEnrollments = async (
  classId: number
): Promise<ClassEnrollmentsResponse> => {
  try {
    const response = await fetch(
      `${apiPrefix}/api/admin/classes/${classId}/enrollments`,
      {
        headers: {
          Authorization: `Bearer ${Auth.getToken()}`,
        },
      }
    );

    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned an invalid response.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch class enrollments"
      );
    }

    return data;
  } catch (error) {
    console.error("Error fetching class enrollments:", error);
    throw error;
  }
};

export const enrollStudent = async (
  classId: number,
  userId: number
) => {
  try {
    const response = await fetch(
      `${apiPrefix}/api/admin/classes/${classId}/enrollments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Auth.getToken()}`,
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      }
    );

    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned an invalid response.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to enroll student"
      );
    }

    return data;
  } catch (error) {
    console.error("Error enrolling student:", error);
    throw error;
  }
};

export const searchClassStudents = async (
  classId: number,
  query: string
) => {
  try {
    const response = await fetch(
      `${apiPrefix}/api/admin/classes/${classId}/students/search?query=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${Auth.getToken()}`,
        },
      }
    );

    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned an invalid response.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to search students"
      );
    }

    return data;
  } catch (error) {
    console.error("Error searching class students:", error);
    throw error;
  }
};

export const removeStudentFromClass = async (
  classId: number,
  userId: number
) => {
  try {
    const response = await fetch(
      `${apiPrefix}/api/admin/classes/${classId}/enrollments/${userId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${Auth.getToken()}`,
        },
      }
    );

    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned an invalid response.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to remove student from class"
      );
    }

    return data;
  } catch (error) {
    console.error("Error removing student from class:", error);
    throw error;
  }
};

export const fetchClassPrograms = async (): Promise<ClassProgramsResponse> => {
  try {
    const response = await fetch(
      `${apiPrefix}/api/admin/classes/options/programs`,
      {
        headers: {
          Authorization: `Bearer ${Auth.getToken()}`,
        },
      }
    );

    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned an invalid response.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch programs"
      );
    }

    return data;
  } catch (error) {
    console.error("Error fetching class programs:", error);
    throw error;
  }
};

export const fetchClassLocations = async (): Promise<ClassLocation[]> => {
  try {
    const response = await fetch(
      `${apiPrefix}/api/admin/locations`,
      {
        headers: {
          Authorization: `Bearer ${Auth.getToken()}`,
        },
      }
    );

    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned an invalid response.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch locations"
      );
    }

    return data;
  } catch (error) {
    console.error("Error fetching class locations:", error);
    throw error;
  }
};

export type CreateClassData = {
  program_id: number;
  organization_id?: number;
  location_id?: number | null;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  enrollment_deadline?: string;
};

export const createClass = async (
  classData: CreateClassData
): Promise<ClassResponse> => {
  try {
    const response = await fetch(
      `${apiPrefix}/api/admin/classes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Auth.getToken()}`,
        },
        body: JSON.stringify(classData),
      }
    );

    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned an invalid response.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to create class"
      );
    }

    return data;
  } catch (error) {
    console.error("Error creating class:", error);
    throw error;
  }
};

export type UpdateClassData = {
  program_id?: number;
  location_id?: number | null;
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  enrollment_deadline?: string | null;
  status?: "draft" | "active" | "completed" | "archived";
};

export const updateClass = async (
  classId: number,
  classData: UpdateClassData
): Promise<ClassResponse> => {
  try {
    const response = await fetch(
      `${apiPrefix}/api/admin/classes/${classId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Auth.getToken()}`,
        },
        body: JSON.stringify(classData),
      }
    );

    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned an invalid response.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to update class"
      );
    }

    return data;
  } catch (error) {
    console.error("Error updating class:", error);
    throw error;
  }
};

export const fetchClassProgress = async (
  classId: number
): Promise<ClassProgressResponse> => {
  const token = localStorage.getItem("id_token");

  const response = await fetch(
    `/api/admin/classes/${classId}/progress`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.message || "Failed to fetch class progress."
    );
  }

  return response.json();
};

export const fetchClassSpecializations = async (
  classId: number
): Promise<ClassSpecializationsResponse> => {
  try {
    const response = await fetch(
      `${apiPrefix}/api/admin/classes/${classId}/specializations`,
      {
        headers: {
          Authorization: `Bearer ${Auth.getToken()}`,
        },
      }
    );

    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned an invalid response.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch specializations"
      );
    }

    return data;
  } catch (error) {
    console.error("Error fetching class specializations:", error);
    throw error;
  }
};

export const saveEnrollmentSpecialization = async (
  classId: number,
  enrollmentId: number,
  specializationId: number
): Promise<SaveEnrollmentSpecializationResponse> => {
  try {
    const response = await fetch(
      `${apiPrefix}/api/admin/classes/${classId}/enrollments/${enrollmentId}/specialization`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Auth.getToken()}`,
        },
        body: JSON.stringify({
          specialization_id: specializationId,
        }),
      }
    );

    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server returned an invalid response.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to save specialization"
      );
    }

    return data;
  } catch (error) {
    console.error("Error saving student specialization:", error);
    throw error;
  }
};