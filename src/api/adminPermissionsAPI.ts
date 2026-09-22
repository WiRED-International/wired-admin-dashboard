import Auth from "../utils/auth";
import { apiPrefix } from "../utils/globalVariables";

export interface AdminPermission {
  id: number;
  country_id: number | null;
  city_id: number | null;
  organization_id: number | null;
  role_id: number | null;
  admin_id: number;
  admin: {
    first_name: string;
    last_name: string;
  };
  role: {
    name: string;
  } | null;
}

export const fetchAdminPermissionsByOrganization = async (
  organizationId: number
): Promise<AdminPermission[]> => {
  const response = await fetch(
    `${apiPrefix}/api/admin-permissions?organizationId=${organizationId}`,
    {
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch organization admin permissions."
    );
  }

  return data;
};

export interface CreateAdminPermissionData {
  adminId: number;
  organizationId: number;
}

export interface CreateAdminPermissionResponse {
  id: number;
  country_id: number | null;
  city_id: number | null;
  organization_id: number;
  role_id: number;
  admin_id: number;
}

export const createOrganizationAdminPermission = async (
  permissionData: CreateAdminPermissionData
): Promise<CreateAdminPermissionResponse> => {
  const response = await fetch(
    `${apiPrefix}/api/admin-permissions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Auth.getToken()}`,
      },
      body: JSON.stringify({
        adminId: permissionData.adminId,
        countryId: null,
        cityId: null,
        organizationId: permissionData.organizationId,
        roleId: 2,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to assign admin to organization."
    );
  }

  return data;
};

export interface DeleteAdminPermissionResponse {
  message: string;
}

export const deleteOrganizationAdminPermission = async (
  permissionId: number
): Promise<DeleteAdminPermissionResponse> => {
  const response = await fetch(
    `${apiPrefix}/api/admin-permissions/${permissionId}`,
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
      data.message || "Failed to remove admin from organization."
    );
  }

  return data;
};