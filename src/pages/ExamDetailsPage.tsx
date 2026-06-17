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

export default function
ExamDetailsPage() {

  const { id } = useParams();

  const navigate = useNavigate();

  const [exam, setExam] = useState<ExamDetails | null>(null);

  const [showParticipants, setShowParticipants] = useState(false);

  const [editing, setEditing] = useState(false);

  const [formData, setFormData] =
  useState({
    title: "",
    description: "",
    localStart: "",
    localEnd: "",
    duration_minutes: 0,
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
          description:
            data.description || "",

          localStart:
            data.available_from
              .slice(0, 16),

          localEnd:
            data.available_until
              .slice(0, 16),

          duration_minutes:
            data.duration_minutes,
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
      <PageHeader
        title={exam.title}
        subtitle="Exam session details"
      />
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
              onClick={() =>
                setEditing(true)
              }
            >
              Edit Exam
            </button>

            <button
              style={{
                marginLeft: "8px",
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
              onClick={async () => {

                try {

                  await updateExam(
                    Number(id),
                    {
                      ...formData,
                      timeZone:
                        "Africa/Nairobi",
                    }
                  );

                  const updated =
                    await getExamDetails(
                      Number(id)
                    );

                  setExam(updated);

                  setEditing(false);

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
              onClick={() => {

                setFormData({

                  title:
                    exam.title,

                  description:
                    exam.description || "",

                  localStart:
                    exam.available_from
                      .slice(0, 16),

                  localEnd:
                    exam.available_until
                      .slice(0, 16),

                  duration_minutes:
                    exam.duration_minutes,

                });

                setEditing(false);

              }}
              style={{
                marginLeft: "8px",
              }}
            >
              Cancel
            </button>
          </>

        )}

      </div>

      <h2>Session Information</h2>

      <p>

        <strong>
          Title:
        </strong>

        {" "}

        {editing ? (

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
              marginTop: "8px",
              padding: "8px",
            }}
          />

        ) : (

          exam.title

        )}

      </p>

      <p>

        <strong>
          Description:
        </strong>

        {" "}

        {editing ? (

          <textarea
            value={
              formData.description
            }
            onChange={(e) =>
              setFormData({
                ...formData,
                description:
                  e.target.value,
              })
            }
            rows={4}
            style={{
              width: "100%",
            }}
          />

        ) : (

          exam.description

        )}

      </p>

      <p>

        <strong>
          Duration:
        </strong>

        {" "}

        {editing ? (

          <input
            type="number"
            value={
              formData.duration_minutes
            }
            onChange={(e) =>
              setFormData({
                ...formData,
                duration_minutes:
                  Number(
                    e.target.value
                  ),
              })
            }
            style={{
              width: "120px",
              marginLeft: "8px",
            }}
          />

        ) : (

          <>
            {exam.duration_minutes}
            {" "}
            minutes
          </>

        )}

      </p>

      <p>

        <strong>
          Start:
        </strong>

        {" "}

        {editing ? (

          <input
            type="datetime-local"
            value={
              formData.localStart
            }
            onChange={(e) =>
              setFormData({
                ...formData,
                localStart:
                  e.target.value,
              })
            }
            style={{
              marginLeft: "8px",
            }}
          />

        ) : (

          <>
            {new Date(
              exam.available_from
            ).toLocaleString()}
            {" "}
            ({exam.time_zone})
          </>

        )}

      </p>

      <p>

        <strong>
          End:
        </strong>

        {" "}

        {editing ? (

          <input
            type="datetime-local"
            value={
              formData.localEnd
            }
            onChange={(e) =>
              setFormData({
                ...formData,
                localEnd:
                  e.target.value,
              })
            }
            style={{
              marginLeft: "8px",
            }}
          />

        ) : (

          <>
            {new Date(
              exam.available_until
            ).toLocaleString()}
            {" "}
            ({exam.time_zone})
          </>

        )}

      </p>

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

          <button
            onClick={() =>
              setShowAddOrg(
                !showAddOrg
              )
            }
          >
            Add Organization
          </button>

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

            </div>

          )}

        </div>

        <button
          disabled={!selectedOrgId}
          style={{
            marginTop: "8px",
          }}
          onClick={async () => {

            if (!selectedOrgId) {
              return;
            }

            try {

              await assignOrganizationToExam(
                Number(id),
                selectedOrgId
              );

              const updated =
                await getExamDetails(
                  Number(id)
                );

              setExam(updated);

              setSelectedOrgId(null);

              setShowAddOrg(false);

            } catch (err) {

              console.error(err);

              alert(
                "Failed to assign organization"
              );

            }

          }}
        >
          Assign
        </button>
        <button
          style={{
            marginLeft: "8px",
          }}
          onClick={() => {

            setShowAddOrg(false);

            setSelectedOrgId(null);

          }}
        >
          Cancel
        </button>

        <ul>

          {exam.organizations.map(
            (org) => (

              <li key={org.id}>

                {org.name}

                <button
                  style={{
                    marginLeft: "12px",
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

              </li>

            )
          )}

        </ul>

      </Panel>

      <Panel>

        <h2>
          Participants
        </h2>

        <button
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

        <p>
          {exam.exam_user_access.length}
          {" "}
          Assigned Users
        </p>

        <button
          onClick={() =>
            setShowParticipants(
              !showParticipants
            )
          }
        >
          {showParticipants
            ? "Hide Participants"
            : "Show Participants"}
        </button>

        {showParticipants && (

          <ul>

            {exam.exam_user_access.map(
              (access) => (

                <li
                  key={access.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >

                  <span>

                    {access.users.first_name}
                    {" "}
                    {access.users.last_name}
                    {" "}
                    (
                    {access.users.email}
                    )

                  </span>

                  <button
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

                </li>

              )
            )}

          </ul>

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