export default function ExamsHeader() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Exams</h1>
      <p style={styles.subtitle}>Manage exams and track performance</p>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    marginBottom: "10px",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 700,
    color: "#1B1B1F",
  },
  subtitle: {
    marginTop: "6px",
    fontSize: "16px",
    color: "#555",
  },
};