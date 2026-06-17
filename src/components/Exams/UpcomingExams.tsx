import { useEffect, useState } from "react";
import { getUpcomingExams } from "@/api/examsAPI";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import { globalStyles } from "@/globalStyles";
import { UpcomingExam } from "@/interfaces/UpcomingExamInterface";
import { useNavigate } from "react-router-dom";


export default function UpcomingExams() {
  const [upcoming, setUpcoming] = useState<UpcomingExam[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const navigate = useNavigate();
  const formatDate = (
    value: string
  ) => {

    return new Date(value)
      .toLocaleString(
        "en-US",
        {
          dateStyle: "medium",
          timeStyle: "short",
        }
      );

  };

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const data = await getUpcomingExams();
        setUpcoming(data);
      } catch (err) {
        if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage("Failed to load upcoming exams.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  return (
  <div style={styles.card}>

    <div style={styles.headerRow}>

      <h3 style={styles.title}>
        Upcoming Exams
      </h3>

      <div
        style={{
          display: "flex",
          gap: "8px",
        }}
      >

        <button
          style={styles.secondaryBtn}
          onClick={() =>
            navigate("/exams/scheduled")
          }
        >
          View All
        </button>

        <button
          style={styles.scheduleBtn}
          onClick={() =>
            navigate("/exams/schedule")
          }
        >
          Schedule Exam
        </button>

      </div>

    </div>

    {loading && <LoadingSpinner />}

    {errorMessage && (
      <div style={styles.error}>
        {errorMessage}
      </div>
    )}

      <div style={styles.list}>
        {!loading && upcoming.length === 0 && !errorMessage && (
          <div style={styles.noExams}>No upcoming exams.</div>
        )}

        {upcoming.slice(0, 2).map((item) => (
          <div key={item.id} style={styles.examBox}>
            
            {/* Top Row: Title + Duration + Edit */}
            <div style={styles.examTopRow}>
              <span style={styles.examTitle}>{item.title}</span>

              <div style={styles.rightControls}>

                <span style={styles.durationBadge}>
                  {item.duration}
                </span>

                <button
                  style={styles.viewBtn}
                  onClick={() =>
                    navigate(`/exams/${item.id}`)
                  }
                >
                  View
                </button>

              </div>
            </div>

            {/* Middle Grid Section */}
            <div style={styles.middleGrid}>
              <div style={styles.leftColumn}>
                <div>
                  <strong>From:</strong>
                  {" "}
                  {formatDate(item.from)}
                  {" "}
                  ({item.timeZone})
                </div>

                <div>
                  <strong>To:</strong>
                  {" "}
                  {formatDate(item.to)}
                  {" "}
                  ({item.timeZone})
                </div>

                <div style={styles.enrolledText}>
                  {item.enrolled.current}/{item.enrolled.total} students enrolled
                </div>
              </div>

              <div style={styles.orgColumn}>
                {item.org}
              </div>
            </div>

            {/* Progress */}
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${item.progress}%`,
                }}
              ></div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },

  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 700,
  },

  error: {
    backgroundColor: globalStyles.colors.error,
    color: globalStyles.colors.whiteTheme,
    padding: "12px",
    borderRadius: "8px",
    marginTop: "10px",
    textAlign: "center",
  },

  noExams: {
    textAlign: "center",
    color: "#777",
    marginTop: "10px",
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },

  examBox: {
    background: "#fff",
    borderRadius: "10px",
    padding: "14px 16px",
    border: "1px solid #E5E7EB",
    boxShadow: "0px 1px 3px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  examTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  examTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#111",
  },

  rightControls: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },

  durationBadge: {
    background: "#2B78F6",
    color: "white",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: 600,
  },

  editBtn: {
    background: "#F3F4F6",
    border: "1px solid #D1D5DB",
    padding: "4px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },

  middleGrid: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    columnGap: "20px",
    alignItems: "start",
  },

  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontSize: "13px",
    color: "#555",
  },

  orgColumn: {
    display: "flex",
    alignItems: "flex-end",
    fontSize: "14px",
    color: "#444",
    fontWeight: 500,
    whiteSpace: "nowrap",
  },

  enrolledText: {
    marginTop: "6px",
    fontSize: "13px",
    color: "#666",
  },

  progressBar: {
    width: "100%",
    height: "8px",
    backgroundColor: "#E5E7EB",
    borderRadius: "4px",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#1E3A8A",
  },

  scheduleBtn: {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#2B78F6",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "14px",
  },
    secondaryBtn: {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "1px solid #D1D5DB",
    backgroundColor: "#fff",
    color: "#374151",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "14px",
  },

  viewBtn: {
    background: "#F3F4F6",
    border: "1px solid #D1D5DB",
    padding: "4px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
};
