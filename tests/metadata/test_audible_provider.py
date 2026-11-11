from unittest.mock import Mock

from shelfmark.metadata_providers import MetadataSearchOptions, SearchType, get_provider
from shelfmark.metadata_providers.audible import AudibleProvider, _parse_product


def test_parse_audible_product_maps_audiobook_metadata():
    book = _parse_product(
        {
            "asin": "B0ABC12345",
            "title": "Le Hobbit",
            "contributors": {
                "authors": [{"name": "J. R. R. Tolkien"}],
                "narrators": [{"name": "Thierry Janssen"}],
            },
            "publisher_summary": "Un voyage inattendu.",
            "publisher_name": "Audiolib",
            "runtime_length_min": 680,
            "release_date": "2024-03-12",
            "language": "French",
            "product_images": {"500": "https://example.test/cover.jpg"},
            "rating": {"average_rating": 4.8},
        },
        "fr",
    )

    assert book is not None
    assert book.provider == "audible"
    assert book.provider_id == "B0ABC12345"
    assert book.title == "Le Hobbit"
    assert book.authors == ["J. R. R. Tolkien"]
    assert book.cover_url == "https://example.test/cover.jpg"
    assert book.source_url == "https://www.audible.fr/pd/B0ABC12345"
    assert book.publish_year == 2024
    assert book.language == "French"
    assert any(field.label == "Durée" and field.value == "11 h 20 min" for field in book.display_fields)
    assert any(field.label == "Narrateur" and "Thierry Janssen" in field.value for field in book.display_fields)


def test_audible_search_uses_french_catalogue_and_maps_results(monkeypatch):
    provider = AudibleProvider(marketplace="fr")
    response = Mock()
    response.raise_for_status.return_value = None
    response.json.return_value = {
        "items": [
            {
                "asin": "B0ABC12345",
                "title": "Le Hobbit",
                "contributors": {"authors": [{"name": "J. R. R. Tolkien"}]},
            }
        ]
    }

    def fake_get(url, **kwargs):
        assert url == "https://api.audible.fr/1.0/catalog/search"
        assert kwargs["params"]["keywords"] == "Le Hobbit"
        assert kwargs["params"]["content_type"] == "Audiobook"
        return response

    monkeypatch.setattr("shelfmark.metadata_providers.audible.requests.get", fake_get)
    results = provider.search(MetadataSearchOptions(query="Le Hobbit", search_type=SearchType.GENERAL))

    assert len(results) == 1
    assert results[0].provider_id == "B0ABC12345"


def test_audible_provider_is_registered_and_is_available():
    provider = get_provider("audible", marketplace="fr")

    assert isinstance(provider, AudibleProvider)
    assert provider.is_available()


def test_audible_does_not_treat_isbn_as_an_asin():
    provider = AudibleProvider()

    assert provider.search_by_isbn("9782070612758") is None
    assert provider.search(MetadataSearchOptions(query="9782070612758", search_type=SearchType.ISBN)) == []



def test_audible_search_fallback_omits_unsupported_content_type(monkeypatch):
    provider = AudibleProvider(marketplace="fr")
    calls = []

    def fake_request(path, params):
        calls.append((path, dict(params)))
        if path == "catalog/search":
            return None
        assert path == "catalog/products"
        return {
            "items": [
                {
                    "asin": "B0ABC12345",
                    "title": "Dungeon Crawler Carl",
                }
            ]
        }

    monkeypatch.setattr(provider, "_request", fake_request)
    results = provider.search(MetadataSearchOptions(query="Dungeon Crawler Carl"))

    assert len(results) == 1
    assert calls[0][0] == "catalog/search"
    assert calls[1][0] == "catalog/products"
    assert "content_type" not in calls[1][1]
    assert calls[1][1]["keywords"] == "Dungeon Crawler Carl"



def test_audible_french_only_filter_keeps_only_identified_french_books(monkeypatch):
    provider = AudibleProvider(marketplace="fr", french_only=True)
    monkeypatch.setattr(
        provider,
        "_search_payload",
        lambda options: {
            "items": [
                {"asin": "FR12345678", "title": "Livre français", "language": "French"},
                {"asin": "EN12345678", "title": "English book", "language": "English"},
                {"asin": "XX12345678", "title": "Langue inconnue"},
                {"asin": "FR22345678", "title": "Livre français 2", "language_code": "fr-FR"},
            ]
        },
    )

    results = provider.search(MetadataSearchOptions(query="test"))

    assert [book.provider_id for book in results] == ["FR12345678", "FR22345678"]


def test_audible_french_only_filter_is_disabled_by_default(monkeypatch):
    provider = AudibleProvider(marketplace="fr")
    monkeypatch.setattr(
        provider,
        "_search_payload",
        lambda options: {
            "items": [
                {"asin": "FR12345678", "title": "Livre français", "language": "French"},
                {"asin": "EN12345678", "title": "English book", "language": "English"},
            ]
        },
    )

    results = provider.search(MetadataSearchOptions(query="test"))

    assert len(results) == 2



