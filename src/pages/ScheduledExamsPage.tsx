import { useEffect, useState } from "react";
import {
  getScheduledExams,
  getAccessibleOrganizations,
  ScheduledExam
} from "@/api/examsAPI";
import {
  fetchClassPrograms,
  fetchClasses,
} from "@/api/classAPI";

import {
  ClassProgramOption,
  ClassItem,
} from "@/interfaces/Class";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import SearchableOrganizationPicker from "@/components/Common/SearchableOrganizationPicker";
import SearchablePicker from "@/components/Common/SearchablePicker";

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
  const [organizations, setOrganizations] = useState<{ id: number; name: string }[]>([]);

  const [programFilter, setProgramFilter] = useState<number | null>(null);
  const [programs, setPrograms] = useState<ClassProgramOption[]>([]);

  const [classFilter, setClassFilter] = useState<number | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [page, setPage] = useState(1);

  const [pageCount, setPageCount] = useState(1);

  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState("available_from");

  const [sortOrder, setSortOrder] = useState <"ASC" | "DESC"> ("DESC");

  const filteredClasses = classes.filter((classItem) => {
    const matchesOrganization =
      organizationFilter === null ||
      classItem.organization_id === organizationFilter;

    const matchesProgram =
      programFilter === null ||
      classItem.program_id === programFilter;

    return matchesOrganization && matchesProgram;
  });

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

    const loadPrograms = async () => {
      try {
        const data = await fetchClassPrograms();

        setPrograms(data.programs);
      } catch (err) {
        console.error(
          "Failed to load programs:",
          err
        );
      }
    };

    const loadClasses = async () => {
      try {
        const data = await fetchClasses();

        setClasses(data.classes);
      } catch (err) {
        console.error(
          "Failed to load classes:",
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
            programId:
              programFilter,
            classId:
              classFilter,
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
    loadPrograms();
    loadClasses();
  }, [
    statusFilter,
    searchTerm,
    organizationFilter,
    programFilter,
    classFilter,
    page,
    sortBy,
    sortOrder,
  ]);

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
   
  return (
    <PageContainer>
      <button
        onClick={() =>
          navigate("/exams")
        }
        style={{
          background: "none",
          border: "none",
          color: "#2B78F6",
          cursor: "pointer",
          padding: 0,
          marginBottom: "12px",
          fontSize: "14px",
          fontWeight: 600,
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        ← Back to Exams
      </button>
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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <label>Status</label>

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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <label>
              Organization
            </label>

            <SearchableOrganizationPicker
              organizations={organizations}
              selectedId={organizationFilter}
              onSelect={(id) => {
                setOrganizationFilter(id);
                setProgramFilter(null);
                setClassFilter(null);
                setPage(1);
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <label>
              Program
            </label>

            <select
              value={programFilter ?? ""}
              onChange={(e) => {
                setProgramFilter(
                  e.target.value
                    ? Number(e.target.value)
                    : null
                );
                setClassFilter(null);
                setPage(1);
              }}
              style={{
                minWidth: "160px",
                padding: "10px 14px",
                backgroundColor: "#F4F4F5",
                borderRadius: "6px",
                fontSize: "14px",
                color: "#444",
                border: "1px solid #ddd",
              }}
            >
              <option value="">All Programs</option>

              {programs.map((program) => (
                <option
                  key={program.id}
                  value={program.id}
                >
                  {program.name}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <label>
              Class
            </label>

            <SearchablePicker
              options={filteredClasses.map((classItem) => ({
                id: classItem.id,
                name: classItem.name,
              }))}
              selectedId={classFilter}
              onSelect={(id) => {
                setClassFilter(id);
                setPage(1);
              }}
              placeholder="All Classes"
              searchPlaceholder="Search classes..."
              clearLabel="Clear Class Filter"
              noResultsLabel="No classes found"
            />
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
              <th style={styles.th}>Classes</th>
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
                <td style={styles.td}>
                  {exam.classes.length > 0
                    ? exam.classes.map((classItem) => classItem.name).join(", ")
                    : "—"}
                </td>
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