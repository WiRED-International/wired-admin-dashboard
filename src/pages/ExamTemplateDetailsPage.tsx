import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { ExamTemplate } from "@/interfaces/ExamTemplate";

import { getExamTemplate, updateExamTemplate, deleteExamTemplateQuestion, } from "@/api/examTemplatesAPI";
import { useNavigate } from "react-router-dom";


export default function ExamTemplateDetailsPage() {
  const { templateId } = useParams();
  const [template, setTemplate] = useState<ExamTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {

    loadTemplate();

  }, [templateId]);

  async function loadTemplate() {

    if (!templateId) return;

    try {

      const data =
        await getExamTemplate(
          Number(templateId)
        );

      setTemplate(data);
      setTitle(data.title);

      setDescription(
        data.description || ""
      );

    } catch (error) {

      console.error(
        "Failed to load template:",
        error
      );

    } finally {

      setLoading(false);
    }
  }

  async function handleSave() {

    if (!templateId) return;

    try {

      const response =
        await updateExamTemplate(
          Number(templateId),
          {
            title,
            description,
          }
        );

      setTemplate((currentTemplate) => {
        if (!currentTemplate) {
          return response.template;
        }

        return {
          ...currentTemplate,
          ...response.template,
          exam_template_questions:
            currentTemplate.exam_template_questions,
        };
      });
      setIsEditing(false);
      setShowSuccess(true);

      setTimeout(() => {setShowSuccess(false);}, 3000);

    } catch (error) {

      console.error(
        "Failed to update template:",
        error
      );
    }
  }

  async function handleDeleteQuestion(
    questionId: number
  ) {

    if (!templateId) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this question?\n\nThis action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {

      await deleteExamTemplateQuestion(
        Number(templateId),
        questionId
      );

      await loadTemplate();

    } catch (error) {

      console.error(
        "Failed to delete question:",
        error
      );

    }

  }
  const filteredQuestions =
    template?.exam_template_questions?.filter(
      (question) => {

        if (!searchTerm.trim()) {
          return true;
        }

        return question.question_text
          .toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          );

      }
    ) || [];
  return (
    <PageContainer>
      <button
        style={styles.backButton}
        onClick={() =>
          navigate("/exams/templates")
        }
      >
        ← Back to Templates
      </button>
      <PageHeader
        title="Template Details"
        subtitle="View exam template"
      />

      <Panel>

        {loading ? (

          <div>
            Loading template...
          </div>

        ) : !template ? (

          <div>
            Template not found.
          </div>

        ) : (

          <>
            {showSuccess && (
              <div style={styles.successBanner}>
                ✓ Template updated successfully
              </div>
            )}
            <div style={styles.summaryCard}>

              <div style={styles.summaryTitle}>
                {isEditing ? (

                  <input
                    value={title}
                    onChange={(e) =>
                      setTitle(
                        e.target.value
                      )
                    }
                  />

                ) : (

                  template.title

                )}
              </div>
              <div style={styles.summaryDescription}>
                {isEditing ? (
                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                    style={styles.textarea}
                  />
                ) : (
                  template.description || "No description provided"
                )}
              </div>

              <div style={styles.summaryFooter}>

                <div style={styles.summaryStat}>
                  {template.exam_template_questions?.length ?? 0} Questions
                </div>

                {isEditing ? (

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    <button
                      style={styles.actionBtn}
                      onClick={handleSave}
                    >
                      Save Changes
                    </button>

                    <button
                      style={styles.secondaryBtn}
                      onClick={() => {

                        setTitle(template.title);

                        setDescription(
                          template.description || ""
                        );

                        setIsEditing(false);

                      }}
                    >
                      Cancel
                    </button>

                  </div>

                ) : (

                  <button
                    style={styles.primaryButton}
                    onClick={() =>
                      setIsEditing(true)
                    }
                  >
                    Edit Template
                  </button>

                )}

              </div>
            </div>

            <div style={styles.questionsHeader}>

              <div>
                <h2 style={styles.sectionTitle}>
                  Questions
                </h2>

                <div style={styles.questionCount}>

                  {searchTerm.trim()
                    ? `Showing ${filteredQuestions.length} of ${template.exam_template_questions?.length ?? 0} Questions`
                    : `${template.exam_template_questions?.length ?? 0} Questions`}

                </div>
              </div>

              <button
                style={styles.primaryButton}
                onClick={() =>
                  navigate(
                    `/exams/templates/${template.id}/questions/new`
                  )
                }
              >
                + Add Question
              </button>

            </div>

            <div style={styles.searchRow}>

              <span style={styles.searchIcon}>
                🔍
              </span>

              <input
                type="text"
                placeholder="Search question text..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                style={styles.searchInput}
              />

              {searchTerm && (

                <button
                  style={styles.clearSearchBtn}
                  onClick={() =>
                    setSearchTerm("")
                  }
                >
                  ✕
                </button>

              )}

            </div>

            <div style={styles.questionsList}>

              {filteredQuestions.length === 0 ? (

                <div style={styles.emptySearch}>
                  No matching questions found.
                </div>

              ) : (

                filteredQuestions.map(
                (question, index) => (
                  <div
                    key={question.id}
                    style={styles.questionCard}
                  >
                    <div style={styles.questionNumber}>
                      Question {index + 1}
                    </div>

                    <div style={styles.questionText}>
                      {question.question_text}
                      <div style={styles.optionsContainer}>
                        {Object.entries(question.options || {}).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              style={styles.option}
                            >
                              <strong>{key}.</strong> {value}
                            </div>
                          )
                        )}
                      </div>
                      <div style={styles.correctAnswerRow}>

                        <strong>Correct Answer</strong>

                        <div style={styles.correctAnswerText}>

                          {Array.isArray(question.correct_answers)
                            ? question.correct_answers.map((answerKey) => (

                                <div key={answerKey}>
                                  <strong>{answerKey}.</strong>{" "}
                                  {question.options?.[answerKey] ?? "(missing option)"}
                                </div>

                              ))
                            : "None"}

                        </div>

                      </div>
                      
                    </div>
                    <div style={styles.analyticsRow}>

                      <div style={styles.analyticsItem}>
                        <div style={styles.analyticsLabel}>
                          Difficulty
                        </div>

                        <span
                          style={{
                            ...styles.difficultyBadge,
                            ...(question.difficulty === "Easy"
                              ? styles.easyBadge
                              : question.difficulty === "Medium"
                              ? styles.mediumBadge
                              : question.difficulty === "Hard"
                              ? styles.hardBadge
                              : styles.noDataBadge),
                          }}
                        >
                          {question.difficulty}
                        </span>
                      </div>

                      {(question.attempts ?? 0) > 0 && (
                        <div style={styles.analyticsItem}>
                          <div style={styles.analyticsLabel}>
                            Correct Rate
                          </div>

                          <div style={styles.analyticsValue}>
                            {question.correctRate}%
                          </div>
                        </div>
                      )}

                      <div style={styles.analyticsItem}>
                        <div style={styles.analyticsLabel}>
                          Attempts
                        </div>

                        <div style={styles.analyticsValue}>
                          {question.attempts ?? 0}
                        </div>
                      </div>

                    </div>
                    <div style={styles.questionActions}>

                      <button
                        style={styles.actionBtn}
                        onClick={() =>
                          navigate(
                            `/exams/templates/${template.id}/questions/${question.id}`
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        style={styles.deleteBtn}
                        onClick={() =>
                          handleDeleteQuestion(question.id)
                        }
                      >
                        Delete
                      </button>

                    </div>
                  </div>
                ))
              )}
            </div>
          </>

        )}

      </Panel>
    </PageContainer>
  );
}

