import { useEffect, useState } from "react";
import {
  useParams,
  useNavigate
} from "react-router-dom";
import {
  getExamDetails,
  updateExam,
  deleteExam,
  removeOrganizationFromExam,
  assignOrganizationToExam,
  getAccessibleOrganizations,
  searchUsersForExam,
  assignUserToExam,
  removeUserFromExam,
} from "@/api/examsAPI";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import { ExamDetails } from "@/interfaces/ExamDetails";
import SearchableOrganizationPicker from "@/components/Common/SearchableOrganizationPicker";
import SearchableTimeZonePicker from "@/components/Common/SearchableTimeZonePicker";

export default function
ExamDetailsPage() {

  const { id } = useParams();

  const navigate = useNavigate();

  const [exam, setExam] = useState<ExamDetails | null>(null);

  const [showParticipants, setShowParticipants] = useState(false);

  const [editing, setEditing] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] =
  useState({
    title: "",
    description: "",
    localStart: "",
    localEnd: "",
    duration_minutes: 0,
    time_zone: "",
  });

  const [showAddOrg, setShowAddOrg] = useState(false);

  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  const [availableOrgs, setAvailableOrgs] = useState<{ id: number; name: string }[]>([]);

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
        });

        const orgs = await getAccessibleOrganizations();

        setAvailableOrgs(orgs);

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

  const availableOrganizations =
  availableOrgs.filter(
    (org) =>
      !exam.organizations.some(
        (assigned) =>
          assigned.id === org.id
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
              onClick={async () => {

                const confirmed =
                  window.confirm(
                    "Are you sure you want to delete this exam?"
                  );

                if (!confirmed) {
                  return;
                }

                try {
                  await deleteExam(Number(id));
                  navigate("/exams/scheduled");
                } catch (err) {

                  console.error(
                    err
                  );

                  alert(
                    "Failed to delete exam"
                  );

                }

              }}
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

                  alert(
                    "Failed to save exam"
                  );

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
                      duration_minutes: Number(
                        e.target.value
                      ),
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

        <div></div>

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
          Organizations
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
                setShowAddOrg(
                  !showAddOrg
                )
              }
            >
              Add Organization
            </button>

          )}

          {showAddOrg && (

            <div
              style={{
                marginTop: "12px",
                marginBottom: "12px",
              }}
            >

              <SearchableOrganizationPicker
                organizations={availableOrganizations}
                selectedId={selectedOrgId}
                onSelect={(id) =>
                  setSelectedOrgId(id)
                }
                placeholder="Select Organization"
                clearLabel="Clear Selection"
              />

              <div style={{ marginTop: "12px" }}>
                <button
                  disabled={!selectedOrgId}
                  style={{
                    backgroundColor: selectedOrgId
                      ? "#2B78F6"
                      : "#94A3B8",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    fontWeight: 600,
                    cursor: selectedOrgId
                      ? "pointer"
                      : "not-allowed",
                  }}
                  onClick={async () => {
                    if (!selectedOrgId) return;

                    try {
                      await assignOrganizationToExam(
                        Number(id),
                        selectedOrgId
                      );

                      const updated =
                        await getExamDetails(Number(id));

                      setExam(updated);
                      setSelectedOrgId(null);
                      setShowAddOrg(false);
                    } catch (err) {
                      console.error(err);
                      alert("Failed to assign organization");
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
                    setShowAddOrg(false);
                    setSelectedOrgId(null);
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

          {exam.organizations.map(
            (org) => (

              <div
                key={org.id}
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
                  {org.name}
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
                          `Remove ${org.name} from this exam?`
                        );

                      if (!confirmed) {
                        return;
                      }

                      try {

                        await removeOrganizationFromExam(
                          Number(id),
                          org.id
                        );

                        const updated =
                          await getExamDetails(
                            Number(id)
                          );

                        setExam(updated);

                      } catch (err) {

                        console.error(err);

                        alert(
                          "Failed to remove organization"
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
    </PageContainer>
  );
}