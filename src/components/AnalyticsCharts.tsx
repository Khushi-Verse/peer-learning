import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsChartsProps {
  profile: { points?: number | null } | null;
  sessions: { status: string }[];
  /**
   * Learning hours per day for the current week (Mon → Sun, 7 values).
   * Provided by the parent once real session-duration data is available.
   * Defaults to all-zeros so the chart renders an honest empty state.
   */
  weeklyHours?: number[];
}

const DEFAULT_WEEKLY_HOURS: number[] = [0, 0, 0, 0, 0, 0, 0];

export default function AnalyticsCharts({
  profile,
  sessions,
  weeklyHours = DEFAULT_WEEKLY_HOURS,
}: AnalyticsChartsProps) {
  const learningHoursData = useMemo(
    () => ({
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Learning Hours",
          data: weeklyHours,
          borderColor: "rgb(34,211,238)",
          backgroundColor: "rgba(34,211,238,0.3)",
        },
      ],
    }),
    [weeklyHours],
  );

  const attendanceData = useMemo(
    () => ({
      labels: ["Attended", "Missed"],
      datasets: [
        {
          label: "Sessions",
          data: [
            sessions.filter((s) => s.status === "attended").length,
            sessions.filter((s) => s.status === "missed").length,
          ],
          backgroundColor: [
            "rgba(34,211,238,0.6)",
            "rgba(239,68,68,0.6)",
          ],
        },
      ],
    }),
    [sessions],
  );

  const xpGrowthData = useMemo(() => {
    const currentXP = profile?.points ?? 0;
    // Weeks 1–3 are shown as 0 until a dedicated XP-history table is
    // available. Only the current week reflects real data.
    return {
      labels: ["Week 1", "Week 2", "Week 3", "This Week"],
      datasets: [
        {
          label: "XP Growth",
          data: [0, 0, 0, currentXP],
          borderColor: "rgb(59,130,246)",
          backgroundColor: "rgba(59,130,246,0.3)",
        },
      ],
    };
  }, [profile?.points]);

  return (
    <div className="grid gap-8 md:grid-cols-2 mt-10">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
        <h2 className="mb-4 text-lg font-semibold">📈 Learning Hours</h2>
        <Line data={learningHoursData} />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
        <h2 className="mb-4 text-lg font-semibold">📊 Session Attendance</h2>
        <Bar data={attendanceData} />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl">
        <h2 className="mb-4 text-lg font-semibold">⚡ XP Growth</h2>
        <Line data={xpGrowthData} />
      </div>
    </div>
  );
}
