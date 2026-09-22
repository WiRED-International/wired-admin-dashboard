import { OrganizationInterface } from "../interfaces/OrganizationsInterface";
import { apiPrefix } from "../utils/globalVariables";
import Auth from "../utils/auth";

//get all organizations
export const fetchAllOrganizations = async (): Promise<OrganizationInterface[]> => {
    const response = await fetch(`${apiPrefix}/organizations`);
    if (!response.ok) {
        throw new Error("Failed to fetch organizations");
    }
    return response.json();
};

export interface AdminOrganizationCountry {
  id: number;
  name: string;
}

export interface AdminOrganization {
  id: number;
  name: string;
  userCount: number;
  countries: AdminOrganizationCountry[];
}

export interface AdminOrganizationsResponse {
  organizations: AdminOrganization[];
}

export type OrganizationSortField =
  | "name"
  | "userCount";

export type OrganizationSortDirection =
  | "asc"
  | "desc";

export interface AdminOrganizationsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedAdminOrganizationsResponse {
  organizations: AdminOrganization[];
  pagination: AdminOrganizationsPagination;
}

export interface FetchAdminOrganizationsParams {
  page: number;
  limit: number;
  query?: string;
  sortBy?: OrganizationSortField;
  sortDirection?: OrganizationSortDirection;
}

export const fetchAdminOrganizations = async (): Promise<AdminOrganizationsResponse> => {
    const response = await fetch(
      `${apiPrefix}/api/admin/organizations`,
      {
        headers: {
          Authorization: `Bearer ${Auth.getToken()}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch organizations."
      );
    }

    return data;
};

export const fetchPaginatedAdminOrganizations =
  async (
    params: FetchAdminOrganizationsParams
  ): Promise<PaginatedAdminOrganizationsResponse> => {
    const searchParams = new URLSearchParams();

    searchParams.set(
      "page",
      String(params.page)
    );

    searchParams.set(
      "limit",
      String(params.limit)
    );

    if (params.query?.trim()) {
      searchParams.set(
        "query",
        params.query.trim()
      );
    }

    if (params.sortBy) {
      searchParams.set(
        "sortBy",
        params.sortBy
      );
    }

    if (params.sortDirection) {
      searchParams.set(
        "sortDirection",
        params.sortDirection
      );
    }

    const response = await fetch(
      `${apiPrefix}/api/admin/organizations?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${Auth.getToken()}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Failed to fetch organizations."
      );
    }

    return data;
  };

export interface CreateOrganizationData {
  name: string;
  country_ids: number[];
}

export interface CreateOrganizationResponse {
  message: string;
  organization: AdminOrganization;
}

export const createOrganization = async (
  organizationData: CreateOrganizationData
): Promise<CreateOrganizationResponse> => {
  const response = await fetch(
    `${apiPrefix}/api/admin/organizations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Auth.getToken()}`,
      },
      body: JSON.stringify(organizationData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to create organization."
    );
  }

  return data;
};

export interface UpdateOrganizationData {
  name: string;
  country_ids: number[];
}

export interface UpdateOrganizationResponse {
  message: string;
  organization: AdminOrganization;
}

export const updateOrganization = async (
  organizationId: number,
  organizationData: UpdateOrganizationData
): Promise<UpdateOrganizationResponse> => {
  const response = await fetch(
    `${apiPrefix}/api/admin/organizations/${organizationId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Auth.getToken()}`,
      },
      body: JSON.stringify(organizationData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update organization."
    );
  }

  return data;
};

export const deleteOrganization = async (
  organizationId: number
): Promise<{ message: string }> => {
  const response = await fetch(
    `${apiPrefix}/api/admin/organizations/${organizationId}`,
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
      data.message ||
        "Failed to delete organization."
    );
  }

  return data;
};