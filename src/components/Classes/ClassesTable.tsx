import { ClassItem } from "@/interfaces/Class";
import { useNavigate } from "react-router-dom";

type ClassesTableProps = {
  classes: ClassItem[];
  loading: boolean;
};

export default function ClassesTable({
  classes,
  loading,
}: ClassesTableProps) {
  const navigate = useNavigate();

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Classes</h3>

      {loading && <p>Loading...</p>}

      {!loading && classes.length === 0 && (
        <p>No classes found.</p>
      )}

      {!loading && classes.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Class Name</th>
              <th style={styles.th}>Program</th>
              <th style={styles.th}>Organization</th>
              <th style={styles.th}>Location</th>
              <th style={styles.th}>Start Date</th>
              <th style={styles.th}>End Date</th>
              <th style={styles.th}>Enrollment Deadline</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {classes.map((classItem) => {
              const formatDate = (date: string | null) => {
                if (!date) return "—";

                const [year, month, day] = date.split("-").map(Number);

                return new Date(year, month - 1, day).toLocaleDateString();
              };

              const startDate = formatDate(classItem.start_date);
              const endDate = formatDate(classItem.end_date);
              const enrollmentDeadline = formatDate(
                classItem.enrollment_deadline
              );

              return (
                <tr key={classItem.id} style={styles.tr}>
                  <td style={styles.td}>
                    {classItem.name}
                  </td>

                  <td style={styles.td}>
                    {classItem.program?.name ?? "—"}
                  </td>

                  <td style={styles.td}>
                    {classItem.organization?.name ?? "—"}
                  </td>

                  <td style={styles.td}>
                    {classItem.location?.name ?? "—"}
                  </td>

                  <td style={styles.td}>
                    {startDate}
                  </td>

                  <td style={styles.td}>
                    {endDate}
                  </td>

                  <td style={styles.td}>
                    {enrollmentDeadline}
                  </td>

                  <td style={styles.td}>
                    {renderStatusBadge(classItem.status)}
                  </td>

                  <td style={styles.td}>
                    <button
                      style={styles.actionBtn}
                      onClick={() =>
                        navigate(`/classes/${classItem.id}`)
                      }
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
    </div>
  );
}

function renderStatusBadge(status: string) {
  const statusStyles: Record<string, React.CSSProperties> = {
    draft: {
      backgroundColor: "#F1F5F9",
      color: "#475569",
    },

    active: {
      backgroundColor: "#DCFCE7",
      color: "#15803D",
    },

    completed: {
      backgroundColor: "#DBEAFE",
      color: "#1D4ED8",
    },

    archived: {
      backgroundColor: "#F3E8FF",
      color: "#7E22CE",
    },
  };

  const label =
    status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      style={{
        ...styles.statusBadge,
        ...(statusStyles[status] ?? {}),
      }}
    >
      {label}
    </span>
  );
}

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

  statusBadge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: 600,
  },
};