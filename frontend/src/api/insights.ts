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
