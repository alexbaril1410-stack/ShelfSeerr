from shelfmark.metadata_providers.hardcover import HardcoverProvider


def test_french_edition_selection_prefers_most_popular_non_audio_edition(monkeypatch):
    provider = HardcoverProvider(api_key="test-token")
    monkeypatch.setattr(
        provider,
        "_execute_query",
        lambda query, variables: {
            "editions": [
                {
                    "id": 10,
                    "book_id": 1,
                    "title": "Harry Potter audio français",
                    "edition_format": "Audible Audio",
                    "reading_format_id": 2,
                    "audio_seconds": 36000,
                    "users_count": 900,
                    "language": {"code2": "fr", "code3": "fra"},
                },
                {
                    "id": 11,
                    "book_id": 1,
                    "title": "Harry Potter - Coffret intégral",
                    "edition_format": "Hardcover",
                    "reading_format_id": 1,
                    "compilation": True,
                    "users_count": 800,
                    "language": {"code2": "fr", "code3": "fra"},
                },
                {
                    "id": 12,
                    "book_id": 1,
                    "title": "Harry Potter à l'école des sorciers",
                    "edition_format": "Paperback",
                    "reading_format_id": 1,
                    "isbn_13": "9782070541201",
                    "users_count": 500,
                    "cached_image": {"url": "https://example.com/harry-potter.jpg"},
                    "language": {"code2": "fr", "code3": "fra"},
                },
                {
                    "id": 13,
                    "book_id": 1,
                    "title": "Harry Potter - Kindle",
                    "edition_format": "Kindle Edition",
                    "reading_format_id": 4,
                    "users_count": 300,
                    "language": {"code2": "fr", "code3": "fra"},
                },
            ]
        },
    )

    selected = provider._fetch_french_editions((1,))

    assert selected is not None
    assert selected[1]["id"] == 12
    assert selected[1]["title"] == "Harry Potter à l'école des sorciers"


def test_french_edition_selection_excludes_audio_by_duration_even_without_format(monkeypatch):
    provider = HardcoverProvider(api_key="test-token")
    monkeypatch.setattr(
        provider,
        "_execute_query",
        lambda query, variables: {
            "editions": [
                {
                    "id": 20,
                    "book_id": 2,
                    "title": "Audio edition",
                    "audio_seconds": 1200,
                    "users_count": 1000,
                    "language": {"code2": "fr"},
                },
                {
                    "id": 21,
                    "book_id": 2,
                    "title": "Print edition",
                    "audio_seconds": 0,
                    "users_count": 10,
                    "language": {"code2": "fr"},
                },
            ]
        },
    )

    selected = provider._fetch_french_editions((2,))

    assert selected is not None
    assert selected[2]["id"] == 21


def test_apply_french_edition_updates_title_isbn_and_cover():
    book = {"title": "Harry Potter", "cached_image": {"url": "old"}}
    edition = {
        "title": "Harry Potter à l'école des sorciers",
        "isbn_13": "9782070541201",
        "cached_image": {"url": "https://example.com/harry-potter.jpg"},
    }

    HardcoverProvider._apply_french_edition(book, edition)

    assert book["title"] == "Harry Potter à l'école des sorciers"
    assert book["isbn_13"] == "9782070541201"
    assert book["cached_image"]["url"] == "https://example.com/harry-potter.jpg"
