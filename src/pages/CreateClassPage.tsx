import { useEffect, useState } from "react";
import {
  fetchClassPrograms,
  fetchClassLocations,
  createClass,
} from "../api/classAPI";
import { getAccessibleOrganizations } from "../api/examsAPI";
import {
  ClassProgramOption,
  ClassLocation,
} from "../interfaces/Class";
import { OrganizationInterface } from "../interfaces/OrganizationsInterface";
import Auth from "../utils/auth";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import { useNavigate } from "react-router-dom";


export default function CreateClassPage() {
  const [programs, setPrograms] = useState<ClassProgramOption[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationInterface[]>([]);
  const [locations, setLocations] = useState<ClassLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [programId, setProgramId] = useState<number | "">("");
  const [organizationId, setOrganizationId] = useState<number | "">("");
  const [locationId, setLocationId] = useState<number | "">("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [enrollmentDeadline, setEnrollmentDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isSuperAdmin = Auth.isSuperAdmin();
  const isAdmin = Auth.hasRole(2);
  const isInstructor = Auth.isInstructor();
  const navigate = useNavigate();

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Both Super Admins and Instructors need Programs.
        const programData = await fetchClassPrograms();
        setPrograms(programData.programs);

        const locationData = await fetchClassLocations();
        setLocations(locationData);

        // Super Admins and Admins choose an Organization.
        // The backend returns only organizations they can access.
        if (isSuperAdmin || isAdmin) {
          const organizationData = await getAccessibleOrganizations();
          setOrganizations(organizationData);
        }
      } catch (err) {
        console.error("Failed to load class options:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load class options."
        );
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, [isSuperAdmin, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    if (!programId) {
      setError("Please select a program.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter a class name.");
      return;
    }

    if ((isSuperAdmin || isAdmin) && !organizationId) {
      setError("Please select an organization.");
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

    try {
      setSubmitting(true);

      const classData = {
        program_id: programId,
        location_id: locationId || undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        enrollment_deadline: enrollmentDeadline || undefined,

        ...((isSuperAdmin || isAdmin) && organizationId
          ? { organization_id: organizationId }
          : {}),
      };

      const data = await createClass(classData);

      navigate(`/classes/${data.class.id}`);
    } catch (err) {
      console.error("Failed to create class:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create class."
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div style={styles.container}>
      <button
        type="button"
        style={styles.backButton}
        onClick={() => navigate("/classes")}
      >
        ← Back to Classes
      </button>
      <div>
        <h1 style={styles.heading}>Create Class</h1>
        <p style={styles.subheading}>
          Create a new training class and assign it to a program and organization.
        </p>
      </div>

      <div style={styles.card}>
        <h3 style={styles.title}>Class Details</h3>

        {loading && (
          <p style={styles.placeholder}>
            Loading class options...
          </p>
        )}

        {error && (
          <p style={styles.error}>
            {error}
          </p>
        )}

        {!loading && (
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

              {(isSuperAdmin || isAdmin) && (
                <div style={styles.field}>
                  <label style={styles.label}>Organization</label>

                  <Select
                    value={organizationId}
                    onChange={(e) =>
                      setOrganizationId(
                        e.target.value === ""
                          ? ""
                          : Number(e.target.value)
                      )
                    }
                    options={[
                      {
                        label: "Select an organization",
                        value: "",
                      },
                      ...organizations.map((organization) => ({
                        label: organization.name,
                        value: organization.id,
                      })),
                    ]}
                    style={styles.control}
                  />
                </div>
              )}

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
                <label style={styles.label}>Class Name</label>

                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter class name"
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
                placeholder="Enter a class description"
                style={styles.textarea}
              />
            </div>

            <div style={styles.actions}>
              <Button
                type="button"
                variant="secondary"
                disabled={submitting}
                onClick={() => navigate("/classes")}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create Class"}
              </Button>
            </div>
          </form>
        )}
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
    marginBottom: "12px",
    fontSize: "18px",
    fontWeight: 700,
  },

  placeholder: {
    margin: 0,
    color: "#666",
    fontSize: "14px",
  },
  
  error: {
    margin: 0,
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