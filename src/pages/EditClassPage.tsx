import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Auth from "../utils/auth";

import {
  fetchClassById,
  fetchClassPrograms,
  fetchClassLocations,
  updateClass,
} from "../api/classAPI";

import {
  ClassItem,
  ClassProgramOption,
  ClassLocation,
} from "../interfaces/Class";

import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";

export default function EditClassPage() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [classItem, setClassItem] = useState<ClassItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programs, setPrograms] = useState<ClassProgramOption[]>([]);
  const [locations, setLocations] = useState<ClassLocation[]>([]);

  const [programId, setProgramId] = useState<number | "">("");
  const [locationId, setLocationId] = useState<number | "">("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [enrollmentDeadline, setEnrollmentDeadline] = useState("");

  const [status, setStatus] = useState<"draft" | "active" | "completed" | "archived">("draft");
  const [submitting, setSubmitting] = useState(false);

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

        const [classData, programData, locationData] = await Promise.all([
          fetchClassById(Number(classId)),
          fetchClassPrograms(),
          fetchClassLocations(),
        ]);

        const currentClass = classData.class;

        setClassItem(currentClass);
        setPrograms(programData.programs);
        setLocations(locationData);

        setProgramId(currentClass.program_id);
        setLocationId(currentClass.location_id ?? "");
        setName(currentClass.name);
        setDescription(currentClass.description ?? "");
        setStartDate(currentClass.start_date ?? "");
        setEndDate(currentClass.end_date ?? "");
        setEnrollmentDeadline(currentClass.enrollment_deadline ?? "");

        setStatus(
          currentClass.status as
            | "draft"
            | "active"
            | "completed"
            | "archived"
        );
      } catch (err) {
        console.error("Failed to load class:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load class."
        );
      } finally {
        setLoading(false);
      }
    };

    loadClass();
  }, [classId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!classItem) return;

    setError(null);

    if (!programId) {
      setError("Please select a program.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter a class name.");
      return;
    }

    if (startDate && endDate && endDate < startDate) {
      setError("End date cannot be before the start date.");
      return;
    }

    if (
      enrollmentDeadline &&
      endDate &&
      enrollmentDeadline > endDate
    ) {
      setError("Enrollment deadline cannot be after the class end date.");
      return;
    }

    if (
      status === "archived" &&
      classItem.status !== "archived" &&
      Auth.isInstructor()
    ) {
      const confirmed = window.confirm(
        "Archive this class? You will no longer be able to edit the class or modify its roster after it is archived."
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setSubmitting(true);

      await updateClass(classItem.id, {
        program_id: programId,
        location_id: locationId === "" ? null : locationId,
        name: name.trim(),
        description: description.trim(),
        start_date: startDate,
        end_date: endDate,
        enrollment_deadline: enrollmentDeadline || null,
        status,
      });

      navigate(`/classes/${classItem.id}`);
    } catch (err) {
      console.error("Failed to update class:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update class."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p>Loading class...</p>
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

  if (
    !Auth.isSuperAdmin() &&
    (Auth.isAdmin() || Auth.isInstructor()) &&
    classItem.status === "archived"
  ) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          Archived classes cannot be edited.
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(`/classes/${classItem.id}`)}
        >
          Back to Class
        </Button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <button
        type="button"
        style={styles.backButton}
        onClick={() => navigate(`/classes/${classItem.id}`)}
      >
        ← Back to Class
      </button>
      <div>
        <h1 style={styles.heading}>Edit Class</h1>

        <p style={styles.subheading}>
          {classItem.name}
        </p>
      </div>

      <div style={styles.card}>
        <h3 style={styles.title}>Class Details</h3>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <form
          style={styles.form}
          onSubmit={handleSubmit}
        >
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Program</label>

              <Select
                value={programId}
                onChange={(e) =>
                  setProgramId(
                    e.target.value === ""
                      ? ""
                      : Number(e.target.value)
                  )
                }
                options={[
                  {
                    label: "Select a program",
                    value: "",
                  },
                  ...programs.map((program) => ({
                    label: program.name,
                    value: program.id,
                  })),
                ]}
                style={styles.control}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Location</label>

              <Select
                value={locationId}
                onChange={(e) =>
                  setLocationId(
                    e.target.value === ""
                      ? ""
                      : Number(e.target.value)
                  )
                }
                options={[
                  {
                    label: "Select a location",
                    value: "",
                  },
                  ...locations.map((location) => ({
                    label: location.name,
                    value: location.id,
                  })),
                ]}
                style={styles.control}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Status</label>

              <Select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as
                      | "draft"
                      | "active"
                      | "completed"
                      | "archived"
                  )
                }
                options={[
                  { label: "Draft", value: "draft" },
                  { label: "Active", value: "active" },
                  { label: "Completed", value: "completed" },
                  { label: "Archived", value: "archived" },
                ]}
                style={styles.control}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Class Name</label>

              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.control}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Start Date</label>

              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={styles.control}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>End Date</label>

              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={styles.control}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Enrollment Deadline</label>

              <Input
                type="date"
                value={enrollmentDeadline}
                onChange={(e) => setEnrollmentDeadline(e.target.value)}
                style={styles.control}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description</label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={styles.textarea}
            />
          </div>

          <div style={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={() => navigate(`/classes/${classItem.id}`)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
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

  placeholder: {
    color: "#666",
    fontSize: "14px",
  },

  error: {
    padding: "12px",
    borderRadius: "6px",
    background: "#FEE2E2",
    color: "#B91C1C",
    fontSize: "14px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "18px 24px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  label: {
    fontFamily: "Inter, sans-serif",
    fontSize: "14px",
    fontWeight: 600,
    color: "#475569",
  },

  control: {
    width: "100%",
  },

  textarea: {
    width: "100%",
    minHeight: "90px",
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #CBD5E1",
    backgroundColor: "#FFFFFF",
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
    color: "#334155",
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "4px",
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
};