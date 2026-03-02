#!/usr/bin/env python3
"""
Generate benchmark coverage data for VoxAtlas.

Maps which omniASR languages overlap with major ASR evaluation benchmarks:
- FLEURS (102 languages) — Google's multilingual speech benchmark
- Common Voice 17 (120+ languages) — Mozilla crowd-sourced speech
- AfriSpeech (120 African-accented English variants)

Output: backend/app/data/benchmarks.json
"""

import csv
import json
from pathlib import Path

# FLEURS language codes (ISO 639-3 + script, mapped to omniASR format)
# Source: https://huggingface.co/datasets/google/fleurs
FLEURS_LANGS = {
    "afr_Latn", "amh_Ethi", "ara_Arab", "asm_Beng", "ast_Latn",
    "azj_Latn", "bel_Cyrl", "ben_Beng", "bos_Latn", "bul_Cyrl",
    "cat_Latn", "ceb_Latn", "ces_Latn", "ckb_Arab", "cmn_Hans",
    "cym_Latn", "dan_Latn", "deu_Latn", "ell_Grek", "eng_Latn",
    "est_Latn", "eus_Latn", "fas_Arab", "fil_Latn", "fin_Latn",
    "fra_Latn", "ful_Latn", "gle_Latn", "glg_Latn", "guj_Gujr",
    "hau_Latn", "heb_Hebr", "hin_Deva", "hrv_Latn", "hun_Latn",
    "hye_Armn", "ibo_Latn", "ind_Latn", "isl_Latn", "ita_Latn",
    "jav_Latn", "jpn_Jpan", "kam_Latn", "kan_Knda", "kat_Geor",
    "kaz_Cyrl", "kea_Latn", "khm_Khmr", "kir_Cyrl", "kor_Hang",
    "lao_Laoo", "lav_Latn", "lin_Latn", "lit_Latn", "ltz_Latn",
    "lug_Latn", "luo_Latn", "mal_Mlym", "mar_Deva", "mkd_Cyrl",
    "mlt_Latn", "mon_Cyrl", "mri_Latn", "msa_Latn", "mya_Mymr",
    "nep_Deva", "nld_Latn", "nob_Latn", "nso_Latn", "nya_Latn",
    "oci_Latn", "orm_Latn", "ory_Orya", "pan_Guru", "pol_Latn",
    "por_Latn", "pus_Arab", "ron_Latn", "rus_Cyrl", "slk_Latn",
    "slv_Latn", "sna_Latn", "snd_Arab", "som_Latn", "spa_Latn",
    "srp_Cyrl", "sun_Latn", "swe_Latn", "swh_Latn", "tam_Taml",
    "tel_Telu", "tgk_Cyrl", "tgl_Latn", "tha_Thai", "tur_Latn",
    "ukr_Cyrl", "umb_Latn", "urd_Arab", "uzb_Latn", "vie_Latn",
    "wol_Latn", "xho_Latn", "yor_Latn", "yue_Hant", "zul_Latn",
}

# Common Voice 17 language codes (approximate mapping to omniASR codes)
# Source: https://huggingface.co/datasets/mozilla-foundation/common_voice_17_0
COMMON_VOICE_LANGS = {
    "abk_Cyrl", "afr_Latn", "amh_Ethi", "ara_Arab", "asm_Beng",
    "ast_Latn", "azj_Latn", "bas_Latn", "bel_Cyrl", "ben_Beng",
    "bos_Latn", "bre_Latn", "bul_Cyrl", "cat_Latn", "ces_Latn",
    "ckb_Arab", "cmn_Hans", "cym_Latn", "dan_Latn", "deu_Latn",
    "div_Thaa", "ell_Grek", "eng_Latn", "epo_Latn", "est_Latn",
    "eus_Latn", "fas_Arab", "fin_Latn", "fra_Latn", "gle_Latn",
    "glg_Latn", "guj_Gujr", "hau_Latn", "heb_Hebr", "hin_Deva",
    "hrv_Latn", "hun_Latn", "hye_Armn", "ibo_Latn", "ind_Latn",
    "isl_Latn", "ita_Latn", "jpn_Jpan", "kan_Knda", "kat_Geor",
    "kaz_Cyrl", "khm_Khmr", "kin_Latn", "kir_Cyrl", "kor_Hang",
    "kmr_Latn", "lao_Laoo", "lav_Latn", "lin_Latn", "lit_Latn",
    "ltz_Latn", "lug_Latn", "mal_Mlym", "mar_Deva", "mkd_Cyrl",
    "mlt_Latn", "mon_Cyrl", "mri_Latn", "msa_Latn", "mya_Mymr",
    "nep_Deva", "nld_Latn", "nob_Latn", "nya_Latn", "oci_Latn",
    "orm_Latn", "ory_Orya", "pan_Guru", "pol_Latn", "por_Latn",
    "pus_Arab", "ron_Latn", "rus_Cyrl", "san_Deva", "slk_Latn",
    "slv_Latn", "sna_Latn", "som_Latn", "spa_Latn", "srp_Cyrl",
    "sun_Latn", "swa_Latn", "swe_Latn", "tam_Taml", "tat_Cyrl",
    "tel_Telu", "tgl_Latn", "tha_Thai", "tig_Ethi", "tok_Latn",
    "tur_Latn", "twi_Latn", "ukr_Cyrl", "urd_Arab", "uzb_Latn",
    "vie_Latn", "wol_Latn", "xho_Latn", "yor_Latn", "yue_Hant",
    "zul_Latn",
}

