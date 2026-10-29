import Auth from "../utils/auth";
import { apiPrefix } from "../utils/globalVariables";

export type Announcement = {
  id: number;
  alert: string;
  important: boolean;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AnnouncementPayload = {
  alert: string;
  important: boolean;
};

export type PaginatedAnnouncements = {
  announcements: Announcement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type MessageResponse = {
  message: string;
};

async function announcementRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(
    `${apiPrefix}/api/admin/alerts${path}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    }
  );

  const contentType =
    response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Unexpected server response (${response.status}).`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        `Announcement request failed (${response.status}).`
    );
  }

  return data as T;
}

// Retrieve all announcements, including inactive ones.
export const fetchAnnouncements = (): Promise<Announcement[]> =>
  announcementRequest<Announcement[]>("/");

// Retrieve one page of announcement history.
export const fetchAnnouncementsPage = (
  page: number = 1,
  limit: number = 25
): Promise<PaginatedAnnouncements> =>
  announcementRequest<PaginatedAnnouncements>(
    `/?page=${page}&limit=${limit}`
  );

// Retrieve a single announcement.
export const fetchAnnouncementById = (
  id: number
): Promise<Announcement> =>
  announcementRequest<Announcement>(`/${id}`);

// Create a new inactive announcement.
export const createAnnouncement = (
  payload: AnnouncementPayload
): Promise<Announcement> =>
  announcementRequest<Announcement>("/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// Edit an announcement without changing its active status.
export const updateAnnouncement = (
  id: number,
  payload: AnnouncementPayload
): Promise<Announcement> =>
  announcementRequest<Announcement>(`/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

// Make this the only active announcement.
export const activateAnnouncement = (
  id: number
): Promise<Announcement> =>
  announcementRequest<Announcement>(`/${id}/activate`, {
    method: "PUT",
  });

// Remove the active announcement from HealthMAP.
export const deactivateAnnouncements =
  (): Promise<MessageResponse> =>
    announcementRequest<MessageResponse>("/deactivate", {
      method: "PUT",
    });

// Permanently delete an announcement.
export const deleteAnnouncement = (
  id: number
): Promise<MessageResponse> =>
  announcementRequest<MessageResponse>(`/${id}`, {
    method: "DELETE",
  });
