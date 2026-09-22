import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { fetchClassProgress } from "../api/classAPI";
import { ClassProgressResponse } from "../interfaces/Class";

export default function StudentClassProgressPage() {
  const { classId, studentId } = useParams();
  const navigate = useNavigate();

  const [progress, setProgress] =
    useState<ClassProgressResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProgress = async () => {
      if (!classId || !studentId) {
        setError("Class ID or student ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await fetchClassProgress(Number(classId));

        setProgress(data);
      } catch (err) {
        console.error("Failed to load student progress:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load student progress."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [classId, studentId]);

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Loading student progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  if (!progress || !studentId) {
    return (
      <div style={styles.container}>
        <p>Student progress not found.</p>
      </div>
    );
  }

  const student = progress.students.find(
    (item) => item.id === Number(studentId)
  );

  if (!student) {
    return (
      <div style={styles.container}>
        <button
          type="button"
          style={styles.backButton}
          onClick={() =>
            navigate(`/classes/${progress.class.id}/progress`)
          }
        >
          ← Back to Class Progress
        </button>

        <div style={styles.error}>
          This student is not enrolled in this class.
        </div>
      </div>
    );
  }

  const isSpecializationClass =
    progress.class.program.training_type === "specialization";

  const studentModules = isSpecializationClass
    ? student.modules ?? []
    : progress.modules;

  const specializationNotSelected =
    isSpecializationClass &&
    !student.specialization_selection;

  const assessedModules = studentModules.filter(
    (module) => module.has_quiz
  );

  const passedModules = assessedModules.filter((module) =>
    progress.quizScores.some(
      (score) =>
        score.user_id === student.id &&
        score.module_id === module.id &&
        score.score >= 80
    )
  );

  const moduleProgress =
    assessedModules.length > 0
      ? Math.round(
          (passedModules.length / assessedModules.length) * 100
        )
      : 0;

  const studentExams = progress.exams.map((exam) => {
    const sessions = exam.exam_sessions
      .filter((session) => session.user_id === student.id)
      .sort((a, b) => b.attempt_number - a.attempt_number);

    return {
      exam,
      latestSession: sessions[0] ?? null,
    };
  });

  return (
    <div style={styles.container}>
      <button
        type="button"
        style={styles.backButton}
        onClick={() =>
          navigate(`/classes/${progress.class.id}/progress`)
        }
      >
        ← Back to Class Progress
      </button>

      <div>
        <h1 style={styles.heading}>
          {student.first_name} {student.last_name}
        </h1>

        <p style={styles.subheading}>
          {student.wired_user_id} · {progress.class.name}
        </p>
      </div>

      <div style={styles.summaryCard}>
        <div>
          <div style={styles.label}>Program</div>
          <div>{progress.class.program.name}</div>
        </div>

        {isSpecializationClass && (
          <div>
            <div style={styles.label}>Specialization</div>
            <div>
              {student.specialization_selection
                ?.specialization.name ?? "Not Selected"}
            </div>
          </div>
        )}

        <div>
          <div style={styles.label}>Student</div>
          <div>
            {student.first_name} {student.last_name}
          </div>
        </div>

        <div>
          <div style={styles.label}>WiRED ID</div>
          <div>{student.wired_user_id}</div>
        </div>

        <div>
          <div style={styles.label}>Email</div>
          <div>{student.email}</div>
        </div>

        <div>
          <div style={styles.label}>Module Progress</div>

          {specializationNotSelected ? (
            <div style={styles.progressDetail}>
              Specialization not selected
            </div>
          ) : (
            <>
              <div style={styles.progressValue}>
                {moduleProgress}%
              </div>

              <div style={styles.progressDetail}>
                {passedModules.length} of {assessedModules.length} assessed modules passed
              </div>
            </>
          )}
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.title}>Module Progress</h3>

        {specializationNotSelected ? (
          <div style={styles.emptyState}>
            A specialization has not been selected for this student.
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.leftHeader}>Module</th>
                  <th style={styles.header}>Assessment</th>
                  <th style={styles.header}>Score</th>
                  <th style={styles.header}>Status</th>
                  <th style={styles.header}>Date Taken</th>
                </tr>
              </thead>

              <tbody>
                {studentModules.map((module) => {
                  const quizScore = progress.quizScores.find(
                    (score) =>
                      score.user_id === student.id &&
                      score.module_id === module.id
                  );

                  return (
                    <tr key={module.id}>
                      <td style={styles.moduleCell}>
                        <div style={styles.moduleNumber}>
                          {getModuleNumber(module.name)}
                        </div>

                        <div style={styles.moduleName}>
                          {getModuleTitle(module.name)}
                        </div>
                      </td>

                      <td style={styles.centerCell}>
                        {module.has_quiz
                          ? "Final Quiz"
                          : "No Final Quiz"}
                      </td>

                      <td style={styles.centerCell}>
                        {!module.has_quiz
                          ? "N/A"
                          : quizScore
                          ? `${formatScore(quizScore.score)}%`
                          : "—"}
                      </td>

                      <td style={styles.centerCell}>
                        {!module.has_quiz ? (
                          <span style={styles.statusNA}>
                            N/A
                          </span>
                        ) : !quizScore ? (
                          <span style={styles.statusNotTaken}>
                            Not Taken
                          </span>
                        ) : quizScore.score >= 80 ? (
                          <span style={styles.statusPassed}>
                            Passed
                          </span>
                        ) : (
                          <span style={styles.statusNotPassed}>
                            Not Passed
                          </span>
                        )}
                      </td>

                      <td style={styles.centerCell}>
                        {!module.has_quiz
                          ? "N/A"
                          : quizScore
                          ? formatDateTime(quizScore.date_taken)
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div style={styles.card}>
        <h3 style={styles.title}>Program Exam</h3>

        {studentExams.length === 0 ? (
          <div style={styles.emptyState}>
            No program exam has been assigned to this class.
          </div>
        ) : (
          studentExams.map(({ exam, latestSession }) => (
            <div
              key={exam.id}
              style={styles.examSection}
            >
              <div style={styles.examTitle}>
                {exam.exam_template?.title ?? exam.title}
              </div>

              <div style={styles.examDetailsGrid}>
                <div>
                  <div style={styles.label}>
                    Scheduled Exam
                  </div>

                  <div>{exam.title}</div>
                </div>

                <div>
                  <div style={styles.label}>
                    Score
                  </div>

                  <div>
                    {latestSession?.score != null
                      ? `${formatScore(latestSession.score)}%`
                      : "—"}
                  </div>
                </div>

                <div>
                  <div style={styles.label}>
                    Status
                  </div>

                  <div>
                    {!latestSession ? (
                      <span style={styles.statusNotTaken}>
                        Not Taken
                      </span>
                    ) : latestSession.score != null &&
                      latestSession.score >= 80 ? (
                      <span style={styles.statusPassed}>
                        Passed
                      </span>
                    ) : (
                      <span style={styles.statusNotPassed}>
                        Not Passed
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div style={styles.label}>
                    Attempt
                  </div>

                  <div>
                    {latestSession
                      ? `#${latestSession.attempt_number}`
                      : "—"}
                  </div>
                </div>

                <div>
                  <div style={styles.label}>
                    Date Taken
                  </div>

                  <div>
                    {latestSession?.submitted_at
                      ? formatDateTime(latestSession.submitted_at)
                      : "—"}
                  </div>
                </div>
              </div>

              {latestSession && (
                <button
                  type="button"
                  style={styles.examAttemptLink}
                  onClick={() =>
                    navigate(
                      `/exams/results/${latestSession.id}`
                    )
                  }
                >
                  View exam attempt
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getModuleNumber(name: string) {
  const match = name.match(/^\d+(?:\.\d+)?/);

  return match ? match[0] : "";
}

function getModuleTitle(name: string) {
  return name.replace(/^\d+(?:\.\d+)?\s*/, "");
}

function formatScore(score: number) {
  return Number.isInteger(score)
    ? score.toString()
    : score.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleDateString();
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "25px",
    paddingLeft: "20px",
    paddingRight: "20px",
    paddingTop: "15px",
    paddingBottom: "20px",
  },

  heading: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
  },

  subheading: {
    marginTop: "6px",
    marginBottom: 0,
    color: "#666",
    fontSize: "14px",
  },

  summaryCard: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "20px",
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
  },

  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
  },

  title: {
    margin: 0,
    marginBottom: "20px",
    fontSize: "18px",
    fontWeight: 700,
  },

  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#666",
    marginBottom: "4px",
  },

  progressValue: {
    fontSize: "22px",
    fontWeight: 700,
  },

  progressDetail: {
    marginTop: "3px",
    fontSize: "12px",
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

  leftHeader: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "2px solid #ddd",
  },

  header: {
    textAlign: "center",
    padding: "12px",
    borderBottom: "2px solid #ddd",
    whiteSpace: "nowrap",
  },

  moduleCell: {
    padding: "12px",
    borderBottom: "1px solid #eee",
  },

  moduleNumber: {
    fontWeight: 700,
  },

  moduleName: {
    marginTop: "3px",
    color: "#555",
    fontSize: "13px",
  },

  centerCell: {
    textAlign: "center",
    padding: "12px",
    borderBottom: "1px solid #eee",
    whiteSpace: "nowrap",
  },

  backButton: {
    alignSelf: "flex-start",
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#2B78F6",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },

  error: {
    padding: "12px",
    borderRadius: "6px",
    background: "#FEE2E2",
    color: "#B91C1C",
    fontSize: "14px",
  },

  statusPassed: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "12px",
    background: "#DCFCE7",
    color: "#166534",
    fontSize: "12px",
    fontWeight: 600,
  },

  statusNotPassed: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "12px",
    background: "#FEE2E2",
    color: "#B91C1C",
    fontSize: "12px",
    fontWeight: 600,
  },

  statusNotTaken: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "12px",
    background: "#F3F4F6",
    color: "#4B5563",
    fontSize: "12px",
    fontWeight: 600,
  },

  statusNA: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "12px",
    background: "#F3F4F6",
    color: "#6B7280",
    fontSize: "12px",
    fontWeight: 600,
  },

  examSection: {
    paddingTop: "4px",
  },

  examTitle: {
    fontSize: "16px",
    fontWeight: 700,
    marginBottom: "18px",
  },

  examDetailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "20px",
  },

  examAttemptLink: {
    marginTop: "20px",
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#2B78F6",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },

  emptyState: {
    color: "#666",
    fontSize: "14px",
  },
};