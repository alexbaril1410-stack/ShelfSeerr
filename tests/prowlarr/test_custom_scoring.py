from shelfmark.release_sources import Release
from shelfmark.release_sources.prowlarr.custom_scoring import (\n    _release_language_signal,\n    release_title_matches_book,\n)\nfrom shelfmark.metadata_providers import BookMetadata


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


def test_release_title_matching_uses_enriched_book_title_when_available():
    book = _book("Dune", "Frank Herbert")

    assert release_title_matches_book(
        _release("Dune by Frank Herbert [ENG / EPUB]", book_title="Dune"), book
    )
    assert not release_title_matches_book(
        _release("Random release title", book_title="The Martian"), book
    )
