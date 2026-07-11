import { useEffect, useState } from "react";
import { getExamTemplates, getAccessibleOrganizations, scheduleExam } from "@/api/examsAPI";
import { ExamTemplate } from "@/interfaces/ExamTemplate";
import { searchUsersBroad } from "@/api/usersAPI";
import { UserSearchResult } from "@/interfaces/UserSearchResult";
import SearchableOrganizationMultiSelect from "@/components/Common/SearchableOrganizationMultiSelect";
import PageContainer from "@/components/ui/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import Panel from "@/components/ui/Panel";
import SearchableTimeZonePicker from "@/components/Common/SearchableTimeZonePicker";
import { useNavigate } from "react-router-dom";

export default function ScheduleExamPage() {
  const [scheduling, setScheduling] = useState(false);
  const [templates, setTemplates] = useState<ExamTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | "">("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [localStart, setLocalStart] = useState("");
  const [localEnd, setLocalEnd] = useState("");
  const [timeZone, setTimeZone] = useState("Africa/Nairobi");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const navigate = useNavigate();

  const [organizations, setOrganizations] =
  useState<
    {
      id: number;
      name: string;
      userCount: number;
    }[]
  >([]);
  const [selectedOrganizations, setSelectedOrganizations] = useState<number[]>([]);

  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);

  const [successMessage, setSuccessMessage] = useState("");

  const organizationUserCount =
    selectedOrganizations.reduce(
      (total, orgId) => {

        const org = organizations.find(
          (o) => o.id === orgId
        );

        return total + (org?.userCount || 0);

      },
      0
    );

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const data = await getExamTemplates();
        setTemplates(data);

        const orgs = await getAccessibleOrganizations();
        setOrganizations(orgs);
      } catch (err) {
        console.error("Failed to load schedule exam data:", err);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const searchUsersForExam = async () => {
      if (!userSearch.trim()) {
        setUserResults([]);
        return;
      }

      try {
        const data = await searchUsersBroad(userSearch, 1, 10);
        setUserResults(data.users || []);
      } catch (err) {
        console.error("User search failed:", err);
      }
    };

    const timeout = setTimeout(searchUsersForExam, 300);

    return () => clearTimeout(timeout);
  }, [userSearch]);

  const formatDateTime = (value: string) => {
    if (!value) return "Not Set";

    return new Date(value).toLocaleString(
      "en-US",
      {
        dateStyle: "long",
        timeStyle: "short",
      }
    );
  };
  const isValid =
    !!selectedTemplateId &&
    !!title.trim() &&
    !!localStart &&
    !!localEnd &&
    (
      selectedOrganizations.length > 0 ||
      selectedUsers.length > 0
    );

  return (
    <PageContainer>
      <button
        onClick={() =>
          navigate("/exams")
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
        ← Back to Exams
      </button>
      <PageHeader
        title="Schedule Exam"
        subtitle="Create and assign a new exam session"
      />
      <Panel>
        <h2>Session Details</h2>

        <div style={styles.detailsGrid}>

          <div>
            <label>Session Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
            />
          </div>

          <div>
            <label>Exam Template</label>
            <select
              value={selectedTemplateId}
              onChange={(e) =>
                setSelectedTemplateId(
                  e.target.value
                    ? Number(e.target.value)
                    : ""
                )
              }
              style={styles.input}
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

          <div>
            <label>Start Date / Time</label>
            <input
              type="datetime-local"
              value={localStart}
              onChange={(e) =>
                setLocalStart(e.target.value)
              }
              style={styles.input}
            />
          </div>

          <div>
            <label>End Date / Time</label>
            <input
              type="datetime-local"
              value={localEnd}
              onChange={(e) =>
                setLocalEnd(e.target.value)
              }
              style={styles.input}
            />
          </div>

          <div>
            <label>Time Zone</label>

            <SearchableTimeZonePicker
              value={timeZone}
              onChange={(zone) =>
                setTimeZone(zone)
              }
            />
          </div>

          <div>
            <label>Duration (minutes)</label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) =>
                setDurationMinutes(
                  Number(e.target.value)
                )
              }
              style={styles.input}
            />
          </div>

        </div>

        <div style={{ marginTop: "20px" }}>
          <label>Description</label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            style={styles.textarea}
          />
        </div>
      </Panel>
      <Panel>
        <h2>Organization Access</h2>

        <SearchableOrganizationMultiSelect
          organizations={organizations}
          selectedIds={selectedOrganizations}
          onChange={(ids) =>
            setSelectedOrganizations(ids)
          }
          placeholder="Select Organizations"
          showSelectedList={true}
        />
      </Panel>
      <Panel>
        <h2>User Access</h2>

        <input
          type="text"
          placeholder="Search users by name or email..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          style={{
            width: "400px",
            padding: "10px 12px",
            border: "1px solid #D1D5DB",
            borderRadius: "6px",
            fontSize: "14px",
            marginBottom: "16px",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          {userResults.map((user) => (
            <div
              key={user.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 12px",
                border: "1px solid #E5E7EB",
                borderRadius: "6px",
                backgroundColor: "#FAFAFA",
              }}
            >
              <div>
                <div>
                  {user.first_name} {user.last_name}
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    color: "#666",
                  }}
                >
                  {user.email}
                </div>
              </div>

              <button
                style={{
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#2B78F6",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                onClick={() => {

                  const exists =
                    selectedUsers.some(
                      (u) => u.id === user.id
                    );

                  if (!exists) {
                    setSelectedUsers([
                      ...selectedUsers,
                      user,
                    ]);
                  }
                }}
              >
                Add
              </button>
            </div>
          ))}
        </div>
        <h3>Selected Users</h3>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {selectedUsers.map((user) => (
            <div
              key={user.id}
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
                {user.first_name} {user.last_name}
              </div>

              <button
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#DC2626",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "16px",
                }}
                onClick={() =>
                  setSelectedUsers(
                    selectedUsers.filter(
                      (u) => u.id !== user.id
                    )
                  )
                }
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <h2>Summary</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px 32px",
            marginTop: "12px",
          }}
        >
          <div>
            <strong>Session Title:</strong>{" "}
            {title || "Not Set"}
          </div>

          <div>
            <strong>Template:</strong>{" "}
            {templates.find(
              (t) => t.id === selectedTemplateId
            )?.title || "None Selected"}
          </div>

          <div>
            <strong>Organizations:</strong>{" "}
            {selectedOrganizations.length}
          </div>

          <div>
            <strong>Organization Members:</strong>{" "}
            {organizationUserCount}
          </div>

          <div>
            <strong>Direct Users:</strong>{" "}
            {selectedUsers.length}
          </div>

          <div>
            <strong>Start:</strong>{" "}
            {formatDateTime(localStart)}
          </div>

          <div>
            <strong>End:</strong>{" "}
            {formatDateTime(localEnd)}
          </div>

          <div>
            <strong>Duration:</strong>{" "}
            {durationMinutes} minutes
          </div>

          <div>
            <strong>Time Zone:</strong>{" "}
            {timeZone}
          </div>

          <div
            style={{
              gridColumn: "1 / -1",
            }}
          >
            <strong>Description:</strong>{" "}
            {description || "Not Set"}
          </div>
        </div>
        <div style={{ marginTop: "24px" }}>
          <h3>Status</h3>

          {isValid ? (

            <div
              style={{
                color: "#16A34A",
                fontWeight: 600,
              }}
            >
              ✅ Ready to Schedule
            </div>

          ) : (

            <div
              style={{
                color: "#B45309",
              }}
            >
              ⚠ Missing:

              <ul style={{ marginTop: "8px" }}>
                {!selectedTemplateId && (
                  <li>Exam Template</li>
                )}

                {!title.trim() && (
                  <li>Session Title</li>
                )}

                {!localStart && (
                  <li>Start Date</li>
                )}

                {!localEnd && (
                  <li>End Date</li>
                )}

                {selectedOrganizations.length === 0 &&
                  selectedUsers.length === 0 && (
                    <li>
                      Organization or User Assignment
                    </li>
                  )}
              </ul>
            </div>
          )}
        </div>
        <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "24px",
          marginBottom: "20px",
        }}
      >
        <button
          style={{
            backgroundColor: !isValid || scheduling
              ? "#94A3B8"
              : "#2B78F6",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            padding: "12px 24px",
            fontSize: "14px",
            fontWeight: 600,
            cursor:
              !isValid || scheduling
                ? "not-allowed"
                : "pointer",
            marginTop: "20px",
            minWidth: "180px",
            boxShadow:
              "0 1px 3px rgba(0,0,0,0.08)",
          }}
          disabled={!isValid || scheduling}
          onClick={async () => {

            if (scheduling) return;
            
            try {

              setScheduling(true);

              const examId = await scheduleExam({
                exam_template_id: Number(selectedTemplateId),
                title,
                description,
                localStart,
                localEnd,
                timeZone,
                duration_minutes: durationMinutes,
                organizations: selectedOrganizations,
                users: selectedUsers.map(u => u.id),
              });

              setSuccessMessage(
                `Exam scheduled successfully (ID: ${examId})`
              );
              setSelectedTemplateId("");
              setTitle("");
              setDescription("");
              setLocalStart("");
              setLocalEnd("");
              setDurationMinutes(45);

              setSelectedOrganizations([]);
              setSelectedUsers([]);
              setUserResults([]);
              setUserSearch("");

            } catch (err) {

              console.error(
                "❌ Failed to schedule exam:",
                err
              );

            } finally {

              setScheduling(false);

            }
          }}
        >
          {scheduling
            ? "Scheduling..."
            : "Schedule Exam"}
        </button>
      </div>
      </Panel>
      {successMessage && (
        <div
          style={{
            marginTop: "16px",
            color: "#16A34A",
            fontWeight: 600,
          }}
        >
          {successMessage}
        </div>
      )}
    </PageContainer>
  );
}

const styles: {
  [key: string]:
    React.CSSProperties;
} = {

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },

  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #D1D5DB",
    marginTop: "6px",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    minHeight: "100px",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #D1D5DB",
    marginTop: "6px",
    boxSizing: "border-box",
  },

};