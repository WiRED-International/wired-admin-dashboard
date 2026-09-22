import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import PageContainer from "../components/ui/PageContainer";
import Panel from "../components/ui/Panel";
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner";
import {
  CredentialRecord,
  CredentialType,
  fetchPaginatedCredentialLedger,
} from "../api/credentialsAPI";
import { formatCredentialDate } from "../utils/credentialDate";

const CredentialLedgerPage = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState<CredentialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCredentials, setTotalCredentials] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const pageLimit = 25;

  const loadCredentials = useCallback(async () => {
    try {
      setLoading(true);

      const data = await fetchPaginatedCredentialLedger({
        page: currentPage,
        limit: pageLimit,
        query: searchText,
        type: selectedType
          ? (selectedType as CredentialType)
          : undefined,
        status: selectedStatus
          ? (selectedStatus as "awarded" | "revoked")
          : undefined,
      });

      setCredentials(data.credentials || []);
      setTotalCredentials(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error(
        "Failed to load credential ledger:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    searchText,
    selectedType,
    selectedStatus,
  ]);

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <PageContainer>
      <Panel>
        <h1 style={styles.title}>WiRED Credential Ledger</h1>

        <p style={styles.subtitle}>
          Review credentials awarded through WiRED formal training programs.
        </p>
      </Panel>

      <Panel>
        <div style={styles.toolbar}>
          <input
            type="text"
            placeholder="Search student, WiRED ID, credential, class..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setCurrentPage(1);
            }}
            style={styles.searchInput}
          />

          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setCurrentPage(1);
            }}
            style={styles.filterSelect}
          >
            <option value="">All Credential Types</option>
            <option value="basic">Basic CHW</option>
            <option value="act">ACT</option>
            <option value="specialization">Specialization</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            style={styles.filterSelect}
          >
            <option value="">All Statuses</option>
            <option value="awarded">Awarded</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>

        <div style={styles.resultCount}>
          {totalCredentials} credential
          {totalCredentials === 1 ? "" : "s"}
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Credential</th>
                <th style={styles.tableHeader}>Student</th>
                <th style={styles.tableHeader}>WiRED ID</th>
                <th style={styles.tableHeader}>Program</th>
                <th style={styles.tableHeader}>Specialization</th>
                <th style={styles.tableHeader}>Class</th>
                <th style={styles.tableHeader}>Awarded</th>
                <th style={styles.tableHeader}>Exam Score</th>
                <th style={styles.tableHeader}>Status</th>
              </tr>
            </thead>

            <tbody>
              {credentials.length === 0 ? (
                <tr>
                  <td colSpan={9} style={styles.emptyRow}>
                    No credentials found.
                  </td>
                </tr>
              ) : (
                credentials.map((credential) => (
                  <tr key={credential.id}>
                    <td style={styles.tableCell}>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/credentials/${credential.id}`)
                        }
                        style={styles.credentialLink}
                      >
                        {credential.credential_number}
                      </button>
                    </td>

                    <td style={styles.tableCell}>
                      <button
                        type="button"
                        onClick={() => navigate(`/userview/${credential.user_id}`)}
                        style={styles.studentLink}
                      >
                        {credential.student_name_snapshot}
                      </button>
                    </td>

                    <td style={styles.tableCell}>
                      {credential.wired_user_id_snapshot}
                    </td>

                    <td style={styles.tableCell}>
                      {credential.program?.name || "—"}
                    </td>

                    <td style={styles.tableCell}>
                      {credential.specialization?.name || "—"}
                    </td>

                    <td style={styles.tableCell}>
                      {credential.class_name_snapshot}
                    </td>

                    <td style={styles.tableCell}>
                      {formatCredentialDate(credential.awarded_at)}
                    </td>

                    <td style={styles.tableCell}>
                      {credential.exam_score_snapshot}%
                    </td>

                    <td style={styles.tableCell}>
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={styles.pagination}>
          <button
            type="button"
            style={styles.paginationButton}
            onClick={() =>
              setCurrentPage((page) =>
                Math.max(1, page - 1)
              )
            }
            disabled={currentPage === 1}
          >
            Previous
          </button>

          <span style={styles.paginationText}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            style={styles.paginationButton}
            onClick={() =>
              setCurrentPage((page) =>
                Math.min(totalPages, page + 1)
              )
            }
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </Panel>
    </PageContainer>
  );
};

export default CredentialLedgerPage;

const styles: Record<string, React.CSSProperties> = {
  title: {
    marginTop: 0,
    marginBottom: "8px",
    fontSize: "30px",
    fontWeight: 700,
  },

  subtitle: {
    margin: 0,
    color: "#777",
  },

  toolbar: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },

  searchInput: {
    flex: 1,
    minWidth: "320px",
    padding: "10px 14px",
  },

  filterSelect: {
    minWidth: "190px",
    padding: "10px",
  },

  resultCount: {
    marginBottom: "16px",
    color: "#666",
    fontSize: "14px",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1100px",
  },

  tableHeader: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "2px solid #ddd",
    whiteSpace: "nowrap",
  },

  tableCell: {
    padding: "12px",
    borderBottom: "1px solid #eee",
    verticalAlign: "top",
  },

  emptyRow: {
    textAlign: "center",
    padding: "40px",
    color: "#777",
  },

  awardedBadge: {
    display: "inline-flex",
    padding: "5px 10px",
    borderRadius: "999px",
    backgroundColor: "#e8f5e9",
    color: "#2e7d32",
    fontSize: "13px",
    fontWeight: 600,
  },

  revokedBadge: {
    display: "inline-flex",
    padding: "5px 10px",
    borderRadius: "999px",
    backgroundColor: "#fdecec",
    color: "#b91c1c",
    fontSize: "13px",
    fontWeight: 600,
  },

  studentLink: {
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    font: "inherit",
    fontWeight: 600,
    textAlign: "left",
  },

  credentialLink: {
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    font: "inherit",
    fontWeight: 600,
    textAlign: "left",
  },

  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginTop: "20px",
  },

  paginationButton: {
    padding: "7px 12px",
    borderRadius: "6px",
    border: "1px solid #CBD5E1",
    backgroundColor: "#FFFFFF",
    color: "#334155",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },

  paginationText: {
    color: "#64748B",
    fontSize: "14px",
  },
};