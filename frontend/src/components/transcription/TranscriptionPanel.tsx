import { formatCER, formatLatency } from "../../utils/formatters";
import { cerToColor } from "../../utils/constants";
import type { TranscribeResult } from "../../api/transcription";

interface TranscriptionPanelProps {
  result: TranscribeResult | null;
  loading?: boolean;
}

export default function TranscriptionPanel({ result, loading }: TranscriptionPanelProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="h-20 bg-gray-100 rounded mb-4" />
        <div className="h-20 bg-gray-100 rounded" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm text-center text-gray-400">
        Select a language and run transcription to see results
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Transcription Result</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">
            Model: <span className="font-medium text-gray-800">{result.model_card}</span>
          </span>
          <span className="text-gray-500">
            Latency: <span className="font-medium text-gray-800">{formatLatency(result.latency_ms)}</span>
          </span>
          <span
            className="px-2.5 py-1 rounded-full text-white text-xs font-bold"
            style={{ backgroundColor: cerToColor(result.cer) }}
          >
            CER: {formatCER(result.cer)}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Ground Truth
          </label>
          <div className="p-3 bg-green-50 rounded-lg text-sm text-gray-800 border border-green-100 font-mono">
            {result.ground_truth || <span className="text-gray-400 italic">Not available</span>}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            Prediction
          </label>
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-gray-800 border border-blue-100 font-mono">
            {result.prediction}
          </div>
        </div>
      </div>
    </div>
  );
}
