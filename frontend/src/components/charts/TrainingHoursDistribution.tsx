import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";
import client from "../../api/client";
import ExportableChart from "./ExportableChart";

const COLORS = ["#EF4444", "#F97316", "#F59E0B", "#84CC16", "#22C55E", "#0668E1", "#8B5CF6"];

interface BucketEntry {
  name: string;
  count: number;
}

export default function TrainingHoursDistribution() {
  const [data, setData] = useState<BucketEntry[]>([]);

  useEffect(() => {
    client
      .get<Record<string, number>>("/analytics/training-hours-distribution")
      .then(({ data: resp }) => {
        const order = ["0", "0-1", "1-10", "10-100", "100-1K", "1K-10K", "10K+"];
        setData(order.map((key) => ({ name: `${key} hrs`, count: resp[key] || 0 })));
      })
      .catch(() => {});
  }, []);

  return (
    <ExportableChart title="Training Data Availability">
      <p className="text-sm text-gray-500 mb-3">How much training data exists per language?</p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
            formatter={(value: number | undefined) => [`${value ?? 0} languages`, "Count"]}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ExportableChart>
  );
}
