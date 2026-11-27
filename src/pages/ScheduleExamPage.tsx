import { isArchivedTemplateConflict } from "@/api/examsAPI";
import { formatExamSchedulePreview, examScheduleValue, requireExamTimeZone } from "@/utils/examDateTime";
import { useEffect, useRef, useState } from "react";
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
import { fetchClasses, fetchClassById } from "@/api/classAPI";
import { ClassItem } from "@/interfaces/Class";
import { isValidLocationTimeZone } from "@/utils/locationTimeZone";

export default function ScheduleExamPage() {
  const [scheduling, setScheduling] = useState(false);
  const [templates, setTemplates] = useState<ExamTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | "">("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [localStart, setLocalStart] = useState("");
  const [localEnd, setLocalEnd] = useState("");
  const [manualTimeZone, setManualTimeZone] = useState("");
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
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classLoadWarning, setClassLoadWarning] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [classTimeZone, setClassTimeZone] = useState<{
    classId: number;
    zone: string | null;
    message: string;
    failed: boolean;
  } | null>(null);
  const [lookupRetry, setLookupRetry] = useState(0);
  const [selectedOrganizations, setSelectedOrganizations] = useState<number[]>([]);

  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);

  const [successMessage, setSuccessMessage] = useState("");
  const successRef = useRef<HTMLDivElement>(null);

  const filteredClasses = classes.filter(
    (classItem) =>
      selectedOrganizations.includes(classItem.organization_id) &&
      classItem.status === "active"
  );

  useEffect(() => {
    if (selectedClassId !== null && !classes.some(c => c.id === selectedClassId &&
      c.status === "active" && selectedOrganizations.includes(c.organization_id))) {
      setSelectedClassId(null);
      setManualTimeZone("");
    }
  }, [selectedOrganizations, classes, selectedClassId]);

  useEffect(() => {
    if (selectedClassId === null) return;
    let cancelled = false;
    setClassTimeZone(null);
    const loadClassTimeZone = async () => {
      try {
        const { class: selectedClass } = await fetchClassById(selectedClassId);
        if (cancelled) return;
        const location = selectedClass.location;
        const zone = location?.time_zone;
        const configured = isValidLocationTimeZone(zone);
        setClassTimeZone({
          classId: selectedClassId,
          zone: configured ? zone : null,
          message: configured
            ? `Automatically selected from the class location: ${location?.name}.`
            : !location
              ? "This class has no location. Select a timezone manually."
              : "This class location has no valid configured timezone. Select a timezone manually.",
          failed: false,
        });
      } catch {
        if (!cancelled) setClassTimeZone({
          classId: selectedClassId,
          zone: null,
          message: "Unable to load the class location. Retry before scheduling.",
          failed: true,
        });
      }
    };
    loadClassTimeZone();
    return () => { cancelled = true; };
  }, [selectedClassId, lookupRetry]);

  const selectedClass = filteredClasses.find(c => c.id === selectedClassId);
  const classMemberCount = selectedClass?.class_enrollments?.length ?? 0;
  const resolvedClassTimeZone = classTimeZone?.classId === selectedClassId ? classTimeZone : null;
  const loadingClassTimeZone = selectedClassId !== null && !resolvedClassTimeZone;
  const timeZone = selectedClassId !== null && resolvedClassTimeZone?.zone
    ? resolvedClassTimeZone.zone : manualTimeZone;
  const classTimeZoneBlocked = loadingClassTimeZone ||
    (selectedClassId !== null && (!selectedClass || resolvedClassTimeZone?.failed));
  const awaitingAssignment = selectedClassId === null && selectedUsers.length === 0 && !timeZone;
  const timeZoneGuidance = awaitingAssignment
    ? "Select a class to determine the timezone."
    : "Select a timezone manually.";

  useEffect(() => {
    if (successMessage) {
      successRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [successMessage]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const data = await getExamTemplates({ status: "active" });
        setTemplates(data.filter(template => !template.is_archived));

        const orgs = await getAccessibleOrganizations();
        setOrganizations(orgs);

        const classData = await fetchClasses({ status: "active", page: 1, limit: 100 });
        const allClasses = new Map(classData.classes.map(classItem => [classItem.id, classItem]));
        for (let page = 2; page <= classData.pagination.totalPages; page++) {
          try {
            const next = await fetchClasses({ status: "active", page, limit: 100 });
            next.classes.forEach(classItem => allClasses.set(classItem.id, classItem));
          } catch {
            setClassLoadWarning("Additional classes could not be loaded. Showing the classes retrieved so far. Refresh to retry.");
            break;
          }
        }
        setClasses([...allClasses.values()]);
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

  const isValid =
    !!selectedTemplateId &&
    !!title.trim() &&
    !!localStart &&
    !!localEnd &&
    !!timeZone &&
    !classTimeZoneBlocked &&
    (
      selectedClassId !== null ||
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
      {successMessage && (
        <div
          ref={successRef}
          style={{
            backgroundColor: "#ECFDF5",
            border: "1px solid #86EFAC",
            color: "#166534",
            borderRadius: "10px",
            padding: "18px 20px",
            marginBottom: "24px",
            fontSize: "16px",
            fontWeight: 600,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          ✅ {successMessage}
        </div>
      )}
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
            <label>Start Date / Time ({timeZone || "select a timezone"})</label>
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
            <label>End Date / Time ({timeZone || "select a timezone"})</label>
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
            {loadingClassTimeZone ? (
              <p role="status" style={styles.timeZoneHelp}>Loading class location timezone...</p>
            ) : selectedClassId !== null && resolvedClassTimeZone?.zone ? (
              <>
                <strong style={{ display: "block", fontSize: "16px" }}>{timeZone}</strong>
                <p role="status" style={{ ...styles.timeZoneHelp, marginTop: "6px" }}>
                  {resolvedClassTimeZone.message}
                </p>
              </>
            ) : (
              <>
                <p role="status" style={styles.timeZoneHelp}>
                  {selectedClassId !== null && resolvedClassTimeZone
                    ? resolvedClassTimeZone.message
                    : awaitingAssignment
                      ? timeZoneGuidance
                      : "Select a timezone manually for student-only exams."}
                </p>
                {!classTimeZoneBlocked && (
                  <SearchableTimeZonePicker
                    value={manualTimeZone}
                    onChange={setManualTimeZone}
                    placeholder={awaitingAssignment ? "Or select a timezone manually…" : "Select Time Zone"}
                  />
                )}
              </>
            )}
            {selectedClassId !== null && resolvedClassTimeZone?.failed && (
              <button type="button" onClick={() => {
                setClassTimeZone(null);
                setLookupRetry(retry => retry + 1);
              }}>Retry location lookup</button>
            )}
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
        <h2>Class Access</h2>
        {classLoadWarning && <p role="alert">{classLoadWarning}</p>}

        <SearchableOrganizationMultiSelect
          organizations={organizations}
          selectedIds={selectedOrganizations}
          onChange={(ids) =>
            setSelectedOrganizations(ids)
          }
          placeholder="Select Organizations"
          showSelectedList={true}
        />

        {selectedOrganizations.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h3>Select Class</h3>
            <p>Schedule one exam per class. The same template can be reused for another class.</p>
            <select
              aria-label="Class for this exam"
              value={selectedClassId ?? ""}
              onChange={(e) => {
                setSelectedClassId(e.target.value ? Number(e.target.value) : null);
                setClassTimeZone(null);
                setManualTimeZone("");
              }}
              style={styles.input}
            >
              <option value="">No class (individual students only)</option>
              {filteredClasses.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name} - {classItem.program?.name ?? "Program not available"}
                </option>
              ))}
            </select>
            {filteredClasses.length === 0 && !classLoadWarning && (
              <p>No active classes found for the selected organization.</p>
            )}
          </div>
        )}
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
            <strong>Class:</strong>{" "}
            {selectedClass?.name || "None selected"}
          </div>

          <div>
            <strong>Class Members:</strong>{" "}
            {classMemberCount}
          </div>

          <div>
            <strong>Direct Users:</strong>{" "}
            {selectedUsers.length}
          </div>

          <div>
            <strong>Start:</strong>{" "}
            {formatExamSchedulePreview(localStart, timeZone)}
          </div>

          <div>
            <strong>End:</strong>{" "}
            {formatExamSchedulePreview(localEnd, timeZone)}
          </div>

          <div>
            <strong>Duration:</strong>{" "}
            {durationMinutes} minutes
          </div>

          <div>
            <strong>Time Zone:</strong>{" "}
            {timeZone || timeZoneGuidance}
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
                {!timeZone && <li>Time Zone</li>}
                {classTimeZoneBlocked && <li>Class location timezone lookup</li>}
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

                {selectedClassId === null &&
                  selectedUsers.length === 0 && (
                    <li>
                      Class or User Assignment
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

            if (scheduling || !isValid) return;
            
            try {

              setScheduling(true);

              const examId = await scheduleExam({
                exam_template_id: Number(selectedTemplateId),
                title,
                description,
                localStart: examScheduleValue(localStart, timeZone),
                localEnd: examScheduleValue(localEnd, timeZone),
                timeZone: requireExamTimeZone(timeZone),
                duration_minutes: durationMinutes,
                classes: selectedClassId === null ? [] : [selectedClassId],
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
              setSelectedClassId(null);
              setClassTimeZone(null);
              setSelectedUsers([]);
              setUserResults([]);
              setUserSearch("");

            } catch (err) {

              if (isArchivedTemplateConflict(err)) {
                setTemplates(current => current.filter(template => template.id !== Number(selectedTemplateId)));
                setSelectedTemplateId("");
                alert("This template has been archived. Select an active template and try again.");
              } else {
                alert(err instanceof Error ? err.message : "Failed to schedule exam");
              }
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

  timeZoneHelp: {
    margin: "0 0 6px",
    fontSize: "14px",
    color: "#666",
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
