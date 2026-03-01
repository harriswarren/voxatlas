import pytest
from app.services.data_service import DataService, LanguageData


@pytest.fixture
def data_service():
    ds = DataService()
    ds.languages = {
        "eng_Latn": LanguageData(
            lang_code="eng_Latn", language_name="English", cer_7b_llm=2.1,
            training_hours=500, continent="Europe", script="Latn"
        ),
        "fra_Latn": LanguageData(
            lang_code="fra_Latn", language_name="French", cer_7b_llm=4.5,
            training_hours=300, continent="Europe", script="Latn"
        ),
        "yor_Latn": LanguageData(
            lang_code="yor_Latn", language_name="Yoruba", cer_7b_llm=8.2,
            training_hours=10, continent="Africa", script="Latn"
        ),
        "cmn_Hans": LanguageData(
            lang_code="cmn_Hans", language_name="Chinese", cer_7b_llm=15.0,
            training_hours=200, continent="Asia", script="Hans"
        ),
        "ara_Arab": LanguageData(
            lang_code="ara_Arab", language_name="Arabic", cer_7b_llm=35.0,
            training_hours=50, continent="Africa", script="Arab"
        ),
    }
    return ds


def test_cer_distribution(data_service):
    dist = data_service.get_cer_distribution()
    assert dist["0-5"] == 2  # eng, fra
    assert dist["5-10"] == 1  # yor
    assert dist["10-15"] == 0
    assert dist["15-20"] == 1  # cmn
    assert dist["30-50"] == 1  # ara


def test_cer_by_region(data_service):
    regions = data_service.get_cer_by_region()
    assert "Europe" in regions
    assert "Africa" in regions
    assert "Asia" in regions
    assert regions["Europe"]["count"] == 2


def test_cer_vs_hours(data_service):
    scatter = data_service.get_cer_vs_hours()
    assert len(scatter) == 5
    assert all("cer" in item and "hours" in item for item in scatter)


def test_top_bottom(data_service):
    result = data_service.get_top_bottom_languages(n=2)
    assert len(result["best"]) == 2
    assert len(result["worst"]) == 2
    assert result["best"][0]["lang_code"] == "eng_Latn"
    assert result["worst"][0]["lang_code"] == "ara_Arab"


def test_unique_scripts(data_service):
    scripts = data_service.get_unique_scripts()
    assert "Latn" in scripts
    assert "Hans" in scripts
    assert "Arab" in scripts


def test_unique_continents(data_service):
    continents = data_service.get_unique_continents()
    assert "Europe" in continents
    assert "Africa" in continents
    assert "Asia" in continents
