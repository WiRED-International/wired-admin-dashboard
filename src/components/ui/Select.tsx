type SelectOption = {
  label: string;
  value: string | number;
};

type SelectProps = {
  value: string | number;

  onChange: (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => void;

  options: SelectOption[];

  style?: React.CSSProperties;
};

export default function Select({
  value,
  onChange,
  options,
  style = {},
}: SelectProps) {

  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        ...styles.select,
        ...style,
      }}
    >
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}

const styles: { [key: string]: React.CSSProperties } = {

  select: {
    height: "38px",

    padding: "0 2px 0 6px",

    borderRadius: "8px",

    border: "1px solid #CBD5E1",

    backgroundColor: "#FFFFFF",

    fontSize: "14px",

    fontFamily: "Inter, sans-serif",

    color: "#334155",

    outline: "none",

    boxSizing: "border-box",

    cursor: "pointer",
  },
};