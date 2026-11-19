import pytest

from shelfmark.release_sources.prowlarr.scoring_models import (
    ProfileFormatScore,
    ScoringConfiguration,
    ScoringProfile,
)
from shelfmark.release_sources.prowlarr import scoring_config_store as store


def test_default_configuration_contains_reusable_formats_and_disabled_profiles():
    configuration = store.default_scoring_configuration()

    formats = {item.id: item for item in configuration.custom_formats}
    profiles = {item.id: item for item in configuration.profiles}

    assert "language-french" in formats
    assert "multi-volume-bundle" in formats
    assert profiles["ebook-equilibre"].enabled is False
    assert profiles["audiobook-equilibre"].enabled is False
    assert profiles["ebook-equilibre"].format_scores[0].format_id == "language-french"
    assert profiles["audiobook-exigeant"].format_scores[0].format_id == "language-french"


def test_default_profiles_can_assign_different_scores_to_same_format():
    configuration = store.default_scoring_configuration()
    profiles = {item.id: item for item in configuration.profiles}

    balanced = {
        item.format_id: item.score
        for item in profiles["ebook-equilibre"].format_scores
    }
    strict = {
        item.format_id: item.score
        for item in profiles["ebook-exigeant"].format_scores
    }

    assert balanced["language-french"] != strict["language-french"]
    assert balanced["multi-volume-bundle"] < 0
    assert strict["multi-volume-bundle"] < balanced["multi-volume-bundle"]


def test_load_returns_defaults_when_new_configuration_is_not_saved(monkeypatch):
    monkeypatch.setattr(store, "load_config_file", lambda _tab: {})

    configuration = store.load_scoring_configuration()

    assert configuration == store.default_scoring_configuration()


def test_load_parses_saved_configuration(monkeypatch):
    expected = store.default_scoring_configuration()
    monkeypatch.setattr(
        store,
        "load_config_file",
        lambda _tab: {store.CONFIG_KEY: store.configuration_to_dict(expected)},
    )

    assert store.load_scoring_configuration() == expected


def test_save_writes_only_the_new_configuration_key(monkeypatch):
    configuration = store.default_scoring_configuration()
    saved = []
    monkeypatch.setattr(
        store,
        "save_config_file",
        lambda tab, values: saved.append((tab, values)) or True,
    )

    assert store.save_scoring_configuration(configuration) is True
    assert saved[0][0] == "custom_scores"
    assert set(saved[0][1]) == {store.CONFIG_KEY}
    assert saved[0][1][store.CONFIG_KEY]["schema_version"] == 1


def test_save_dict_rejects_invalid_configuration_before_persisting(monkeypatch):
    saved = []
    monkeypatch.setattr(
        store,
        "save_config_file",
        lambda *_args: saved.append(True) or True,
    )
    invalid = {
        "schema_version": 1,
        "custom_formats": [],
        "profiles": [{
            "id": "ebook",
            "name": "Ebooks",
            "content_type": "ebook",
            "format_scores": [
                {"format_id": "missing-format", "score": 10},
            ],
        }],
    }

    with pytest.raises(ValueError, match="unknown custom format"):
        store.save_scoring_configuration_dict(invalid)

    assert saved == []


def test_legacy_scoring_values_are_not_modified_by_new_store(monkeypatch):
    existing = {
        "CUSTOM_SCORES_EBOOKS_ENABLED": True,
        "CUSTOM_SCORES_EBOOK_MINIMUM": 30,
    }
    written = {}

    def _save(tab, values):
        assert tab == "custom_scores"
        written.update(values)
        return True

    monkeypatch.setattr(store, "save_config_file", _save)

    assert store.save_scoring_configuration(store.default_scoring_configuration())
    assert written == {store.CONFIG_KEY: store.configuration_to_dict(store.default_scoring_configuration())}
    assert existing == {
        "CUSTOM_SCORES_EBOOKS_ENABLED": True,
        "CUSTOM_SCORES_EBOOK_MINIMUM": 30,
    }
