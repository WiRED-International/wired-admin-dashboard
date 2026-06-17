import {
  AllExamResultItem,
  ExamSort,
} from "@/interfaces/Exam";
import { useNavigate } from "react-router-dom";

type AllExamsTableProps = {
  results: AllExamResultItem[];
  loading: boolean;

  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;

  totalPages: number;

  sort: ExamSort;

  setSort: React.Dispatch<
    React.SetStateAction<ExamSort>
  >;
};

export default function AllExamsTable({
  results,
  loading,
  page,
  setPage,
  totalPages,
  sort,
  setSort,
}: AllExamsTableProps) {
  const { sortBy, sortOrder } = sort;
  const navigate = useNavigate();
  // ---------------------------------------
  // SORTABLE HEADER RENDERER
  // ---------------------------------------
  function renderHeader(
    key: string,
    label: string,
    sortable: boolean = true
  ) {
    const isActive = sortBy === key;
    const arrow = !sortable
      ? ""
      : isActive
        ? sortOrder === "ASC"
          ? " ▲"
          : " ▼"
        : " ⬍";

    return (
      <th
        style={{ ...styles.th, cursor: sortable ? "pointer" : "default" }}
        onClick={() => {
          if (!sortable) return;

          if (sortBy === key) {
            setSort((prev) => ({
              ...prev,
              sortOrder:
                prev.sortOrder === "ASC"
                  ? "DESC"
                  : "ASC",
            }));
          } else {
            setSort({
              sortBy: key,
              sortOrder: "ASC",
            });
          }

          setPage(1);
        }}
      >
        {label}
        {sortable && <span style={{ marginLeft: 4 }}>{arrow}</span>}
      </th>
    );
  }

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>All Exams</h3>

      {loading && <p>Loading...</p>}
      {!loading && results.length === 0 && <p>No results found.</p>}

      {!loading && results.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              {renderHeader("first_name", "First Name")}
              {renderHeader("last_name", "Last Name")}
              {renderHeader("exam_title", "Exam Title")}
              {renderHeader("score", "Score")}
              {renderHeader("submitted_at", "Date & Time Submitted")}
              {renderHeader("status", "Status", false)}
              {renderHeader("organization", "Organization")}
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {results.map((row) => {
              const dateStr = row.submitted_at
                ? new Date(row.submitted_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—";

              const timeStr = row.submitted_at
                ? new Date(row.submitted_at).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "—";

              const status =
                row.score === null
                  ? "In Progress"
                  : row.score >= 80
                  ? "Passed"
                  : "Failed";

              return (
                <tr key={row.session_id} style={styles.tr}>
                  <td style={styles.td}>{row.user.first_name}</td>
                  <td style={styles.td}>{row.user.last_name}</td>
                  <td style={styles.td}>{row.exam_title ?? ""}</td>

                  <td style={styles.td}>
                    {row.score === null ? "In Progress" : `${row.score}%`}
                  </td>

                  <td style={styles.td}>
                    {dateStr}{" "}
                    {timeStr !== "—" && (
                      <span style={{ color: "#666" }}>{timeStr}</span>
                    )}
                  </td>

                  <td style={styles.td}>{renderStatusBadge(status)}</td>

                  <td style={styles.td}>{row.organization_name ?? "—"}</td>

                  <td style={styles.td}>
                    <button
                      style={styles.actionBtn}
                      onClick={() => navigate(`/exams/results/${row.session_id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Pagination */}
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
          Page <b>{page}</b> of <b>{totalPages}</b>
        </span>

        <input
          type="number"
          min={1}
          max={totalPages}
          defaultValue={page}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const target = Number((e.target as HTMLInputElement).value);
              if (!isNaN(target) && target >= 1 && target <= totalPages) {
                setPage(target);
              }
            }
          }}
          style={styles.jumpInput}
        />

        <button
          style={styles.pageBtn}
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next ▶
        </button>

        <button
          style={styles.pageBtn}
          disabled={page >= totalPages}
          onClick={() => setPage(totalPages)}
        >
          Last ⏭
        </button>
      </div>
    </div>
  );
}

/* ---------------- BADGES ---------------- */

function renderStatusBadge(status: string) {
  let style: React.CSSProperties = {};

  switch (status) {
    case "Passed":
      style = { ...badgeBase, backgroundColor: "#DCFCE7", color: "#15803D" };
      break;
    case "Failed":
      style = { ...badgeBase, backgroundColor: "#FEE2E2", color: "#B91C1C" };
      break;
    case "In Progress":
      style = { ...badgeBase, backgroundColor: "#FEF9C3", color: "#CA8A04" };
      break;
  }

  return <span style={style}>{status}</span>;
}

const badgeBase: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "13px",
  fontWeight: 600,
};

/* ---------------- STYLES ---------------- */

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
    marginTop: "15px",
  },
  title: {
    margin: 0,
    marginBottom: "12px",
    fontSize: "18px",
    fontWeight: 700,
  },
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
  tr: {
    borderBottom: "1px solid #eee",
  },
  td: {
    padding: "14px 12px",
    fontSize: "14px",
    color: "#333",
    verticalAlign: "middle",
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
    marginTop: "15px",
    gap: "20px",
  },
  pageBtn: {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "1px solid #aaa",
    background: "#f6f6f6",
    cursor: "pointer",
  },
  pageInfo: {
    fontSize: "14px",
  },
  jumpInput: {
    width: "60px",
    padding: "6px 8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "14px",
    textAlign: "center",
  },
};
