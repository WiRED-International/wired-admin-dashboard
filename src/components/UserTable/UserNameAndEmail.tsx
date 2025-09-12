import { globalStyles } from "../../globalStyles";

interface UserNameAndEmailProps {
  formState: any;
  setFormState: React.Dispatch<React.SetStateAction<any>>;
  viewMode: "view" | "edit";
  styles: { [key: string]: React.CSSProperties };
}

const UserNameAndEmail = ({ formState, setFormState, viewMode, styles }: UserNameAndEmailProps) => {
  return (
    <>
      <div style={styles.formRow}>
        <label style={styles.label}>First Name:</label>
        {viewMode === "view" ? (
          <span>{formState.first_name}</span>
        ) : (
          <input
            type="text"
            style={globalStyles.input}
            value={formState.first_name}
            onChange={(e) =>
              setFormState({ ...formState, first_name: e.target.value })
            }
          />
        )}
      </div>

      <div style={styles.formRow}>
        <label style={styles.label}>Last Name:</label>
        {viewMode === "view" ? (
          <span>{formState.last_name}</span>
        ) : (
          <input
            type="text"
            style={globalStyles.input}
            value={formState.last_name}
            onChange={(e) =>
              setFormState({ ...formState, last_name: e.target.value })
            }
          />
        )}
      </div>
      <div style={styles.formRow}>
        <label style={styles.label}>Email:</label>
        {viewMode === "view" ? (
          <span>{formState.email}</span>
        ) : (
          <input
            type="email"
            style={globalStyles.input}
            value={formState.email}
            onChange={(e) =>
              setFormState({ ...formState, email: e.target.value })
            }
          />
        )}
      </div>
    </>
  );
}
export default UserNameAndEmail;