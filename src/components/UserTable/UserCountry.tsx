import SearchableDropdownReusable from "../SearchDropdown-Reusable";
import { CountryInterface } from "../../interfaces/CountryInterface";

interface UserCountryProps {
  formState: any;
  setFormState: React.Dispatch<React.SetStateAction<any>>;
  viewMode: "view" | "edit";
  styles: { [key: string]: React.CSSProperties };
  countries: CountryInterface[];
  handleCountryChange: (value: string) => void;
  handleCountrySelect: (id: number, name: string) => void;
}

const UserCountry = ({
  formState,
  viewMode,
  styles,
  countries,
  handleCountryChange,
  handleCountrySelect
}: UserCountryProps) => {
  return (
    <>
      <div style={styles.formRow}>
        <label style={styles.label}>Country:</label>
        {viewMode === "view" ? (
          <span>{formState.country}</span>
        ) : (
          <SearchableDropdownReusable
            options={countries}
            placeholder="Select a country"
            value={formState.country}
            onChange={(value) => handleCountryChange(value)}
            onSelect={(opt) => handleCountrySelect(opt.id, opt.name)}
            disabled={countries.length === 0}

          />

        )}
      </div>
    </>
  );
};

export default UserCountry;