#!/usr/bin/env python3
"""
Enrich language data from the per_language_results CSV with rich metadata.

Data sources:
1. Glottolog CLDF (languages.csv) — name, macroarea, countries, family, coordinates
2. Glottolog CLDF (values.csv) — AES endangerment status
3. SIL ISO 639-3 code table — fallback for language names
4. Glottolog resourcemap — additional coordinate data

Usage:
    python data/scripts/enrich_languages.py
"""

import csv
import io
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

# Data source URLs
GLOTTOLOG_CLDF_LANGS = "https://raw.githubusercontent.com/glottolog/glottolog-cldf/master/cldf/languages.csv"
GLOTTOLOG_CLDF_VALUES = "https://raw.githubusercontent.com/glottolog/glottolog-cldf/master/cldf/values.csv"
GLOTTOLOG_RESOURCEMAP = "https://glottolog.org/resourcemap.json?rsc=language"
SIL_URL = "https://iso639-3.sil.org/sites/iso639-3/files/downloads/iso-639-3.tab"

# Cache paths
CACHE_DIR = Path("/tmp/voxatlas_enrichment")

# ISO 3166-1 alpha-2 to country name mapping (comprehensive)
COUNTRY_CODES = {
    "AD": "Andorra", "AE": "UAE", "AF": "Afghanistan", "AG": "Antigua and Barbuda",
    "AI": "Anguilla", "AL": "Albania", "AM": "Armenia", "AO": "Angola",
    "AR": "Argentina", "AS": "American Samoa", "AT": "Austria", "AU": "Australia",
    "AW": "Aruba", "AZ": "Azerbaijan", "BA": "Bosnia and Herzegovina", "BB": "Barbados",
    "BD": "Bangladesh", "BE": "Belgium", "BF": "Burkina Faso", "BG": "Bulgaria",
    "BH": "Bahrain", "BI": "Burundi", "BJ": "Benin", "BM": "Bermuda",
    "BN": "Brunei", "BO": "Bolivia", "BR": "Brazil", "BS": "Bahamas",
    "BT": "Bhutan", "BW": "Botswana", "BY": "Belarus", "BZ": "Belize",
    "CA": "Canada", "CD": "DR Congo", "CF": "Central African Republic",
    "CG": "Congo", "CH": "Switzerland", "CI": "Côte d'Ivoire", "CK": "Cook Islands",
    "CL": "Chile", "CM": "Cameroon", "CN": "China", "CO": "Colombia",
    "CR": "Costa Rica", "CU": "Cuba", "CV": "Cape Verde", "CY": "Cyprus",
    "CZ": "Czech Republic", "DE": "Germany", "DJ": "Djibouti", "DK": "Denmark",
    "DM": "Dominica", "DO": "Dominican Republic", "DZ": "Algeria", "EC": "Ecuador",
    "EE": "Estonia", "EG": "Egypt", "ER": "Eritrea", "ES": "Spain",
    "ET": "Ethiopia", "FI": "Finland", "FJ": "Fiji", "FK": "Falkland Islands",
    "FM": "Micronesia", "FO": "Faroe Islands", "FR": "France", "GA": "Gabon",
    "GB": "United Kingdom", "GD": "Grenada", "GE": "Georgia", "GF": "French Guiana",
    "GH": "Ghana", "GI": "Gibraltar", "GL": "Greenland", "GM": "Gambia",
    "GN": "Guinea", "GP": "Guadeloupe", "GQ": "Equatorial Guinea", "GR": "Greece",
    "GT": "Guatemala", "GU": "Guam", "GW": "Guinea-Bissau", "GY": "Guyana",
    "HK": "Hong Kong", "HN": "Honduras", "HR": "Croatia", "HT": "Haiti",
    "HU": "Hungary", "ID": "Indonesia", "IE": "Ireland", "IL": "Israel",
    "IN": "India", "IQ": "Iraq", "IR": "Iran", "IS": "Iceland",
    "IT": "Italy", "JM": "Jamaica", "JO": "Jordan", "JP": "Japan",
    "KE": "Kenya", "KG": "Kyrgyzstan", "KH": "Cambodia", "KI": "Kiribati",
    "KM": "Comoros", "KN": "Saint Kitts and Nevis", "KP": "North Korea",
    "KR": "South Korea", "KW": "Kuwait", "KY": "Cayman Islands", "KZ": "Kazakhstan",
    "LA": "Laos", "LB": "Lebanon", "LC": "Saint Lucia", "LI": "Liechtenstein",
    "LK": "Sri Lanka", "LR": "Liberia", "LS": "Lesotho", "LT": "Lithuania",
    "LU": "Luxembourg", "LV": "Latvia", "LY": "Libya", "MA": "Morocco",
    "MC": "Monaco", "MD": "Moldova", "ME": "Montenegro", "MG": "Madagascar",
    "MH": "Marshall Islands", "MK": "North Macedonia", "ML": "Mali", "MM": "Myanmar",
    "MN": "Mongolia", "MO": "Macao", "MP": "Northern Mariana Islands",
    "MQ": "Martinique", "MR": "Mauritania", "MS": "Montserrat", "MT": "Malta",
    "MU": "Mauritius", "MV": "Maldives", "MW": "Malawi", "MX": "Mexico",
    "MY": "Malaysia", "MZ": "Mozambique", "NA": "Namibia", "NC": "New Caledonia",
    "NE": "Niger", "NF": "Norfolk Island", "NG": "Nigeria", "NI": "Nicaragua",
    "NL": "Netherlands", "NO": "Norway", "NP": "Nepal", "NR": "Nauru",
    "NU": "Niue", "NZ": "New Zealand", "OM": "Oman", "PA": "Panama",
    "PE": "Peru", "PF": "French Polynesia", "PG": "Papua New Guinea",
    "PH": "Philippines", "PK": "Pakistan", "PL": "Poland", "PM": "Saint Pierre and Miquelon",
    "PN": "Pitcairn Islands", "PR": "Puerto Rico", "PS": "Palestine", "PT": "Portugal",
    "PW": "Palau", "PY": "Paraguay", "QA": "Qatar", "RE": "Réunion",
    "RO": "Romania", "RS": "Serbia", "RU": "Russia", "RW": "Rwanda",
    "SA": "Saudi Arabia", "SB": "Solomon Islands", "SC": "Seychelles", "SD": "Sudan",
    "SE": "Sweden", "SG": "Singapore", "SH": "Saint Helena", "SI": "Slovenia",
    "SK": "Slovakia", "SL": "Sierra Leone", "SM": "San Marino", "SN": "Senegal",
    "SO": "Somalia", "SR": "Suriname", "SS": "South Sudan", "ST": "São Tomé and Príncipe",
    "SV": "El Salvador", "SX": "Sint Maarten", "SY": "Syria", "SZ": "Eswatini",
    "TC": "Turks and Caicos Islands", "TD": "Chad", "TG": "Togo", "TH": "Thailand",
    "TJ": "Tajikistan", "TK": "Tokelau", "TL": "Timor-Leste", "TM": "Turkmenistan",
    "TN": "Tunisia", "TO": "Tonga", "TR": "Turkey", "TT": "Trinidad and Tobago",
    "TV": "Tuvalu", "TW": "Taiwan", "TZ": "Tanzania", "UA": "Ukraine",
    "UG": "Uganda", "US": "United States", "UY": "Uruguay", "UZ": "Uzbekistan",
    "VA": "Vatican City", "VC": "Saint Vincent and the Grenadines", "VE": "Venezuela",
    "VG": "British Virgin Islands", "VI": "US Virgin Islands", "VN": "Vietnam",
    "VU": "Vanuatu", "WF": "Wallis and Futuna", "WS": "Samoa", "XK": "Kosovo",
    "YE": "Yemen", "YT": "Mayotte", "ZA": "South Africa", "ZM": "Zambia",
    "ZW": "Zimbabwe",
}

