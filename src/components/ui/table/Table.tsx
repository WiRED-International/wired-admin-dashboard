type TableProps = {
  children: React.ReactNode;
};

export default function Table({
  children,
}: TableProps) {
  return (
    <table style={styles.table}>
      {children}
    </table>
  );
}

const styles: { [key: string]: React.CSSProperties } = {

  table: {
    width: "100%",

    borderCollapse: "separate",

    borderSpacing: 0,

    minWidth: "1200px",

    backgroundColor: "#FFFFFF",
  },
};