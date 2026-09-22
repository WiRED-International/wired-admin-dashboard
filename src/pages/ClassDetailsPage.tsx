import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchClassById,
  fetchClassEnrollments,
} from "../api/classAPI";

import {
  ClassItem,
  ClassEnrollment,
} from "../interfaces/Class";

import ClassRoster from "../components/Classes/ClassRoster";
import EnrollStudent from "../components/Classes/EnrollStudent";
import Auth from "../utils/auth";

export default function ClassDetailsPage() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [classItem, setClassItem] = useState<ClassItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);

  useEffect(() => {
    const loadClass = async () => {
      if (!classId) {
        setError("Class ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await fetchClassById(Number(classId));

        setClassItem(data.class);

        const enrollmentData = await fetchClassEnrollments(
          Number(classId)
        );

        setEnrollments(enrollmentData.enrollments);
      } catch (err) {
        console.error("Failed to load class:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load class."
        );
      } finally {
        setLoading(false);
        setRosterLoading(false);
      }
    };

    loadClass();
  }, [classId]);

  const refreshEnrollments = async () => {
    if (!classId) return;

    try {
      setRosterLoading(true);

      const enrollmentData = await fetchClassEnrollments(
        Number(classId)
      );

      setEnrollments(enrollmentData.enrollments);
    } catch (err) {
      console.error("Error refreshing class enrollments:", err);
    } finally {
      setRosterLoading(false);
    }
  };

  const rosterLocked = classItem?.status === "archived";

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Loading class...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  if (!classItem) {
    return (
      <div style={styles.container}>
        <p>Class not found.</p>
      </div>
    );
  }

  const canEditClass =
    Auth.isSuperAdmin() ||
    (
      (Auth.isAdmin() || Auth.isInstructor()) &&
      classItem.status !== "archived"
    );

  return (
    <div style={styles.container}>
      <button
        type="button"
        style={styles.backButton}
        onClick={() => navigate("/classes")}
      >
        ← Back to Classes
      </button>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.heading}>{classItem.name}</h1>

          <p style={styles.subheading}>
            {classItem.program?.name ?? "Program not available"}
          </p>
        </div>

        <div style={styles.headerActions}>
          <button
            style={styles.progressButton}
            onClick={() => navigate(`/classes/${classItem.id}/progress`)}
          >
            View Progress
          </button>

          {canEditClass && (
            <button
              style={styles.editButton}
              onClick={() => navigate(`/classes/${classItem.id}/edit`)}
            >
              Edit Class
            </button>
          )}
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={styles.title}>Class Details</h3>

        <div style={styles.detailsGrid}>
          <div>
            <div style={styles.label}>Program</div>
            <div>{classItem.program?.name ?? "—"}</div>
          </div>

          <div>
            <div style={styles.label}>Organization</div>
            <div>{classItem.organization?.name ?? "—"}</div>
          </div>

          <div>
            <div style={styles.label}>Location</div>
            <div>{classItem.location?.name ?? "—"}</div>
          </div>

          <div>
            <div style={styles.label}>Start Date</div>
            <div>{formatDate(classItem.start_date)}</div>
          </div>

          <div>
            <div style={styles.label}>End Date</div>
            <div>{formatDate(classItem.end_date)}</div>
          </div>

          <div>
            <div style={styles.label}>Enrollment Deadline</div>
            <div>{formatDate(classItem.enrollment_deadline)}</div>
          </div>

          <div>
            <div style={styles.label}>Status</div>
            <div>{classItem.status}</div>
          </div>
        </div>

        {classItem.description && (
          <div style={styles.description}>
            <div style={styles.label}>Description</div>
            <div>{classItem.description}</div>
          </div>
        )}
      </div>

      <ClassRoster
        classId={classItem.id}
        enrollments={enrollments}
        loading={rosterLoading}
        onRosterChanged={refreshEnrollments}
        rosterLocked={rosterLocked}
        isSpecializationClass={
          classItem.program?.training_type === "specialization"
        }
      />

      {!rosterLocked && (
        <EnrollStudent
          classId={classItem.id}
          onStudentEnrolled={refreshEnrollments}
        />
      )}

    </div>
  );
}

function formatDate(date: string | null) {
  if (!date) return "—";

  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString();
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "25px",
    paddingLeft: "20px",
    paddingRight: "20px",
    paddingTop: "15px",
    paddingBottom: "20px",
  },

  heading: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
  },

  subheading: {
    marginTop: "6px",
    marginBottom: 0,
    color: "#666",
    fontSize: "14px",
  },

  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
  },

  title: {
    margin: 0,
    marginBottom: "20px",
    fontSize: "18px",
    fontWeight: 700,
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "20px",
  },

  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#666",
    marginBottom: "4px",
  },

  description: {
    marginTop: "24px",
  },

  error: {
    padding: "12px",
    borderRadius: "6px",
    background: "#FEE2E2",
    color: "#B91C1C",
    fontSize: "14px",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  editButton: {
    padding: "10px 16px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#2B78F6",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },

  backButton: {
    alignSelf: "flex-start",
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#2B78F6",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  progressButton: {
    padding: "10px 16px",
    borderRadius: "6px",
    border: "1px solid #2B78F6",
    backgroundColor: "#fff",
    color: "#2B78F6",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },
};