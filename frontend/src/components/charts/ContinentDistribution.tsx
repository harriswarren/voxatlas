import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";
import client from "../../api/client";
import ExportableChart from "./ExportableChart";

const COLORS: Record<string, string> = {
  Africa: "#F59E0B",
  Asia: "#EF4444",
  Europe: "#0668E1",
  "North America": "#22C55E",
  "South America": "#8B5CF6",
  Oceania: "#06B6D4",
  Unknown: "#94A3B8",
};

interface ContinentEntry {
  continent: string;
  count: number;
  mean_cer: number;
}

export default function ContinentDistribution() {
  const [data, setData] = useState<ContinentEntry[]>([]);

  useEffect(() => {
    client
      .get<Record<string, { count: number; mean_cer: number }>>("/analytics/continent-distribution")
      .then(({ data: resp }) => {
        setData(
          Object.entries(resp).map(([continent, stats]) => ({
            continent,
            count: stats.count,
            mean_cer: stats.mean_cer,
          }))
        );
      })
      .catch(() => {});
  }, []);

  return (
    <ExportableChart title="Languages by Continent">
      <p className="text-sm text-gray-500 mb-3">Count of languages per continent with mean CER</p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="continent" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
            content={({ payload }) => {
              if (!payload || payload.length === 0) return null;
              const item = payload[0]?.payload as ContinentEntry | undefined;
              if (!item) return null;
              return (
                <div className="bg-white p-2 rounded-lg border shadow-sm text-sm">
                  <p className="font-medium">{item.continent}</p>
                  <p>{item.count} languages</p>
                  <p>Mean CER: {item.mean_cer}%</p>
                </div>
              );
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={COLORS[entry.continent] || "#94A3B8"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ExportableChart>
  );
}
