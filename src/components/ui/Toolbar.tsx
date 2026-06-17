type ToolbarProps = {
  children: React.ReactNode;
};

export default function Toolbar({
  children,
}: ToolbarProps) {
  return (
    <div style={styles.toolbar}>
      {children}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {

  toolbar: {
    display: "flex",

    flexWrap: "wrap",

    alignItems: "center",

    gap: "10px",

    padding: "10px 14px",

    marginBottom: "24px",

    backgroundColor: "#F8FAFC",

    border: "1px solid #E2E8F0",

    borderRadius: "12px",
  },
};