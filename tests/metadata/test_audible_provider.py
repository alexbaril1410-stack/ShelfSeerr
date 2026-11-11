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



def test_audible_search_uses_catalogue_products_endpoint_and_readmeabook_page_size(monkeypatch):
    provider = AudibleProvider(marketplace="fr")
    calls = []

    def fake_request(path, params):
        calls.append((path, dict(params)))
        return {"products": [{
            "asin": "B0ABC12345",
            "title": "Dungeon Crawler Carl",
            "language": "French",
        }], "total_results": 1}

    monkeypatch.setattr(provider, "_request", fake_request)
    results = provider.search(MetadataSearchOptions(query="Dongeon", limit=50, page=1))

    assert len(results) == 1
    assert calls == [("catalog/products", {
        "keywords": "Dongeon",
        "num_results": 50,
        "page": 0,
        "response_groups": "contributors,product_desc,product_attrs,product_extended_attrs,media,rating,series,category_ladders,product_details",
    })]


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


def test_audible_exposes_series_browse_capability():
    provider = AudibleProvider(marketplace="fr")

    assert any(capability.key == "view_series" and capability.field_key == "series" for capability in provider.capabilities)
    assert any(field.key == "series" for field in provider.search_fields)


def test_audible_series_browse_loads_child_books_in_sequence_order(monkeypatch):
    provider = AudibleProvider(marketplace="fr")
    calls = []

    def fake_request(path, params):
        calls.append((path, dict(params)))
        if params.get("asins") == "B0SERIES999":
            return {"products": [{
                "asin": "B0SERIES999",
                "title": "Dungeon Crawler Carl",
                "relationships": [
                    {"asin": "B0BOOK0002", "relationship_to_product": "child", "relationship_type": "series", "sequence": "2"},
                    {"asin": "B0BOOK0001", "relationship_to_product": "child", "relationship_type": "series", "sequence": "1"},
                ],
            }]}
        return {"products": [
            {"asin": "B0BOOK0001", "title": "Book One", "language": "French"},
            {"asin": "B0BOOK0002", "title": "Book Two", "language": "French"},
        ]}

    monkeypatch.setattr(provider, "_request", fake_request)
    result = provider.search_paginated(MetadataSearchOptions(
        query="",
        limit=1,
        page=1,
        fields={"series": "id:B0SERIES999"},
    ))

    assert [book.provider_id for book in result.books] == ["B0BOOK0001"]
    assert result.books[0].series_name == "Dungeon Crawler Carl"
    assert result.books[0].series_position == 1.0
    assert result.books[0].series_count == 2
    assert result.total_found == 2
    assert result.has_more is True
    assert calls[1][1]["asins"] == "B0BOOK0001"


def test_audible_series_suggestions_are_deduplicated(monkeypatch):
    provider = AudibleProvider(marketplace="fr")
    monkeypatch.setattr(provider, "_request", lambda _path, _params: {"products": [
        {"series": [{"asin": "B0SERIES999", "title": "Dungeon Crawler Carl"}]},
        {"series": [{"asin": "B0SERIES999", "title": "Dungeon Crawler Carl"}]},
    ]})

    assert provider.get_search_field_options("series", "Dungeon") == [
        {"value": "asin:B0SERIES999", "label": "Dungeon Crawler Carl"}
    ]


