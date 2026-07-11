import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";

import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation, } from "react-router-dom";

import { getExamTemplateQuestion, updateExamTemplateQuestion, createExamTemplateQuestion, } from "@/api/examTemplatesAPI";
import { ExamTemplateQuestion } from "@/interfaces/ExamTemplate";

export default function ExamTemplateQuestionDetailsPage() {

  const { templateId, questionId } = useParams();

  const navigate = useNavigate();

  const location = useLocation();

  const [question, setQuestion] = useState<ExamTemplateQuestion | null>(null);

  const [questionText, setQuestionText] = useState("");

  const [options, setOptions] = useState<Record<string, string>>({});

  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);

  const [showSuccess, setShowSuccess] = useState(false);

  const isNewQuestion = location.pathname.endsWith("/questions/new");

  const [questionType, setQuestionType] = useState("single");

  console.log({
    templateId,
    questionId,
    isNewQuestion,
  });

    useEffect(() => {

      if (isNewQuestion) {

        setQuestion({
          id: 0,
          exam_template_id: Number(templateId),
          question_type: "single",
          question_text: "",
          options: {
            A: "",
            B: "",
            C: "",
            D: "",
          },
          correct_answers: [],
          order: 0,
        });

        setQuestionText("");

        setQuestionType("single");

        setOptions({
          A: "",
          B: "",
          C: "",
          D: "",
        });

        setCorrectAnswers([]);

        setLoading(false);

      } else {

        loadQuestion();

      }

    }, [templateId, questionId]);

    useEffect(() => {

      if (questionType !== "true_false") {
        return;
      }

      setOptions({
        A: "True",
        B: "False",
      });

      setCorrectAnswers([]);

    }, [questionType]);

    async function loadQuestion() {

        if (!templateId || !questionId) {
        return;
        }

        try {

        const data =
          await getExamTemplateQuestion(
            Number(templateId),
            Number(questionId)
          );

          setQuestion(data);

          setQuestionText(
            data.question_text || ""
          );

          setQuestionType(
            data.question_type || "single"
          );

          setOptions(
            data.options || {}
          );

          setCorrectAnswers(
            data.correct_answers || []
          );

        } catch (error) {

        console.error(
            "Failed to load question:",
            error
        );

        } finally {

        setLoading(false);
        }
    }

    async function handleSave() {

      if (!templateId) {
        return;
      }

      if (!question) {
        return;
      }

      try {

        let savedQuestion: ExamTemplateQuestion;

        if (isNewQuestion) {

          savedQuestion =
            await createExamTemplateQuestion(
              Number(templateId),
              {
                question_type: questionType,
                question_text: questionText,
                options,
                correct_answers: correctAnswers,
              }
            );

        } else {

          savedQuestion =
            await updateExamTemplateQuestion(
              Number(templateId),
              Number(questionId),
              {
                question_type: questionType,
                question_text: questionText,
                options,
                correct_answers: correctAnswers,
              }
            );

        }

        setQuestion(savedQuestion);

        if (isNewQuestion) {

          navigate(
            `/exams/templates/${templateId}`
          );

          return;

        }

        setShowSuccess(true);

        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);

      } catch (error) {

        console.error(
          "Failed to save question:",
          error
        );

      }

    }

    function updateOption(
      key: keyof typeof options,
      value: string
    ) {
      setOptions((prev) => ({
        ...prev,
        [key]: value,
      }));
    }

    if (loading) {
      return (
        <PageContainer>
          <PageHeader
            title="Question Editor"
            subtitle="Loading question..."
          />

          <Panel>
            Loading question...
          </Panel>
        </PageContainer>
      );
    }

    if (!question) {
      return (
        <PageContainer>
          <PageHeader
            title="Question Editor"
            subtitle={
              isNewQuestion
                ? "Create a new exam question"
                : "Edit exam question"
            }
          />

          <Panel>
            Question not found.
          </Panel>
        </PageContainer>
      );
    }
    
  return (
    <PageContainer>

        <button
          style={styles.backButton}
          onClick={() =>
            navigate(`/exams/templates/${templateId}`)
          }
        >
          ← Back to Template
        </button>

        <PageHeader
          title="Question Editor"
          subtitle={
            isNewQuestion
              ? "Create a new exam question"
              : `Edit Question ${question.order}`
          }
        />

      <Panel>
        {showSuccess && (
          <div style={styles.successBanner}>
            ✓ Question updated successfully
          </div>
        )}

        <div style={styles.editorLayout}>

          <div style={styles.editorMain}>
          
            <h2 style={styles.sectionTitle}>
              Question {question.order}
            </h2>

            <div style={styles.detailCard}>
              <div style={styles.fieldLabel}>
                Question Text
              </div>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                style={styles.questionTextarea}
              />

            </div>

            <h2 style={styles.sectionTitle}>
              Answer Options
            </h2>

            <div style={styles.detailCard}>

              <div style={styles.optionsContainer}>

                {(
                  questionType === "true_false"
                    ? (["A", "B"] as const)
                    : (["A", "B", "C", "D"] as const)
                ).map((key) => (

                  <div
                    key={key}
                    style={styles.optionRow}
                  >

                    <div style={styles.optionLabel}>
                      Option {key}
                    </div>

                    <input
                      type="text"
                      value={options[key] || ""}
                      onChange={(e) =>
                        updateOption(
                          key,
                          e.target.value
                        )
                      }
                      style={styles.optionInput}
                    />

                  </div>

                ))}

              </div>

            </div>

            <h2 style={styles.sectionTitle}>
              Correct Answer
            </h2>

            <div style={styles.detailCard}>

              {(
                questionType === "true_false"
                  ? (["A", "B"] as const)
                  : (["A", "B", "C", "D"] as const)
              ).map((key) => (

                <div
                  key={key}
                  style={{
                    ...styles.answerCard,
                    ...(correctAnswers.includes(key)
                      ? styles.answerCardSelected
                      : {}),
                  }}
                  onClick={() =>
                    setCorrectAnswers([key])
                  }
                >

                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={correctAnswers.includes(key)}
                    readOnly
                  />

                  <strong>{key}.</strong>{" "}

                  {options[key] || "(empty option)"}

                </div>

              ))}

            </div>
            <div style={styles.metadataCard}>
              <div style={styles.metadataItem}>

                <div style={styles.metadataLabel}>
                  Question Type
                </div>

                <select
                  value={questionType}
                  onChange={(e) =>
                    setQuestionType(e.target.value)
                  }
                  style={styles.select}
                >
                  <option value="single">
                    Single Choice
                  </option>

                  <option value="multiple">
                    Multiple Choice
                  </option>

                  <option value="true_false">
                    True / False
                  </option>

                </select>

              </div>

              <div style={styles.metadataItem}>

                <div style={styles.metadataLabel}>
                  Display Order
                </div>

                <div style={styles.metadataValue}>
                  {question.order}
                </div>

              </div>

        </div>
          <div style={styles.buttonRow}>

            <button
              style={styles.secondaryBtn}
              onClick={() =>
                navigate(
                  `/exams/templates/${templateId}`
                )
              }
            >
              Cancel
            </button>

            <button
              style={styles.actionBtn}
              onClick={handleSave}
            >
              {isNewQuestion
                ? "Save Question"
                : "Save Changes"}
            </button>

          </div>
        </div>
        </div>
      </Panel>

    </PageContainer>
  );
}

