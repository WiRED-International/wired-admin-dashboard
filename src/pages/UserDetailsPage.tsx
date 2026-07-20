import { useNavigate, useParams } from "react-router-dom";
import PageContainer from "../components/ui/PageContainer";
import Panel from "../components/ui/Panel";
import { fetchUserById } from "../api/usersAPI";
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

  useEffect(() => {

    const loadUser = async () => {

      if (!userId) return;

      try {

        setLoading(true);

        const [
          userData,
          transcriptData,
          learningProgressData,
        ] = await Promise.all([
          fetchUserById(Number(userId)),
          fetchTranscript(Number(userId)),
          getLearningProgress(Number(userId))
        ]);

        setUser(userData);
        setTranscript(transcriptData || []);
        setLearningProgress(learningProgressData);

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);

      }

    };

    loadUser();

  }, [userId]);

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

          {/* <button style={styles.editButton}>
            Edit User
          </button> */}

        </div>

      </Panel>

      <Panel>

        <h2 style={styles.sectionTitle}>
          Account Information
        </h2>

        <div style={styles.infoGrid}>

          <div style={styles.label}>Email</div>
          <div style={styles.value}>{user?.email}</div>

          <div style={styles.label}>Role</div>
          <div style={styles.value}>{user?.role?.name}</div>

          <div style={styles.label}>Organization</div>
          <div style={styles.value}>{user?.organization?.name}</div>

          <div style={styles.label}>Country</div>
          <div style={styles.value}>{user?.country?.name}</div>

          <div style={styles.label}>City</div>
          <div style={styles.value}>{user?.city?.name}</div>

        </div>

      </Panel>

      <Panel>
        <h2 style={styles.sectionTitle}>
          Earned Specializations
        </h2>

        {user?.specializations?.length ? (
          <div style={styles.specializationList}>
            {user.specializations.map((specialization) => (
              <span
                key={specialization.id}
                style={styles.specializationBadge}
              >
                {specialization.name}
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
                Training
              </th>

              <th style={styles.tableHeader}>
                Specializations
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
                    {record.type}
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
};