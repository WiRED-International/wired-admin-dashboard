import { useEffect, useState } from "react";
import React from "react";
import axios from "axios";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { ExamTemplate, ExamType } from "@/interfaces/ExamTemplate";
import {
  getExamTemplates,
  createExamTemplate,
  deleteExamTemplate,
} from "@/api/examTemplatesAPI";
import { useNavigate } from "react-router-dom";

export default function ExamTemplatesPage() {

  const [templates, setTemplates] = useState<ExamTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState("New Template");
  const [newExamType, setNewExamType] = useState<ExamType | "">("");
  const [newProgram, setNewProgram] = useState("Basic Training");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {

    try {

      const data = await getExamTemplates();

      setTemplates(data);

    } catch (error) {

      console.error("Failed to load templates:", error);

    } finally {

      setLoading(false);
    }
  }

  async function handleCreateTemplate() {
    if (!newTemplateTitle.trim() || !newExamType) {
      return;
    }

    try {
      setCreating(true);

      const response = await createExamTemplate({
        title: newTemplateTitle.trim(),
        description: "",
        program: newProgram,
        exam_type: newExamType,
      });

      const newTemplateId = response.template.id;

      navigate(`/exams/templates/${newTemplateId}`);
    } catch (error) {
      console.error("Failed to create template:", error);
      alert("Failed to create template.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteTemplate(
    templateId: number
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this template? This will also delete all questions in the template."
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteExamTemplate(templateId);

      setTemplates((currentTemplates) =>
        currentTemplates.filter(
          (template) => template.id !== templateId
        )
      );

    } catch (error) {

      console.error(
        "Failed to delete template:",
        error
      );

      if (axios.isAxiosError(error)) {
        alert(
          error.response?.data?.message ??
          "Failed to delete template."
        );
      } else {
        alert("Failed to delete template.");
      }

    }
  }

  return (
    <PageContainer>
      <button
        style={styles.backButton}
        onClick={() => navigate("/exams")}
      >
        ← Back to Exams
      </button>
      <PageHeader
        title="Exam Templates"
        subtitle="Manage reusable exam templates"
      />

      <Panel>
          {loading ? (

            <div>
              Loading templates...
            </div>

          ) : (

            <>
              <div style={styles.actions}>
                <button
                  style={styles.primaryButton}
                  onClick={() => setShowCreateForm(true)}
                >
                  Create Template
                </button>

                <button style={styles.secondaryButton}>
                  Import Template
                </button>
              </div>
              {showCreateForm && (
                <div style={styles.createForm}>
                  <h3 style={{ marginTop: 0 }}>Create Exam Template</h3>

                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Template Title</label>
                    <input
                      style={styles.formInput}
                      value={newTemplateTitle}
                      onChange={(e) => setNewTemplateTitle(e.target.value)}
                    />
                  </div>

                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Program</label>
                    <select
                      style={styles.formInput}
                      value={newProgram}
                      disabled={
                        newExamType === "basic_qualifying" ||
                        newExamType === "act_final" ||
                        newExamType === "specialization_final"
                      }
                      onChange={(e) => setNewProgram(e.target.value)}
                    >
                      <option value="Basic Training">Basic Training</option>
                      <option value="ACT">ACT</option>
                      <option value="Specialization">Specialization</option>
                    </select>
                  </div>

                  <div style={styles.formField}>
                    <label style={styles.formLabel}>Exam Type</label>
                    <select
                      style={styles.formInput}
                      value={newExamType}
                      onChange={(e) => {
                        const selectedType = e.target.value as ExamType | "";
                        setNewExamType(selectedType);

                        if (selectedType === "basic_qualifying") {
                          setNewProgram("Basic Training");
                        } else if (selectedType === "act_final") {
                          setNewProgram("ACT");
                        } else if (selectedType === "specialization_final") {
                          setNewProgram("Specialization");
                        }
                      }}
                    >
                      <option value="">Select an exam type</option>
                      <option value="general">General / Other</option>
                      <option value="basic_qualifying">Basic Qualifying Exam</option>
                      <option value="act_final">ACT Final Exam</option>
                      <option value="specialization_final">Specialization Final Exam</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      style={styles.primaryButton}
                      onClick={handleCreateTemplate}
                      disabled={creating || !newTemplateTitle.trim() || !newExamType}
                    >
                      {creating ? "Creating..." : "Create and Open"}
                    </button>

                    <button
                      style={styles.secondaryBtn}
                      onClick={() => setShowCreateForm(false)}
                      disabled={creating}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              <div
                style={{
                  marginBottom: "16px",
                  color: "#64748B",
                  fontSize: "14px",
                }}
              >
                {templates.length} Templates
              </div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Template</th>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {templates.map((template) => (
                    <tr key={template.id}>
                      <td style={styles.td}>
                        {template.title}
                      </td>

                      <td style={styles.td}>
                        {template.description || "—"}
                      </td>

                      <td style={styles.td}>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                          }}
                        >
                          <button
                            style={styles.actionBtn}
                            onClick={() =>
                              navigate(
                                `/exams/templates/${template.id}`
                              )
                            }
                          >
                            View
                          </button>

                          <button
                            style={styles.deleteBtn}
                            onClick={() =>
                              handleDeleteTemplate(template.id)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </>
        )}
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

  secondaryBtn: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #D1D5DB",
    backgroundColor: "#FFFFFF",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },
    actions: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
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

  deleteBtn: {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "1px solid #DC2626",
    background: "#FEF2F2",
    color: "#DC2626",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
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

  createForm: {
    border: "1px solid #D1D5DB",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "20px",
    backgroundColor: "#F9FAFB",
  },

  formField: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "16px",
  },

  formLabel: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
  },

  formInput: {
    padding: "10px",
    border: "1px solid #D1D5DB",
    borderRadius: "6px",
    fontSize: "14px",
  },
};