# AfriSpeech — languages with significant African language coverage
# Source: https://huggingface.co/datasets/tobiolatunji/afrispeech-200
AFRISPEECH_LANGS = {
    "aka_Latn", "amh_Ethi", "bem_Latn", "efi_Latn", "ewe_Latn",
    "ful_Latn", "hau_Latn", "ibo_Latn", "kin_Latn", "lin_Latn",
    "lug_Latn", "luo_Latn", "nso_Latn", "nya_Latn", "orm_Latn",
    "run_Latn", "sna_Latn", "som_Latn", "sot_Latn", "swa_Latn",
    "swh_Latn", "tir_Ethi", "tsn_Latn", "tso_Latn", "twi_Latn",
    "ven_Latn", "wol_Latn", "xho_Latn", "yor_Latn", "zul_Latn",
}

BENCHMARKS = {
    "fleurs": {
        "name": "FLEURS",
        "full_name": "Few-shot Learning Evaluation of Universal Representations of Speech",
        "source": "Google",
        "hf_dataset": "google/fleurs",
        "description": "102-language read speech benchmark. The standard for multilingual ASR evaluation.",
        "total_languages": 102,
        "langs": FLEURS_LANGS,
    },
    "common_voice": {
        "name": "Common Voice 17",
        "full_name": "Mozilla Common Voice",
        "source": "Mozilla",
        "hf_dataset": "mozilla-foundation/common_voice_17_0",
        "description": "Crowd-sourced read speech in 120+ languages. Largest open multilingual speech dataset.",
        "total_languages": 120,
        "langs": COMMON_VOICE_LANGS,
    },
    "afrispeech": {
        "name": "AfriSpeech",
        "full_name": "AfriSpeech-200",
        "source": "Intron Health",
        "hf_dataset": "tobiolatunji/afrispeech-200",
        "description": "African-accented speech benchmark covering 30 African languages. Critical for low-resource African language evaluation.",
        "total_languages": 30,
        "langs": AFRISPEECH_LANGS,
    },
}


def main():
    # Load omniASR language codes from CSV
    csv_path = Path(__file__).parent.parent.parent / "backend" / "app" / "data" / "per_language_results.csv"
    omni_langs = set()
    omni_data = {}
    with open(csv_path) as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row.get("Language", "").strip()
            if code:
                omni_langs.add(code)
                omni_data[code] = {
                    "training_hours": float(row.get("Training Hours", 0)),
                    "cer": float(row.get("CER", 0)),
                }

    print(f"omniASR languages: {len(omni_langs)}")

    output = {"benchmarks": {}, "language_coverage": {}}

    # Generate benchmark summaries
    for key, bench in BENCHMARKS.items():
        overlap = bench["langs"] & omni_langs
        only_bench = bench["langs"] - omni_langs
        only_omni_count = len(omni_langs) - len(overlap)

        # Compute avg CER for overlapping languages
        overlap_cers = [omni_data[c]["cer"] for c in overlap if c in omni_data]
        avg_cer = round(sum(overlap_cers) / len(overlap_cers), 2) if overlap_cers else 0

        output["benchmarks"][key] = {
            "name": bench["name"],
            "full_name": bench["full_name"],
            "source": bench["source"],
            "hf_dataset": bench["hf_dataset"],
            "description": bench["description"],
            "total_languages": bench["total_languages"],
            "overlap_count": len(overlap),
            "overlap_languages": sorted(overlap),
            "only_in_benchmark": sorted(only_bench),
            "omni_unique_count": only_omni_count,
            "avg_cer_overlap": avg_cer,
        }

        print(f"\n{bench['name']}:")
        print(f"  Benchmark languages: {bench['total_languages']}")
        print(f"  Overlap with omniASR: {len(overlap)}")
        print(f"  Only in benchmark: {len(only_bench)}")
        print(f"  Only in omniASR: {only_omni_count}")
        print(f"  Avg CER (overlap): {avg_cer}%")

    # Per-language coverage map
    for code in sorted(omni_langs):
        coverage = []
        for key, bench in BENCHMARKS.items():
            if code in bench["langs"]:
                coverage.append(key)
        output["language_coverage"][code] = coverage

    # Write output
    out_path = Path(__file__).parent.parent.parent / "backend" / "app" / "data" / "benchmarks.json"
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"\nWritten to {out_path}")


if __name__ == "__main__":
    main()
