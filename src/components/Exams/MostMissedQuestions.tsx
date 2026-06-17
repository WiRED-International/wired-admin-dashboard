import { MostMissedQuestion, QuestionAnalyticsResponse } from "@/interfaces/Exam";

import { useState } from "react";

import { getQuestionAnalytics } from "@/api/examsAPI";


type MostMissedQuestionsProps = {
  questions: MostMissedQuestion[];
};

export default function MostMissedQuestions({
  questions,
}: MostMissedQuestionsProps) {

  const [
    expandedQuestionId,
    setExpandedQuestionId,
  ] = useState<number | null>(
    null
  );

  const [
    analyticsCache,
    setAnalyticsCache,
  ] = useState<
    Record<number, QuestionAnalyticsResponse>
  >({});

  const [
    loadingQuestion,
    setLoadingQuestion,
  ] = useState(false);

  return (

    <div style={styles.card}>

      <h3 style={styles.title}>
        Most Missed Questions
      </h3>

      {questions.length === 0 ? (

        <p style={styles.empty}>
          No question analytics available.
        </p>

      ) : (

        <div>

          {questions.map((question) => (

            <div
              key={question.questionId}
              style={{
                ...styles.questionRow,
                cursor: "pointer",
              }}

              onClick={async () => {

                if (
                  expandedQuestionId ===
                  question.questionId
                ) {

                  setExpandedQuestionId(
                    null
                  );

                  return;

                }

                try {

                  setLoadingQuestion(
                    true
                  );

                  if (
                    analyticsCache[
                      question.questionId
                    ]
                  ) {

                    setExpandedQuestionId(
                      question.questionId
                    );

                    return;

                  }

                  const data =
                    await getQuestionAnalytics(
                      question.questionId
                    );

                  setAnalyticsCache(prev => ({
                    ...prev,
                    [question.questionId]: data,
                  }));

                  setExpandedQuestionId(
                    question.questionId
                  );

                  setExpandedQuestionId(
                    question.questionId
                  );

                } catch (err) {

                  console.error(
                    err
                  );

                } finally {

                  setLoadingQuestion(
                    false
                  );

                }

              }}
            >

              <div>
                <div style={styles.examTitle}>
                    {question.examTitle}
                </div>
                <div style={styles.questionText}>
                    {question.questionText}
                </div>
              </div>

              <div style={styles.stats}>
                {expandedQuestionId ===
                  question.questionId &&
                  analyticsCache[
                    question.questionId
                  ] && (

                  <div
                    style={
                      styles.analyticsPanel
                    }
                  >

                    <div
                      style={
                        styles.analyticsTitle
                      }
                    >
                      Answer Distribution
                    </div>

                    {loadingQuestion ? (

                      <div>
                        Loading...
                      </div>

                    ) : (

                      analyticsCache[
                        question.questionId
                      ].distribution.map(
                        option => (

                          <div
                            key={
                              option.optionId
                            }
                            style={
                              styles.optionRow
                            }
                          >

                            <span>

                              {option.optionId.toUpperCase()}
                              {". "}
                              {option.optionText}

                              {option.isCorrect &&
                                " ✅"}

                            </span>

                            <span>
                              {
                                option.percent
                              }
                              %
                            </span>

                          </div>

                        )
                      )

                    )}

                  </div>

                )}

                <span>
                  {question.missedCount}
                  {" of "}
                  {question.attemptCount}
                  {" missed"}
                </span>

                <span>
                  {question.missRate}%
                </span>

              </div>

            </div>

          ))}

        </div>

      )}

    </div>

  );

}

const styles: {
  [key: string]:
    React.CSSProperties;
} = {

  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.08)",
  },

  title: {
    margin: 0,
    marginBottom: "16px",
    fontSize: "18px",
    fontWeight: 700,
  },

  questionRow: {
    padding: "12px 0",
    borderBottom:
      "1px solid #E5E7EB",
  },

  examTitle: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#2563EB",
    marginBottom: "4px",
  },

  questionText: {
    fontSize: "14px",
    fontWeight: 600,
    marginBottom: "6px",
    color: "#111827",
  },

  stats: {
    display: "flex",
    justifyContent:
      "space-between",
    fontSize: "13px",
    color: "#6B7280",
  },

  empty: {
    color: "#6B7280",
  },

  analyticsPanel: {
    marginTop: "12px",
    background: "#F8FAFC",
    padding: "12px",
    borderRadius: "8px",
  },

  analyticsTitle: {
    fontWeight: 700,
    marginBottom: "10px",
  },

  optionRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
  },

};