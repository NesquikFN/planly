import type { WeeklyProgress } from "@/types/focus";

interface ProgressCardProps {
  progress: WeeklyProgress;
}

const CHART_WIDTH = 240;
const CHART_HEIGHT = 56;

function buildPoints(values: number[]): string {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = CHART_WIDTH / (values.length - 1);

  return values
    .map((value, index) => {
      const x = index * step;
      const y = CHART_HEIGHT - ((value - min) / range) * CHART_HEIGHT;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function ProgressCard({ progress }: ProgressCardProps) {
  const points = buildPoints(progress.points);

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900">Прогресс</h3>

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="mt-3 h-14 w-full"
        preserveAspectRatio="none"
      >
        <polyline
          points={points}
          fill="none"
          stroke="#2563eb"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="mt-1 flex justify-between text-xs text-gray-400">
        {progress.days.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-400">Выполнено задач</p>
          <p className="mt-1 text-base font-semibold text-gray-900">
            {progress.completed} из {progress.total}
          </p>
        </div>
        <p className="text-base font-semibold text-blue-600">{progress.percent}%</p>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </section>
  );
}
