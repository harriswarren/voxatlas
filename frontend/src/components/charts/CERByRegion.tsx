import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import client from "../../api/client";
import ExportableChart from "./ExportableChart";

interface RegionData {
  region: string;
  mean_cer: number;
  count: number;
}

export default function CERByRegion() {
  const [data, setData] = useState<RegionData[]>([]);

  useEffect(() => {
    client
      .get<{ regions: Record<string, { mean_cer: number; count: number }> }>("/analytics/cer-by-region")
      .then(({ data: resp }) => {
        const formatted = Object.entries(resp.regions)
          .map(([region, stats]) => ({
            region: region || "Unknown",
            mean_cer: parseFloat(stats.mean_cer.toFixed(1)),
            count: stats.count,
          }))
          .sort((a, b) => a.mean_cer - b.mean_cer);
        setData(formatted);
      })
      .catch(() => {});
  }, []);

  return (
    <ExportableChart title="CER by Region">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="region" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 12 }} label={{ value: "Mean CER %", angle: -90, position: "insideLeft", style: { fontSize: 12 } }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
            formatter={(value: number | undefined) => [
              `${value ?? 0}%`,
              "Mean CER",
            ]}
          />
          <Bar dataKey="mean_cer" fill="#0668E1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ExportableChart>
  );
}
