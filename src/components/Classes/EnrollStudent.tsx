import { useState } from "react";
import {
  searchClassStudents,
  enrollStudent,
} from "@/api/classAPI";
import { UserDataInterface } from "@/interfaces/UserDataInterface";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type EnrollStudentProps = {
  classId: number;
  onStudentEnrolled: () => void;
};

export default function EnrollStudent({
  classId,
  onStudentEnrolled,
}: EnrollStudentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserDataInterface[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [enrollingUserId, setEnrollingUserId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const query = searchQuery.trim();

    if (!query) {
      setUsers([]);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await searchClassStudents(classId, query);
      setUsers(data.users || []);
    } catch (err) {
      setUsers([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to search for students."
      );
    } finally {
      setSearching(false);
    }
  };

  const handleEnroll = async (userId: number) => {
    setEnrollingUserId(userId);
    setError(null);
    setSuccessMessage(null);

    try {
      const data = await enrollStudent(classId, userId);

      setSuccessMessage(
        data.message || "Student enrolled successfully."
      );

      // Remove the newly enrolled student from search results
      setUsers((currentUsers) =>
        currentUsers.filter((user) => user.id !== userId)
      );

      // Tell the parent page to refresh the roster
      onStudentEnrolled();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to enroll student."
      );
    } finally {
      setEnrollingUserId(null);
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Enroll Student</h3>

      <form onSubmit={handleSearch} style={styles.searchRow}>
        <Input
          type="text"
          placeholder="Search by name, email, or WiRED ID"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: "320px" }}
        />

        <Button type="submit" disabled={searching}>
          {searching ? "Searching..." : "Search"}
        </Button>
      </form>

      {error && (
        <p style={styles.error}>
          {error}
        </p>
      )}

      {successMessage && (
        <p style={styles.success}>
          {successMessage}
        </p>
      )}

      {!searching &&
        hasSearched &&
        !error &&
        users.length === 0 && (
          <p style={styles.empty}>
            No matching students found.
          </p>
        )}

      {!searching && users.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>WiRED ID</th>
              <th style={styles.th}>First Name</th>
              <th style={styles.th}>Last Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={styles.tr}>
                <td style={styles.td}>
                  {user.wired_user_id}
                </td>

                <td style={styles.td}>
                  {user.first_name}
                </td>

                <td style={styles.td}>
                  {user.last_name}
                </td>

                <td style={styles.td}>
                  {user.email}
                </td>

                <td style={styles.td}>
                  <Button
                    type="button"
                    disabled={enrollingUserId === user.id}
                    onClick={() => handleEnroll(user.id)}
                  >
                    {enrollingUserId === user.id
                      ? "Enrolling..."
                      : "Enroll"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
  },

  title: {
    margin: 0,
    marginBottom: "16px",
    fontSize: "18px",
    fontWeight: 700,
  },

  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  error: {
    marginTop: "15px",
    color: "#B91C1C",
  },

  empty: {
    marginTop: "15px",
    color: "#666",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
  },

  th: {
    textAlign: "left",
    fontSize: "14px",
    fontWeight: 600,
    padding: "12px",
    background: "#F4F4F5",
    borderBottom: "1px solid #ddd",
  },

  tr: {
    borderBottom: "1px solid #eee",
  },

  td: {
    padding: "14px 12px",
    fontSize: "14px",
    color: "#333",
    verticalAlign: "middle",
  },

  success: {
    marginTop: "15px",
    color: "#15803D",
  },
};