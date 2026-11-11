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
