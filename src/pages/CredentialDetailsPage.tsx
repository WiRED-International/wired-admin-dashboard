import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageContainer from "../components/ui/PageContainer";
import Panel from "../components/ui/Panel";
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner";
import {
  CredentialRecord,
  fetchCredentialById,
  revokeCredential,
} from "../api/credentialsAPI";
import { formatCredentialDate } from "../utils/credentialDate";

const CredentialDetailsPage = () => {
  const navigate = useNavigate();
  const { credentialId } = useParams<{ credentialId: string }>();

  const [credential, setCredential] = useState<CredentialRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [revocationReason, setRevocationReason] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [revocationError, setRevocationError] = useState("");
  const [revocationMessage, setRevocationMessage] = useState("");

  useEffect(() => {
    const loadCredential = async () => {
      const parsedCredentialId = Number(credentialId);

      if (
        !Number.isSafeInteger(parsedCredentialId) ||
        parsedCredentialId <= 0
      ) {
        setError("Invalid credential ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await fetchCredentialById(parsedCredentialId);

        setCredential(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load credential details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCredential();
  }, [credentialId]);

  const handleRevokeCredential = async () => {
    if (!credential) return;

    const reason = revocationReason.trim();

    if (!reason) {
      setRevocationError("A revocation reason is required.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to revoke ${credential.credential_number}? This will change the credential's official status to revoked.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRevoking(true);
      setRevocationError("");
      setRevocationMessage("");

      const result = await revokeCredential(
        credential.id,
        reason
      );

      setCredential(result.credential);
      setRevocationReason("");
      setRevocationMessage(result.message);
    } catch (err) {
      setRevocationError(
        err instanceof Error
          ? err.message
          : "Failed to revoke credential."
      );
    } finally {
      setRevoking(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !credential) {
    return (
      <PageContainer>
        <button
          type="button"
          onClick={() => navigate("/credentials")}
          style={styles.backButton}
        >
          ← Back to Credential Ledger
        </button>

        <Panel>
          <p style={styles.error}>
            {error || "Credential not found."}
          </p>
        </Panel>
      </PageContainer>
    );
  }

  const requirements = credential.requirements_snapshot;
  const moduleRequirements = requirements.modules.requirements;
  const finalExam = requirements.final_exam;

  return (
    <PageContainer>
      <button
        type="button"
        onClick={() => navigate("/credentials")}
        style={styles.backButton}
      >
        ← Back to Credential Ledger
      </button>

      <Panel>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              {credential.credential_number}
            </h1>

            <p style={styles.subtitle}>
              WiRED Credential Award Record
            </p>
          </div>

          <span
            style={
              credential.status === "awarded"
                ? styles.awardedBadge
                : styles.revokedBadge
            }
          >
            {credential.status === "awarded"
              ? "Awarded"
              : "Revoked"}
          </span>
        </div>
      </Panel>

      <Panel>
        <h2 style={styles.sectionTitle}>
          Credential Information
        </h2>

        <div style={styles.infoGrid}>
          <div style={styles.label}>Student</div>
          <div style={styles.value}>
            <button
              type="button"
              onClick={() =>
                navigate(`/userview/${credential.user_id}`)
              }
              style={styles.linkButton}
            >
              {credential.student_name_snapshot}
            </button>
          </div>

          <div style={styles.label}>WiRED ID</div>
          <div style={styles.value}>
            {credential.wired_user_id_snapshot}
          </div>

          <div style={styles.label}>Program</div>
          <div style={styles.value}>
            {credential.program?.name || "—"}
          </div>

          <div style={styles.label}>Specialization</div>
          <div style={styles.value}>
            {credential.specialization?.name || "—"}
          </div>

          <div style={styles.label}>Class</div>
          <div style={styles.value}>
            {credential.class_name_snapshot}
          </div>

          <div style={styles.label}>Awarded</div>
          <div style={styles.value}>
            {formatCredentialDate(credential.awarded_at)}
          </div>

          <div style={styles.label}>Final Exam Score</div>
          <div style={styles.value}>
            {credential.exam_score_snapshot}%
          </div>

          <div style={styles.label}>Status</div>
          <div style={styles.value}>
            {credential.status === "awarded"
              ? "Awarded"
              : "Revoked"}
          </div>
        </div>
      </Panel>

      <Panel>
        <h2 style={styles.sectionTitle}>
          Module Requirements at Award
        </h2>

        <p style={styles.requirementSummary}>
          Passed {requirements.modules.passed_count} of{" "}
          {requirements.modules.required_count} required modules.
        </p>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Module ID</th>
                <th style={styles.tableHeader}>Title</th>
                <th style={styles.tableHeader}>Score</th>
                <th style={styles.tableHeader}>Completed</th>
                <th style={styles.tableHeader}>Status</th>
              </tr>
            </thead>

            <tbody>
              {moduleRequirements.map((requirement) => (
                <tr key={requirement.module_id}>
                  <td style={styles.tableCell}>
                    {requirement.external_module_id}
                  </td>

                  <td style={styles.tableCell}>
                    {requirement.name}
                  </td>

                  <td style={styles.tableCell}>
                    {requirement.score === null
                      ? "—"
                      : `${requirement.score}%`}
                  </td>

                  <td style={styles.tableCell}>
                    {formatCredentialDate(requirement.date_taken)}
                  </td>

                  <td style={styles.tableCell}>
                    <span
                      style={
                        requirement.passed
                          ? styles.passedBadge
                          : styles.failedBadge
                      }
                    >
                      {requirement.passed ? "Passed" : "Not Passed"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel>
        <h2 style={styles.sectionTitle}>
          Final Exam at Award
        </h2>

        <div style={styles.infoGrid}>
          <div style={styles.label}>Exam Score</div>
          <div style={styles.value}>
            {finalExam.score}%
          </div>

          <div style={styles.label}>Completed</div>
          <div style={styles.value}>
            {formatCredentialDate(finalExam.submitted_at)}
          </div>

          <div style={styles.label}>Exam ID</div>
          <div style={styles.value}>
            {finalExam.exam_id}
          </div>

          <div style={styles.label}>Exam Session ID</div>
          <div style={styles.value}>
            {finalExam.session_id}
          </div>
        </div>
      </Panel>

      {credential.status === "awarded" && (
        <Panel>
          <h2 style={styles.sectionTitle}>
            Credential Administration
          </h2>

          <p style={styles.revocationHelp}>
            Revoking a credential preserves the original award record
            and evidence, but changes the credential's official status
            to revoked.
          </p>

          <label style={styles.revocationLabel}>
            Revocation Reason
          </label>

          <textarea
            value={revocationReason}
            onChange={(event) => {
              setRevocationReason(event.target.value);

              if (revocationError) {
                setRevocationError("");
              }
            }}
            placeholder="Enter the reason this credential is being revoked..."
            rows={4}
            style={styles.textarea}
            disabled={revoking}
          />

          {revocationError && (
            <p style={styles.revocationError}>
              {revocationError}
            </p>
          )}

          {revocationMessage && (
            <p style={styles.revocationSuccess}>
              {revocationMessage}
            </p>
          )}

          <button
            type="button"
            onClick={handleRevokeCredential}
            disabled={revoking}
            style={{
              ...styles.revokeButton,
              ...(revoking ? styles.revokeButtonDisabled : {}),
            }}
          >
            {revoking ? "Revoking..." : "Revoke Credential"}
          </button>
        </Panel>
      )}

      {credential.status === "revoked" && (
        <Panel>
          <h2 style={styles.sectionTitle}>
            Revocation Information
          </h2>

          <div style={styles.infoGrid}>
            <div style={styles.label}>Revoked</div>
            <div style={styles.value}>
              {formatCredentialDate(credential.revoked_at)}
            </div>

            <div style={styles.label}>Reason</div>
            <div style={styles.value}>
              {credential.revocation_reason || "—"}
            </div>
          </div>
        </Panel>
      )}
    </PageContainer>
  );
};

export default CredentialDetailsPage;

const styles: Record<string, React.CSSProperties> = {
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    marginBottom: "20px",
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 600,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 700,
  },

  subtitle: {
    marginTop: "8px",
    marginBottom: 0,
    color: "#777",
  },

  sectionTitle: {
    marginTop: 0,
    marginBottom: "24px",
    fontSize: "22px",
    fontWeight: 600,
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "180px 1fr",
    rowGap: "18px",
    columnGap: "30px",
  },

  label: {
    fontWeight: 600,
    color: "#666",
  },

  value: {
    color: "#222",
  },

  awardedBadge: {
    display: "inline-flex",
    padding: "6px 12px",
    borderRadius: "999px",
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    fontSize: "13px",
    fontWeight: 600,
  },

  revokedBadge: {
    display: "inline-flex",
    padding: "6px 12px",
    borderRadius: "999px",
    backgroundColor: "#fdecec",
    color: "#b91c1c",
    fontSize: "13px",
    fontWeight: 600,
  },

  requirementSummary: {
    marginTop: 0,
    marginBottom: "20px",
    color: "#666",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  tableHeader: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "2px solid #ddd",
  },

  tableCell: {
    padding: "12px",
    borderBottom: "1px solid #eee",
  },

  passedBadge: {
    display: "inline-flex",
    padding: "5px 10px",
    borderRadius: "999px",
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    fontSize: "13px",
    fontWeight: 600,
  },

  failedBadge: {
    display: "inline-flex",
    padding: "5px 10px",
    borderRadius: "999px",
    backgroundColor: "#fdecec",
    color: "#b91c1c",
    fontSize: "13px",
    fontWeight: 600,
  },

  linkButton: {
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    font: "inherit",
    fontWeight: 600,
  },

  error: {
    margin: 0,
    color: "#b91c1c",
    fontWeight: 600,
  },

  revocationHelp: {
    marginTop: 0,
    marginBottom: "20px",
    color: "#666",
    lineHeight: 1.5,
  },

  revocationLabel: {
    display: "block",
    marginBottom: "8px",
    fontWeight: 600,
    color: "#444",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    font: "inherit",
    resize: "vertical",
    marginBottom: "12px",
  },

  revokeButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#b91c1c",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },

  revokeButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },

  revocationError: {
    marginTop: 0,
    marginBottom: "12px",
    color: "#b91c1c",
    fontWeight: 600,
  },

  revocationSuccess: {
    marginTop: 0,
    marginBottom: "12px",
    color: "#2e7d32",
    fontWeight: 600,
  },
};