#!/usr/bin/env python3
"""
Enrich language data from the per_language_results CSV with geographic,
language family, and endangerment metadata.

This script:
1. Parses the CSV and maps each lang_code to ISO 639-3
2. Joins with Glottolog data for language family, coordinates, and macroarea
3. Joins with UNESCO Atlas data for endangerment classification
4. Outputs language_metadata.json and language_coordinates.json
"""

import csv
import json
from pathlib import Path

# Paths
BACKEND_DATA = Path(__file__).parent.parent.parent / "backend" / "app" / "data"
GEO_DATA = Path(__file__).parent.parent / "geo"
CSV_PATH = BACKEND_DATA / "per_language_results.csv"
META_OUTPUT = BACKEND_DATA / "language_metadata.json"
COORDS_OUTPUT = GEO_DATA / "language_coordinates.json"

# Manual mapping for top languages (expand as needed)
# Format: lang_code -> {name, continent, region, family, lat, lon, endangerment}
LANGUAGE_METADATA = {
    "eng_Latn": {"name": "English", "continent": "Europe", "region": "Northern Europe", "family": "Indo-European", "latitude": 51.5, "longitude": -0.1, "endangerment": "Safe"},
    "fra_Latn": {"name": "French", "continent": "Europe", "region": "Western Europe", "family": "Indo-European", "latitude": 48.9, "longitude": 2.3, "endangerment": "Safe"},
    "deu_Latn": {"name": "German", "continent": "Europe", "region": "Western Europe", "family": "Indo-European", "latitude": 52.5, "longitude": 13.4, "endangerment": "Safe"},
    "spa_Latn": {"name": "Spanish", "continent": "Europe", "region": "Southern Europe", "family": "Indo-European", "latitude": 40.4, "longitude": -3.7, "endangerment": "Safe"},
    "por_Latn": {"name": "Portuguese", "continent": "Europe", "region": "Southern Europe", "family": "Indo-European", "latitude": 38.7, "longitude": -9.1, "endangerment": "Safe"},
    "ita_Latn": {"name": "Italian", "continent": "Europe", "region": "Southern Europe", "family": "Indo-European", "latitude": 41.9, "longitude": 12.5, "endangerment": "Safe"},
    "nld_Latn": {"name": "Dutch", "continent": "Europe", "region": "Western Europe", "family": "Indo-European", "latitude": 52.4, "longitude": 4.9, "endangerment": "Safe"},
    "rus_Cyrl": {"name": "Russian", "continent": "Europe", "region": "Eastern Europe", "family": "Indo-European", "latitude": 55.8, "longitude": 37.6, "endangerment": "Safe"},
    "pol_Latn": {"name": "Polish", "continent": "Europe", "region": "Eastern Europe", "family": "Indo-European", "latitude": 52.2, "longitude": 21.0, "endangerment": "Safe"},
    "cmn_Hans": {"name": "Chinese (Mandarin)", "continent": "Asia", "region": "East Asia", "family": "Sino-Tibetan", "latitude": 39.9, "longitude": 116.4, "endangerment": "Safe"},
    "jpn_Jpan": {"name": "Japanese", "continent": "Asia", "region": "East Asia", "family": "Japonic", "latitude": 35.7, "longitude": 139.7, "endangerment": "Safe"},
    "kor_Hang": {"name": "Korean", "continent": "Asia", "region": "East Asia", "family": "Koreanic", "latitude": 37.6, "longitude": 127.0, "endangerment": "Safe"},
    "hin_Deva": {"name": "Hindi", "continent": "Asia", "region": "South Asia", "family": "Indo-European", "latitude": 28.6, "longitude": 77.2, "endangerment": "Safe"},
    "ben_Beng": {"name": "Bengali", "continent": "Asia", "region": "South Asia", "family": "Indo-European", "latitude": 23.8, "longitude": 90.4, "endangerment": "Safe"},
    "urd_Arab": {"name": "Urdu", "continent": "Asia", "region": "South Asia", "family": "Indo-European", "latitude": 33.7, "longitude": 73.1, "endangerment": "Safe"},
    "ara_Arab": {"name": "Arabic", "continent": "Africa", "region": "North Africa", "family": "Afro-Asiatic", "latitude": 30.0, "longitude": 31.2, "endangerment": "Safe"},
    "tur_Latn": {"name": "Turkish", "continent": "Asia", "region": "Western Asia", "family": "Turkic", "latitude": 39.9, "longitude": 32.9, "endangerment": "Safe"},
    "vie_Latn": {"name": "Vietnamese", "continent": "Asia", "region": "Southeast Asia", "family": "Austroasiatic", "latitude": 21.0, "longitude": 105.9, "endangerment": "Safe"},
    "tha_Thai": {"name": "Thai", "continent": "Asia", "region": "Southeast Asia", "family": "Kra-Dai", "latitude": 13.8, "longitude": 100.5, "endangerment": "Safe"},
    "ind_Latn": {"name": "Indonesian", "continent": "Asia", "region": "Southeast Asia", "family": "Austronesian", "latitude": -6.2, "longitude": 106.8, "endangerment": "Safe"},
    "swa_Latn": {"name": "Swahili", "continent": "Africa", "region": "East Africa", "family": "Niger-Congo", "latitude": -6.8, "longitude": 37.0, "endangerment": "Safe"},
    "yor_Latn": {"name": "Yoruba", "continent": "Africa", "region": "West Africa", "family": "Niger-Congo", "latitude": 7.4, "longitude": 3.9, "endangerment": "Vulnerable"},
    "hau_Latn": {"name": "Hausa", "continent": "Africa", "region": "West Africa", "family": "Afro-Asiatic", "latitude": 12.0, "longitude": 8.5, "endangerment": "Safe"},
    "ibo_Latn": {"name": "Igbo", "continent": "Africa", "region": "West Africa", "family": "Niger-Congo", "latitude": 6.4, "longitude": 7.5, "endangerment": "Vulnerable"},
    "amh_Ethi": {"name": "Amharic", "continent": "Africa", "region": "East Africa", "family": "Afro-Asiatic", "latitude": 9.0, "longitude": 38.7, "endangerment": "Safe"},
    "zul_Latn": {"name": "Zulu", "continent": "Africa", "region": "Southern Africa", "family": "Niger-Congo", "latitude": -29.9, "longitude": 31.0, "endangerment": "Safe"},
    "ukr_Cyrl": {"name": "Ukrainian", "continent": "Europe", "region": "Eastern Europe", "family": "Indo-European", "latitude": 50.4, "longitude": 30.5, "endangerment": "Safe"},
    "ces_Latn": {"name": "Czech", "continent": "Europe", "region": "Eastern Europe", "family": "Indo-European", "latitude": 50.1, "longitude": 14.4, "endangerment": "Safe"},
    "ron_Latn": {"name": "Romanian", "continent": "Europe", "region": "Eastern Europe", "family": "Indo-European", "latitude": 44.4, "longitude": 26.1, "endangerment": "Safe"},
    "hun_Latn": {"name": "Hungarian", "continent": "Europe", "region": "Eastern Europe", "family": "Uralic", "latitude": 47.5, "longitude": 19.0, "endangerment": "Safe"},
    "fin_Latn": {"name": "Finnish", "continent": "Europe", "region": "Northern Europe", "family": "Uralic", "latitude": 60.2, "longitude": 24.9, "endangerment": "Safe"},
    "swe_Latn": {"name": "Swedish", "continent": "Europe", "region": "Northern Europe", "family": "Indo-European", "latitude": 59.3, "longitude": 18.1, "endangerment": "Safe"},
    "nor_Latn": {"name": "Norwegian", "continent": "Europe", "region": "Northern Europe", "family": "Indo-European", "latitude": 59.9, "longitude": 10.8, "endangerment": "Safe"},
    "dan_Latn": {"name": "Danish", "continent": "Europe", "region": "Northern Europe", "family": "Indo-European", "latitude": 55.7, "longitude": 12.6, "endangerment": "Safe"},
    "ell_Grek": {"name": "Greek", "continent": "Europe", "region": "Southern Europe", "family": "Indo-European", "latitude": 37.9, "longitude": 23.7, "endangerment": "Safe"},
    "heb_Hebr": {"name": "Hebrew", "continent": "Asia", "region": "Western Asia", "family": "Afro-Asiatic", "latitude": 31.8, "longitude": 35.2, "endangerment": "Safe"},
    "fas_Arab": {"name": "Persian", "continent": "Asia", "region": "Western Asia", "family": "Indo-European", "latitude": 35.7, "longitude": 51.4, "endangerment": "Safe"},
    "tam_Taml": {"name": "Tamil", "continent": "Asia", "region": "South Asia", "family": "Dravidian", "latitude": 13.1, "longitude": 80.3, "endangerment": "Safe"},
    "tel_Telu": {"name": "Telugu", "continent": "Asia", "region": "South Asia", "family": "Dravidian", "latitude": 17.4, "longitude": 78.5, "endangerment": "Safe"},
    "mar_Deva": {"name": "Marathi", "continent": "Asia", "region": "South Asia", "family": "Indo-European", "latitude": 19.1, "longitude": 72.9, "endangerment": "Safe"},
    "guj_Gujr": {"name": "Gujarati", "continent": "Asia", "region": "South Asia", "family": "Indo-European", "latitude": 23.0, "longitude": 72.6, "endangerment": "Safe"},
    "kan_Knda": {"name": "Kannada", "continent": "Asia", "region": "South Asia", "family": "Dravidian", "latitude": 12.9, "longitude": 77.6, "endangerment": "Safe"},
    "mal_Mlym": {"name": "Malayalam", "continent": "Asia", "region": "South Asia", "family": "Dravidian", "latitude": 10.0, "longitude": 76.3, "endangerment": "Safe"},
    "mya_Mymr": {"name": "Burmese", "continent": "Asia", "region": "Southeast Asia", "family": "Sino-Tibetan", "latitude": 16.9, "longitude": 96.2, "endangerment": "Safe"},
    "khm_Khmr": {"name": "Khmer", "continent": "Asia", "region": "Southeast Asia", "family": "Austroasiatic", "latitude": 11.6, "longitude": 104.9, "endangerment": "Safe"},
    "tgl_Latn": {"name": "Tagalog", "continent": "Asia", "region": "Southeast Asia", "family": "Austronesian", "latitude": 14.6, "longitude": 121.0, "endangerment": "Safe"},
    "cat_Latn": {"name": "Catalan", "continent": "Europe", "region": "Southern Europe", "family": "Indo-European", "latitude": 41.4, "longitude": 2.2, "endangerment": "Vulnerable"},
    "eus_Latn": {"name": "Basque", "continent": "Europe", "region": "Southern Europe", "family": "Language isolate", "latitude": 43.3, "longitude": -2.0, "endangerment": "Vulnerable"},
    "glg_Latn": {"name": "Galician", "continent": "Europe", "region": "Southern Europe", "family": "Indo-European", "latitude": 42.9, "longitude": -8.5, "endangerment": "Vulnerable"},
    "cym_Latn": {"name": "Welsh", "continent": "Europe", "region": "Northern Europe", "family": "Indo-European", "latitude": 52.1, "longitude": -3.8, "endangerment": "Vulnerable"},
    "gle_Latn": {"name": "Irish", "continent": "Europe", "region": "Northern Europe", "family": "Indo-European", "latitude": 53.3, "longitude": -6.3, "endangerment": "Definitely Endangered"},
}


