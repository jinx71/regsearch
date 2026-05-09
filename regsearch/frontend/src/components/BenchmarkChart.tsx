import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BenchmarkData } from "../types";
import { METRIC_LABELS, MODE_META, MODE_ORDER } from "../types";

// Reshape { mode -> {metric -> value} } into one row per metric so each metric
// becomes a group of four channel-colored bars.
function toChartRows(data: BenchmarkData) {
  return METRIC_LABELS.map(({ key, label }) => {
    const row: Record<string, string | number> = { metric: label };
    for (const mode of MODE_ORDER) {
      row[mode] = Number(data.modes[mode][key].toFixed(4));
    }
    return row;
  });
}

export default function BenchmarkChart({ data }: { data: BenchmarkData }) {
  const rows = toChartRows(data);

  return (
    <div className="panel p-4">
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EB" vertical={false} />
          <XAxis
            dataKey="metric"
            tick={{ fontSize: 12, fill: "#3B4D5F", fontFamily: "IBM Plex Sans" }}
            axisLine={{ stroke: "#CBD2DA" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fontSize: 11, fill: "#7A8896", fontFamily: "IBM Plex Mono" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ fill: "rgba(15,36,56,0.04)" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #E2E6EB",
              fontSize: 12,
              fontFamily: "IBM Plex Sans",
            }}
            labelStyle={{ fontWeight: 600, color: "#0F2438" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, fontFamily: "IBM Plex Sans" }}
            formatter={(value: string) =>
              MODE_META[value as keyof typeof MODE_META]?.label ?? value
            }
          />
          {MODE_ORDER.map((mode) => (
            <Bar
              key={mode}
              dataKey={mode}
              fill={MODE_META[mode].color}
              radius={[3, 3, 0, 0]}
              maxBarSize={34}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
