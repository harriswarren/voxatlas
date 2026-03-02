#!/usr/bin/env python3
"""
Enrich language data from the per_language_results CSV with geographic
coordinates and full language names.

Data sources:
1. Glottolog resourcemap (https://glottolog.org/resourcemap.json?rsc=language)
   - Maps ISO 639-3 codes to language names and lat/lon coordinates
2. SIL ISO 639-3 code table (https://iso639-3.sil.org)
   - Fallback for language names not in Glottolog

Usage:
    # First, download the reference data:
    curl -sL "https://glottolog.org/resourcemap.json?rsc=language" -o /tmp/glottolog_languages.json
    curl -sL "https://iso639-3.sil.org/sites/iso639-3/files/downloads/iso-639-3.tab" -o /tmp/iso-639-3.tab

    # Then run:
    python data/scripts/enrich_languages.py
"""

import csv
import json
import sys
import urllib.request
from pathlib import Path

# Paths
BACKEND_DATA = Path(__file__).parent.parent.parent / "backend" / "app" / "data"
GEO_DATA = Path(__file__).parent.parent / "geo"
CSV_PATH = BACKEND_DATA / "per_language_results.csv"
META_OUTPUT = BACKEND_DATA / "language_metadata.json"
COORDS_OUTPUT = GEO_DATA / "language_coordinates.json"

GLOTTOLOG_URL = "https://glottolog.org/resourcemap.json?rsc=language"
SIL_URL = "https://iso639-3.sil.org/sites/iso639-3/files/downloads/iso-639-3.tab"
GLOTTOLOG_CACHE = Path("/tmp/glottolog_languages.json")
SIL_CACHE = Path("/tmp/iso-639-3.tab")

# Manual overrides for well-known languages (continent, region, family, endangerment)
MANUAL_OVERRIDES = {
    "eng_Latn": {"continent": "Europe", "region": "Northern Europe", "family": "Indo-European", "endangerment": "Safe"},
    "fra_Latn": {"continent": "Europe", "region": "Western Europe", "family": "Indo-European", "endangerment": "Safe"},
    "deu_Latn": {"continent": "Europe", "region": "Western Europe", "family": "Indo-European", "endangerment": "Safe"},
    "spa_Latn": {"continent": "Europe", "region": "Southern Europe", "family": "Indo-European", "endangerment": "Safe"},
    "por_Latn": {"continent": "Europe", "region": "Southern Europe", "family": "Indo-European", "endangerment": "Safe"},
    "ita_Latn": {"continent": "Europe", "region": "Southern Europe", "family": "Indo-European", "endangerment": "Safe"},
    "rus_Cyrl": {"continent": "Europe", "region": "Eastern Europe", "family": "Indo-European", "endangerment": "Safe"},
    "cmn_Hans": {"continent": "Asia", "region": "East Asia", "family": "Sino-Tibetan", "endangerment": "Safe"},
    "jpn_Jpan": {"continent": "Asia", "region": "East Asia", "family": "Japonic", "endangerment": "Safe"},
    "kor_Hang": {"continent": "Asia", "region": "East Asia", "family": "Koreanic", "endangerment": "Safe"},
    "hin_Deva": {"continent": "Asia", "region": "South Asia", "family": "Indo-European", "endangerment": "Safe"},
    "ara_Arab": {"continent": "Africa", "region": "North Africa", "family": "Afro-Asiatic", "endangerment": "Safe"},
    "swa_Latn": {"continent": "Africa", "region": "East Africa", "family": "Niger-Congo", "endangerment": "Safe"},
    "tur_Latn": {"continent": "Asia", "region": "Western Asia", "family": "Turkic", "endangerment": "Safe"},
    "vie_Latn": {"continent": "Asia", "region": "Southeast Asia", "family": "Austroasiatic", "endangerment": "Safe"},
    "ind_Latn": {"continent": "Asia", "region": "Southeast Asia", "family": "Austronesian", "endangerment": "Safe"},
    "tha_Thai": {"continent": "Asia", "region": "Southeast Asia", "family": "Kra-Dai", "endangerment": "Safe"},
}


