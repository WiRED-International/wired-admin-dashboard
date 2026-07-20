import { QuizScoreInterface } from "../../interfaces/UserDataInterface";

interface TrainingRecordTableProps {
  quizScores: QuizScoreInterface[];
}

export default function TrainingRecordTable({
  quizScores,
}: TrainingRecordTableProps) {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.header}>Module ID</th>
          <th style={styles.header}>Module</th>
          <th style={styles.header}>Program</th>
          <th style={styles.header}>Completed</th>
          <th style={styles.header}>Score</th>
        </tr>
      </thead>

      <tbody>
        {quizScores.length === 0 ? (
          <tr>
            <td colSpan={5} style={styles.empty}>
              No training records found.
            </td>
          </tr>
        ) : (
          quizScores.map((score) => (
            <tr key={score.id}>
              <td style={styles.cell}>TODO</td>
              <td style={styles.cell}>TODO</td>
              <td style={styles.cell}>TODO</td>
              <td style={styles.cell}>TODO</td>
              <td style={styles.cell}>TODO</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

const styles: Record<string, React.CSSProperties> = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  header: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "2px solid #ddd",
    fontWeight: 600,
  },

  cell: {
    padding: "12px",
    borderBottom: "1px solid #eee",
  },

  empty: {
    textAlign: "center",
    padding: "40px",
    color: "#777",
  },
};