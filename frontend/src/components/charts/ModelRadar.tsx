import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from "recharts";
import ExportableChart from "./ExportableChart";
import type { TranscribeResult } from "../../api/transcription";

interface ModelRadarProps {
  results: TranscribeResult[];
}

export default function ModelRadar({ results }: ModelRadarProps) {
  if (results.length === 0) return null;

  const maxCER = Math.max(...results.map((r) => r.cer), 1);
  const maxLatency = Math.max(...results.map((r) => r.latency_ms), 1);

  const data = [
    { metric: "Accuracy", ...Object.fromEntries(results.map((r) => [r.model_card, Math.max(0, 100 - (r.cer / maxCER) * 100)])) },
    { metric: "Speed", ...Object.fromEntries(results.map((r) => [r.model_card, Math.max(0, 100 - (r.latency_ms / maxLatency) * 100)])) },
  ];

  const colors = ["#0668E1", "#22C55E", "#F59E0B", "#EF4444"];

  return (
    <ExportableChart title="Model Comparison Radar">
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} />
          {results.map((r, i) => (
            <Radar
              key={r.model_card}
              name={r.model_card}
              dataKey={r.model_card}
              stroke={colors[i % colors.length]}
              fill={colors[i % colors.length]}
              fillOpacity={0.15}
            />
          ))}
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </ExportableChart>
  );
}
