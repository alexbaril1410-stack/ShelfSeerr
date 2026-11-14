from shelfmark.metadata_providers import SearchResult, SortOrder
from shelfmark.metadata_providers.hardcover import (
    HARDCOVER_BOOKS_BY_IDS_QUERY,
    HARDCOVER_TRENDING_BOOKS_QUERY,
    HardcoverProvider,
)


def _book(book_id: int, title: str) -> dict:
    return {
        "id": book_id,
        "title": title,
        "slug": title.lower().replace(" ", "-"),
        "release_date": "2024-01-01",
        "rating": 4.2,
        "ratings_count": 10,
        "users_count": 20,
        "cached_image": {"url": f"https://example.com/{book_id}.jpg"},
        "cached_contributors": [{"name": "Test Author"}],
        "cached_tags": [],
        "contributions": [],
        "featured_book_series": [],
    }


def test_discover_trending_uses_hardcover_trending_endpoint_and_preserves_order(monkeypatch):
    provider = HardcoverProvider(api_key="test-token")
    calls = []

    def fake_execute(query, variables):
        calls.append((query, variables))
        if query == HARDCOVER_TRENDING_BOOKS_QUERY:
            return {"books_trending": {"ids": [3, 1, 2]}}
        assert query == HARDCOVER_BOOKS_BY_IDS_QUERY
        return {
            "books": [
                _book(1, "Book One"),
                _book(2, "Book Two"),
                _book(3, "Book Three"),
            ]
        }

    monkeypatch.setattr(provider, "_execute_query", fake_execute)
    monkeypatch.setattr(
        "shelfmark.metadata_providers.hardcover.app_config.get",
        lambda key, default=None: False if key == "HARDCOVER_FRENCH_ONLY" else default,
    )

    result = provider.discover("trending", limit=3)

    assert isinstance(result, SearchResult)
    assert [book.title for book in result.books] == ["Book Three", "Book One", "Book Two"]
    assert calls[0][1] == {"duration": "week", "limit": 3, "offset": 0}
    assert calls[1][1] == {"bookIds": [3, 1, 2]}


def test_discover_popular_uses_hardcover_users_count_sort(monkeypatch):
    provider = HardcoverProvider(api_key="test-token")
    captured = {}

    def fake_search(options):
        captured["query"] = options.query
        captured["sort"] = options.sort
        captured["limit"] = options.limit
        return SearchResult(books=[], page=1, total_found=0, has_more=False)

    monkeypatch.setattr(provider, "search_paginated", fake_search)

    provider.discover("popular", limit=100)

    assert captured == {
        "query": "*",
        "sort": SortOrder.POPULARITY,
        "limit": 40,
    }