const styles: {
  [key: string]: React.CSSProperties;
} = {

  questionTextarea: {
    width: "100%",
    minHeight: "120px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #D1D5DB",
    fontSize: "15px",
    fontFamily: "inherit",
    resize: "vertical",
    marginBottom: "16px",
  },

  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "32px",
    paddingTop: "24px",
    borderTop: "1px solid #E5E7EB",
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

  actionBtn: {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#2B78F6",
    color: "#FFFFFF",
    cursor: "pointer",
    fontWeight: 600,
  },

  secondaryBtn: {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "1px solid #D1D5DB",
    backgroundColor: "#FFFFFF",
    cursor: "pointer",
    fontWeight: 600,
  },

  successBanner: {
    backgroundColor: "#ECFDF5",
    border: "1px solid #10B981",
    color: "#065F46",
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontWeight: 600,
  },

  sectionTitle: {
    fontSize: "18px",
    fontWeight: 700,
    marginBottom: "12px",
  },

  detailCard: {
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "18px",
    marginBottom: "24px",
    backgroundColor: "#FFFFFF",
  },

  questionText: {
    lineHeight: 1.6,
    color: "#111827",
    marginBottom: "16px",
  },

  optionRow: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: "6px",
    marginBottom: "18px",
  },

  optionLabel: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#475569",
    marginBottom: "6px",
    whiteSpace: "nowrap",
  },

  optionInput: {
    flex: 1,
    padding: "10px 12px",
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    fontSize: "14px",
  },

  answerChoice: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
    cursor: "pointer",
  },

  correctAnswer: {
    fontWeight: 600,
    fontSize: "16px",
    marginBottom: "16px",
  },

  metadataCard: {
    display: "flex",
    gap: "40px",
    padding: "18px",
    marginBottom: "24px",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    backgroundColor: "#F9FAFB",
  },

  metadataItem: {
    display: "flex",
    flexDirection: "column",
  },

  metadataLabel: {
    fontSize: "12px",
    color: "#6B7280",
    marginBottom: "4px",
    fontWeight: 600,
  },

  select: {
    marginTop: "8px",
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #D1D5DB",
    fontSize: "14px",
  },

  metadataValue: {
    marginTop: "8px",
    color: "#111827",
    fontWeight: 600,
  },

  answerCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    border: "1px solid #D1D5DB",
    borderRadius: "10px",
    cursor: "pointer",
    marginBottom: "10px",
    transition: "0.15s",
  },

  answerCardSelected: {
    border: "2px solid #2B78F6",
    backgroundColor: "#EFF6FF",
  },

  fieldLabel: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#475569",
    marginBottom: "8px",
  },

  editorLayout: {
    display: "block",
  },

  editorMain: {
    width: "100%",
  },
};