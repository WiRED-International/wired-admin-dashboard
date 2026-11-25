import { useNavigate, useParams } from "react-router-dom";
import PageContainer from "../components/ui/PageContainer";
import Panel from "../components/ui/Panel";
import Auth from "../utils/auth";
import {
  fetchUserById,
  updateUserById,
} from "../api/usersAPI";
import {
  UserDataInterface,
  TranscriptRecordInterface,
  LearningProgress,
} from "../interfaces/UserDataInterface";
import { useEffect, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner";
import { fetchTranscript } from "../api/transcriptAPI";
import { getLearningProgress } from "../api/usersAPI";
import LearningProgressCard from "../components/users/LearningProgressCard";
import StudentCredentialsCard from "../components/users/StudentCredentialsCard";
import {
  fetchStudentCredentials,
  fetchEarnedSpecializations,
  StudentCredentialsResponse,
  EarnedSpecializationsResponse,
} from "../api/credentialsAPI";
import { fetchAllOrganizations } from "../api/organizationsAPI";
import { fetchAllCountries } from "../api/countriesAPI";
import { fetchAllRoles } from "../api/rolesAPI";
import { OrganizationInterface } from "../interfaces/OrganizationsInterface";
import { CountryInterface } from "../interfaces/CountryInterface";
import { RoleInterface } from "../interfaces/rolesInterface";
import SearchableOrganizationPicker from "../components/Common/SearchableOrganizationPicker";

const UserDetailsPage = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserDataInterface | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [transcript, setTranscript] = useState<TranscriptRecordInterface[]>([]);
  const [learningProgress, setLearningProgress] = useState<LearningProgress | null>(null);
  const [credentialData, setCredentialData] = useState<StudentCredentialsResponse | null>(null);
  const [earnedSpecializations, setEarnedSpecializations] =
  useState<EarnedSpecializationsResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editRoleId, setEditRoleId] = useState<number | null>(null);
  const [editOrganizationId, setEditOrganizationId] = useState<number | null>(null);
  const [editCountryId, setEditCountryId] = useState<number | null>(null);
  const [roles, setRoles] = useState<RoleInterface[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationInterface[]>([]);
  const [countries, setCountries] = useState<CountryInterface[]>([]);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = Auth.isSuperAdmin();
  let canEditUser = isSuperAdmin && !!user;
  if (Auth.getRoleId() === 2 && user) {
    const profile = Auth.getProfile() as { organization_id?: number; country_id?: number; city_id?: number };
    const targetRole = user.role_id ?? user.role?.id;
    canEditUser = targetRole !== 2 && targetRole !== 3
      && profile.organization_id != null && profile.organization_id === user.organization_id
      && profile.country_id != null && profile.country_id === user.country_id
      && (!profile.city_id || profile.city_id === user.city_id);
  }

  useEffect(() => {

    const loadUser = async () => {

      if (!userId) return;

      try {

        setLoading(true);

        const [
          userData,
          transcriptData,
          learningProgressData,
          earnedSpecializationsData,
        ] = await Promise.all([
          fetchUserById(Number(userId)),
          fetchTranscript(Number(userId)),
          getLearningProgress(Number(userId)),
          fetchEarnedSpecializations(Number(userId)),
        ]);

        setUser(userData);
        setTranscript(transcriptData || []);
        setLearningProgress(learningProgressData);
        setEarnedSpecializations(earnedSpecializationsData);

        if (Auth.isSuperAdmin()) {
          const credentialsData =
            await fetchStudentCredentials(Number(userId));

          setCredentialData(credentialsData);
        } else {
          setCredentialData(null);
        }

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);

      }

    };

    loadUser();

  }, [userId]);

  useEffect(() => {
    const loadEditOptions = async () => {
      try {
        const [
          rolesData,
          organizationsData,
          countriesData,
        ] = await Promise.all([
          fetchAllRoles(),
          fetchAllOrganizations(),
          fetchAllCountries(),
        ]);

        setRoles(rolesData);
        setOrganizations(organizationsData);
        setCountries(countriesData);
      } catch (err) {
        console.error("Failed to load user edit options:", err);
      }
    };

    loadEditOptions();
  }, []);

  useEffect(() => {
    const years = Array.from(
      new Set(
        transcript.map((record) =>
          new Date(record.completedAt).getFullYear()
        )
      )
    ).sort((a, b) => b - a);

    setAvailableYears(years);
  }, [transcript]);
  if (loading) {
    return <LoadingSpinner />;
  }
  const filteredTranscript = transcript.filter((record) => {

    const normalizedSearch = searchText.trim().toLowerCase();

    const matchesSearch =
      !normalizedSearch ||
      record.displayId.toLowerCase().includes(normalizedSearch) ||
      record.title.toLowerCase().includes(normalizedSearch);

    const matchesCategory =
      !selectedCategory ||
      record.training === selectedCategory;

    const matchesYear =
      !selectedYear ||
      new Date(record.completedAt).getFullYear().toString() === selectedYear;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesYear
    );

  });

  const availableCategories = Array.from(
    new Set(
      transcript
        .map((record) => record.training)
        .filter(Boolean)
    )
  ).sort();

  const handleSaveUser = async () => {
    if (!userId || !canEditUser || saving) return;
    setSaveError(null);
    const identity = {
      first_name: editFirstName.trim(),
      last_name: editLastName.trim(),
      email: editEmail.trim(),
    };
    for (const [field, label] of [["first_name", "First Name"], ["last_name", "Last Name"], ["email", "Email"]] as const) {
      if (!identity[field] || Array.from(identity[field]).length > 255) {
        setSaveError(`${label} is required and must be at most 255 characters.`);
        return;
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity.email)) {
      setSaveError("Enter a valid email address.");
      return;
    }

    setSaving(true);
    try {
      const response = await updateUserById(
        Number(userId),
        {
          ...identity,
          ...(isSuperAdmin ? {
          role_id: editRoleId ?? undefined,
          organization_id: editOrganizationId,
          country_id: editCountryId,
          } : {}),
        }
      );

      setUser(response.user);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update user:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to update user. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer>

      <button
        onClick={() => navigate("/userview")}
        style={styles.backButton}
      >
        ← Back to Users
      </button>

      <Panel>

        <div style={styles.header}>

          <div>

            <h1 style={styles.name}>
              {user?.first_name} {user?.last_name}
            </h1>

            <p style={styles.role}>
              {user?.role?.name}
            </p>

            <p style={styles.subtitle}>
              Manage account information, permissions, and learning history.
            </p>

          </div>

          {canEditUser && (
            <>
              {isEditing ? (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    style={styles.cancelButton}
                    disabled={saving}
                    onClick={() => { setIsEditing(false); setSaveError(null); }}
                  >
                    Cancel
                  </button>

                  <button
                    style={styles.saveButton}
                    type="button"
                    onClick={handleSaveUser}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              ) : (
                <button
                  style={styles.saveButton}
                  onClick={() => {
                    setEditFirstName(user?.first_name ?? "");
                    setEditLastName(user?.last_name ?? "");
                    setEditEmail(user?.email ?? "");
                    setSaveError(null);
                    setEditRoleId(user?.role_id ?? null);
                    setEditOrganizationId(user?.organization_id ?? null);
                    setEditCountryId(user?.country_id ?? null);
                    setIsEditing(true);
                  }}
                >
                  Edit User
                </button>
              )}
            </>
          )}

        </div>

      </Panel>

      <Panel>

        <h2 style={styles.sectionTitle}>
          Account Information
        </h2>

        {saveError && <p role="alert" style={{ color: "#B91C1C" }}>{saveError}</p>}

        <div style={styles.infoGrid}>

          <label htmlFor="edit-first-name" style={styles.label}>First Name</label>
          <div style={styles.value}>{isEditing && canEditUser ? (
            <input id="edit-first-name" style={styles.editSelect} value={editFirstName}
              required onChange={e => setEditFirstName(e.target.value)} />
          ) : user?.first_name}</div>

          <label htmlFor="edit-last-name" style={styles.label}>Last Name</label>
          <div style={styles.value}>{isEditing && canEditUser ? (
            <input id="edit-last-name" style={styles.editSelect} value={editLastName}
              required onChange={e => setEditLastName(e.target.value)} />
          ) : user?.last_name}</div>

          <label htmlFor="edit-email" style={styles.label}>Email</label>
          <div style={styles.value}>{isEditing && canEditUser ? (
            <>
              <input id="edit-email" type="email" style={styles.editSelect} value={editEmail}
                required aria-describedby="edit-email-note" onChange={e => setEditEmail(e.target.value)} />
              <p id="edit-email-note" style={styles.subtitle}>Changing the email address also changes the user's HealthMAP login email.</p>
            </>
          ) : user?.email}</div>

          <div style={styles.label}>Role</div>

          <div style={styles.value}>
            {isEditing && isSuperAdmin ? (
              <div style={styles.selectWrapper}>
                <select
                  value={editRoleId ?? ""}
                  style={styles.editSelect}
                  onChange={(e) =>
                    setEditRoleId(Number(e.target.value))
                  }
                >
                  {roles.map((role) => (
                    <option
                      key={role.id}
                      value={role.id}
                    >
                      {role.name}
                    </option>
                  ))}
                </select>

                <span style={styles.selectChevron}>
                  ▼
                </span>
              </div>
            ) : (
              user?.role?.name
            )}
          </div>

          <div style={styles.label}>Organization</div>

          <div style={styles.value}>
            {isEditing && isSuperAdmin ? (
              <SearchableOrganizationPicker
                organizations={organizations}
                selectedId={editOrganizationId}
                onSelect={setEditOrganizationId}
                placeholder="No Organization"
                clearLabel="No Organization"
                width="240px"
              />
            ) : (
              user?.organization?.name ?? "None"
            )}
          </div>

          <div style={styles.label}>Country</div>

          <div style={styles.value}>
            {isEditing && isSuperAdmin ? (
              <div style={styles.selectWrapper}>
                <select
                  value={editCountryId ?? ""}
                  style={styles.editSelect}
                  onChange={(e) =>
                    setEditCountryId(
                      e.target.value
                        ? Number(e.target.value)
                        : null
                    )
                  }
                >
                  <option value="">No Country</option>

                  {countries.map((country) => (
                    <option
                      key={country.id}
                      value={country.id}
                    >
                      {country.name}
                    </option>
                  ))}
                </select>

                <span style={styles.selectChevron}>
                  ▼
                </span>
              </div>
            ) : (
              user?.country?.name ?? "None"
            )}
          </div>

        </div>

      </Panel>

      <Panel>
        <h2 style={styles.sectionTitle}>
          Earned Specializations
        </h2>

        {earnedSpecializations?.specializations.length ? (
          <div style={styles.specializationList}>
            {earnedSpecializations.specializations.map((record) => (
              <span
                key={record.credential_id}
                style={styles.specializationBadge}
              >
                {record.specialization.name}
              </span>
            ))}
          </div>
        ) : (
          <p style={styles.emptyText}>
            No earned specializations yet.
          </p>
        )}
      </Panel>

      <LearningProgressCard progress={learningProgress} />

      {credentialData && (
        <StudentCredentialsCard
          userId={Number(userId)}
          data={credentialData}
          onRefresh={setCredentialData}
        />
      )}

      <Panel>

        <h2 style={styles.sectionTitle}>
          Learning Transcript
        </h2>

        <div style={styles.trainingToolbar}>

          <input
            type="text"
            placeholder="Search by ID or title..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={styles.searchInput}
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">
              All Programs
            </option>

            {availableCategories.map((category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">
                All Years
            </option>

            {availableYears.map(year => (

                <option
                    key={year}
                    value={year}
                >
                    {year}
                </option>

            ))}
          </select>

        </div>

        <table style={styles.trainingTable}>

          <thead>

            <tr>

              <th style={styles.tableHeader}>
                ID
              </th>

              <th style={styles.tableHeader}>
                Title
              </th>

              <th style={styles.tableHeader}>
                Type
              </th>

              <th style={styles.tableHeader}>
                Program
              </th>

              <th style={styles.tableHeader}>
                Specialization Association
              </th>

              <th style={styles.tableHeader}>
                Completed
              </th>

              <th style={styles.tableHeader}>
                Score
              </th>

            </tr>

          </thead>

          <tbody>
            {filteredTranscript.length === 0 ? (
              <tr>
                <td colSpan={7} style={styles.emptyRow}>
                  No training records found.
                </td>
              </tr>
            ) : (
              filteredTranscript.map((record) => (
                <tr key={record.recordId}>
                  <td style={styles.tableCell}>
                    {record.type === "Exam" ? "—" : record.displayId}
                  </td>

                  <td style={styles.tableCell}>
                    {record.title}
                  </td>

                  <td style={styles.tableCell}>
                    {record.type === "Exam" && record.attemptNumber
                      ? `${record.type} · Attempt ${record.attemptNumber}`
                      : record.type}
                  </td>

                  <td style={styles.tableCell}>
                    {record.training}
                  </td>

                  <td style={styles.tableCell}>
                      {record.specializations.length
                          ? record.specializations.join(", ")
                          : "—"}
                  </td>

                  <td style={styles.tableCell}>
                    {new Date(record.completedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  <td style={styles.tableCell}>
                    {record.score.toFixed(1)}%
                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>

      </Panel>

    </PageContainer>
  );
};

export default UserDetailsPage;

const styles: Record<string, React.CSSProperties> = {
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "20px",
    padding: "0",
    border: "none",
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 600,
  },

  placeholder: {
    padding: "32px 0",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  name: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 700,
  },

  role: {
    marginTop: "6px",
    fontSize: "18px",
    color: "#666",
  },

  subtitle: {
    marginTop: "12px",
    color: "#777",
  },

  sectionTitle: {
    marginTop: 0,
    marginBottom: "24px",
    fontSize: "22px",
    fontWeight: 600,
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "180px 1fr",
    rowGap: "18px",
    columnGap: "30px",
  },

  label: {
    fontWeight: 600,
    color: "#666",
  },

  value: {
    color: "#222",
  },

  specializationList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },

  specializationBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 14px",
    borderRadius: "999px",
    backgroundColor: "#E8F1FD",
    color: "#1F5FA8",
    fontSize: "14px",
    fontWeight: 600,
  },

  emptyText: {
    margin: 0,
    color: "#777",
    fontStyle: "italic",
  },

  trainingToolbar: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },

  searchInput: {
    flex: 1,
    minWidth: "300px",
    padding: "10px 14px",
  },

  filterSelect: {
    minWidth: "180px",
    padding: "10px",
  },

  trainingTable: {
    width: "100%",
    borderCollapse: "collapse",
  },

  tableHeader: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "2px solid #ddd",
  },

  tableCell: {
    padding: "12px",
    borderBottom: "1px solid #eee",
  },

  emptyRow: {
    textAlign: "center",
    padding: "40px",
    color: "#777",
  },

  scoreCell: {
    padding: "12px",
    borderBottom: "1px solid #eee",
    textAlign: "center",
    fontWeight: 600,
  },

  moduleId: {
    fontWeight: 600,
  },

  editSelect: {
    width: "240px",
    padding: "10px 14px",
    backgroundColor: "#F4F4F5",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#444",
    border: "1px solid #ddd",
    boxSizing: "border-box",
    cursor: "pointer",
    appearance: "none",
    paddingRight: "36px",
  },

  selectWrapper: {
    position: "relative",
    width: "240px",
  },

  selectChevron: {
    position: "absolute",
    right: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "10px",
    color: "#666",
    pointerEvents: "none",
  },

  cancelButton: {
    padding: "9px 16px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    backgroundColor: "#ffffff",
    color: "#374151",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },

  saveButton: {
    padding: "9px 16px",
    borderRadius: "6px",
    border: "1px solid #2563eb",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
};