def download_if_missing(url: str, path: Path) -> Path:
    """Download a file if it doesn't exist in the cache location."""
    if path.exists():
        print(f"  Using cached {path}")
        return path
    print(f"  Downloading {url} ...")
    urllib.request.urlretrieve(url, path)
    print(f"  Saved to {path}")
    return path


def load_glottolog(path: Path) -> dict[str, dict]:
    """Build ISO 639-3 -> {name, lat, lon} mapping from Glottolog."""
    with open(path) as f:
        data = json.load(f)
    iso_map = {}
    for r in data.get("resources", []):
        for ident in r.get("identifiers", []):
            if ident.get("type") == "iso639-3":
                iso_map[ident["identifier"]] = {
                    "name": r["name"],
                    "lat": r.get("latitude"),
                    "lon": r.get("longitude"),
                }
    return iso_map


def load_sil_names(path: Path) -> dict[str, str]:
    """Build ISO 639-3 -> reference name mapping from SIL table."""
    names = {}
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            code = row.get("Id", "").strip()
            name = row.get("Ref_Name", "").strip()
            if code and name:
                names[code] = name
    return names


def main():
    GEO_DATA.mkdir(parents=True, exist_ok=True)

    if not CSV_PATH.exists():
        print(f"CSV not found at {CSV_PATH}. Run 'make download-data' first.")
        sys.exit(1)

    # Download reference data
    print("Loading reference data...")
    glotto_path = download_if_missing(GLOTTOLOG_URL, GLOTTOLOG_CACHE)
    sil_path = download_if_missing(SIL_URL, SIL_CACHE)

    iso_glotto = load_glottolog(glotto_path)
    sil_names = load_sil_names(sil_path)
    print(f"  Glottolog: {len(iso_glotto)} ISO entries, SIL: {len(sil_names)} names")

    # Read CSV
    lang_codes = []
    with open(CSV_PATH) as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row.get("lang_code", row.get("Language", row.get("language", ""))).strip()
            if code:
                lang_codes.append(code)

    print(f"Found {len(lang_codes)} language codes in CSV")

    # Build enriched metadata
    metadata = {}
    coordinates = {}
    stats = {"names": 0, "coords": 0}

    for code in lang_codes:
        iso3 = code.split("_")[0] if "_" in code else code
        script = code.split("_")[-1] if "_" in code else ""

        # Language name: Glottolog > SIL > ISO code
        name = ""
        if iso3 in iso_glotto:
            name = iso_glotto[iso3]["name"]
        if not name and iso3 in sil_names:
            name = sil_names[iso3]
        if name:
            stats["names"] += 1

        # Coordinates from Glottolog
        lat, lon = 0.0, 0.0
        if iso3 in iso_glotto and iso_glotto[iso3]["lat"] is not None:
            lat = iso_glotto[iso3]["lat"]
            lon = iso_glotto[iso3]["lon"]
            stats["coords"] += 1

        # Manual overrides
        manual = MANUAL_OVERRIDES.get(code, {})

        metadata[code] = {
            "name": name or iso3,
            "script": script,
            "continent": manual.get("continent", ""),
            "region": manual.get("region", ""),
            "family": manual.get("family", ""),
            "latitude": lat,
            "longitude": lon,
            "endangerment": manual.get("endangerment", "Unknown"),
        }

        if lat != 0 or lon != 0:
            coordinates[code] = {"latitude": lat, "longitude": lon}

    # Write outputs
    with open(META_OUTPUT, "w") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    with open(COORDS_OUTPUT, "w") as f:
        json.dump(coordinates, f, indent=2, ensure_ascii=False)

    print(f"\nResults:")
    print(f"  Total languages: {len(lang_codes)}")
    print(f"  Names resolved:  {stats['names']}")
    print(f"  With coordinates: {stats['coords']}")
    print(f"  Wrote {len(metadata)} entries to {META_OUTPUT}")
    print(f"  Wrote {len(coordinates)} entries to {COORDS_OUTPUT}")


if __name__ == "__main__":
    main()
