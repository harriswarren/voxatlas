export const COLORS = {
  metaBlue: "#0668E1",
  metaDark: "#1A1A2E",
  accent: "#16537E",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  bgLight: "#F8FAFC",
  bgCard: "#FFFFFF",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
};

export const CER_COLORS = {
  excellent: "#22C55E",   // CER 0-5
  good: "#84CC16",        // CER 5-10
  moderate: "#F59E0B",    // CER 10-20
  poor: "#F97316",        // CER 20-30
  bad: "#EF4444",         // CER 30+
};

export const MODEL_OPTIONS = [
  { value: "omniASR_CTC_300M_v2", label: "CTC 300M v2", vram: "2 GB", speed: "96x" },
  { value: "omniASR_CTC_1B_v2", label: "CTC 1B v2", vram: "3 GB", speed: "48x" },
  { value: "omniASR_LLM_1B_v2", label: "LLM 1B v2", vram: "6 GB", speed: "~1x" },
  { value: "omniASR_LLM_7B_v2", label: "LLM 7B v2", vram: "17 GB", speed: "~1x" },
];

export const ENDANGERMENT_LEVELS = [
  "Not Endangered",
  "Threatened",
  "Shifting",
  "Moribund",
  "Nearly Extinct",
  "Extinct",
  "Unknown",
];

export function endangermentStyle(status: string): { bg: string; color: string } {
  switch (status) {
    case "Not Endangered":
      return { bg: "#dcfce7", color: "#166534" };
    case "Threatened":
      return { bg: "#fef9c3", color: "#854d0e" };
    case "Shifting":
      return { bg: "#fef3c7", color: "#92400e" };
    case "Moribund":
      return { bg: "#fed7aa", color: "#9a3412" };
    case "Nearly Extinct":
      return { bg: "#fecaca", color: "#991b1b" };
    case "Extinct":
      return { bg: "#e2e8f0", color: "#475569" };
    default:
      return { bg: "#f1f5f9", color: "#64748b" };
  }
}

export const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export function cerToColor(cer: number): string {
  if (cer <= 5) return CER_COLORS.excellent;
  if (cer <= 10) return CER_COLORS.good;
  if (cer <= 20) return CER_COLORS.moderate;
  if (cer <= 30) return CER_COLORS.poor;
  return CER_COLORS.bad;
}

export function cerToBucket(cer: number): string {
  if (cer <= 5) return "0-5%";
  if (cer <= 10) return "5-10%";
  if (cer <= 20) return "10-20%";
  if (cer <= 30) return "20-30%";
  return "30%+";
}
