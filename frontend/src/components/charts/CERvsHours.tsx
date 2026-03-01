import { useEffect, useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import client from "../../api/client";
import ExportableChart from "./ExportableChart";
import { cerToColor } from "../../utils/constants";

interface ScatterPoint {
  lang_code: string;
  language_name: string;
  cer: number;
  hours: number;
  continent: string;
}

export default function CERvsHours() {
  const [data, setData] = useState<ScatterPoint[]>([]);

  useEffect(() => {
    client
      .get<ScatterPoint[]>("/analytics/cer-vs-hours")
      .then(({ data: resp }) => setData(resp))
      .catch(() => {});
  }, []);

  return (
    <ExportableChart title="CER vs Training Hours">
      <p className="text-sm text-gray-500 mb-4">Does more training data correlate with lower CER?</p>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="hours"
            type="number"
            scale="log"
            domain={["auto", "auto"]}
            tick={{ fontSize: 12 }}
            label={{ value: "Training Hours (log)", position: "insideBottom", offset: -5, style: { fontSize: 12 } }}
          />
          <YAxis
            dataKey="cer"
            type="number"
            tick={{ fontSize: 12 }}
            label={{ value: "CER %", angle: -90, position: "insideLeft", style: { fontSize: 12 } }}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
            content={({ payload }) => {
              if (!payload || payload.length === 0) return null;
              const point = payload[0]?.payload as ScatterPoint;
              if (!point) return null;
              return (
                <div className="bg-white p-2 rounded-lg border shadow-sm text-sm">
                  <p className="font-medium">{point.language_name || point.lang_code}</p>
                  <p>CER: {point.cer.toFixed(1)}%</p>
                  <p>Hours: {point.hours.toFixed(1)}</p>
                  <p className="text-gray-400">{point.continent}</p>
                </div>
              );
            }}
          />
          <Scatter
            data={data}
            fill="#0668E1"
            shape={((props: { cx?: number; cy?: number; payload?: ScatterPoint }) => (
              <circle
                cx={props.cx ?? 0}
                cy={props.cy ?? 0}
                r={4}
                fill={props.payload ? cerToColor(props.payload.cer) : "#0668E1"}
                fillOpacity={0.7}
                stroke="white"
                strokeWidth={0.5}
              />
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            )) as any}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </ExportableChart>
  );
}
