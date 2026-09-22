import Auth from "../utils/auth";
import { apiPrefix } from "../utils/globalVariables";

export type CredentialType = "basic" | "act" | "specialization";

export interface StudentCredentialEnrollment {
  id: number;
  user_id: number;
  class_id: number;
  status: string;
  enrolled_at: string;
  class: {
    id: number;
    name: string;
    status: string;
    program_id: number;
    start_date: string | null;
    end_date: string | null;
    program: {
      id: number;
      name: string;
      training_type: CredentialType;
    };
  };
  specialization_selection: {
    id: number;
    specialization_id: number;
    specialization: {
      id: number;
      name: string;
    };
  } | null;
}

export interface CredentialModuleRequirement {
  name: string;
  score: number | null;
  passed: boolean;
  module_id: number;
  date_taken: string | null;
  external_module_id: string;
}

export interface CredentialRequirementsSnapshot {
  modules: {
    all_passed: boolean;
    program_id: number;
    passed_count: number;
    program_name: string;
    requirements: CredentialModuleRequirement[];
    required_count: number;
    specialization_id: number | null;
  };
  final_exam: {
    score: number;
    exam_id: number;
    session_id: number;
    submitted_at: string;
  };
  program_id: number;
  credential_type: CredentialType;
  specialization_id: number | null;
}

export interface CredentialRecord {
  id: number;
  credential_number: string;
  credential_type: CredentialType;
  user_id: number;
  class_id: number;
  program_id: number;
  specialization_id: number | null;
  wired_user_id_snapshot: string;
  student_name_snapshot: string;
  class_name_snapshot: string;
  awarded_at: string;
  exam_score_snapshot: number;
  exam_session_id: number | null;
  exam_completed_at_snapshot: string;
  requirements_snapshot: CredentialRequirementsSnapshot;
  status: "awarded" | "revoked";
  revoked_at: string | null;
  revocation_reason: string | null;
  class: {
    id: number;
    name: string;
  };
  program: {
    id: number;
    name: string;
    training_type: CredentialType;
  };
  specialization: {
    id: number;
    name: string;
  } | null;
  user?: {
    id: number;
    wired_user_id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface CredentialLedgerPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CredentialLedgerResponse {
  credentials: CredentialRecord[];
  pagination: CredentialLedgerPagination;
}

export interface FetchCredentialLedgerParams {
  page: number;
  limit: number;
  query?: string;
  type?: CredentialType;
  status?: "awarded" | "revoked";
}

export interface StudentCredentialsResponse {
  user: {
    id: number;
    wired_user_id: string;
    first_name: string;
    last_name: string;
  };
  enrollments: StudentCredentialEnrollment[];
  credentials: CredentialRecord[];
}

export interface EarnedSpecializationRecord {
  credential_id: number;
  credential_number: string;
  awarded_at: string;
  specialization: {
    id: number;
    name: string;
  };
}

export interface EarnedSpecializationsResponse {
  specializations: EarnedSpecializationRecord[];
}

export interface CredentialRecheckResponse {
  message: string;
  issued: boolean;
  already_exists?: boolean;
  reason?: string;
  credential?: CredentialRecord;
  eligibility?: {
    eligible: boolean;
    reason?: string;
    modules?: {
      required_count: number;
      passed_count: number;
      all_passed: boolean;
      requirements: Array<{
        module_id: number;
        name: string;
        score: number | null;
        passed: boolean;
      }>;
    };
    final_exam?: {
      session_id: number;
      exam_id: number;
      score: number;
      submitted_at: string;
    } | null;
  };
}

export const fetchStudentCredentials = async (
  userId: number
): Promise<StudentCredentialsResponse> => {
  const response = await fetch(
    `${apiPrefix}/api/admin/credentials/students/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch student credentials.");
  }

  return data;
};

export const fetchEarnedSpecializations = async (
  userId: number
): Promise<EarnedSpecializationsResponse> => {
  const response = await fetch(
    `${apiPrefix}/api/admin/credentials/students/${userId}/earned-specializations`,
    {
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch earned specializations."
    );
  }

  return data;
};

export const recheckStudentCredential = async (
  userId: number,
  classId: number
): Promise<CredentialRecheckResponse> => {
  const response = await fetch(
    `${apiPrefix}/api/admin/credentials/recheck`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Auth.getToken()}`,
      },
      body: JSON.stringify({
        userId,
        classId,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to recheck credential eligibility.");
  }

  return data;
};

export const fetchCredentialLedger = async (): Promise<CredentialRecord[]> => {
  const response = await fetch(
    `${apiPrefix}/api/admin/credentials`,
    {
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch credential ledger.");
  }

  return data;
};

export const fetchPaginatedCredentialLedger = async (
  params: FetchCredentialLedgerParams
): Promise<CredentialLedgerResponse> => {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

  if (params.query?.trim()) {
    searchParams.set("query", params.query.trim());
  }

  if (params.type) {
    searchParams.set("type", params.type);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  const response = await fetch(
    `${apiPrefix}/api/admin/credentials?${searchParams.toString()}`,
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
        "Failed to fetch credential ledger."
    );
  }

  return data;
};

export const fetchCredentialById = async (
  credentialId: number
): Promise<CredentialRecord> => {
  const response = await fetch(
    `${apiPrefix}/api/admin/credentials/${credentialId}`,
    {
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch credential details.");
  }

  return data;
};

export interface RevokeCredentialResponse {
  message: string;
  credential: CredentialRecord;
}

export const revokeCredential = async (
  credentialId: number,
  reason: string
): Promise<RevokeCredentialResponse> => {
  const response = await fetch(
    `${apiPrefix}/api/admin/credentials/${credentialId}/revoke`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Auth.getToken()}`,
      },
      body: JSON.stringify({
        reason,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to revoke credential.");
  }

  return data;
};
