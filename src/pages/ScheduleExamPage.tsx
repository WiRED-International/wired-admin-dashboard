import { useEffect, useState } from "react";
import { getExamTemplates, getAccessibleOrganizations, scheduleExam } from "@/api/examsAPI";
import { ExamTemplate } from "@/interfaces/ExamTemplate";
import { searchUsersBroad } from "@/api/usersAPI";
import { UserSearchResult } from "@/interfaces/UserSearchResult";

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

  const [organizations, setOrganizations] = useState<{ id: number; name: string }[]>([]);
  const [selectedOrganizations, setSelectedOrganizations] = useState<number[]>([]);
  const [orgSelection, setOrgSelection] = useState("");

  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);

  const [successMessage, setSuccessMessage] = useState("");

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
    <div>
      <h1>Schedule Exam</h1>

      <div>
        <label>Exam Template</label>

        <select
          value={selectedTemplateId}
          onChange={(e) =>
            setSelectedTemplateId(
              e.target.value ? Number(e.target.value) : ""
            )
          }
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
      <h2>Session Details</h2>

      <div>
        <label>Session Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label>Start Date / Time</label>
        <input
          type="datetime-local"
          value={localStart}
          onChange={(e) => setLocalStart(e.target.value)}
        />
      </div>

      <div>
        <label>End Date / Time</label>
        <input
          type="datetime-local"
          value={localEnd}
          onChange={(e) => setLocalEnd(e.target.value)}
        />
      </div>

      <div>
        <label>Time Zone</label>
        <input
          type="text"
          value={timeZone}
          onChange={(e) => setTimeZone(e.target.value)}
        />
      </div>

      <div>
        <label>Duration (minutes)</label>
        <input
          type="number"
          value={durationMinutes}
          onChange={(e) =>
            setDurationMinutes(Number(e.target.value))
          }
        />
      </div>

      <h2>Organization Access</h2>

      <select
        value={orgSelection}
        onChange={(e) => {

          setOrgSelection(e.target.value);

          const id = Number(e.target.value);

          if (
            id &&
            !selectedOrganizations.includes(id)
          ) {
            setSelectedOrganizations([
              ...selectedOrganizations,
              id,
            ]);
          }

          // Reset dropdown back to placeholder
          setOrgSelection("");
        }}
      >
        <option value="">
          Select Organization
        </option>

        {organizations.map((org) => (
          <option
            key={org.id}
            value={org.id}
          >
            {org.name}
          </option>
        ))}
      </select>
      <ul>
        {selectedOrganizations.map((orgId) => {
          const org = organizations.find(
            (o) => o.id === orgId
          );

          return (
            <li key={orgId}>
              {org?.name}

              <button
                onClick={() =>
                  setSelectedOrganizations(
                    selectedOrganizations.filter(
                      (id) => id !== orgId
                    )
                  )
                }
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>
      <h2>User Access</h2>

      <input
        type="text"
        placeholder="Search Users"
        value={userSearch}
        onChange={(e) => setUserSearch(e.target.value)}
      />
      <ul>
        {userResults.map((user) => (
          <li key={user.id}>
            {user.first_name} {user.last_name}
            {" - "}
            {user.email}

            <button
              onClick={() => {

                const exists = selectedUsers.some(
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
          </li>
        ))}
      </ul>
      <h3>Selected Users</h3>

      <ul>
        {selectedUsers.map((user) => (
          <li key={user.id}>
            {user.first_name} {user.last_name}

            <button
              onClick={() =>
                setSelectedUsers(
                  selectedUsers.filter(
                    (u) => u.id !== user.id
                  )
                )
              }
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <h2>Summary</h2>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "16px",
          marginTop: "20px",
        }}
      >
        <p>
          <strong>Session Title:</strong>{" "}
          {title || "Not Set"}
        </p>

        <p>
          <strong>Description:</strong>{" "}
          {description || "Not Set"}
        </p>

        <p>
          <strong>Template:</strong>{" "}
          {templates.find(
            (t) => t.id === selectedTemplateId
          )?.title || "None Selected"}
        </p>

        <p>
          <strong>Organizations:</strong>{" "}
          {selectedOrganizations.length}
        </p>

        <p>
          <strong>Users:</strong>{" "}
          {selectedUsers.length}
        </p>

        <p>
          <strong>Start:</strong>{" "}
          {formatDateTime(localStart)}
        </p>

        <p>
          <strong>End:</strong>{" "}
          {formatDateTime(localEnd)}
        </p>

        <p>
          <strong>Duration:</strong>{" "}
          {durationMinutes} minutes
        </p>

        <p>
          <strong>Time Zone:</strong>{" "}
          {timeZone}
        </p>
      </div>
      <h3>Validation</h3>

      <ul>
        {!selectedTemplateId && (
          <li>Select an exam template.</li>
        )}

        {!title.trim() && (
          <li>Enter a session title.</li>
        )}

        {!localStart && (
          <li>Select a start date.</li>
        )}

        {!localEnd && (
          <li>Select an end date.</li>
        )}

        {selectedOrganizations.length === 0 &&
        selectedUsers.length === 0 && (
          <li>
            Assign at least one organization or user.
          </li>
        )}
      </ul>

      <h3>Organizations</h3>

      <ul>
        {selectedOrganizations.map((orgId) => {
          const org = organizations.find(
            (o) => o.id === orgId
          );

          return (
            <li key={orgId}>
              {org?.name}
            </li>
          );
        })}
      </ul>

      <h3>Individual Users</h3>

      <ul>
        {selectedUsers.map((user) => (
          <li key={user.id}>
            {user.first_name} {user.last_name}
            {" - "}
            {user.email}
          </li>
        ))}
      </ul>
      {successMessage && (
        <div>
          {successMessage}
        </div>
      )}
      <button
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
            setOrgSelection("");

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
  );
}