type DashboardPageProps = {
  children: React.ReactNode;
};

export default function DashboardPage({
  children,
}: DashboardPageProps) {
  return (
    <div style={styles.page}>
      {children}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {

  page: {
    padding: "28px",

    backgroundColor: "#F1F5F9",

    width: "100%",

    boxSizing: "border-box",
  },
};