# Map Glottolog macroareas to more standard continent names
MACROAREA_TO_CONTINENT = {
    "Africa": "Africa",
    "Australia": "Oceania",
    "Eurasia": "Eurasia",
    "North America": "North America",
    "Papunesia": "Oceania",
    "South America": "South America",
}

# AES code to human-readable label
AES_LABELS = {
    "aes-not_endangered": "Not Endangered",
    "aes-threatened": "Threatened",
    "aes-shifting": "Shifting",
    "aes-moribund": "Moribund",
    "aes-nearly_extinct": "Nearly Extinct",
    "aes-extinct": "Extinct",
}


def download_cached(url: str, filename: str) -> str:
    """Download a file with caching, return contents as string."""
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_path = CACHE_DIR / filename
    if cache_path.exists():
        print(f"  Using cached {cache_path}")
        with open(cache_path, encoding="utf-8") as f:
            return f.read()
    print(f"  Downloading {url} ...")
    resp = urllib.request.urlopen(url)
    data = resp.read().decode("utf-8")
    with open(cache_path, "w", encoding="utf-8") as f:
        f.write(data)
    print(f"  Cached to {cache_path}")
    return data


def main():
    GEO_DATA.mkdir(parents=True, exist_ok=True)

    if not CSV_PATH.exists():
        print(f"CSV not found at {CSV_PATH}. Run 'make download-data' first.")
        sys.exit(1)

    # 1. Load Glottolog CLDF languages.csv
    print("Loading Glottolog CLDF languages...")
    langs_csv = download_cached(GLOTTOLOG_CLDF_LANGS, "glottolog_languages.csv")
    reader = csv.DictReader(io.StringIO(langs_csv))

    # Build glottocode -> family name lookup (from family-level rows)
    family_names: dict[str, str] = {}
    # Build ISO -> rich metadata lookup (from language-level rows)
    iso_cldf: dict[str, dict] = {}
    all_rows = list(reader)

    for row in all_rows:
        if row["Level"] == "family":
            family_names[row["ID"]] = row["Name"]

    for row in all_rows:
        if row["Level"] == "language" and row["ISO639P3code"]:
            iso3 = row["ISO639P3code"]
            countries_raw = row.get("Countries", "")
            country_codes_list = [c.strip() for c in countries_raw.split(";") if c.strip()] if countries_raw else []
            country_names = [COUNTRY_CODES.get(c, c) for c in country_codes_list]
            family_id = row.get("Family_ID", "")
            family_name = family_names.get(family_id, "")
            if not family_name and row.get("Is_Isolate") == "True":
                family_name = f"{row['Name']} (isolate)"

            macroarea = row.get("Macroarea", "")
            continent = MACROAREA_TO_CONTINENT.get(macroarea, macroarea)

            lat = float(row["Latitude"]) if row["Latitude"] else 0.0
            lon = float(row["Longitude"]) if row["Longitude"] else 0.0

            iso_cldf[iso3] = {
                "name": row["Name"],
                "glottocode": row["ID"],
                "macroarea": macroarea,
                "continent": continent,
                "countries": country_names,
                "country_codes": country_codes_list,
                "family": family_name,
                "latitude": lat,
                "longitude": lon,
            }

    print(f"  CLDF: {len(iso_cldf)} languages with ISO codes, {len(family_names)} families")

    # 2. Load AES endangerment data from values.csv
    print("Loading Glottolog AES endangerment data...")
    values_csv = download_cached(GLOTTOLOG_CLDF_VALUES, "glottolog_values.csv")
    reader = csv.DictReader(io.StringIO(values_csv))
    glottocode_aes: dict[str, str] = {}
    for row in reader:
        if row["Parameter_ID"] == "aes":
            code_id = row.get("Code_ID", "")
            label = AES_LABELS.get(code_id, code_id.replace("aes-", "").replace("_", " ").title())
            glottocode_aes[row["Language_ID"]] = label
    print(f"  AES: {len(glottocode_aes)} endangerment entries")

    # 3. Load Glottolog resourcemap for extra coordinates
    print("Loading Glottolog resourcemap...")
    rmap_data = download_cached(GLOTTOLOG_RESOURCEMAP, "glottolog_resourcemap.json")
    rmap = json.loads(rmap_data)
    iso_rmap: dict[str, dict] = {}
    for r in rmap.get("resources", []):
        for ident in r.get("identifiers", []):
            if ident.get("type") == "iso639-3":
                iso_rmap[ident["identifier"]] = {
                    "name": r["name"],
                    "lat": r.get("latitude"),
                    "lon": r.get("longitude"),
                }
    print(f"  Resourcemap: {len(iso_rmap)} ISO entries")

    # 4. Load SIL names as final fallback (may be blocked by SIL server)
    sil_names: dict[str, str] = {}
    try:
        print("Loading SIL names...")
        sil_data = download_cached(SIL_URL, "iso-639-3.tab")
        sil_reader = csv.DictReader(io.StringIO(sil_data), delimiter="\t")
        for row in sil_reader:
            code = row.get("Id", "").strip()
            name = row.get("Ref_Name", "").strip()
            if code and name:
                sil_names[code] = name
        print(f"  SIL: {len(sil_names)} names")
    except Exception as e:
        print(f"  SIL download skipped ({e}). Using Glottolog + resourcemap names only.")

    # 5. Read omniASR language codes from CSV
    lang_codes = []
    with open(CSV_PATH) as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row.get("lang_code", row.get("Language", row.get("language", ""))).strip()
            if code:
                lang_codes.append(code)
    print(f"\nEnriching {len(lang_codes)} omniASR languages...")

    # 6. Build enriched metadata
    metadata = {}
    coordinates = {}
    stats = {"names": 0, "coords": 0, "continents": 0, "countries": 0, "families": 0, "aes": 0}

    for code in lang_codes:
        iso3 = code.split("_")[0] if "_" in code else code
        script = code.split("_")[-1] if "_" in code else ""

        cldf = iso_cldf.get(iso3, {})
        rmap_entry = iso_rmap.get(iso3, {})

        # Name: CLDF > resourcemap > SIL > raw ISO code
        name = cldf.get("name", "") or rmap_entry.get("name", "") or sil_names.get(iso3, "") or iso3
        if name != iso3:
            stats["names"] += 1

        # Coordinates: CLDF > resourcemap
        lat = cldf.get("latitude", 0.0)
        lon = cldf.get("longitude", 0.0)
        if (lat == 0 and lon == 0) and rmap_entry.get("lat") is not None:
            lat = rmap_entry["lat"]
            lon = rmap_entry["lon"]
        if lat != 0 or lon != 0:
            stats["coords"] += 1

        # Continent from CLDF macroarea
        continent = cldf.get("continent", "")
        if continent:
            stats["continents"] += 1

        # Countries
        countries = cldf.get("countries", [])
        if countries:
            stats["countries"] += 1

        # Family
        family = cldf.get("family", "")
        if family:
            stats["families"] += 1

        # Endangerment from AES data
        glottocode = cldf.get("glottocode", "")
        endangerment = glottocode_aes.get(glottocode, "Unknown")
        if endangerment != "Unknown":
            stats["aes"] += 1

        metadata[code] = {
            "name": name,
            "script": script,
            "continent": continent,
            "region": countries[0] if countries else "",
            "countries": countries,
            "family": family,
            "latitude": lat,
            "longitude": lon,
            "endangerment": endangerment,
        }

        if lat != 0 or lon != 0:
            coordinates[code] = {"latitude": lat, "longitude": lon}

    # Write outputs
    with open(META_OUTPUT, "w") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    with open(COORDS_OUTPUT, "w") as f:
        json.dump(coordinates, f, indent=2, ensure_ascii=False)

    print(f"\nResults:")
    print(f"  Total languages:     {len(lang_codes)}")
    print(f"  Names resolved:      {stats['names']}")
    print(f"  With coordinates:    {stats['coords']}")
    print(f"  With continent:      {stats['continents']}")
    print(f"  With countries:      {stats['countries']}")
    print(f"  With family:         {stats['families']}")
    print(f"  With endangerment:   {stats['aes']}")
    print(f"  Wrote {len(metadata)} entries to {META_OUTPUT}")
    print(f"  Wrote {len(coordinates)} entries to {COORDS_OUTPUT}")


if __name__ == "__main__":
    main()
