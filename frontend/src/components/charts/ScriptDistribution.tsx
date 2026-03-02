import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import client from "../../api/client";
import ExportableChart from "./ExportableChart";

const COLORS = [
  "#0668E1", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#84CC16", "#6366F1",
  "#14B8A6", "#A855F7", "#D946EF", "#0EA5E9", "#10B981",
];

interface ScriptEntry {
  name: string;
  value: number;
}

export default function ScriptDistribution() {
  const [data, setData] = useState<ScriptEntry[]>([]);

  useEffect(() => {
    client
      .get<Record<string, number>>("/analytics/script-distribution")
      .then(({ data: resp }) => {
        const entries = Object.entries(resp);
        const top = entries.slice(0, 10);
        const other = entries.slice(10).reduce((sum, [, v]) => sum + v, 0);
        const formatted = top.map(([name, value]) => ({ name, value }));
        if (other > 0) formatted.push({ name: "Other", value: other });
        setData(formatted);
      })
      .catch(() => {});
  }, []);

  return (
    <ExportableChart title="Writing Scripts">
      <p className="text-sm text-gray-500 mb-3">Distribution of languages by writing system</p>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={110}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }: { name?: string; percent?: number }) =>
              (percent ?? 0) > 0.03 ? `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)` : ""
            }
            labelLine={false}
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
            formatter={(value: number | undefined) => [`${value ?? 0} languages`, "Count"]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => <span className="text-xs text-gray-600">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </ExportableChart>
  );
}
