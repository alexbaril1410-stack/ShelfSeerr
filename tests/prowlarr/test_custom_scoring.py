from shelfmark.release_sources import Release
from shelfmark.release_sources.prowlarr.custom_scoring import (
    _release_language_signal,
    release_title_matches_book,
    release_author_matches_book,
    score_release,
    minimum_score,
)\nfrom shelfmark.metadata_providers import BookMetadata


def test_release_language_signal_detects_french_markers():
    for title in ("Dungeon.Crawler.Carl.FR", "Dungeon Crawler Carl [VFF]", "Dungeon Crawler Carl - VFQ"):
        assert _release_language_signal(Release(source="prowlarr", source_id="1", title=title)) == "fr"


def test_release_language_signal_detects_original_language_markers():
    for title in ("Dungeon Crawler Carl [VO]", "Dungeon Crawler Carl VOSTFR", "Dungeon Crawler Carl ENG"):
        assert _release_language_signal(Release(source="prowlarr", source_id="1", title=title)) == "vo"


def test_release_language_signal_ignores_words_containing_language_names():
    for title in ("The French Connection", "English Patient"):
        assert _release_language_signal(Release(source="prowlarr", source_id="1", title=title)) is None



def _book(title, author=""):
    return BookMetadata(
        provider="hardcover",
        provider_id="test",
        title=title,
        authors=[author] if author else [],
    )


def _release(title, book_title=None):
    extra = {"book_title": book_title} if book_title else {}
    return Release(source="prowlarr", source_id="1", title=title, extra=extra)


def test_release_title_matching_avoids_dune_inside_french_contraction():
    book = _book("Dune", "Frank Herbert")

    assert release_title_matches_book(_release("Dune.Tome.1.Frank.Herbert.FR.epub"), book)
    assert not release_title_matches_book(
        _release("A. Zavarelli - Les Fils souverains, Tome 1 : Le Requiem d'une..."), book
    )
    assert not release_title_matches_book(
        _release("A. Zavarelli - Les Fils souverains, Tome 1 : Le Requiem dune..."), book
    )


def test_release_title_matching_rejects_unrelated_results_for_long_title():
    book = _book("Projet Dernière Chance", "Andy Weir")

    assert release_title_matches_book(
        _release("Projet.Derniere.Chance.Andy.Weir.FR.epub"), book
    )
    assert not release_title_matches_book(_release("Stephen Markley - Le déluge [FR] epub"), book)
    assert not release_title_matches_book(
        _release("Accepte-Moi Sans Condition C E Ross 2025 FRENCH Epub-Notag"), book
    )


def test_numeric_title_does_not_match_parenthesized_publication_year():
    book = _book("1984", "George Orwell")

    assert release_title_matches_book(_release("George Orwell - 1984 [EPUB]"), book)
    assert not release_title_matches_book(
        _release("Robert Van Gulik - Meurtre sur un bateau de fleurs - (1984) FR epub"), book
    )

def test_numeric_one_word_title_requires_matching_author():
    book = _book("1984", "George Orwell")

    assert release_title_matches_book(
        _release("1984.George.Orwell.2013.FR.[EPUB]"), book
    )
    assert not release_title_matches_book(
        _release("1984 (Derrien) - One Shot - Bds - Fr - EPUB"), book
    )
    assert not release_title_matches_book(
        _release("1984 - Fido Nesti - BD - FR - PDF"), book
    )


def test_dune_one_word_title_requires_matching_author():
    book = _book("Dune", "Frank Herbert")

    assert release_title_matches_book(
        _release("Dune.Tome.1.Frank.Herbert.FR.[EPUB]"), book
    )
    assert release_title_matches_book(
        _release("Dune, le Roman graphique (T01 à T03) - 2021-2024 [PDF & CBZ] Fr"), book
    )
    assert not release_author_matches_book(
        _release("Dune, le Roman graphique (T01 à T03) - 2021-2024 [PDF & CBZ] Fr"), book
    )
    assert not release_author_matches_book(
        _release("Dune - Maison Harkonnen (T01 à T03) - 2023-2025 [PDF & CBZ] Fr"), book
    )


def test_release_title_matching_uses_enriched_book_title_when_available():
    book = _book("Dune", "Frank Herbert")

    assert release_title_matches_book(
        _release("Dune by Frank Herbert [ENG / EPUB]", book_title="Dune"), book
    )
    assert not release_title_matches_book(
        _release("Random release title", book_title="The Martian"), book
    )



def test_author_match_works_for_long_titles_and_falls_back_when_missing():
    book = _book("Projet Dernière Chance", "Andy Weir")

    assert release_author_matches_book(
        _release("Projet Dernière Chance - Andy Weir - EPUB"), book
    )
    assert not release_author_matches_book(
        _release("Projet Dernière Chance.epub"), book
    )
    assert release_title_matches_book(_release("Projet Dernière Chance.epub"), book)



def test_release_title_matching_tolerates_missing_apostrophe_in_french_elision():
    book = _book("L'Ogive du jugement dernier", "Matt Dinniman")
    assert release_title_matches_book(
        _release("Dungeon Crawler Carl T02, Logive Du Jugement Dernier [EPUB]"),
        book,
    )


def test_release_title_matching_accepts_exact_series_and_volume_variant():
    book = _book("L'Ogive du jugement dernier", "Matt Dinniman")
    book.series_name = "Dungeon Crawler Carl"
    book.series_position = 2

    assert release_title_matches_book(
        _release("Dungeon Crawler Carl T02 [EPUB]"),
        book,
    )


