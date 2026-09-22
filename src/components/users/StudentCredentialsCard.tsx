import { useState } from "react";
import Panel from "../ui/Panel";
import {
  CredentialRecord,
  CredentialRecheckResponse,
  StudentCredentialEnrollment,
  StudentCredentialsResponse,
  fetchStudentCredentials,
  recheckStudentCredential,
} from "../../api/credentialsAPI";
import { formatCredentialDate } from "../../utils/credentialDate";

type Props = {
  userId: number;
  data: StudentCredentialsResponse;
  onRefresh: (data: StudentCredentialsResponse) => void;
};

const StudentCredentialsCard = ({ userId, data, onRefresh }: Props) => {
  const [checkingClassId, setCheckingClassId] = useState<number | null>(null);
  const [results, setResults] = useState<
    Record<number, CredentialRecheckResponse>
  >({});
  const [errors, setErrors] = useState<Record<number, string>>({});

  const getCredential = (
    enrollment: StudentCredentialEnrollment
  ): CredentialRecord | undefined =>
    data.credentials.find(
      (credential) => credential.class_id === enrollment.class_id
    );

  const handleRecheck = async (classId: number) => {
    setCheckingClassId(classId);
    setErrors((previous) => ({ ...previous, [classId]: "" }));

    try {
      const result = await recheckStudentCredential(userId, classId);

      setResults((previous) => ({
        ...previous,
        [classId]: result,
      }));

      const refreshed = await fetchStudentCredentials(userId);
      onRefresh(refreshed);
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        [classId]:
          error instanceof Error ? error.message : "Recheck failed.",
      }));
    } finally {
      setCheckingClassId(null);
    }
  };

  const renderResult = (result: CredentialRecheckResponse) => {
    if (result.issued) {
      return <p style={styles.success}>Credential issued successfully.</p>;
    }

    if (result.already_exists) {
      return <p style={styles.success}>Credential already exists.</p>;
    }

    const eligibility = result.eligibility;

    return (
      <div style={styles.result}>
        <p style={styles.resultTitle}>
          {result.reason || result.message}
        </p>

        {eligibility?.modules && (
          <p>
            Modules passed: {eligibility.modules.passed_count} of{" "}
            {eligibility.modules.required_count}
          </p>
        )}

        {eligibility?.final_exam === null && (
          <p>Required final exam: Not passed</p>
        )}

        {eligibility?.modules?.requirements
          .filter((requirement) => !requirement.passed)
          .map((requirement) => (
            <p key={requirement.module_id}>
              {requirement.name}:{" "}
              {requirement.score === null
                ? "No score"
                : `${requirement.score}%`}
            </p>
          ))}
      </div>
    );
  };

  return (
    <Panel>
      <h2 style={styles.title}>Credentials</h2>

      <p style={styles.description}>
        WiRED training credentials and eligibility by class enrollment.
      </p>

      {data.enrollments.length === 0 ? (
        <p style={styles.empty}>No formal-training enrollments found.</p>
      ) : (
        <div style={styles.list}>
          {data.enrollments.map((enrollment) => {
            const credential = getCredential(enrollment);
            const result = results[enrollment.class_id];
            const error = errors[enrollment.class_id];
            const checking = checkingClassId === enrollment.class_id;

            return (
              <div key={enrollment.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.programName}>
                      {enrollment.class.program.name}
                    </h3>
                    <p style={styles.className}>
                      {enrollment.class.name}
                    </p>
                    {enrollment.specialization_selection && (
                      <p style={styles.specialization}>
                        {
                          enrollment.specialization_selection.specialization
                            .name
                        }
                      </p>
                    )}
                  </div>

                  <span
                    style={
                      credential?.status === "awarded"
                        ? styles.awardedBadge
                        : styles.pendingBadge
                    }
                  >
                    {credential?.status === "awarded"
                      ? "Awarded"
                      : credential?.status === "revoked"
                      ? "Revoked"
                      : "Not Awarded"}
                  </span>
                </div>

                {credential && (
                  <div style={styles.credentialDetails}>
                    <div>
                      <strong>Credential:</strong>{" "}
                      {credential.credential_number}
                    </div>
                    <div>
                      <strong>Awarded:</strong>{" "}
                      {formatCredentialDate(credential.awarded_at)}
                    </div>
                    <div>
                      <strong>Final exam score:</strong>{" "}
                      {credential.exam_score_snapshot}%
                    </div>
                    {credential.status === "revoked" &&
                      credential.revocation_reason && (
                        <div>
                          <strong>Revocation reason:</strong>{" "}
                          {credential.revocation_reason}
                        </div>
                      )}
                  </div>
                )}

                {!credential && (
                  <button
                    type="button"
                    onClick={() => handleRecheck(enrollment.class_id)}
                    disabled={checkingClassId !== null}
                    style={styles.recheckButton}
                  >
                    {checking ? "Checking..." : "Recheck Eligibility"}
                  </button>
                )}

                {result && renderResult(result)}

                {error && <p style={styles.error}>{error}</p>}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
};

export default StudentCredentialsCard;

const styles: Record<string, React.CSSProperties> = {
  title: {
    marginTop: 0,
    marginBottom: "8px",
    fontSize: "22px",
    fontWeight: 600,
  },
  description: {
    color: "#777",
    marginBottom: "24px",
  },
  empty: {
    color: "#777",
    fontStyle: "italic",
  },
  list: {
    display: "grid",
    gap: "16px",
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "20px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
  },
  programName: {
    margin: 0,
    fontSize: "18px",
  },
  className: {
    margin: "6px 0",
    color: "#666",
  },
  specialization: {
    margin: "6px 0",
    color: "#2563eb",
    fontWeight: 600,
  },
  awardedBadge: {
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 600,
  },
  pendingBadge: {
    backgroundColor: "#f3f4f6",
    color: "#555",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 600,
  },
  credentialDetails: {
    marginTop: "16px",
    lineHeight: 1.8,
    fontSize: "14px",
  },
  recheckButton: {
    marginTop: "16px",
    padding: "9px 14px",
    border: "1px solid #2563eb",
    borderRadius: "6px",
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    fontWeight: 600,
  },
  result: {
    marginTop: "16px",
    padding: "14px",
    backgroundColor: "#f8fafc",
    borderRadius: "6px",
    fontSize: "14px",
  },
  resultTitle: {
    marginTop: 0,
    fontWeight: 600,
  },
  success: {
    color: "#2e7d32",
    fontWeight: 600,
  },
  error: {
    color: "#b91c1c",
    marginTop: "12px",
  },
};