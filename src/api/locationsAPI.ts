import Auth from "../utils/auth";
import { apiPrefix } from "../utils/globalVariables";

export type LocationType =
  | "county"
  | "sub_county"
  | "city";

export interface LocationCountry {
  id: number;
  name: string;
  code: string;
}

export interface AdminLocation {
  id: number;
  name: string;
  country_id: number;
  location_type: LocationType;
  parent_location_id: number | null;
  country: LocationCountry;
}

export type LocationSortField =
  | "name"
  | "location_type"
  | "country";

export type SortDirection = "asc" | "desc";

export interface FetchLocationsParams {
  page: number;
  limit: number;
  sortBy?: LocationSortField;
  sortDirection?: SortDirection;
  countryId?: number;
  locationType?: LocationType;
  query?: string;
}

export interface LocationsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedLocationsResponse {
  locations: AdminLocation[];
  pagination: LocationsPagination;
}

export const fetchAdminLocations =
  async (): Promise<AdminLocation[]> => {
    const response = await fetch(
      `${apiPrefix}/api/admin/locations`,
      {
        headers: {
          Authorization: `Bearer ${Auth.getToken()}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch locations."
      );
    }

    return data;
  };

  export interface CreateLocationData {
  name: string;
  country_id: number;
  location_type: LocationType;
  parent_location_id: number | null;
}

export const fetchPaginatedAdminLocations = async (
  params: FetchLocationsParams
): Promise<PaginatedLocationsResponse> => {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    sortBy: params.sortBy ?? "name",
    sortDirection: params.sortDirection ?? "asc",
  });

  if (params.countryId !== undefined) {
    searchParams.set(
      "countryId",
      String(params.countryId)
    );
  }

  if (params.locationType !== undefined) {
    searchParams.set(
      "locationType",
      params.locationType
    );
  }

  if (params.query?.trim()) {
    searchParams.set(
      "query",
      params.query.trim()
    );
  }

  const response = await fetch(
    `${apiPrefix}/api/admin/locations?${searchParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch locations."
    );
  }

  return data;
};

export interface CreateLocationResponse {
  message: string;
  location: AdminLocation;
}

export const createAdminLocation = async (
  locationData: CreateLocationData
): Promise<CreateLocationResponse> => {
  const response = await fetch(
    `${apiPrefix}/api/admin/locations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Auth.getToken()}`,
      },
      body: JSON.stringify(locationData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to create location."
    );
  }

  return data;
};

export interface UpdateLocationData {
  name: string;
  country_id: number;
  location_type: LocationType;
  parent_location_id: number | null;
}

export interface UpdateLocationResponse {
  message: string;
  location: AdminLocation;
}

export const updateAdminLocation = async (
  locationId: number,
  locationData: UpdateLocationData
): Promise<UpdateLocationResponse> => {
  const response = await fetch(
    `${apiPrefix}/api/admin/locations/${locationId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Auth.getToken()}`,
      },
      body: JSON.stringify(locationData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update location."
    );
  }

  return data;
};

export interface DeleteLocationResponse {
  message: string;
}

export const deleteAdminLocation = async (
  locationId: number
): Promise<DeleteLocationResponse> => {
  const response = await fetch(
    `${apiPrefix}/api/admin/locations/${locationId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to delete location."
    );
  }

  return data;
};