import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";
import client from "../../api/client";
import ExportableChart from "./ExportableChart";

interface BucketData {
  name: string;
  count: number;
  isUnder10: boolean;
}

export default function CERHistogram() {
  const [data, setData] = useState<BucketData[]>([]);

  useEffect(() => {
    client
      .get<{ buckets: Record<string, number> }>("/analytics/cer-distribution")
      .then(({ data: resp }) => {
        const bucketOrder = ["0-5", "5-10", "10-15", "15-20", "20-30", "30-50", "50+"];
        const formatted = bucketOrder.map((key) => ({
          name: `${key}%`,
          count: resp.buckets[key] || 0,
          isUnder10: key === "0-5" || key === "5-10",
        }));
        setData(formatted);
      })
      .catch(() => {});
  }, []);

  const totalUnder10 = data.filter((d) => d.isUnder10).reduce((s, d) => s + d.count, 0);
  const total = data.reduce((s, d) => s + d.count, 0);
  const pct = total > 0 ? ((totalUnder10 / total) * 100).toFixed(0) : "0";

  return (
    <ExportableChart title="CER Distribution">
      <p className="text-sm text-gray-500 mb-4">
        <span className="font-semibold text-green-600">{pct}%</span> of languages achieve {"<"} 10% CER
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
            formatter={(value: number | undefined) => [`${value ?? 0} languages`, "Count"]}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.isUnder10 ? "#22C55E" : "#F59E0B"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ExportableChart>
  );
}
