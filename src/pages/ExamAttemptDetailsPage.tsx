import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getExamAttemptDetails } from "@/api/examsAPI";
import { ExamAttemptResponse } from "@/interfaces/ExamAttempt";

export default function ExamAttemptDetailsPage() {
  const { sessionId } = useParams();
  const [data, setData] = useState<ExamAttemptResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState< "all" | "correct" | "incorrect" | "unanswered" >("all");

  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);

  useEffect(() => {
    async function load() {
      if (!sessionId) return;

      try {
        const result = await getExamAttemptDetails(Number(sessionId));
        setData(result);
      } catch (err) {
        console.error("Failed to load exam attempt details:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [sessionId]);

  if (loading) return <p>Loading exam attempt...</p>;

  if (!data) return <p>Exam attempt not found.</p>;

    function changeFilter(
      newFilter:
        | "all"
        | "correct"
        | "incorrect"
        | "unanswered"
    ) {
      setFilter(newFilter);

      if (
        newFilter === "all" ||
        newFilter === "correct"
      ) {
        setExpandedQuestions([]);
        return;
      }

      if (newFilter === "incorrect") {

        const incorrectIds = data!.questions
          .filter(
            q =>
              q.user_answer !== null &&
              q.is_correct === false
          )
          .map(q => q.question_id);

        setExpandedQuestions(incorrectIds);
        return;
      }

      if (newFilter === "unanswered") {

        const unansweredIds = data!.questions
          .filter(
            q => q.user_answer === null
          )
          .map(q => q.question_id);

        setExpandedQuestions(unansweredIds);
      }
    }

  const totalQuestions = data.questions.length;

  const answeredQuestions = data.questions.filter(q => q.user_answer !== null).length;

  const unansweredQuestions = totalQuestions - answeredQuestions;

  const submittedDate = data.submitted_at
  ? new Date(data.submitted_at).toLocaleString()
  : "—";

  const correctQuestions = data.questions.filter( q => q.is_correct === true ).length;

  const incorrectQuestions = data.questions.filter( q => q.user_answer !== null && q.is_correct === false ).length;

  const filteredQuestions = data.questions.filter(question => {

    if (filter === "correct") {
      return question.is_correct === true;
    }

    if (filter === "incorrect") {
      return (
        question.user_answer !== null &&
        question.is_correct === false
      );
    }

    if (filter === "unanswered") {
      return question.user_answer === null;
    }

    return true;

  });

    return (
    <PageContainer>

      <PageHeader
        title="Exam Attempt Details"
        subtitle={`Session #${sessionId}`}
      />

      <Panel>

        <h2>
          {data.user.first_name} {data.user.last_name}
        </h2>

        <p>{data.user.email}</p>

        <p>
          <strong>Exam:</strong>{" "}
          {data.exam.title}
        </p>

        <p>
          <strong>Score:</strong>{" "}
          {data.score}%
        </p>
        <p>
          <strong>Attempt:</strong>{" "}
          #{data.attempt_number}
        </p>
        <p>
          <strong>Organization:</strong>{" "}
          {data.organization ?? "—"}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          {data.score >= 80 ? "Passed" : "Failed"}
        </p>

        <p>
          <strong>Timezone:</strong>{" "}
          {data.exam.time_zone}
        </p>

        <p>
          <strong>Submitted:</strong>{" "}
          {submittedDate}
        </p>

      </Panel>

      <Panel>

        <h3>Results Summary</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "16px",
            marginTop: "16px",
          }}
        >

          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Total Questions</div>
            <div style={styles.summaryValue}>{totalQuestions}</div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Correct</div>
            <div style={{ ...styles.summaryValue, color: "#15803D" }}>
              {correctQuestions}
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Incorrect</div>
            <div style={{ ...styles.summaryValue, color: "#B91C1C" }}>
              {incorrectQuestions}
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Unanswered</div>
            <div style={{ ...styles.summaryValue, color: "#6B7280" }}>
              {unansweredQuestions}
            </div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Score</div>
            <div style={styles.summaryValue}>{data.score}%</div>
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>Status</div>

            <div
              style={{
                ...styles.summaryValue,
                color:
                  data.score >= 80
                    ? "#15803D"
                    : "#B91C1C",
              }}
            >
              {data.score >= 80
                ? "PASS"
                : "FAIL"}
            </div>
          </div>

        </div>

      </Panel>

      <Panel>

        <h3>Question Review</h3>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={() => changeFilter("all")}
            style={{
              backgroundColor:
                filter === "all"
                  ? "#2B78F6"
                  : "#FFFFFF",
              color:
                filter === "all"
                  ? "#FFFFFF"
                  : "#000000",
            }}
          >
            All ({totalQuestions})
          </button>

          <button
            onClick={() => changeFilter("correct")}
            style={{
              backgroundColor:
                filter === "correct"
                  ? "#15803D"
                  : "#FFFFFF",
              color:
                filter === "correct"
                  ? "#FFFFFF"
                  : "#000000",
            }}
          >
            Correct ({correctQuestions})
          </button>

          <button 
            onClick={() => changeFilter("incorrect")}
             style={{
              backgroundColor:
                filter === "incorrect"
                  ? "#B91C1C"
                  : "#FFFFFF",
              color:
                filter === "incorrect"
                  ? "#FFFFFF"
                  : "#000000",
            }}
          >
            Incorrect ({incorrectQuestions})
          </button>

          <button
            onClick={() => changeFilter("unanswered")}
            style={{
              backgroundColor:
                filter === "unanswered"
                  ? "#6B7280"
                  : "#FFFFFF",
              color:
                filter === "unanswered"
                  ? "#FFFFFF"
                  : "#000000",
            }}
          >
            Unanswered ({unansweredQuestions})
          </button>
        </div>
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={() =>
              setExpandedQuestions(
                filteredQuestions.map(
                  q => q.question_id
                )
              )
            }
          >
            Expand Visible
          </button>

          <button
            onClick={() =>
              setExpandedQuestions([])
            }
          >
            Collapse All
          </button>
        </div>

        {filteredQuestions.map((question) => {

          const status =
            question.is_correct
              ? "correct"
              : question.user_answer
              ? "incorrect"
              : "unanswered";

          const statusColor =
            status === "correct"
              ? "#15803D"
              : status === "incorrect"
              ? "#B91C1C"
              : "#6B7280";

          return (
            <div
              key={question.question_id}
              onClick={() => {

                if (
                  expandedQuestions.includes(
                    question.question_id
                  )
                ) {
                  setExpandedQuestions(
                    expandedQuestions.filter(
                      id => id !== question.question_id
                    )
                  );
                } else {
                  setExpandedQuestions([
                    ...expandedQuestions,
                    question.question_id,
                  ]);
                }

              }}
              style={{
                padding: "12px 0",
                borderBottom: "1px solid #E5E7EB",
                cursor: "pointer",

                backgroundColor:
                  expandedQuestions.includes(
                    question.question_id
                  )
                    ? "#F8FAFC"
                    : "transparent",

                transition: "background-color 0.2s ease",
              }}
            >

              <div
                style={{
                  color: statusColor,
                  fontWeight: 600,
                }}
              >
                {expandedQuestions.includes(question.question_id)
                  ? "▼ "
                  : "▶ "}

                {status === "correct" && "✓ "}
                {status === "incorrect" && "✗ "}
                {status === "unanswered" && "— "}

                <strong>
                  Question {
                    data.questions.findIndex(
                      q => q.question_id === question.question_id
                    ) + 1
                  }
                </strong>
              </div>

              <div>
                {question.question_text}
              </div>
              {expandedQuestions.includes(question.question_id) && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px",
                    backgroundColor: "#F8FAFC",
                    borderRadius: "6px",
                  }}
                >
                  <>
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: "10px",
                        color:
                          question.is_correct
                            ? "#15803D"
                            : question.user_answer
                            ? "#B91C1C"
                            : "#6B7280",
                      }}
                    >
                      {question.is_correct
                        ? "✓ Correct"
                        : question.user_answer
                        ? "✗ Incorrect"
                        : "— Unanswered"}
                    </div>
                    <p>
                      <strong>Student Answer:</strong>
                    </p>

                    <div>
                      {(question.user_answer?.selected_option_ids ?? []).map(optionId => (
                        <div key={optionId}>
                          {optionId}) {question.options[optionId]}
                        </div>
                      ))}
                    </div>

                    <p>
                      <strong>Correct Answer:</strong>
                    </p>

                    <div>
                      {question.correct_answers.map(optionId => (
                        <div key={optionId}>
                          {optionId}) {question.options[optionId]}
                        </div>
                      ))}
                    </div>
                  </>
                </div>
              )}
            </div>
          );
        })}

      </Panel>

    </PageContainer>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  summaryCard: {
    border: "1px solid #E5E7EB",
    borderRadius: "10px",
    padding: "16px",
    backgroundColor: "#F9FAFB",
  },
  summaryLabel: {
    fontSize: "13px",
    color: "#6B7280",
    marginBottom: "8px",
    fontWeight: 600,
  },
  summaryValue: {
    fontSize: "26px",
    fontWeight: 700,
    color: "#111827",
  },
};