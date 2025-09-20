import { useEffect } from "react";
import { SpecializationsInterface } from "../../interfaces/SpecializationInterface";
import { UserDataInterface } from "../../interfaces/UserDataInterface";

interface UserSpecializationsProps {
  singleUserData: UserDataInterface | null;
  viewMode: "view" | "edit";
  formState: any;
  setFormState: React.Dispatch<React.SetStateAction<any>>;
  specializations: SpecializationsInterface[];
  styles: { [key: string]: React.CSSProperties };
}

const UserSpecializations = ({
  singleUserData,
  viewMode,
  formState,
  setFormState,
  specializations,
  styles,
}: UserSpecializationsProps) => {
  // Always sync formState with DB specializations when data changes
  useEffect(() => {
    if (singleUserData?.specializations) {
      setFormState((prev: any) => ({
        ...prev,
        specializations: singleUserData.specializations,
      }));
    }
  }, [singleUserData]);

  const handleCheckboxChange = (spec: SpecializationsInterface) => {
    const alreadySelected = formState.specializations?.some(
      (s: SpecializationsInterface) => s.id === spec.id
    );

    let updatedSpecializations;
    if (alreadySelected) {
      updatedSpecializations = formState.specializations.filter(
        (s: SpecializationsInterface) => s.id !== spec.id
      );
    } else {
      updatedSpecializations = [...(formState.specializations || []), spec];
    }

    setFormState({
      ...formState,
      specializations: updatedSpecializations,
    });
  };

  return (
    <>
      <div style={styles.formRow}>
        {viewMode === "edit" && (
          <div
            style={{
              maxHeight: "150px",
              overflowY: "auto",
              border: "1px solid #ccc",
              padding: "0.5rem",
              borderRadius: "4px",
            }}
          >
            {specializations.map((spec) => {
              const checked = formState.specializations?.some(
                (s: SpecializationsInterface) => s.id === spec.id
              );

              return (
                <label
                  key={`spec_checkbox_${spec.id}`}
                  style={{ display: "block", marginBottom: "0.25rem" }}
                >
                  <input
                    type="checkbox"
                    value={spec.id}
                    checked={checked || false}
                    onChange={() => handleCheckboxChange(spec)}
                  />
                  {spec.name}
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div style={styles.formRow}>
        <div
          style={{ 
            overflowY: "auto",
            maxHeight: "150px",
            width: "100%",
           }}
        >
          Specializations:{" "}
          {(formState?.specializations ?? []).length > 0
            ? formState.specializations.map(
                (spec: SpecializationsInterface) => (
                  <p
                    key={spec.id}
                    style={{
                      
                      marginRight: "0.5rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {`-${spec.name}`}
                  </p>
                )
              )
            : "None"}
        </div>
      </div>
    </>
  );
};

export default UserSpecializations;
