import client from "./client";

export interface TranscribeResult {
  lang_code: string;
  model_card: string;
  prediction: string;
  ground_truth: string;
  cer: number;
  latency_ms: number;
}

export interface CompareResult {
  lang_code: string;
  results: TranscribeResult[];
}

export async function transcribe(
  langCode: string,
  modelCard: string = "omniASR_CTC_1B_v2",
  sampleIdx: number = 0
): Promise<TranscribeResult> {
  const { data } = await client.post<TranscribeResult>("/transcribe", {
    lang_code: langCode,
    model_card: modelCard,
    sample_idx: sampleIdx,
  });
  return data;
}

export async function compareModels(
  langCode: string,
  sampleIdx: number = 0,
  modelCards?: string[]
): Promise<CompareResult> {
  const { data } = await client.post<CompareResult>("/transcribe/compare", {
    lang_code: langCode,
    sample_idx: sampleIdx,
    ...(modelCards ? { model_cards: modelCards } : {}),
  });
  return data;
}

export function getAudioUrl(langCode: string, sampleIdx: number = 0): string {
  return `/api/v1/transcribe/audio/${langCode}?sample_idx=${sampleIdx}`;
}