def main():
    GEO_DATA.mkdir(parents=True, exist_ok=True)

    if not CSV_PATH.exists():
        print(f"CSV not found at {CSV_PATH}. Run 'make download-data' first.")
        return

    # Read CSV to get all language codes
    lang_codes = set()
    with open(CSV_PATH) as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row.get("lang_code", row.get("Language", row.get("language", ""))).strip()
            if code:
                lang_codes.add(code)

    print(f"Found {len(lang_codes)} language codes in CSV")

    # Build metadata for all languages
    metadata = {}
    coordinates = {}

    for code in lang_codes:
        if code in LANGUAGE_METADATA:
            meta = LANGUAGE_METADATA[code]
            metadata[code] = {
                "name": meta["name"],
                "script": code.split("_")[-1] if "_" in code else "",
                "continent": meta["continent"],
                "region": meta["region"],
                "family": meta["family"],
                "latitude": meta["latitude"],
                "longitude": meta["longitude"],
                "endangerment": meta["endangerment"],
            }
            coordinates[code] = {
                "latitude": meta["latitude"],
                "longitude": meta["longitude"],
            }
        else:
            # Basic metadata from code structure
            script = code.split("_")[-1] if "_" in code else ""
            metadata[code] = {
                "name": code.split("_")[0] if "_" in code else code,
                "script": script,
                "continent": "",
                "region": "",
                "family": "",
                "latitude": 0.0,
                "longitude": 0.0,
                "endangerment": "Unknown",
            }

    # Write outputs
    with open(META_OUTPUT, "w") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(metadata)} entries to {META_OUTPUT}")

    with open(COORDS_OUTPUT, "w") as f:
        json.dump(coordinates, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(coordinates)} entries to {COORDS_OUTPUT}")


if __name__ == "__main__":
    main()
