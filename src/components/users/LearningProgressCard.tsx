import Panel from "../ui/Panel";
import { LearningProgress } from "../../interfaces/UserDataInterface";

interface Props {
  progress: LearningProgress | null;
}

type ProgressRowProps = {
  label: string;
  completed: number;
  total: number;
  percent: number;
};

function ProgressRow({
  label,
  completed,
  total,
  percent,
}: ProgressRowProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        <span>{label}</span>

        <span>
          {completed} / {total} ({percent}%)
        </span>
      </div>

      <div
        style={{
          height: 10,
          background: "#E5E7EB",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            background: "#2563EB",
          }}
        />
      </div>
    </div>
  );
}

export default function LearningProgressCard({ progress }: Props) {
  if (!progress) {
    return null;
  }

  return (
    <Panel>
      <h2>Learning Progress</h2>

      <ProgressRow
        label="Basic Training"
        completed={progress.basicTraining.completed}
        total={progress.basicTraining.total}
        percent={progress.basicTraining.percent}
      />

      <ProgressRow
        label="ACT"
        completed={progress.act.completed}
        total={progress.act.total}
        percent={progress.act.percent}
      />

      {progress.specializations.map((specialization) => (
        <ProgressRow
          key={specialization.id}
          label={specialization.name}
          completed={specialization.completed}
          total={specialization.total}
          percent={specialization.percent}
        />
      ))}

    </Panel>
  );
}