def test_audible_search_retries_common_vowel_typo(monkeypatch):
    provider = AudibleProvider(marketplace="fr")
    attempted_queries = []

    def fake_search_once(query, options):
        attempted_queries.append(query)
        if query == "Dungeon":
            return {
                "items": [
                    {
                        "asin": "B0DUNGEON1",
                        "title": "Dungeon Crawler Carl",
                        "language": "English",
                    }
                ]
            }
        return None

    monkeypatch.setattr(provider, "_search_once", fake_search_once)
    results = provider.search(MetadataSearchOptions(query="Dongeon"))

    assert attempted_queries[0] == "Dongeon"
    assert "Dungeon" in attempted_queries
    assert len(results) == 1
    assert results[0].title == "Dungeon Crawler Carl"


def test_audible_search_does_not_retry_multi_word_queries(monkeypatch):
    provider = AudibleProvider(marketplace="fr")
    attempted_queries = []

    def fake_search_once(query, options):
        attempted_queries.append(query)
        return None

    monkeypatch.setattr(provider, "_search_once", fake_search_once)
    results = provider.search(MetadataSearchOptions(query="Dongeon Crawler"))

    assert results == []
    assert attempted_queries == ["Dongeon Crawler"]



def test_parse_audible_product_extracts_contributors_series_and_html_description():
    book = _parse_product(
        {
            "asin": "B0SERIES123",
            "title": "Dungeon Crawler Carl",
            "contributors": [
                {"name": "Matt Dinniman", "role": "Author"},
                {"name": "Jeff Hays", "role": "Narrator"},
            ],
            "series": [
                {"asin": "B0SERIES999", "title": "Dungeon Crawler Carl", "sequence": "1"}
            ],
            "publisher_summary": "<p>First paragraph.</p><p>Second <strong>paragraph</strong>.</p>",
        },
        "fr",
    )

    assert book is not None
    assert book.authors == ["Matt Dinniman"]
    assert any(
        field.label == "Narrateur" and field.value == "Jeff Hays"
        for field in book.display_fields
    )
    assert book.series_id == "B0SERIES999"
    assert book.series_name == "Dungeon Crawler Carl"
    assert book.series_position == 1.0
    assert book.description == "First paragraph.\nSecond paragraph."
    assert "<p>" not in book.description


def test_parse_audible_product_handles_contributor_objects_and_fallback_fields():
    book = _parse_product(
        {
            "asin": "B0CONTRIB12",
            "title": "Test",
            "contributors": {
                "authors": {"name": "Auteur"},
                "narrators": {"name": "Narrateur"},
            },
            "series_info": {"name": "Série test", "position": "2.5"},
        },
        "fr",
    )

    assert book is not None
    assert book.authors == ["Auteur"]
    assert any(
        field.label == "Narrateur" and field.value == "Narrateur"
        for field in book.display_fields
    )
    assert book.series_name == "Série test"
    assert book.series_position == 2.5



def test_audible_series_parser_handles_hardcover_like_nested_series():
    from shelfmark.metadata_providers.audible import _series_fields

    series_id, series_name, position = _series_fields(
        {
            "featured_series": {
                "position": "3",
                "series": {
                    "asin": "B0SERIES999",
                    "name": "Dungeon Crawler Carl",
                },
            }
        }
    )

    assert series_id == "B0SERIES999"
    assert series_name == "Dungeon Crawler Carl"
    assert position == 3.0


def test_audible_description_decodes_html_entities_and_uses_real_newlines():
    from shelfmark.metadata_providers.audible import _clean_description

    description = _clean_description(
        "<p>Premier &amp; deuxième</p><p>Troisième</p>"
    )

    assert description == "Premier & deuxième\nTroisième"
    assert "\\n" not in description
    assert "<p>" not in description



def test_audible_requests_series_response_group_for_search_and_details(monkeypatch):
    provider = AudibleProvider(marketplace="fr")
    calls = []

    def fake_request(path, params):
        calls.append((path, dict(params)))
        return {
            "products": [
                {
                    "asin": "B0BOOK1234",
                    "title": "Dungeon Crawler Carl",
                    "series": [
                        {
                            "asin": "B0SERIES999",
                            "title": "Dungeon Crawler Carl",
                            "sequence": "1",
                        }
                    ],
                }
            ]
        }

    monkeypatch.setattr(provider, "_request", fake_request)

    search_results = provider.search(MetadataSearchOptions(query="Dungeon Crawler Carl"))
    detail = provider.get_book("B0BOOK1234")

    assert search_results[0].series_id == "B0SERIES999"
    assert search_results[0].series_name == "Dungeon Crawler Carl"
    assert search_results[0].series_position == 1.0
    assert detail is not None
    assert detail.series_id == "B0SERIES999"
    assert detail.series_name == "Dungeon Crawler Carl"
    assert all("series" in params["response_groups"].split(",") for _, params in calls)
