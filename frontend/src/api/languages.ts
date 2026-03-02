import client from "./client";

export interface Language {
  lang_code: string;
  language_name: string;
  script: string;
  region: string;
  continent: string;
  family: string;
  latitude: number;
  longitude: number;
  training_hours: number;
  cer_7b_llm: number;
  cer_7b_ctc: number;
  endangerment: string;
}

export interface LanguageListResponse {
  total: number;
  page: number;
  page_size: number;
  languages: Language[];
}

export interface LanguageDetail extends Language {
  cer_by_model: Record<string, number>;
}

export interface LanguageFilters {
  region?: string;
  script?: string;
  cer_max?: number;
  endangered?: string;
  search?: string;
  sort_by?: string;
  sort_desc?: boolean;
  page?: number;
  page_size?: number;
}

export async function getLanguages(filters: LanguageFilters = {}): Promise<LanguageListResponse> {
  const params = new URLSearchParams();
  if (filters.region) params.set("region", filters.region);
  if (filters.script) params.set("script", filters.script);
  if (filters.cer_max !== undefined) params.set("cer_max", String(filters.cer_max));
  if (filters.endangered) params.set("endangered", filters.endangered);
  if (filters.search) params.set("search", filters.search);
  if (filters.sort_by) params.set("sort_by", filters.sort_by);
  if (filters.sort_desc) params.set("sort_desc", "true");
  if (filters.page) params.set("page", String(filters.page));
  if (filters.page_size) params.set("page_size", String(filters.page_size));

  const { data } = await client.get<LanguageListResponse>(`/languages?${params.toString()}`);
  return data;
}

export async function getLanguage(code: string): Promise<LanguageDetail> {
  const { data } = await client.get<LanguageDetail>(`/languages/${code}`);
  return data;
}

export interface MapPoint {
  lang_code: string;
  language_name: string;
  latitude: number;
  longitude: number;
  cer: number;
  endangerment: string;
  continent: string;
  training_hours: number;
}

export async function getMapPoints(): Promise<MapPoint[]> {
  const { data } = await client.get<MapPoint[]>("/languages/map-points");
  return data;
}

export async function getScripts(): Promise<string[]> {
  const { data } = await client.get<string[]>("/languages/scripts");
  return data;
}

export async function getContinents(): Promise<string[]> {
  const { data } = await client.get<string[]>("/languages/continents");
  return data;
}
