type TableContainerProps = {
  children: React.ReactNode;
};

export default function TableContainer({
  children,
}: TableContainerProps) {
  return (
    <div style={styles.wrapper}>
      {children}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {

  wrapper: {
    width: "100%",

    overflow: "visible",

    border: "1px solid #E2E8F0",

    borderRadius: "12px",

    backgroundColor: "#FFFFFF",

    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
};