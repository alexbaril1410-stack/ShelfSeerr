from shelfmark.release_sources import Release
from shelfmark.release_sources.prowlarr.custom_scoring import _release_language_signal


def test_release_language_signal_detects_french_markers():
    for title in ("Dungeon.Crawler.Carl.FR", "Dungeon Crawler Carl [VFF]", "Dungeon Crawler Carl - VFQ"):
        assert _release_language_signal(Release(source="prowlarr", source_id="1", title=title)) == "fr"


def test_release_language_signal_detects_original_language_markers():
    for title in ("Dungeon Crawler Carl [VO]", "Dungeon Crawler Carl VOSTFR", "Dungeon Crawler Carl ENG"):
        assert _release_language_signal(Release(source="prowlarr", source_id="1", title=title)) == "vo"


def test_release_language_signal_ignores_words_containing_language_names():
    for title in ("The French Connection", "English Patient"):
        assert _release_language_signal(Release(source="prowlarr", source_id="1", title=title)) is None
