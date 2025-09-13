import SearchableDropdownReusable from "../SearchDropdown-Reusable";

interface UserOrganizationProps {
  singleUserData: any;
  formState: any;
  setFormState: React.Dispatch<React.SetStateAction<any>>;
  viewMode: "view" | "edit";
  styles: { [key: string]: React.CSSProperties };
  filteredOrganizations: { name: string, id: number }[];
  setSelectedOrganizationId: React.Dispatch<React.SetStateAction<number | null>>;
}

const UserOrganization = ({
  singleUserData,
  formState,
  setFormState,
  viewMode,
  styles,
  filteredOrganizations,
  setSelectedOrganizationId
}: UserOrganizationProps) => {
  return (
    <div style={styles.formRow}>
      <label style={styles.label}>Organization:</label>
      {viewMode === "view" ? (
        <span>{singleUserData?.organization?.name}</span>
      ) : (
        <SearchableDropdownReusable
          options={filteredOrganizations}
          placeholder="Select an organization"
          value={formState.organization}
          onChange={(value) => {
            setFormState((prev: any) => ({ ...prev, organization: value }));
            // If the typed value doesn't match any option, set ID to null
            const match = filteredOrganizations.find(
              (org) => org.name === value
            );
            setSelectedOrganizationId(match ? match.id : null);
          }}
          onSelect={(opt) => {
            setSelectedOrganizationId(opt.id);
            setFormState({ ...formState, organization: opt.name });
          }}
          disabled={filteredOrganizations.length === 0}
        />
      )}
    </div>
  );
}

export default UserOrganization;