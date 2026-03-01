import { useState } from "react";
import { transcribe, compareModels, type TranscribeResult, type CompareResult } from "../api/transcription";

export function useTranscription() {
  const [result, setResult] = useState<TranscribeResult | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTranscription = async (langCode: string, modelCard?: string, sampleIdx?: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await transcribe(langCode, modelCard, sampleIdx);
      setResult(res);
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transcription failed";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const runComparison = async (langCode: string, sampleIdx?: number, modelCards?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await compareModels(langCode, sampleIdx, modelCards);
      setCompareResult(res);
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Comparison failed";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { result, compareResult, loading, error, runTranscription, runComparison };
}
