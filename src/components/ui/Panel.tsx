type PanelProps = {
  children: React.ReactNode;
};

export default function Panel({
  children,
}: PanelProps) {
  return (
    <div style={styles.panel}>
      {children}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {

  panel: {
    backgroundColor: "#FFFFFF",

    borderRadius: "14px",

    padding: "28px",

    border: "1px solid #E2E8F0",

    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",

    minWidth: "fit-content",
  },
};