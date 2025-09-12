import { useState, useEffect, useRef } from "react";
import { globalStyles } from "../globalStyles";

interface NamedItem {
  name: string; // required
  [key: string]: any; // allows any other properties
}

interface SearchableDropdownProps {
  options: NamedItem[];
  placeholder?: string;
  value?: string; // controlled value
  onChange?: (value: string) => void; // fires on input change
  onSelect?: (opt: NamedItem) => void; // fires on selecting an option
  disabled?: boolean;
}



export default function SearchableDropdownReusable({
  options,
  placeholder = "Search...",
  value = "",
  onChange,
  onSelect,
  disabled = false,
}: SearchableDropdownProps) {
  const [query, setQuery] = useState(value);
  const [filteredOptions, setFilteredOptions] = useState<NamedItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);

  // Sync internal state with external value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Filter options whenever query changes
  useEffect(() => {
    if (query.trim() === "") {
      setFilteredOptions(options);
    } else {
      setFilteredOptions(
        options.filter((opt) => opt.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name))
      );
    }
  }, [query, options]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange?.(val);
    setShowDropdown(true);
    setSelectedIndex(-1);
  };

  const handleSelect = (option: NamedItem) => {
    setQuery(option.name);
    onSelect?.(option);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      setSelectedIndex((prev) =>
        Math.min(prev + 1, filteredOptions.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      handleSelect(filteredOptions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  // Keep selected option visible when navigating
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedOption = dropdownRef.current.children[
        selectedIndex
      ] as HTMLElement;
      selectedOption?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedIndex]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        !inputRef.current?.contains(event.target as Node) &&
        !dropdownRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder}
        disabled={disabled}
        style={globalStyles.input}
      />
      {showDropdown && filteredOptions.length > 0 && (
        <ul ref={dropdownRef} style={globalStyles.dropdownUL}>
          {filteredOptions.map((option, index) => (
            <li
              key={option.name}
              style={{
                ...globalStyles.dropdownLI,
                ...(index === selectedIndex
                  ? globalStyles.dropDownLISelected
                  : {}),
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => handleSelect(option)}
            >
              {option.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
