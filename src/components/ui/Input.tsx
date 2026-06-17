type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({
  style = {},
  ...props
}: InputProps) {

  return (
    <input
      {...props}
      style={{
        ...styles.input,
        ...style,
      }}
    />
  );
}

const styles: { [key: string]: React.CSSProperties } = {

  input: {
    height: "34px",

    paddingInline: "8px",

    borderRadius: "8px",

    border: "1px solid #CBD5E1",

    backgroundColor: "#FFFFFF",

    fontSize: "14px",

    fontFamily: "Inter, sans-serif",

    color: "#334155",

    outline: "none",

    boxSizing: "border-box",

    transition: "border-color 0.15s ease",
  },
};