const styles: {
  [key: string]: React.CSSProperties;
} = {
  questionCard: {
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "20px",
    marginTop: "12px",
    backgroundColor: "#FFFFFF",
  },

  questionNumber: {
    fontWeight: 600,
    color: "#64748B",
    marginBottom: "8px",
  },

  questionText: {
    fontSize: "17px",
    fontWeight: 600,
    color: "#111827",
    lineHeight: 1.6,
  },

  optionsContainer: {
    marginTop: "12px",
  },

  option: {
    padding: "6px 0",
    color: "#374151",
    fontSize: "15px",
    paddingLeft: "12px",
  },

  backButton: {
    backgroundColor: "#2563EB",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "10px 18px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
    marginBottom: "20px",
  },
  
  summaryCard: {
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px",
    backgroundColor: "#FFFFFF",
  },

  summaryTitle: {
    fontSize: "20px",
    fontWeight: 700,
    marginBottom: "10px",
  },

  summaryDescription: {
    color: "#64748B",
    marginBottom: "16px",
    lineHeight: 1.5,
  },

  summaryStat: {
    fontWeight: 600,
    color: "#111827",
  },

  textarea: {
    width: "100%",
    minHeight: "90px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #D1D5DB",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
  },

  correctAnswerRow: {
    marginTop: "18px",
    paddingTop: "16px",
    borderTop: "1px solid #E5E7EB",
    fontSize: "14px",
    fontWeight: 600,
    color: "#1F2937",
  },

  questionActions: {
    marginTop: "12px",
    display: "flex",
    gap: "8px",
  },

  primaryButton: {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#2B78F6",
    color: "#FFFFFF",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },

  actionBtn: {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#2B78F6",
    color: "#FFFFFF",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },

  secondaryBtn: {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "1px solid #D1D5DB",
    backgroundColor: "#FFFFFF",
    color: "#111827",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },

  deleteBtn: {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "1px solid #FCA5A5",
    backgroundColor: "#FFFFFF",
    color: "#DC2626",
    cursor: "pointer",
    fontWeight: 600,
  },

  summaryFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
  },

  correctAnswerText: {
    marginTop: "8px",
    color: "#111827",
    lineHeight: 1.6,
  },

  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "20px",
  },

  searchInput: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #D1D5DB",
    fontSize: "14px",
  },

  questionsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },

  questionCount: {
    fontSize: "14px",
    color: "#64748B",
    fontWeight: 600,
  },

  emptySearch: {
    textAlign: "center",
    padding: "40px",
    color: "#64748B",
    fontStyle: "italic",
  },

  searchIcon: {
    fontSize: "18px",
    color: "#64748B",
  },

  clearSearchBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
    color: "#64748B",
    padding: "0 6px",
  },

  analyticsRow: {
    display: "flex",
    gap: "28px",
    marginTop: "18px",
    paddingTop: "14px",
    borderTop: "1px solid #E5E7EB",
  },

  analyticsItem: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },

  analyticsLabel: {
    fontSize: "12px",
    color: "#64748B",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  },

  analyticsValue: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#1F2937",
  },

  difficultyBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 700,
  },

  easyBadge: {
    background: "#DCFCE7",
    color: "#166534",
  },

  mediumBadge: {
    background: "#FEF3C7",
    color: "#92400E",
  },

  hardBadge: {
    background: "#FEE2E2",
    color: "#991B1B",
  },

  noDataBadge: {
    background: "#E5E7EB",
    color: "#4B5563",
  },
    
};