def test_release_title_matching_does_not_accept_wrong_series_volume():
    book = _book("L'Ogive du jugement dernier", "Matt Dinniman")
    book.series_name = "Dungeon Crawler Carl"
    book.series_position = 2

    assert not release_title_matches_book(
        _release("Dungeon Crawler Carl T03 [EPUB]"),
        book,
    )



def test_multi_volume_bundle_remains_visible_but_receives_large_penalty(monkeypatch):
    import shelfmark.release_sources.prowlarr.custom_scoring as scoring

    values = {
        "CUSTOM_SCORES_EBOOKS_ENABLED": True,
        "CUSTOM_SCORES_EBOOK_RULES": [
            {"enabled": True, "name": "Tome demandé", "field": "volume", "operator": "equals", "value": "{{requested_volume}}", "score": 300},
            {"enabled": True, "name": "Compilation de plusieurs tomes", "field": "multi_volume_bundle", "operator": "equals", "value": "true", "score": -500},
        ],
    }
    monkeypatch.setattr(scoring.config, "get", lambda key, default=None: values.get(key, default))

    book = _book("L'Ogive du jugement dernier", "Matt Dinniman")
    book.series_name = "Dungeon Crawler Carl"
    book.series_position = 1

    # Cover the common separators used by trackers, including the dotted
    # normalization visible in the reported T01.a.T04 release.
    for title in (
        "Matt.Dinniman.Dungeon.Crawler.Carl.T01-T04.FRENCH.EPUB-NoTAG",
        "Matt.Dinniman.Dungeon.Crawler.Carl.T01.a.T04.FRENCH.EPUB-NoTAG",
        "Matt.Dinniman.Dungeon.Crawler.Carl.T01 à T04.FRENCH.EPUB-NoTAG",
        "Matt.Dinniman.Dungeon.Crawler.Carl.T01.to.T04.FRENCH.EPUB-NoTAG",
    ):
        release = _release(title)
        assert score_release(release, book, "ebook") == -500
        assert release.extra["custom_score_breakdown"] == [
            {
                "name": "Compilation de plusieurs tomes",
                "field": "multi_volume_bundle",
                "score": -500,
                "matched_value": "true",
            }
        ]

    # Disabling the bundle rule removes only its penalty; the compilation
    # still must not receive the +300 points for an individual requested tome.
    values["CUSTOM_SCORES_EBOOK_RULES"][1]["enabled"] = False
    assert score_release(_release("Dungeon.Crawler.Carl.T01.a.T04.FR.EPUB"), book, "ebook") == 0



def test_disabled_scoring_disables_its_minimum_threshold(monkeypatch):
    import shelfmark.release_sources.prowlarr.custom_scoring as scoring

    values = {
        "CUSTOM_SCORES_EBOOKS_ENABLED": False,
        "CUSTOM_SCORES_EBOOK_MINIMUM": 250,
        "CUSTOM_SCORES_AUDIOBOOKS_ENABLED": False,
        "CUSTOM_SCORES_AUDIOBOOK_MINIMUM": 250,
    }
    monkeypatch.setattr(scoring.config, "get", lambda key, default=None: values.get(key, default))

    assert minimum_score("ebook") == 0
    assert minimum_score("audiobook") == 0


def test_enabled_scoring_keeps_its_configured_minimum_threshold(monkeypatch):
    import shelfmark.release_sources.prowlarr.custom_scoring as scoring

    values = {
        "CUSTOM_SCORES_EBOOKS_ENABLED": True,
        "CUSTOM_SCORES_EBOOK_MINIMUM": 125,
        "CUSTOM_SCORES_AUDIOBOOKS_ENABLED": True,
        "CUSTOM_SCORES_AUDIOBOOK_MINIMUM": 175,
    }
    monkeypatch.setattr(scoring.config, "get", lambda key, default=None: values.get(key, default))

    assert minimum_score("ebook") == 125
    assert minimum_score("audiobook") == 175


def test_french_release_bonus_is_not_implicitly_added_twice(monkeypatch):
    import shelfmark.release_sources.prowlarr.custom_scoring as scoring

    values = {
        "CUSTOM_SCORES_EBOOKS_ENABLED": True,
        "CUSTOM_SCORES_EBOOK_RULES": [
            {
                "enabled": True,
                "name": "Langue française",
                "field": "language",
                "operator": "equals",
                "value": "fr",
                "score": 40,
            }
        ],
    }
    monkeypatch.setattr(scoring.config, "get", lambda key, default=None: values.get(key, default))

    book = _book("Dune")
    book.language = "fr"
    release = _release("Dune.FR.EPUB")
    release.language = "fr"

    assert score_release(release, book, "ebook") == 40
    assert release.extra["custom_score_breakdown"] == [
        {
            "name": "Langue française",
            "field": "language",
            "score": 40,
            "matched_value": "fr",
        }
    ]


def test_original_language_penalty_remains_for_french_requests(monkeypatch):
    import shelfmark.release_sources.prowlarr.custom_scoring as scoring

    values = {
        "CUSTOM_SCORES_EBOOKS_ENABLED": True,
        "CUSTOM_SCORES_EBOOK_RULES": [],
    }
    monkeypatch.setattr(scoring.config, "get", lambda key, default=None: values.get(key, default))

    book = _book("Dune")
    book.language = "fr"
    release = _release("Dune [ENG].EPUB")

    assert score_release(release, book, "ebook") == -300
    assert release.extra["custom_score_breakdown"][0]["name"] == "Version originale (non française)"
