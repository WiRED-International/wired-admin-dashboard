import { useEffect, useState } from "react";
import React from "react";
import axios from "axios";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { ExamTemplate } from "@/interfaces/ExamTemplate";
import {
  getExamTemplates,
  createExamTemplate,
  deleteExamTemplate,
} from "@/api/examTemplatesAPI";
import { useNavigate } from "react-router-dom";

export default function ExamTemplatesPage() {

  const [templates, setTemplates] = useState<ExamTemplate[]>([]);
  const [loading, setLoading] = useState(true);
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

    try {

      const response =
        await createExamTemplate({
          title: "New Template",
          description: "",
        });

      const newTemplateId =
        response.template.id;

      navigate(
        `/exams/templates/${newTemplateId}`
      );

    } catch (error) {

      console.error(
        "Failed to create template:",
        error
      );
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
                  onClick={handleCreateTemplate}
                >
                  Create Template
                </button>

                <button style={styles.secondaryButton}>
                  Import Template
                </button>
              </div>
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
};