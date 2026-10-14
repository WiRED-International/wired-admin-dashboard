import Auth from "../utils/auth";
import { apiPrefix } from "../utils/globalVariables";

export type ModuleProgram = {
  id: number;
  name: string;
  training_type: string;
  description?: string | null;
  active?: boolean;
};

export type ModuleSpecialization = {
  id: number;
  name: string;
};

export type ModuleLetter = {
  id: number;
  letters: string;
};

export type ModuleKeyword = {
  id: number;
  name: string;
};

export type ModuleSubCategory = {
  id: number;
  name: string;
  category_id?: number;
  category?: {
    id: number;
    name: string;
  };
};

export type CategoryOption = {
  id: number;
  name: string;
  subCategories: {
    id: number;
    name: string;
  }[];
};

export type LetterOption = {
  id: number;
  letters: string;
};

export type KeywordOption = {
  id: number;
  name: string;
};

export type ModuleRecord = {
  id: number;
  module_id: string;
  name: string;
  description?: string | null;
  version?: string | null;
  downloadLink?: string | null;
  language?: string | null;
  packageSize?: string | null;

  type: "module" | "animation";

  has_quiz: boolean;
  is_archived: boolean;

  credit_type: "none" | "cme";
  cme_credits: number | null;

  content_updated_at: string | null;
  package_uploaded_at: string | null;

  categories?: string[] | null;

  programs: ModuleProgram[];
  specializations: ModuleSpecialization[];
  letters: ModuleLetter[];
  subCategories: ModuleSubCategory[];
  keywords: ModuleKeyword[];
};

export type UpdateModulePayload = {
  name?: string;
  module_id?: string;
  description?: string | null;
  version?: string | null;
  downloadLink?: string | null;
  language?: string | null;
  packageSize?: string | null;
  type?: "module" | "animation";
  has_quiz?: boolean;
  credit_type?: "none" | "cme";
  cme_credits?: number | null;
  content_updated_at?: string | null;

  program_ids?: number[];
  specialization_ids?: number[];
  letter_ids?: number[];
  subcategory_ids?: number[];
  keyword_ids?: number[];
};

export type CreateModulePayload = {
  name: string;
  module_id?: string;
  description?: string | null;
  version?: string | null;
  downloadLink?: string | null;
  language?: string | null;
  packageSize?: string | null;
  type: "module" | "animation";
  has_quiz: boolean;
  credit_type: "none" | "cme";
  cme_credits: number | null;
  content_updated_at?: string | null;
  program_ids?: number[];
  specialization_ids?: number[];
  letter_ids?: number[];
  subcategory_ids?: number[];
  keyword_ids?: number[];
};

export const archiveModule = async (moduleId: number): Promise<void> => {
  const response = await fetch(
    `${apiPrefix}/api/admin/modules/${moduleId}/archive`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to archive module.");
  }
};

export const restoreModule = async (moduleId: number): Promise<void> => {
  const response = await fetch(
    `${apiPrefix}/api/admin/modules/${moduleId}/restore`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to restore module.");
  }
};

export const fetchModules = async (): Promise<ModuleRecord[]> => {
  try {
    const response = await fetch(
      `${apiPrefix}/api/admin/modules`,
      {
        headers: {
          Authorization: `Bearer ${Auth.getToken()}`,
        },
      }
    );

    const contentType =
      response.headers.get("content-type");

    if (
      !contentType ||
      !contentType.includes("application/json")
    ) {
      throw new Error(
        "Server returned an invalid response."
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.error ||
        "Failed to fetch modules"
      );
    }

    return data;
  } catch (error) {
    console.error(
      "Error fetching modules:",
      error
    );

    throw error;
  }
};

export const fetchModuleById = async (
  moduleId: number | string
): Promise<ModuleRecord> => {
  try {
    const response = await fetch(
      `${apiPrefix}/modules/${moduleId}`,
      {
        headers: {
          Authorization: `Bearer ${Auth.getToken()}`,
        },
      }
    );

    const contentType =
      response.headers.get("content-type");

    if (
      !contentType ||
      !contentType.includes("application/json")
    ) {
      throw new Error(
        "Server returned an invalid response."
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.error ||
        "Failed to fetch module"
      );
    }

    return data;
  } catch (error) {
    console.error(
      "Error fetching module:",
      error
    );

    throw error;
  }
};

