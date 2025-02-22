import { useState, useEffect, useRef } from "react";
import { FilterFormInterface } from "../interfaces/FilterFormInterface";
import { globalStyles } from "../globalStyles";
import countryData from "../utils/countryNames.json";

interface CountryFilterProps {
    formData: FilterFormInterface;
    setFormData: (formData: FilterFormInterface) => void;
    countryInputShown: boolean;
    setCountryInputShown: (value: boolean) => void;
    selectedCountryCode: string;
    setSelectedCountryCode: (value: string) => void;
}

interface CountryInterface {
    name: string;
    code: string;
}

export default function CountryFilter({
    formData,
    setFormData,
    countryInputShown,
    setCountryInputShown,
    selectedCountryCode,
    setSelectedCountryCode,
}: CountryFilterProps) {

  
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLUListElement>(null);
    const [options, setOptions] = useState<CountryInterface[]>([]);
    const [filteredOptions, setFilteredOptions] = useState<CountryInterface[]>(options);
    
    useEffect(() => {
        setOptions(countryData);
    }, [])

    useEffect(() => {
        if(formData.country_code){
            setCountryInputShown(true);
            setQuery(countryData.find((country) => country.code === formData.country_code)?.name || "");
            setSelectedCountryCode(formData.country_code);
        }
    }, [formData.country_code]);

    useEffect(() => {
        setFormData({ ...formData, country_code: selectedCountryCode });
    }, [query]);

    useEffect(() => {
        if (query === "") {
            setFilteredOptions([]);
        }
    }, [options]);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        setFilteredOptions(
            options.filter((opt) => opt.name.toLowerCase().includes(value.toLowerCase()))
        );
        setSelectedIndex(-1);
        setShowDropdown(true);
    };

    // Handle keyboard navigation and selection of dropdown options
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            setSelectedIndex((prev) =>
                Math.min(prev + 1, filteredOptions.length - 1)
            );
        } else if (e.key === "ArrowUp") {
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" && selectedIndex >= 0) {
            setQuery(filteredOptions[selectedIndex].name);
            setShowDropdown(false);
        } else if (e.key === "Escape") {
            setShowDropdown(false);
        }
    };

    const handleToggleLocationInputs = (): void => {
        if (countryInputShown) {
            setFormData({
                ...formData,
                country_code: "",
            });
            setSelectedCountryCode("");
            setQuery("");
        }
        setCountryInputShown(!countryInputShown);
      }

    // Scroll to the selected option only if it is changed by keyboard or mouse
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedOption = dropdownRef.current.children[selectedIndex] as HTMLElement;
      selectedOption?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

    // Handle clicks outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                inputRef.current &&
                !inputRef.current.contains(event.target as Node) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div style={styles.container}>
            <label style={globalStyles.label}>Search by country</label>
            <input
                type="checkbox"
                checked={countryInputShown}
                onChange={handleToggleLocationInputs}
                style={{ marginRight: "5px" }}
            />
            {countryInputShown && 
            <>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowDropdown(true)}
                    placeholder={`Search for country`}
                    style={globalStyles.input}
                />
                {showDropdown && filteredOptions.length > 0 && (
                    <ul ref={dropdownRef} style={styles.dropdownUL}>
                        {filteredOptions.map((option, index) => (
                            <li
                                style={{
                                    ...styles.dropdownLI,
                                    ...(index === selectedIndex ? styles.dropDownLISelected : {}),
                                }}
                                key={option.code}
                                onMouseEnter={() => setSelectedIndex(index)}
                                onClick={() => {
                                    setQuery(option.name);
                                    setSelectedCountryCode(option.code);
                                    setShowDropdown(false);
                                }}
                            >
                                {option.name}
                            </li>
                        ))}
                    </ul>
                )}
            </>}
            <hr style={globalStyles.hr}/>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        position: "relative",
        width: "100%",
    },
    dropdownUL: {
        listStyleType: "none",
        padding: 0,
        margin: 0,
        backgroundColor: "white",
        border: "1px solid #ccc",
        borderRadius: "5px",
        position: "absolute",
        width: "100%",
        maxWidth: "inherit",
        zIndex: 1,
    },
    dropdownLI: {
        padding: "8px",
        cursor: "pointer",
    },
    dropDownLISelected: {
        backgroundColor: "#add8e6",
    },
};
