import { ExamKpiResponse } from "@/interfaces/Exam";
type KpiCardsProps = {
  kpis: ExamKpiResponse;
};
export default function KpiCards({
  kpis,
}: KpiCardsProps) {
  const cards = [
    {
      title: "Total Attempts",
      value: kpis.totalAttempts,
      icon: ExamIcon(),
      bg: "#EEF4FF",
    },
    {
      title: "Average Score",
      value: `${kpis.averageScore}%`,
      icon: ScoreIcon(),
      bg: "#FEFCE8",
    },
    {
      title: "Pass Rate",
      value: `${kpis.passRate}%`,
      icon: ScoreIcon(),
      bg: "#ECFDF5",
    },
    {
      title: "Active Exams",
      value: kpis.activeExams,
      icon: TimerIcon(),
      bg: "#FFF4EC",
    },
  ];

  return (
    <div style={styles.container}>
      {cards.map((card) => (
        <div key={card.title} style={{ ...styles.card, backgroundColor: card.bg }}>
          <div style={styles.iconWrapper}>{card.icon}</div>
          <div>
            <div style={styles.title}>{card.title}</div>
            <div style={styles.value}>{card.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- SVG ICONS ---------------- */

function ExamIcon() {
  return (
    <svg width="22" height="22" fill="#3B82F6">
      <path d="M4 3h14a1 1 0 0 1 1 1v14l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1z" />
    </svg>
  );
}

// function MissedIcon() {
//   return (
//     <svg width="22" height="22" fill="#F97316">
//       <path d="M11 2a9 9 0 1 0 .002 18.002A9 9 0 0 0 11 2zm0 4a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1zm0 10a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6z" />
//     </svg>
//   );
// }

function TimerIcon() {
  return (
    <svg width="22" height="22" fill="#10B981">
      <path d="M11 1a1 1 0 1 1 0 2 8 8 0 1 1-7.446 4.975 1 1 0 1 1 1.79-.895A6 6 0 1 0 11 5V4h-1a1 1 0 1 1 0-2h2z" />
      <path d="M12 11a1 1 0 0 1-.553.894l-3 1.5a1 1 0 1 1-.894-1.788l3-1.5A1 1 0 0 1 12 11z" />
    </svg>
  );
}

function ScoreIcon() {
  return (
    <svg width="22" height="22" fill="#EAB308">
      <path d="M11 2a1 1 0 0 1 .894.553l8 16A1 1 0 0 1 19 20H3a1 1 0 0 1-.894-1.447l8-16A1 1 0 0 1 11 2zM11 6.618 5.618 18h10.764L11 6.618z" />
    </svg>
  );
}

/* ---------------- STYLES ---------------- */

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    gap: "20px",
    width: "100%",
  },
  card: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "18px",
    borderRadius: "10px",
    boxShadow: "0px 2px 4px rgba(0,0,0,0.08)",
  },
  iconWrapper: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    backgroundColor: "#ffffffaa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "4px",
  },
  value: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#111",
  },
};