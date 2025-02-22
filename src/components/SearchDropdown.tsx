import { useState, useEffect, useRef } from "react";
import { FilterFormInterface } from "../interfaces/FilterFormInterface";
import { globalStyles } from "../globalStyles";

interface SearchableDropdownProps {
  formData: FilterFormInterface
  setFormData: (formData: FilterFormInterface) => void,
  moduleAndPackageInfo: { modules: { id: number, name: string }[], packages: { id: number, name: string }[] }
}

export default function SearchableDropdown({ formData, moduleAndPackageInfo, setFormData }: SearchableDropdownProps) {

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    if (formData.searchBy && formData.searchQuery) {
      setQuery(formData.searchQuery);
    }
    if (!formData.searchQuery) {
      setQuery('');
    }
    let newOptions: string[] = [];
    if (formData.searchBy === 'module') {
      newOptions = moduleAndPackageInfo.modules.map((module) => module.name);
    } else if (formData.searchBy === 'package') {
      newOptions = moduleAndPackageInfo.packages.map((pkg) => pkg.name);
    } else {
      setQuery('');
    }
    setOptions(newOptions);
  }, [formData]);

  useEffect(() => {
    setFormData({ ...formData, searchQuery: query });
  }, [query]);

  // Clear filtered options when user changes search category
  useEffect(() => {
    if (query === '') {
      setFilteredOptions([]);
    }
  }, [options]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setFilteredOptions(options.filter((opt) => opt.toLowerCase().includes(value.toLowerCase())));
    setSelectedIndex(-1);
    setShowDropdown(true);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      setSelectedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      setQuery(filteredOptions[selectedIndex]);
      setShowDropdown(false);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

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
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowDropdown(true)}
        placeholder={formData.searchBy ? `Enter ${formData.searchBy} name` : 'Select a category first'}
        disabled={!formData.searchBy}
        style={globalStyles.input}
      />
      {showDropdown && filteredOptions.length > 0 && (
        <ul
          ref={dropdownRef}
          style={globalStyles.dropdownUL}
        >
          {filteredOptions.map((option, index) => (
            <li
              style={{ ...globalStyles.dropdownLI, ...(index === selectedIndex ? globalStyles.dropDownLISelected : {}) }}
              key={option}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => {
                setQuery(option);
                setShowDropdown(false);
              }}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: "relative",
    width: "100%",
  },
};
