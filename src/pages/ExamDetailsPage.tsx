import { useEffect, useState } from "react";
import axios from "axios";
import {
  useParams,
  useNavigate
} from "react-router-dom";
import {
  getExamDetails,
  getExamTemplates,
  updateExam,
  deleteExam,
  assignClassToExam,
  removeClassFromExam,
  searchUsersForExam,
  assignUserToExam,
  removeUserFromExam,
} from "@/api/examsAPI";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { ExamDetails } from "@/interfaces/ExamDetails";
import { ExamTemplate } from "@/interfaces/ExamTemplate";
import SearchableTimeZonePicker from "@/components/Common/SearchableTimeZonePicker";
import { fetchClasses } from "../api/classAPI";
import { ClassItem } from "../interfaces/Class";

export default function
ExamDetailsPage() {

  const { id } = useParams();

  const navigate = useNavigate();

  const [exam, setExam] = useState<ExamDetails | null>(null);

  const [templates, setTemplates] = useState<ExamTemplate[]>([]);

  const [showParticipants, setShowParticipants] = useState(false);

  const [editing, setEditing] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formData, setFormData] =
  useState({
    title: "",
    description: "",
    localStart: "",
    localEnd: "",
    duration_minutes: 0,
    time_zone: "",
    exam_template_id: null as number | null,
  });

  const [showAddClass, setShowAddClass] = useState(false);

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  const [availableClasses, setAvailableClasses] = useState<ClassItem[]>([]);

  const [showAddParticipant, setShowAddParticipant] = useState(false);

  const [userSearch, setUserSearch] = useState("");

  const [userResults, setUserResults] = useState<{
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  }[]>([]);


  useEffect(() => {

    const loadExam =
      async () => {

      try {

        const data = await getExamDetails(Number(id));

        setExam(data);
        console.log("Exam Details:", data);

        setFormData({
          title: data.title,

          description: data.description || "",

          localStart: data.available_from.slice(0, 16),

          localEnd: data.available_until.slice(0, 16),

          duration_minutes: data.duration_minutes,

          time_zone: data.time_zone || "",

          exam_template_id: data.exam_template_id,
        });

        const classData = await fetchClasses();

        setAvailableClasses(classData.classes);

        const templateData = await getExamTemplates();

        setTemplates(templateData);

      } catch (err) {

        console.error(
          "Failed to load exam",
          err
        );

      }
    };

    if (id) {
      loadExam();
    }

  }, [id]);

  if (!exam) {
    return <div>Loading...</div>;
  }

  const assignableClasses = availableClasses.filter(
    (classItem) =>
      classItem.status !== "draft" &&
      classItem.status !== "completed" &&
      classItem.status !== "archived" &&
      !exam.classes.some(
        (assignedClass) =>
          assignedClass.id === classItem.id
      )
  );

  return (
    <PageContainer>
      <button
        onClick={() =>
          navigate("/exams/scheduled")
        }
        style={{
          background: "none",
          border: "none",
          color: "#2B78F6",
          cursor: "pointer",
          padding: 0,
          marginBottom: "12px",
          fontSize: "14px",
          fontWeight: 600,
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        ← Back to Scheduled Exams
      </button>
      <PageHeader
        title={exam.title}
        subtitle="Exam session details"
      />
      {successMessage && (
        <div
          style={{
            backgroundColor: "#ECFDF5",
            color: "#166534",
            border: "1px solid #BBF7D0",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "16px",
            fontWeight: 600,
          }}
        >
          ✓ {successMessage}
        </div>
      )}
      <Panel>

      <div
        style={{
          marginTop: "12px",
          marginBottom: "24px",
        }}
      >

        {!editing ? (

          <>
            <button
              style={{
                backgroundColor: "#2B78F6",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={() => setEditing(true)}
            >
              Edit Exam
            </button>

            <button
              style={{
                marginLeft: "8px",
                backgroundColor: "#DC2626",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={() =>
                setShowDeleteModal(true)
              }
            >
              Delete Exam
            </button>
          </>

        ) : (

          <>
            <button
              style={{
                backgroundColor: "#2B78F6",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={async () => {

                try {

                  await updateExam(
                    Number(id),
                    {
                      ...formData,
                      timeZone:
                        formData.time_zone,
                    }
                  );

                  const updated =
                    await getExamDetails(
                      Number(id)
                    );

                  setExam(updated);

                  setEditing(false);

                  setSuccessMessage("Exam updated successfully");

                  setTimeout(() => {
                    setSuccessMessage("");
                  }, 3000);

                } catch (err) {

                  console.error(err);

                  setFormData({
                    title: exam.title,
                    description: exam.description || "",
                    localStart: exam.available_from.slice(0, 16),
                    localEnd: exam.available_until.slice(0, 16),
                    duration_minutes: exam.duration_minutes,
                    time_zone: exam.time_zone || "",
                    exam_template_id: exam.exam_template_id,
                  });

                  if (axios.isAxiosError(err)) {
                    alert(
                      err.response?.data?.message ||
                      "Failed to save exam"
                    );
                  } else {
                    alert(
                      "Failed to save exam"
                    );
                  }

                }

              }}
            >
              Save Changes
            </button>

            <button
              style={{
                marginLeft: "8px",
                backgroundColor: "#FFFFFF",
                color: "#334155",
                border: "1px solid #CBD5E1",
                borderRadius: "8px",
                padding: "10px 16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={() => {

                setFormData({

                  title: exam.title,

                  description: exam.description || "",

                  localStart: exam.available_from.slice(0, 16),

                  localEnd: exam.available_until.slice(0, 16),

                  duration_minutes: exam.duration_minutes,

                  time_zone: exam.time_zone || "",

                  exam_template_id: exam.exam_template_id,

                });

                setEditing(false);

              }}
            >
              Cancel
            </button>
          </>

        )}

      </div>

      <h2>Session Information</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px 32px",
          marginTop: "16px",
        }}
      >
        <div
          style={{
            gridColumn: "1 / -1",
          }}
        >
          <strong>Title:</strong>{" "}

          {editing ? (
            <div style={{ marginTop: "8px" }}>
              <input
                value={formData.title}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    title: e.target.value,
                  })
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ) : (
            exam.title
          )}
        </div>
        <div>
          <strong>Start:</strong>{" "}
          {editing ? (
            <input
              type="datetime-local"
              value={formData.localStart}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  localStart: e.target.value,
                })
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #CBD5E1",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            />
          ) : (
            new Date(exam.available_from).toLocaleString()
          )}
        </div>

        <div>
        {editing ? (
          <>
            <strong>Duration:</strong>

            <div>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_minutes: Number(e.target.value),
                  })
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </>
        ) : (
          <>
            <strong>Duration:</strong>{" "}
            {exam.duration_minutes} minutes
          </>
        )}
      </div>

        <div>
          <strong>End:</strong>{" "}
          {editing ? (
            <input
              type="datetime-local"
              value={formData.localEnd}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  localEnd: e.target.value,
                })
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #CBD5E1",
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          ) : (
            new Date(exam.available_until).toLocaleString()
          )}
        </div>
        
        <div>
          <strong>Time Zone:</strong>{" "}

          {editing ? (

            <SearchableTimeZonePicker
              value={formData.time_zone}
              onChange={(timeZone) =>
                setFormData({
                  ...formData,
                  time_zone: timeZone,
                })
              }
            />

          ) : (

            exam.time_zone

          )}
        </div>

        <div>
          <strong>Exam Template:</strong>{" "}

          {editing ? (
            <div style={{ marginTop: "8px" }}>
              <select
                value={formData.exam_template_id ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    exam_template_id:
                      e.target.value === ""
                        ? null
                        : Number(e.target.value),
                  })
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              >
                <option value="">
                  Select a template
                </option>

                {templates.map((template) => (
                  <option
                    key={template.id}
                    value={template.id}
                  >
                    {template.title}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            exam.exam_template?.title ?? "No template assigned"
          )}
        </div>

        <div
          style={{
            gridColumn: "1 / -1",
            marginTop: "8px",
          }}
        >
          <strong>Description:</strong>

          <div style={{ marginTop: "8px" }}>
            {editing ? (
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                rows={4}
                style={{
                  width: "100%",
                  minHeight: "120px",
                  padding: "12px",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            ) : (
              exam.description || "No description"
            )}
          </div>
        </div>
      </div>
      </Panel>

      <Panel>

        <h2>
          Classes
        </h2>

        <div
          style={{
            marginBottom: "12px",
          }}
        >

          {editing && (

            <button
              style={{
                backgroundColor: "#2B78F6",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={() =>
                setShowAddClass(
                  !showAddClass
                )
              }
            >
              Add Class
            </button>

          )}

          {showAddClass && (

            <div
              style={{
                marginTop: "12px",
                marginBottom: "12px",
              }}
            >

              <select
                value={selectedClassId ?? ""}
                onChange={(e) =>
                  setSelectedClassId(
                    e.target.value === ""
                      ? null
                      : Number(e.target.value)
                  )
                }
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  padding: "10px 12px",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  fontSize: "14px",
                }}
              >
                <option value="">
                  Select Class
                </option>

                {assignableClasses.map(
                  (classItem) => (
                    <option
                      key={classItem.id}
                      value={classItem.id}
                    >
                      {classItem.name}
                    </option>
                  )
                )}
              </select>

              <div style={{ marginTop: "12px" }}>
                <button
                  disabled={!selectedClassId}
                  style={{
                    backgroundColor: selectedClassId
                      ? "#2B78F6"
                      : "#94A3B8",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    fontWeight: 600,
                    cursor: selectedClassId
                      ? "pointer"
                      : "not-allowed",
                  }}
                  onClick={async () => {
                    if (!selectedClassId) return;

                    try {
                      await assignClassToExam(
                        Number(id),
                        selectedClassId
                      );

                      const updated =
                        await getExamDetails(Number(id));

                      setExam(updated);
                      setSelectedClassId(null);
                      setShowAddClass(false);

                    } catch (err) {
                      console.error(err);

                      alert(
                        "Failed to assign class"
                      );
                    }
                  }}
                >
                  Assign
                </button>

                <button
                  style={{
                    marginLeft: "8px",
                    backgroundColor: "#FFFFFF",
                    color: "#334155",
                    border: "1px solid #CBD5E1",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setShowAddClass(false);
                    setSelectedClassId(null);
                  }}
                >
                  Cancel
                </button>
              </div>

            </div>

          )}

        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginTop: "12px",
          }}
        >

          {exam.classes.map(
            (classItem) => (

              <div
                key={classItem.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                  backgroundColor: "#F9FAFB",
                }}
              >

                <div>
                  <div
                    style={{
                      fontWeight: 600,
                    }}
                  >
                    {classItem.name}
                  </div>

                  <div
                    style={{
                      marginTop: "3px",
                      fontSize: "13px",
                      color: "#64748B",
                    }}
                  >
                    {classItem.organization?.name ?? "—"}
                    {" • "}
                    {classItem.program?.name ?? "—"}
                  </div>
                </div>

                {editing && (
                  <button
                    style={{
                      marginLeft: "12px",
                      backgroundColor: "transparent",
                      color: "#DC2626",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: "4px 8px",
                    }}
                    onClick={async () => {

                      const confirmed =
                        window.confirm(
                          `Remove ${classItem.name} from this exam?`
                        );

                      if (!confirmed) {
                        return;
                      }

                      try {

                        await removeClassFromExam(
                          Number(id),
                          classItem.id
                        );

                        const updated =
                          await getExamDetails(
                            Number(id)
                          );

                        setExam(updated);

                      } catch (err) {

                        console.error(err);

                        alert(
                          "Failed to remove class"
                        );

                      }

                    }}
                  >
                    Remove
                  </button>
                )}

              </div>

            )
          )}

        </div>

      </Panel>

      <Panel>

        <h2>
          Participants
        </h2>

        {showAddParticipant && (

          <div
            style={{
              marginTop: "16px",
              marginBottom: "16px",
            }}
          >

            <input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={async (e) => {

                const value =
                  e.target.value;

                setUserSearch(value);

                if (
                  value.length < 2
                ) {

                  setUserResults([]);

                  return;

                }

                try {

                  const users =
                    await searchUsersForExam(
                      value
                    );

                  setUserResults(users);

                } catch (err) {

                  console.error(err);

                }

              }}
              style={{
                width: "300px",
                padding: "8px",
              }}
            />

          </div>

        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "16px",
            marginBottom: "16px",
          }}
        >
          {editing && (
            <button
              style={{
                backgroundColor: showAddParticipant
                  ? "#FFFFFF"
                  : "#2B78F6",
                color: showAddParticipant
                  ? "#334155"
                  : "#FFFFFF",
                border: showAddParticipant
                  ? "1px solid #CBD5E1"
                  : "none",
                borderRadius: "8px",
                padding: "10px 16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
              onClick={() =>
                setShowAddParticipant(
                  !showAddParticipant
                )
              }
            >
              {showAddParticipant
                ? "Cancel"
                : "Add Participant"}
            </button>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <strong>
              {exam.exam_user_access.length}
            </strong>{" "}
            Assigned Users
          </div>

          <button
            style={{
              backgroundColor: "#FFFFFF",
              color: "#334155",
              border: "1px solid #CBD5E1",
              borderRadius: "8px",
              padding: "10px 16px",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={() =>
              setShowParticipants(
                !showParticipants
              )
            }
          >
            {showParticipants
              ? "Hide Participants"
              : "View Participants"}
          </button>
        </div>

        {showParticipants && (

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginTop: "16px",
            }}
          >

            {exam.exam_user_access.map(
              (access) => (

                <div
                  key={access.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    backgroundColor: "#F8FAFC",
                  }}
                >

                  <div>

                    <div
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      {access.users.first_name}
                      {" "}
                      {access.users.last_name}
                    </div>

                    <div
                      style={{
                        fontSize: "13px",
                        color: "#64748B",
                      }}
                    >
                      {access.users.email}
                    </div>

                  </div>
                  {editing && (
                    <button
                      style={{
                        backgroundColor: "#FEF2F2",
                        color: "#DC2626",
                        border: "1px solid #FECACA",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                      onClick={async () => {

                        const confirmed =
                          window.confirm(
                            `Remove ${access.users.first_name} ${access.users.last_name} from this exam?`
                          );

                        if (!confirmed) {
                          return;
                        }

                        try {

                          await removeUserFromExam(
                            Number(id),
                            access.users.id
                          );

                          const updated =
                            await getExamDetails(
                              Number(id)
                            );

                          setExam(updated);

                        } catch (err) {

                          console.error(err);

                          alert(
                            "Failed to remove participant"
                          );

                        }

                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>

              )
            )}

          </div>

        )}

        {userResults.length > 0 && (

          <div
            style={{
              marginTop: "12px",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              padding: "8px",
            }}
          >

            {userResults.map(
              (user) => (

                <div
                  key={user.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom:
                      "1px solid #F1F5F9",
                  }}
                >

                  <div>

                    <strong>
                      {user.first_name}
                      {" "}
                      {user.last_name}
                    </strong>

                    <br />

                    <small>
                      {user.email}
                    </small>

                  </div>

                  <button
                    onClick={async () => {

                      try {

                        await assignUserToExam(
                          Number(id),
                          user.id
                        );

                        const updated =
                          await getExamDetails(
                            Number(id)
                          );

                        setExam(updated);

                        setUserSearch("");

                        setUserResults([]);

                        setShowAddParticipant(false);

                      } catch (err) {

                        console.error(err);

                        alert(
                          "Failed to assign participant"
                        );

                      }

                    }}
                  >
                    Assign
                  </button>
                </div>
              )
            )}
          </div>
        )}
      </Panel>
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              padding: "24px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.20)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: "12px",
              }}
            >
              Delete Exam?
            </h2>

            <p
              style={{
                marginTop: 0,
                marginBottom: "8px",
                color: "#475569",
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to permanently delete
              <strong> {exam.title}</strong>?
            </p>

            <p
              style={{
                marginTop: 0,
                marginBottom: "24px",
                color: "#64748B",
                fontSize: "14px",
              }}
            >
              This action cannot be undone.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
              }}
            >
              <button
                style={{
                  backgroundColor: "#FFFFFF",
                  color: "#334155",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() =>
                  setShowDeleteModal(false)
                }
              >
                Cancel
              </button>

              <button
                style={{
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={async () => {

                  try {

                    await deleteExam(
                      Number(id)
                    );

                    setShowDeleteModal(false);

                    navigate(
                      "/exams/scheduled"
                    );

                  } catch (err) {

                    console.error(err);

                    setShowDeleteModal(false);

                    if (axios.isAxiosError(err)) {
                      alert(
                        err.response?.data?.message ||
                        "Failed to delete exam"
                      );
                    } else {
                      alert(
                        "Failed to delete exam"
                      );
                    }

                  }

                }}
              >
                Delete Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}