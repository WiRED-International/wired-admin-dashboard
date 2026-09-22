import { useEffect, useState } from "react";
import {
  ClassEnrollment,
  SpecializationOption,
} from "@/interfaces/Class";

import {
  fetchClassSpecializations,
  removeStudentFromClass,
  saveEnrollmentSpecialization,
} from "@/api/classAPI";
import Button from "@/components/ui/Button";

type ClassRosterProps = {
  classId: number;
  enrollments: ClassEnrollment[];
  loading: boolean;
  onRosterChanged: () => void;
  rosterLocked: boolean;
  isSpecializationClass: boolean;
};

export default function ClassRoster({
  classId,
  enrollments,
  loading,
  onRosterChanged,
  rosterLocked,
  isSpecializationClass,
}: ClassRosterProps) {
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [studentToRemove, setStudentToRemove] = useState<ClassEnrollment | null>(null);
  const [specializations, setSpecializations] = useState<SpecializationOption[]>([]);
  const [savingEnrollmentId, setSavingEnrollmentId] = useState<number | null>(null);
  const [editingEnrollmentId, setEditingEnrollmentId] = useState<number | null>(null);
  const [selectedSpecializationId, setSelectedSpecializationId] = useState<number | null>(null);

  useEffect(() => {
    if (!isSpecializationClass) {
      setSpecializations([]);
      return;
    }

    const loadSpecializations = async () => {
      try {
        const data = await fetchClassSpecializations(classId);

        setSpecializations(data.specializations);
      } catch (err) {
        console.error("Unable to load specializations:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load specializations."
        );
      }
    };

    loadSpecializations();
  }, [classId, isSpecializationClass]);

  const handleRemove = async (userId: number) => {
    setRemovingUserId(userId);
    setError(null);

    try {
      await removeStudentFromClass(classId, userId);

      await onRosterChanged();

      setStudentToRemove(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove student from class."
      );
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleStartSpecializationEdit = (
    enrollment: ClassEnrollment
  ) => {
    setEditingEnrollmentId(enrollment.id);

    setSelectedSpecializationId(
      enrollment.specialization_selection?.specialization_id ?? null
    );

    setError(null);
  };

  const handleCancelSpecializationEdit = () => {
    setEditingEnrollmentId(null);
    setSelectedSpecializationId(null);
  };

  const handleSpecializationChange = async (
    enrollment: ClassEnrollment
  ) => {
    if (!selectedSpecializationId) {
      setError("Please select a specialization.");
      return;
    }

    const existingSelection =
      enrollment.specialization_selection;

    const newSpecialization = specializations.find(
      (specialization) =>
        specialization.id === selectedSpecializationId
    );

    if (!newSpecialization) {
      setError("Selected specialization could not be found.");
      return;
    }

    // Require confirmation when changing an existing selection.
    if (
      existingSelection &&
      existingSelection.specialization_id !==
        selectedSpecializationId
    ) {
      const confirmed = window.confirm(
        `Change ${enrollment.user.first_name} ${enrollment.user.last_name}'s specialization from ` +
          `${existingSelection.specialization.name} to ${newSpecialization.name}?`
      );

      if (!confirmed) {
        return;
      }
    }

    // Nothing actually changed.
    if (
      existingSelection?.specialization_id ===
      selectedSpecializationId
    ) {
      handleCancelSpecializationEdit();
      return;
    }

    setSavingEnrollmentId(enrollment.id);
    setError(null);

    try {
      await saveEnrollmentSpecialization(
        classId,
        enrollment.id,
        selectedSpecializationId
      );

      await onRosterChanged();

      setEditingEnrollmentId(null);
      setSelectedSpecializationId(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save specialization."
      );
    } finally {
      setSavingEnrollmentId(null);
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Students</h3>
      {error && (
        <p style={styles.error}>
          {error}
        </p>
      )}

      {loading && <p>Loading students...</p>}

      {!loading && enrollments.length === 0 && (
        <p>No students are currently enrolled in this class.</p>
      )}

      {!loading && enrollments.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>WiRED ID</th>
              <th style={styles.th}>First Name</th>
              <th style={styles.th}>Last Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Status</th>
              {isSpecializationClass && (
                <th style={styles.th}>Specialization</th>
              )}
              <th style={styles.th}>Enrolled</th>
              {!rosterLocked && (
                <th style={styles.th}>Actions</th>
              )}
            </tr>
          </thead>

          <tbody>
            {enrollments.map((enrollment) => (
              <tr key={enrollment.id} style={styles.tr}>
                <td style={styles.td}>
                  {enrollment.user.wired_user_id}
                </td>

                <td style={styles.td}>
                  {enrollment.user.first_name}
                </td>

                <td style={styles.td}>
                  {enrollment.user.last_name}
                </td>

                <td style={styles.td}>
                  {enrollment.user.email}
                </td>

                <td style={styles.td}>
                  {enrollment.status}
                </td>

                {isSpecializationClass && (
                  <td style={styles.td}>
                    {editingEnrollmentId === enrollment.id ? (
                      <div style={styles.specializationEditor}>
                        <select
                          value={selectedSpecializationId ?? ""}
                          disabled={savingEnrollmentId === enrollment.id}
                          onChange={(event) => {
                            const value = Number(event.target.value);

                            setSelectedSpecializationId(
                              value ? value : null
                            );
                          }}
                          style={styles.specializationSelect}
                        >
                          <option value="">Select specialization</option>

                          {specializations.map((specialization) => (
                            <option
                              key={specialization.id}
                              value={specialization.id}
                            >
                              {specialization.name}
                            </option>
                          ))}
                        </select>

                        <div style={styles.specializationActions}>
                          <button
                            type="button"
                            style={styles.saveSpecializationButton}
                            disabled={
                              !selectedSpecializationId ||
                              savingEnrollmentId === enrollment.id
                            }
                            onClick={() =>
                              handleSpecializationChange(enrollment)
                            }
                          >
                            {savingEnrollmentId === enrollment.id
                              ? "Saving..."
                              : "Save"}
                          </button>

                          <button
                            type="button"
                            style={styles.cancelSpecializationButton}
                            disabled={savingEnrollmentId === enrollment.id}
                            onClick={handleCancelSpecializationEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={styles.specializationDisplay}>
                        <span>
                          {enrollment.specialization_selection
                            ?.specialization.name ?? "Not Selected"}
                        </span>

                        {!rosterLocked && (
                          <button
                            type="button"
                            style={styles.specializationEditButton}
                            onClick={() =>
                              handleStartSpecializationEdit(enrollment)
                            }
                          >
                            {enrollment.specialization_selection
                              ? "Change"
                              : "Select"}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                )}

                <td style={styles.td}>
                  {formatDateTime(enrollment.enrolled_at)}
                </td>

                {!rosterLocked && (
                  <td style={styles.td}>
                    <Button
                      type="button"
                      disabled={removingUserId === enrollment.user.id}
                      onClick={() => setStudentToRemove(enrollment)}
                    >
                      {removingUserId === enrollment.user.id
                        ? "Removing..."
                        : "Remove"}
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {studentToRemove && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmationModal}>
            <h3 style={styles.confirmationTitle}>
              Remove student from class?
            </h3>

            <p style={styles.confirmationText}>
              Are you sure you want to remove{" "}
              <strong>
                {studentToRemove.user.first_name}{" "}
                {studentToRemove.user.last_name}
              </strong>{" "}
              from this class?
            </p>

            <p style={styles.confirmationWarning}>
              This will unenroll the student from this class.
            </p>

            <div style={styles.confirmationActions}>
              <button
                type="button"
                style={styles.confirmationCancelButton}
                disabled={
                  removingUserId === studentToRemove.user.id
                }
                onClick={() => setStudentToRemove(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                style={styles.confirmationRemoveButton}
                disabled={
                  removingUserId === studentToRemove.user.id
                }
                onClick={() =>
                  handleRemove(studentToRemove.user.id)
                }
              >
                {removingUserId === studentToRemove.user.id
                  ? "Removing..."
                  : "Remove Student"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateTime(date: string | null) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
    marginBottom: "12px",
    fontSize: "18px",
    fontWeight: 700,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
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

  error: {
    marginBottom: "15px",
    color: "#B91C1C",
  },

  specializationSelect: {
    width: "260px",
    minWidth: "190px",
    padding: "8px 10px",
    border: "1px solid #D1D5DB",
    borderRadius: "6px",
    background: "#fff",
    fontSize: "14px",
  },

  specializationEditor: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "8px",
  },

  specializationActions: {
    display: "flex",
    gap: "6px",
  },

  specializationDisplay: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  specializationEditButton: {
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#2B78F6",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },

  saveSpecializationButton: {
    padding: "6px 10px",
    border: "none",
    borderRadius: "5px",
    background: "#2B78F6",
    color: "#fff",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  },

  cancelSpecializationButton: {
    padding: "6px 10px",
    border: "1px solid #D1D5DB",
    borderRadius: "5px",
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  },

  modalOverlay: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },

  confirmationModal: {
    width: "100%",
    maxWidth: "440px",
    backgroundColor: "#FFFFFF",
    borderRadius: "10px",
    padding: "24px",
    boxShadow: "0 12px 32px rgba(0, 0, 0, 0.2)",
  },

  confirmationTitle: {
    margin: 0,
    marginBottom: "14px",
    fontSize: "20px",
    fontWeight: 700,
    color: "#111827",
  },

  confirmationText: {
    margin: 0,
    marginBottom: "10px",
    fontSize: "14px",
    lineHeight: 1.5,
    color: "#374151",
  },

  confirmationWarning: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.5,
    color: "#B91C1C",
  },

  confirmationActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "24px",
  },

  confirmationCancelButton: {
    padding: "9px 14px",
    borderRadius: "6px",
    border: "1px solid #D1D5DB",
    backgroundColor: "#FFFFFF",
    color: "#374151",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },

  confirmationRemoveButton: {
    padding: "9px 14px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#DC2626",
    color: "#FFFFFF",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },
};