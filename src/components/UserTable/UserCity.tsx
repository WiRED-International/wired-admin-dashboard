import SearchableDropdownReusable from "../SearchDropdown-Reusable";


interface UserCityProps {
  formState: any;
  setFormState: React.Dispatch<React.SetStateAction<any>>;
  viewMode: "view" | "edit";
  styles: { [key: string]: React.CSSProperties };
  filteredCities: { name: string, id: number }[];
  setSelectedCityId: React.Dispatch<React.SetStateAction<number | null>>;
}

const UserCity = ({ styles, formState, setFormState, viewMode, filteredCities, setSelectedCityId }: UserCityProps) => {
  return (
    <div style={styles.formRow}>
      <label style={styles.label}>City:</label>
      {viewMode === "view" ? (
        <span>{formState.city}</span>
      ) : (
        <SearchableDropdownReusable
          options={filteredCities}
          placeholder="Select a city"
          value={formState.city}
          onChange={(value) =>
            setFormState({ ...formState, city: value })
          }
          onSelect={(opt) => {
            setSelectedCityId(opt.id);
            setFormState({ ...formState, city: opt.name })
          }}
          disabled={filteredCities.length === 0}
        />
      )}
    </div>
  )
};

export default UserCity;