type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;

  variant?: "primary" | "secondary" | "danger";

  type?: "button" | "submit";

  disabled?: boolean;

  style?: React.CSSProperties;
};

export default function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled = false,
  style = {},
}: ButtonProps) {

  const variantStyles = {
    primary: {
      backgroundColor: "#2563EB",
      color: "#FFFFFF",
      border: "none",
    },

    secondary: {
      backgroundColor: "#FFFFFF",
      color: "#334155",
      border: "1px solid #CBD5E1",
    },

    danger: {
      backgroundColor: "#DC2626",
      color: "#FFFFFF",
      border: "none",
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.button,
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

const styles: { [key: string]: React.CSSProperties } = {

  button: {
    height: "34px",

    paddingInline: "14px",

    borderRadius: "6px",

    fontSize: "14px",

    fontWeight: 600,

    fontFamily: "Inter, sans-serif",

    cursor: "pointer",

    transition: "all 0.15s ease",

    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "8px",
  },
};