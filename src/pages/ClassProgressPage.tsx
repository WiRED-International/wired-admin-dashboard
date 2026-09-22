import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { fetchClassProgress } from "../api/classAPI";
import {
  assignHistoricalExamToClass,
  getHistoricalUnassignedExams,
  HistoricalUnassignedExamSession,
} from "../api/examsAPI";
import { ClassProgressResponse } from "../interfaces/Class";
import AuthService from "../utils/auth";

export default function ClassProgressPage() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [progress, setProgress] =
    useState<ClassProgressResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [historicalSessions, setHistoricalSessions] =
    useState<HistoricalUnassignedExamSession[]>([]);

  const [historicalStudentId, setHistoricalStudentId] =
    useState<number | null>(null);

  const [historicalLoading, setHistoricalLoading] =
    useState(false);

  const [selectedHistoricalSessionId, setSelectedHistoricalSessionId] =
    useState<number | null>(null);

  useEffect(() => {
    const loadProgress = async () => {
      if (!classId) {
        setError("Class ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await fetchClassProgress(Number(classId));

        setProgress(data);
      } catch (err) {
        console.error("Failed to load class progress:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load class progress."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [classId]);

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Loading class progress...</p>
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

  if (!progress) {
    return (
      <div style={styles.container}>
        <p>Class progress not found.</p>
      </div>
    );
  }

  const isSpecializationClass =
    progress.class.program.training_type === "specialization";

  const isSuperAdmin = AuthService.isSuperAdmin();

  const handleHistoricalExamClick = async (
    studentId: number
  ) => {
    try {
      setHistoricalLoading(true);
      setHistoricalStudentId(studentId);
      setSelectedHistoricalSessionId(null);

      const response =
        await getHistoricalUnassignedExams(studentId);

      setHistoricalSessions(response.sessions);

      console.log(
        "Historical unassigned exams:",
        response.sessions
      );
    } catch (err) {
      console.error(
        "Failed to load historical exams:",
        err
      );
    } finally {
      setHistoricalLoading(false);
    }
  };

  const handleAssignHistoricalExam = async () => {
    if (
      selectedHistoricalSessionId === null ||
      historicalStudentId === null ||
      !classId
    ) {
      return;
    }

    try {
      await assignHistoricalExamToClass(
        selectedHistoricalSessionId,
        Number(classId)
      );

      const historicalResponse =
        await getHistoricalUnassignedExams(
          historicalStudentId
        );

      setHistoricalSessions(
        historicalResponse.sessions
      );

      const updatedProgress =
        await fetchClassProgress(
          Number(classId)
        );

      setProgress(updatedProgress);

      setSelectedHistoricalSessionId(null);

      console.log(
        "Historical exam assigned successfully."
      );
    } catch (err) {
      console.error(
        "Failed to assign historical exam:",
        err
      );
    }
  };

  return (
    <div style={styles.container}>
      <button
        type="button"
        style={styles.backButton}
        onClick={() => navigate(`/classes/${progress.class.id}`)}
      >
        ← Back to Class
      </button>

      <div>
        <h1 style={styles.heading}>
          {progress.class.name}
        </h1>

        <p style={styles.subheading}>
          {progress.class.program.name} · Student Progress
        </p>
      </div>

      <div style={styles.card}>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.studentHeader}>
                  Student
                </th>

                {isSpecializationClass && (
                  <th style={styles.studentHeader}>
                    Specialization
                  </th>
                )}

                <th style={styles.progressHeader}>
                  Module Progress
                </th>

                {isSpecializationClass && (
                  <th style={styles.progressHeader}>
                    Modules Passed
                  </th>
                )}

                <th style={styles.progressHeader}>
                  Program Exam
                </th>

                {!isSpecializationClass &&
                  progress.modules.map((module) => (
                    <th
                      key={module.id}
                      style={styles.moduleHeader}
                    >
                      <span
                        style={styles.moduleNumber}
                        title={module.name}
                      >
                        {getModuleNumber(module.name)}
                      </span>
                    </th>
                  ))}
              </tr>
            </thead>

            <tbody>
              {progress.students.map((student) => (
                <tr key={student.id}>
                  <td style={styles.studentCell}>
                    <div style={styles.studentName}>
                      {student.first_name} {student.last_name}
                    </div>

                    <div style={styles.studentId}>
                      {student.wired_user_id}
                    </div>

                    <button
                      type="button"
                      style={styles.viewProgressLink}
                      onClick={() =>
                        navigate(
                          `/classes/${progress.class.id}/students/${student.id}/progress`
                        )
                      }
                    >
                      View progress
                    </button>
                  </td>

                  {isSpecializationClass && (
                    <td style={styles.studentCell}>
                      {student.specialization_selection
                        ?.specialization.name ?? "Not Selected"}
                    </td>
                  )}

                  <td style={styles.progressCell}>
                    {isSpecializationClass ? (
                      student.specialization_selection ? (
                        <>
                          {calculateOverallProgress(
                            student.id,
                            student.modules ?? [],
                            progress.quizScores
                          )}
                          %
                        </>
                      ) : (
                        "—"
                      )
                    ) : (
                      <>
                        {calculateOverallProgress(
                          student.id,
                          progress.modules,
                          progress.quizScores
                        )}
                        %
                      </>
                    )}
                  </td>

                  {isSpecializationClass && (
                    <td style={styles.progressCell}>
                      {student.specialization_selection
                        ? getPassedModuleCount(
                            student.id,
                            student.modules ?? [],
                            progress.quizScores
                          )
                        : "—"}
                    </td>
                  )}

                  <td style={styles.progressCell}>
                    <StudentExamStatus
                      studentId={student.id}
                      exams={progress.exams}
                    />

                    {isSuperAdmin && (
                      <>
                        <button
                          type="button"
                          style={styles.historicalExamButton}
                          onClick={() =>
                            handleHistoricalExamClick(student.id)
                          }
                        >
                          {historicalLoading &&
                          historicalStudentId === student.id
                            ? "Loading..."
                            : "Historical Exam"}
                        </button>

                        {historicalStudentId === student.id &&
                          !historicalLoading && (
                            <div style={styles.historicalExamList}>
                              {historicalSessions.length === 0 ? (
                                <div style={styles.historicalExamEmpty}>
                                  No unassigned exams
                                </div>
                              ) : (
                                <>
                                  {historicalSessions.map((session) => (
                                    <label
                                      key={session.id}
                                      style={styles.historicalExamItem}
                                    >
                                      <input
                                        type="radio"
                                        name={`historical-exam-${student.id}`}
                                        checked={
                                          selectedHistoricalSessionId === session.id
                                        }
                                        onChange={() =>
                                          setSelectedHistoricalSessionId(session.id)
                                        }
                                      />

                                      <span>
                                        {session.exam_title ??
                                          `Exam ${session.exam_id}`}{" "}
                                        —{" "}
                                        {session.score == null
                                          ? "No score"
                                          : `${formatScore(session.score)}%`}
                                      </span>
                                    </label>
                                  ))}

                                  {selectedHistoricalSessionId !== null && (
                                    <button
                                      type="button"
                                      style={styles.assignHistoricalButton}
                                      onClick={handleAssignHistoricalExam}
                                    >
                                      Assign to Class
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                      </>
                    )}
                  </td>

                  {!isSpecializationClass &&
                    progress.modules.map((module) => {
                      const quizScore =
                        progress.quizScores.find(
                          (score) =>
                            score.user_id === student.id &&
                            score.module_id === module.id
                        );

                      return (
                        <td
                          key={module.id}
                          style={styles.scoreCell}
                        >
                          {!module.has_quiz
                            ? "N/A"
                            : quizScore
                            ? `${formatScore(quizScore.score)}%`
                            : "—"}
                        </td>
                      );
                    })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getModuleNumber(name: string) {
  const match = name.match(/^\d+(?:\.\d+)?/);

  return match ? match[0] : name;
}

function formatScore(score: number) {
  return Number.isInteger(score)
    ? score.toString()
    : score.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function calculateOverallProgress(
  studentId: number,
  modules: ClassProgressResponse["modules"],
  quizScores: ClassProgressResponse["quizScores"]
) {
  const assessedModules = modules.filter(
    (module) => module.has_quiz
  );

  if (assessedModules.length === 0) {
    return 0;
  }

  const passedModules = assessedModules.filter((module) =>
    quizScores.some(
      (score) =>
        score.user_id === studentId &&
        score.module_id === module.id &&
        score.score >= 80
    )
  );

  return Math.round(
    (passedModules.length / assessedModules.length) * 100
  );
}

function getPassedModuleCount(
  studentId: number,
  modules: ClassProgressResponse["modules"],
  quizScores: ClassProgressResponse["quizScores"]
) {
  const assessedModules = modules.filter(
    (module) => module.has_quiz
  );

  const passedModules = assessedModules.filter((module) =>
    quizScores.some(
      (score) =>
        score.user_id === studentId &&
        score.module_id === module.id &&
        score.score >= 80
    )
  );

  return `${passedModules.length}/${assessedModules.length}`;
}

function StudentExamStatus({
  studentId,
  exams,
}: {
  studentId: number;
  exams: ClassProgressResponse["exams"];
}) {
  if (exams.length === 0) {
    return <span style={styles.statusNA}>N/A</span>;
  }

  const sessions = exams
    .flatMap((exam) => exam.exam_sessions)
    .filter((session) => session.user_id === studentId)
    .sort((a, b) => b.attempt_number - a.attempt_number);

  const latestSession = sessions[0];

  if (!latestSession || latestSession.score == null) {
    return (
      <span style={styles.statusNotTaken}>
        Not Taken
      </span>
    );
  }

  const passed = latestSession.score >= 80;

  return (
    <div style={styles.examResult}>
      <div>
        {formatScore(latestSession.score)}%
      </div>

      <span
        style={
          passed
            ? styles.statusPassed
            : styles.statusNotPassed
        }
      >
        {passed ? "Passed" : "Not Passed"}
      </span>
    </div>
  );
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

  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "700px",
  },

  studentHeader: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "2px solid #ddd",
    whiteSpace: "nowrap",
  },

  moduleHeader: {
    textAlign: "center",
    padding: "12px",
    borderBottom: "2px solid #ddd",
    whiteSpace: "nowrap",
  },

  studentCell: {
    padding: "12px",
    borderBottom: "1px solid #eee",
    whiteSpace: "nowrap",
  },

  studentName: {
    fontWeight: 600,
  },

  studentId: {
    marginTop: "3px",
    fontSize: "12px",
    color: "#777",
  },

  scoreCell: {
    textAlign: "center",
    padding: "12px",
    borderBottom: "1px solid #eee",
    whiteSpace: "nowrap",
  },

  error: {
    padding: "12px",
    borderRadius: "6px",
    background: "#FEE2E2",
    color: "#B91C1C",
    fontSize: "14px",
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

  moduleNumber: {
    cursor: "help",
    borderBottom: "1px dotted #777",
  },

  viewProgressLink: {
    display: "block",
    marginTop: "5px",
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#2B78F6",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
    textAlign: "left",
  },

  progressHeader: {
    textAlign: "center",
    padding: "12px",
    borderBottom: "2px solid #ddd",
    whiteSpace: "nowrap",
  },

  progressCell: {
    textAlign: "center",
    padding: "12px",
    borderBottom: "1px solid #eee",
    whiteSpace: "nowrap",
    fontWeight: 600,
  },

  examResult: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "5px",
  },

  statusPassed: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "999px",
    background: "#DCFCE7",
    color: "#166534",
    fontSize: "12px",
    fontWeight: 600,
  },

  statusNotPassed: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "999px",
    background: "#FEE2E2",
    color: "#B91C1C",
    fontSize: "12px",
    fontWeight: 600,
  },

  statusNotTaken: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "999px",
    background: "#F3F4F6",
    color: "#4B5563",
    fontSize: "12px",
    fontWeight: 600,
  },

  statusNA: {
    display: "inline-block",
    padding: "3px 8px",
    borderRadius: "999px",
    background: "#F3F4F6",
    color: "#6B7280",
    fontSize: "12px",
    fontWeight: 600,
  },

  historicalExamButton: {
    display: "block",
    margin: "8px auto 0",
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#2B78F6",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  },

  historicalExamList: {
    marginTop: "8px",
    fontSize: "12px",
    fontWeight: 400,
    whiteSpace: "normal",
  },

  historicalExamItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "6px",
    padding: "4px 0",
    color: "#374151",
    cursor: "pointer",
    textAlign: "left",
  },

  historicalExamEmpty: {
    paddingTop: "4px",
    color: "#777",
    fontStyle: "italic",
  },

  assignHistoricalButton: {
    marginTop: "8px",
    padding: "5px 9px",
    border: "1px solid #2B78F6",
    borderRadius: "5px",
    background: "#fff",
    color: "#2B78F6",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: 600,
  },
};