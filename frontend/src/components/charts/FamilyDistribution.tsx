import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import client from "../../api/client";
import ExportableChart from "./ExportableChart";

interface FamilyEntry {
  family: string;
  count: number;
}

export default function FamilyDistribution() {
  const [data, setData] = useState<FamilyEntry[]>([]);

  useEffect(() => {
    client
      .get<Record<string, number>>("/analytics/family-distribution")
      .then(({ data: resp }) => {
        setData(
          Object.entries(resp).map(([family, count]) => ({ family, count }))
        );
      })
      .catch(() => {});
  }, []);

  return (
    <ExportableChart title="Language Families">
      <p className="text-sm text-gray-500 mb-3">Top language families by number of languages</p>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, bottom: 5, left: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            dataKey="family"
            type="category"
            tick={{ fontSize: 11 }}
            width={95}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
            formatter={(value: number | undefined) => [`${value ?? 0} languages`, "Count"]}
          />
          <Bar dataKey="count" fill="#0668E1" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ExportableChart>
  );
}
