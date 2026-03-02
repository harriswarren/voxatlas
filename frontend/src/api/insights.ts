import client from "./client";

export interface InsightResponse {
  answer: string;
}

export async function askVoxAtlas(question: string, context: Record<string, unknown> = {}): Promise<InsightResponse> {
  const { data } = await client.post<InsightResponse>("/insights/ask", {
    question,
    context,
  });
  return data;
}

export async function getSummary(): Promise<InsightResponse> {
  const { data } = await client.get<InsightResponse>("/insights/summary");
  return data;
}

export interface ProviderInfo {
  available: boolean;
  provider: string;
  provider_name: string;
  model: string;
}

export async function getProviderInfo(): Promise<ProviderInfo> {
  const { data } = await client.get<ProviderInfo>("/insights/provider");
  return data;
}
