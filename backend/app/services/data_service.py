import csv
import json
from pathlib import Path
from dataclasses import dataclass, field


@dataclass
class LanguageData:
    lang_code: str
    language_name: str = ""
    script: str = ""
    region: str = ""
    continent: str = ""
    family: str = ""
    latitude: float = 0.0
    longitude: float = 0.0
    training_hours: float = 0.0
    cer_7b_llm: float = 0.0
    cer_7b_ctc: float = 0.0
    endangerment: str = "Unknown"
    cer_by_model: dict = field(default_factory=dict)


class DataService:
    def __init__(self):
        self.languages: dict[str, LanguageData] = {}
        self.data_dir = Path(__file__).parent.parent / "data"

    def load_data(self):
        # 1. Load per-language results CSV
        csv_path = self.data_dir / "per_language_results.csv"
        if csv_path.exists():
            with open(csv_path) as f:
                reader = csv.DictReader(f)
                for row in reader:
                    code = row.get("lang_code", row.get("Language", row.get("language", ""))).strip()
                    if not code:
                        continue
                    cer_val = 0.0
                    for key in ("CER", "cer", "cer_7b_llm"):
                        if key in row and row[key]:
                            try:
                                cer_val = float(row[key])
                            except ValueError:
                                pass
                            break
                    hours_val = 0.0
                    for key in ("Training Hours", "hours", "train_hours", "training_hours"):
                        if key in row and row[key]:
                            try:
                                hours_val = float(row[key])
                            except ValueError:
                                pass
                            break
                    script = ""
                    if "_" in code:
                        script = code.split("_")[-1]
                    self.languages[code] = LanguageData(
                        lang_code=code,
                        cer_7b_llm=cer_val,
                        training_hours=hours_val,
                        script=script,
                    )

        # 2. Load enriched metadata if available
        meta_path = self.data_dir / "language_metadata.json"
        if meta_path.exists():
            with open(meta_path) as f:
                metadata = json.load(f)
            for code, meta in metadata.items():
                if code in self.languages:
                    lang = self.languages[code]
                    lang.language_name = meta.get("name", "")
                    lang.script = meta.get("script", lang.script)
                    lang.region = meta.get("region", "")
                    lang.continent = meta.get("continent", "")
                    lang.family = meta.get("family", "")
                    lang.latitude = meta.get("latitude", 0.0)
                    lang.longitude = meta.get("longitude", 0.0)
                    lang.endangerment = meta.get("endangerment", "Unknown")

        # 3. Load endangerment data if available
        endanger_path = self.data_dir / "endangerment_status.json"
        if endanger_path.exists():
            with open(endanger_path) as f:
                endangerment = json.load(f)
            for code, status in endangerment.items():
                if code in self.languages:
                    self.languages[code].endangerment = status

    def get_all_languages(
        self,
        region: str | None = None,
        script: str | None = None,
        cer_max: float | None = None,
        endangered: str | None = None,
        search: str | None = None,
        sort_by: str = "lang_code",
        sort_desc: bool = False,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[LanguageData], int]:
        results = list(self.languages.values())
        if region:
            results = [lang for lang in results if lang.continent.lower() == region.lower()]
        if script:
            results = [lang for lang in results if lang.script.lower() == script.lower()]
        if cer_max is not None:
            results = [lang for lang in results if lang.cer_7b_llm <= cer_max]
        if endangered:
            results = [lang for lang in results if lang.endangerment.lower() == endangered.lower()]
        if search:
            q = search.lower()
            results = [
                lang
                for lang in results
                if q in lang.lang_code.lower()
                or q in lang.language_name.lower()
                or q in lang.family.lower()
            ]

        # Sort
        sort_key = lambda lang: getattr(lang, sort_by, "")
        try:
            results.sort(key=sort_key, reverse=sort_desc)
        except TypeError:
            pass

        total = len(results)

        # Paginate
        start = (page - 1) * page_size
        end = start + page_size
        return results[start:end], total

    def get_language(self, lang_code: str) -> LanguageData | None:
        return self.languages.get(lang_code)

    def get_cer_distribution(self) -> dict[str, int]:
        buckets = {"0-5": 0, "5-10": 0, "10-15": 0, "15-20": 0, "20-30": 0, "30-50": 0, "50+": 0}
        for lang in self.languages.values():
            cer = lang.cer_7b_llm
            if cer <= 5:
                buckets["0-5"] += 1
            elif cer <= 10:
                buckets["5-10"] += 1
            elif cer <= 15:
                buckets["10-15"] += 1
            elif cer <= 20:
                buckets["15-20"] += 1
            elif cer <= 30:
                buckets["20-30"] += 1
            elif cer <= 50:
                buckets["30-50"] += 1
            else:
                buckets["50+"] += 1
        return buckets

    def get_cer_by_region(self) -> dict[str, dict[str, float]]:
        region_cers: dict[str, list[float]] = {}
        for lang in self.languages.values():
            continent = lang.continent or "Unknown"
            if continent not in region_cers:
                region_cers[continent] = []
            region_cers[continent].append(lang.cer_7b_llm)
        result = {}
        for region, cers in region_cers.items():
            result[region] = {
                "mean_cer": sum(cers) / len(cers) if cers else 0,
                "median_cer": sorted(cers)[len(cers) // 2] if cers else 0,
                "count": len(cers),
                "pct_under_10": sum(1 for c in cers if c < 10) / len(cers) * 100 if cers else 0,
            }
        return result

    def get_cer_vs_hours(self) -> list[dict]:
        return [
            {
                "lang_code": lang.lang_code,
                "language_name": lang.language_name,
                "cer": lang.cer_7b_llm,
                "hours": lang.training_hours,
                "continent": lang.continent,
            }
            for lang in self.languages.values()
            if lang.training_hours > 0
        ]

    def get_summary_stats(self) -> dict:
        cers = [lang.cer_7b_llm for lang in self.languages.values() if lang.cer_7b_llm > 0]
        return {
            "total_languages": len(self.languages),
            "mean_cer": round(sum(cers) / len(cers), 2) if cers else 0,
            "median_cer": round(sorted(cers)[len(cers) // 2], 2) if cers else 0,
            "pct_under_10": round(sum(1 for c in cers if c < 10) / len(cers) * 100, 1) if cers else 0,
            "total_training_hours": round(sum(lang.training_hours for lang in self.languages.values()), 1),
            "min_cer": round(min(cers), 2) if cers else 0,
            "max_cer": round(max(cers), 2) if cers else 0,
        }

    def get_top_bottom_languages(self, n: int = 20) -> dict:
        langs = [lang for lang in self.languages.values() if lang.cer_7b_llm > 0]
        sorted_langs = sorted(langs, key=lambda x: x.cer_7b_llm)
        return {
            "best": [
                {"lang_code": l.lang_code, "language_name": l.language_name, "cer": l.cer_7b_llm}
                for l in sorted_langs[:n]
            ],
            "worst": [
                {"lang_code": l.lang_code, "language_name": l.language_name, "cer": l.cer_7b_llm}
                for l in sorted_langs[-n:][::-1]
            ],
        }

    def get_unique_scripts(self) -> list[str]:
        scripts = set()
        for lang in self.languages.values():
            if lang.script:
                scripts.add(lang.script)
        return sorted(scripts)

    def get_unique_continents(self) -> list[str]:
        continents = set()
        for lang in self.languages.values():
            if lang.continent:
                continents.add(lang.continent)
        return sorted(continents)
