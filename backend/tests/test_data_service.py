import pytest
from app.services.data_service import DataService, LanguageData


def test_data_service_init():
    ds = DataService()
    assert ds.languages == {}


def test_get_cer_distribution_empty():
    ds = DataService()
    dist = ds.get_cer_distribution()
    assert all(v == 0 for v in dist.values())


def test_get_summary_stats_empty():
    ds = DataService()
    stats = ds.get_summary_stats()
    assert stats["total_languages"] == 0
    assert stats["mean_cer"] == 0


def test_get_summary_stats_with_data():
    ds = DataService()
    ds.languages = {
        "eng_Latn": LanguageData(lang_code="eng_Latn", cer_7b_llm=3.5, training_hours=100),
        "fra_Latn": LanguageData(lang_code="fra_Latn", cer_7b_llm=5.0, training_hours=80),
        "cmn_Hans": LanguageData(lang_code="cmn_Hans", cer_7b_llm=12.0, training_hours=50),
    }
    stats = ds.get_summary_stats()
    assert stats["total_languages"] == 3
    assert stats["pct_under_10"] > 0
    assert stats["total_training_hours"] == 230


def test_get_all_languages_pagination():
    ds = DataService()
    for i in range(100):
        ds.languages[f"lang_{i:03d}"] = LanguageData(lang_code=f"lang_{i:03d}", cer_7b_llm=float(i))
    results, total = ds.get_all_languages(page=1, page_size=10)
    assert len(results) == 10
    assert total == 100


def test_get_all_languages_filter_cer():
    ds = DataService()
    ds.languages = {
        "a": LanguageData(lang_code="a", cer_7b_llm=5.0),
        "b": LanguageData(lang_code="b", cer_7b_llm=15.0),
        "c": LanguageData(lang_code="c", cer_7b_llm=25.0),
    }
    results, total = ds.get_all_languages(cer_max=10.0)
    assert total == 1
    assert results[0].lang_code == "a"
