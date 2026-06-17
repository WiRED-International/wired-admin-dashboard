import { useEffect, useRef, useState } from "react";
import {
  getScheduledExams,
  getAccessibleOrganizations,
  ScheduledExam
} from "@/api/examsAPI";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";

function renderStatusBadge(status: string) {
  const base: React.CSSProperties = {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: 600,
  };

  switch (status) {
    case "Active":
      return (
        <span
          style={{
            ...base,
            backgroundColor: "#DCFCE7",
            color: "#15803D",
          }}
        >
          Active
        </span>
      );

    case "Scheduled":
      return (
        <span
          style={{
            ...base,
            backgroundColor: "#DBEAFE",
            color: "#1D4ED8",
          }}
        >
          Scheduled
        </span>
      );

    case "Closed":
      return (
        <span
          style={{
            ...base,
            backgroundColor: "#F3F4F6",
            color: "#4B5563",
          }}
        >
          Closed
        </span>
      );

    default:
      return <span>{status}</span>;
  }
}


export default function ScheduledExamsPage() {

  const [exams, setExams] =
    useState<ScheduledExam[]>([]);

  const [statusFilter, setStatusFilter] = useState("All");

  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState<number | null>(null);
  const [organizations, setOrganizations] = useState <{ id: number; name: string }[]> ([]);
  const [page, setPage] = useState(1);

  const [pageCount, setPageCount] = useState(1);

  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState("available_from");

  const [sortOrder, setSortOrder] = useState <"ASC" | "DESC"> ("DESC");

  const [orgOpen, setOrgOpen] = useState(false);

  const [orgSearch, setOrgSearch] = useState("");

  const orgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadOrganizations = async () => {
        try {
          const data = await getAccessibleOrganizations();

          setOrganizations(data);

        } catch (err) {
          console.error(
            "Failed to load organizations:",
            err
          );
        }
    };

    const loadExams = async () => {

      try {

        const data =
          await getScheduledExams({
            status: statusFilter,
            search: searchTerm,
            organizationId:
              organizationFilter,
            page,
            limit: 10,
            sortBy,
            sortOrder,
          });

        setExams(data.exams);

        setPageCount(
          data.pageCount
        );

        setTotalCount(
          data.totalCount
        );

      } catch (err) {

        console.error(
          "Failed to load exams:",
          err
        );

      }
    };

    loadExams();
    loadOrganizations();

  }, [
    statusFilter,
    searchTerm,
    organizationFilter,
    page,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        orgRef.current &&
        !orgRef.current.contains(event.target as Node)
      ) {
        setOrgOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);
    const formatDate = (value: string) => {

      return new Date(value).toLocaleString(
          "en-US",
          {
          dateStyle: "medium",
          timeStyle: "short",
          }
      );
    };
    
    const handleSort = (
      field: string
    ) => {

      if (sortBy === field) {

        setSortOrder(
          sortOrder === "ASC"
            ? "DESC"
            : "ASC"
        );

      } else {

        setSortBy(field);

        setSortOrder("ASC");

      }

      setPage(1);

    };
    const filteredOrgs = organizations.filter((org) =>
      org.name
        .toLowerCase()
        .includes(orgSearch.toLowerCase())
    );
  return (
    <PageContainer>

      <PageHeader
        title="Scheduled Exams"
        subtitle="Manage scheduled, active, and completed exams"
      />

      <Panel>

        <div
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <input
            type="text"
            placeholder="Search exams..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            style={{
              width: "300px",
              padding: "10px 14px",
              backgroundColor: "#F4F4F5",
              borderRadius: "6px",
              fontSize: "14px",
              color: "#444",
              border: "1px solid #ddd",
            }}
          />

          <div>
            <label style={{ marginRight: "8px" }}> Status </label>

            <select
              style={{
                padding: "10px 14px",
                backgroundColor: "#F4F4F5",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#444",
                border: "1px solid #ddd",
              }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}

            >
              <option value="All">All</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Active">Active</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div style={{ position: "relative" }} ref={orgRef}>
            <label style={{ marginRight: "8px" }}>
              Organization
            </label>

            <div
              style={{
                display: "inline-block",
                minWidth: "220px",
                padding: "10px 14px",
                backgroundColor: "#F4F4F5",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#444",
                border: "1px solid #ddd",
                cursor: "pointer",
              }}
              onClick={() => setOrgOpen(!orgOpen)}
            >
              {organizationFilter
                ? organizations.find((o) => o.id === organizationFilter)?.name
                : "All Organizations"}
            </div>

            {orgOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "95px",
                  marginTop: "4px",
                  width: "320px",
                  background: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  zIndex: 1000,
                }}
              >
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  autoFocus
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    border: "none",
                    borderBottom: "1px solid #E5E7EB",
                    fontSize: "14px",
                  }}
                />

                <div
                  style={{
                    maxHeight: "220px",
                    overflowY: "auto",
                  }}
                >
                  {filteredOrgs.length === 0 && (
                    <div style={{ padding: "12px", color: "#666" }}>
                      No organizations found
                    </div>
                  )}

                  {filteredOrgs.map((org) => (
                    <div
                      key={org.id}
                      style={{
                        padding: "10px 12px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                      onClick={() => {
                        setOrganizationFilter(org.id);
                        setPage(1);
                        setOrgOpen(false);
                        setOrgSearch("");
                      }}
                    >
                      {org.name}
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    padding: "10px 12px",
                    borderTop: "1px solid #E5E7EB",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#B91C1C",
                    fontWeight: 600,
                  }}
                  onClick={() => {
                    setOrganizationFilter(null);
                    setPage(1);
                    setOrgOpen(false);
                    setOrgSearch("");
                  }}
                >
                  Clear Organization Filter
                </div>
              </div>
            )}
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th
                onClick={() =>
                  handleSort("title")
                }
                style={{
                  ...styles.th,
                  cursor: "pointer"
                }}
              >
                Title{" "}
                {sortBy === "title"
                  ? sortOrder === "ASC"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() =>
                  handleSort("status")
                }
                style={{
                  ...styles.th,
                  cursor: "pointer"
                }}
              >
                Status{" "}
                {sortBy === "status"
                  ? sortOrder === "ASC"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() =>
                  handleSort("available_from")
                }
                style={{
                  ...styles.th,
                  cursor: "pointer"
                }}
              >
                Start{" "}
                {sortBy === "available_from"
                  ? sortOrder === "ASC"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() =>
                  handleSort("available_until")
                }
                style={{
                  ...styles.th,
                  cursor: "pointer"
                }}
              >
                End{" "}
                {sortBy === "available_until"
                  ? sortOrder === "ASC"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th style={styles.th}>Organizations</th>
              <th
                onClick={() =>
                  handleSort("participant_count")
                }
                style={{
                  ...styles.th,
                  cursor: "pointer"
                }}
              >
                Participants{" "}
                {sortBy === "participant_count"
                  ? sortOrder === "ASC"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th style={styles.th}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>

            {exams.length === 0 ? (

              <tr>

              <td colSpan={7}>
                No exams found.
              </td>

              </tr>

            ) : (

              exams.map((exam) => (

              <tr key={exam.id}>
                <td style={styles.td}>{exam.title}</td>
                <td style={styles.td}>
                  {renderStatusBadge(exam.status)}
                </td>
                <td style={styles.td}>
                  {formatDate(
                    exam.available_from
                  )}
                  <br />
                  <small>
                    {exam.time_zone}
                  </small>
                </td>
                <td style={styles.td}>
                  {formatDate(
                    exam.available_until
                  )}
                  <br />
                  <small>
                    {exam.time_zone}
                  </small>
                </td>
                <td style={styles.td}>{exam.organizations.map(o => o.name).join(", ")}</td>
                <td style={styles.td}>{exam.participant_count}</td>
                <td style={styles.td}>
                  <button
                    style={styles.actionBtn}
                    onClick={() =>
                      navigate(`/exams/${exam.id}`)
                    }
                  >
                    View
                  </button>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
        <div style={styles.pagination}>

          <button
            style={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => setPage(1)}
          >
            ⏮ First
          </button>

          <button
            style={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            ◀ Prev
          </button>

          <span style={styles.pageInfo}>
            Page <b>{page}</b> of <b>{pageCount}</b>
            {" • "}
            {totalCount} exams
          </span>

          <button
            style={styles.pageBtn}
            disabled={page >= pageCount}
            onClick={() => setPage(page + 1)}
          >
            Next ▶
          </button>

          <button
            style={styles.pageBtn}
            disabled={page >= pageCount}
            onClick={() => setPage(pageCount)}
          >
            Last ⏭
          </button>

        </div>
      </Panel>
    </PageContainer>
  );
}

const styles: {
  [key: string]: React.CSSProperties;
} = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    fontSize: "14px",
    fontWeight: 600,
    padding: "12px",
    background: "#F4F4F5",
    borderBottom: "1px solid #ddd",
  },

  td: {
    padding: "14px 12px",
    fontSize: "14px",
    color: "#333",
    borderBottom: "1px solid #eee",
  },

  actionBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#2B78F6",
    color: "#fff",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },

  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
    marginTop: "20px",
  },

  pageBtn: {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "1px solid #aaa",
    background: "#f6f6f6",
    cursor: "pointer",
    fontSize: "14px",
  },

  pageInfo: {
    fontSize: "14px",
  },
}