import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ExamAnalyticsResponse } from "@/interfaces/Exam";
type PerformanceChartProps = {
  analytics: ExamAnalyticsResponse;
};

export default function PerformanceChart({
  analytics,
}: PerformanceChartProps) {
  const {
    excellent,
    good,
    needsImprovement,
    totalCompleted,
  } = analytics.distribution;
  const data = [
    {
      name: "Excellent (90%+)",
      value: excellent,
      color: "#2B78F6",
    },
    {
      name: "Good (80-89%)",
      value: good,
      color: "#38BDF8",
    },
    {
      name: "Needs Improvement (<80%)",
      value: needsImprovement,
      color: "#F97316",
    },
  ];

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Performance Distribution</h3>

      <div style={styles.chartRow}>
        {/* Donut Chart */}
        <div style={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center Label */}
          <div style={styles.centerLabel}>
            <span style={styles.centerNumber}>
              {totalCompleted}
            </span>
            <span style={styles.centerText}>
              completed exams
            </span>
          </div>
        </div>

        {/* Legend */}
        <div style={styles.legend}>
          {data.map((item) => (
            <div key={item.name} style={styles.legendRow}>
              <div
                style={{
                  ...styles.legendColor,
                  backgroundColor: item.color,
                }}
              ></div>
              <span style={styles.legendLabel}>
                {item.name} — {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
  },
  title: {
    margin: 0,
    marginBottom: "10px",
    fontSize: "18px",
    fontWeight: 700,
  },
  chartRow: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  chartWrapper: {
    position: "relative",
    width: "250px",
    height: "250px",
  },
  centerLabel: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
  },
  centerNumber: {
    fontSize: "26px",
    fontWeight: 700,
    color: "#111",
  },
  centerText: {
    display: "block",
    marginTop: "4px",
    fontSize: "13px",
    color: "#666",
  },
  legend: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  legendRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  legendColor: {
    width: "16px",
    height: "16px",
    borderRadius: "4px",
  },
  legendLabel: {
    fontSize: "14px",
    color: "#444",
  },
};