export const createModule = async (
  payload: CreateModulePayload
): Promise<ModuleRecord> => {
  const response = await fetch(`${apiPrefix}/modules`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Auth.getToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get("content-type");

  if (
    !contentType ||
    !contentType.includes("application/json")
  ) {
    throw new Error(
      `Create module returned ${response.status} ${
        contentType || "unknown content type"
      } from ${response.url}`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      "Failed to create module"
    );
  }

  return data.module;
};

export const updateModule = async (
  moduleId: number | string,
  updates: UpdateModulePayload
): Promise<ModuleRecord> => {
  try {
    const response = await fetch(
      `${apiPrefix}/modules/${moduleId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${Auth.getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      }
    );

    const contentType =
      response.headers.get("content-type");

    if (
      !contentType ||
      !contentType.includes("application/json")
    ) {
      throw new Error(
        "Server returned an invalid response."
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.error ||
        "Failed to update module"
      );
    }

    return data.module;
  } catch (error) {
    console.error(
      "Error updating module:",
      error
    );

    throw error;
  }
};

export const fetchLetters = async (): Promise<LetterOption[]> => {
  const response = await fetch(
    `${apiPrefix}/letters`,
    {
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
      },
    }
  );

  const contentType =
    response.headers.get("content-type");

  if (
    !contentType ||
    !contentType.includes("application/json")
  ) {
    throw new Error(
      `Letters request returned ${response.status} ${contentType || "unknown content type"} from ${response.url}`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      "Failed to fetch letters"
    );
  }

  return data;
};

export const fetchCategories = async (): Promise<CategoryOption[]> => {
  const response = await fetch(
    `${apiPrefix}/categories`,
    {
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
      },
    }
  );

  const contentType =
    response.headers.get("content-type");

  if (
    !contentType ||
    !contentType.includes("application/json")
  ) {
    throw new Error(
      `Categories request returned ${response.status} ${contentType || "unknown content type"} from ${response.url}`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      "Failed to fetch categories"
    );
  }

  return data;
};

export const fetchKeywords = async (): Promise<KeywordOption[]> => {
  const response = await fetch(
    `${apiPrefix}/keywords`,
    {
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
      },
    }
  );

  const contentType =
    response.headers.get("content-type");

  if (
    !contentType ||
    !contentType.includes("application/json")
  ) {
    throw new Error(
      `Keywords request returned ${response.status} ${contentType || "unknown content type"} from ${response.url}`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      "Failed to fetch keywords"
    );
  }

  return data;
};

export const createKeyword = async (
  name: string
): Promise<KeywordOption> => {
  const response = await fetch(
    `${apiPrefix}/keywords`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    }
  );

  const contentType =
    response.headers.get("content-type");

  if (
    !contentType ||
    !contentType.includes("application/json")
  ) {
    throw new Error(
      `Keyword creation returned ${response.status} ${contentType || "unknown content type"} from ${response.url}`
    );
  }

  const data = await response.json();

  /*
   * The backend may return the existing keyword rather than
   * creating a duplicate. In either case we want the keyword.
   */
  if (!response.ok && !data.keyword) {
    throw new Error(
      data.message ||
      data.error ||
      "Failed to create keyword"
    );
  }

  if (!data.keyword) {
    throw new Error(
      "Keyword response did not contain a keyword."
    );
  }

  return data.keyword;
};

export const fetchPrograms = async (): Promise<ModuleProgram[]> => {
  const response = await fetch(
    `${apiPrefix}/api/programs`,
    {
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
      },
    }
  );

  const contentType =
    response.headers.get("content-type");

  if (
    !contentType ||
    !contentType.includes("application/json")
  ) {
    throw new Error(
      `Programs request returned ${response.status} ${contentType || "unknown content type"} from ${response.url}`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      "Failed to fetch programs"
    );
  }

  return data;
};

export const fetchSpecializations = async (): Promise<
  ModuleSpecialization[]
> => {
  const response = await fetch(
    `${apiPrefix}/api/specializations`,
    {
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
      },
    }
  );

  const contentType =
    response.headers.get("content-type");

  if (
    !contentType ||
    !contentType.includes("application/json")
  ) {
    throw new Error(
      `Specializations request returned ${response.status} ${contentType || "unknown content type"} from ${response.url}`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      "Failed to fetch specializations"
    );
  }

  return data;
};

export type ModuleUploadUrlResponse = {
  uploadUrl: string;
  downloadLink: string;
  key: string;
  fileName: string;
};

export const createModuleUploadUrl = async (
  file: File
): Promise<ModuleUploadUrlResponse> => {
  const response = await fetch(
    `${apiPrefix}/api/admin/modules/upload-url`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || "application/zip",
      }),
    }
  );

  const contentType =
    response.headers.get("content-type");

  if (
    !contentType ||
    !contentType.includes("application/json")
  ) {
    throw new Error(
      `Module upload request returned ${response.status} ${
        contentType || "unknown content type"
      } from ${response.url}`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      "Failed to create module upload URL"
    );
  }

  return data;
};

export type ReplacementModuleUploadUrlResponse =
  ModuleUploadUrlResponse & {
    uploadId: string;
  };

export const createReplacementModuleUploadUrl = async (
  moduleId: number | string,
  file: File
): Promise<ReplacementModuleUploadUrlResponse> => {
  const response = await fetch(
    `${apiPrefix}/api/admin/modules/${moduleId}/replace-upload-url`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || "application/zip",
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to create replacement ZIP upload URL."
    );
  }

  return data;
};

export type ConfirmModuleReplacementResponse = {
  message: string;
  packageSize: string;
  package_uploaded_at: string;
};

export const confirmModuleReplacement = async (
  moduleId: number | string,
  uploadId: string,
  key: string
): Promise<ConfirmModuleReplacementResponse> => {
  const response = await fetch(
    `${apiPrefix}/api/admin/modules/${moduleId}/confirm-replacement`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uploadId, key }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to confirm module ZIP replacement."
    );
  }

  return data;
};

export const uploadModuleZipToS3 = async (
  file: File,
  uploadUrl: string,
  uploadId?: string
): Promise<void> => {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/zip",
      ...(uploadId ? { "x-amz-meta-uploadid": uploadId } : {}),
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(
      `Failed to upload module ZIP to S3 (${response.status}).`
    );
  }
};

export const deleteModule = async (
  moduleId: number | string
): Promise<{ message: string }> => {
  const response = await fetch(
    `${apiPrefix}/api/admin/modules/${moduleId}`,
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
      data.message || "Failed to delete module."
    );
  }

  return data;
};