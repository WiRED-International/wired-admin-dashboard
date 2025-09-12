import { UserDataInterface } from "../../interfaces/UserDataInterface";
import { RoleInterface } from "../../interfaces/rolesInterface";
import { globalStyles } from "../../globalStyles";

interface UserRolesProps {
  singleUserData: UserDataInterface | null;
  viewMode: "view" | "edit";
  formState: any;
  setFormState: React.Dispatch<React.SetStateAction<any>>;
  roles: RoleInterface[];
  styles: { [key: string]: React.CSSProperties };
}

const UserRoles = ({
  viewMode,
  formState,
  setFormState,
  roles,
  styles,
}: UserRolesProps) => {
  return (
    <div style={styles.formRow}>
      <label style={styles.label}>Role:</label>
      {viewMode === "view" ? (
        <span>{roles.find(r => r.name === formState.role)?.name}</span>
      ) : (
        <select
          style={globalStyles.input}
          value={roles.find(r => r.name === formState.role)?.id || ""}
          onChange={(e) =>
            setFormState({
              ...formState,
              role: roles.find(r => r.id === Number(e.target.value))?.name || "",
            })
          }
        >
          <option value="">Select a role</option>
          {roles.map((role) => (
            <option key={`role_${role.id}`} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default UserRoles;
