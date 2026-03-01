import { useState, useEffect, useCallback } from "react";
import { getLanguages, getScripts, getContinents, type LanguageFilters, type LanguageListResponse } from "../api/languages";

export function useLanguages(initialFilters: LanguageFilters = {}) {
  const [data, setData] = useState<LanguageListResponse | null>(null);
  const [filters, setFilters] = useState<LanguageFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLanguages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getLanguages(filters);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch languages");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLanguages();
  }, [fetchLanguages]);

  return { data, filters, setFilters, loading, error, refetch: fetchLanguages };
}

export function useFilterOptions() {
  const [scripts, setScripts] = useState<string[]>([]);
  const [continents, setContinents] = useState<string[]>([]);

  useEffect(() => {
    getScripts().then(setScripts).catch(() => {});
    getContinents().then(setContinents).catch(() => {});
  }, []);

  return { scripts, continents };
}
