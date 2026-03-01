import { formatCER, formatLatency } from "../../utils/formatters";
import { cerToColor } from "../../utils/constants";
import type { TranscribeResult } from "../../api/transcription";

interface ModelComparisonProps {
  results: TranscribeResult[];
  loading?: boolean;
}

export default function ModelComparison({ results, loading }: ModelComparisonProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm animate-pulse">
        <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
        <div className="h-40 bg-gray-100 rounded" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm text-center text-gray-400">
        Run a model comparison to see results side by side
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Model Comparison</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-gray-500 font-medium">Model</th>
              <th className="text-left py-2 px-3 text-gray-500 font-medium">Transcription</th>
              <th className="text-right py-2 px-3 text-gray-500 font-medium">CER</th>
              <th className="text-right py-2 px-3 text-gray-500 font-medium">Latency</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.model_card} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-3 px-3 font-medium text-gray-800">{r.model_card}</td>
                <td className="py-3 px-3 text-gray-600 font-mono text-xs max-w-[300px] truncate">
                  {r.prediction}
                </td>
                <td className="py-3 px-3 text-right">
                  <span
                    className="px-2 py-0.5 rounded-full text-white text-xs font-bold"
                    style={{ backgroundColor: cerToColor(r.cer) }}
                  >
                    {formatCER(r.cer)}
                  </span>
                </td>
                <td className="py-3 px-3 text-right text-gray-600">{formatLatency(r.latency_ms)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
