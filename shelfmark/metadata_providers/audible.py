"""Audible marketplace metadata provider for audiobook catalogue searches.

The public catalogue endpoint is unofficial and may change without notice. No
Audible account credentials are required for public catalogue searches.
"""

from contextlib import suppress
from datetime import date
from html import unescape
from html.parser import HTMLParser
from typing import Any
from urllib.parse import quote

import requests
import re

from shelfmark.core.config import config as app_config
from shelfmark.core.logger import setup_logger
from shelfmark.core.settings_registry import (
    ActionButton,
    CheckboxField,
    HeadingField,
    SelectField,
    SettingsField,
    register_settings,
)
from shelfmark.metadata_providers import (
    BookMetadata,
    DisplayField,
    MetadataCapability,
    MetadataProvider,
    MetadataSearchOptions,
    SearchResult,
    SearchType,
    SortOrder,
    TextSearchField,
    register_provider,
    register_provider_kwargs,
)

logger = setup_logger(__name__)

_AUDIBLE_MARKETPLACES = [
    {"value": "fr", "label": "France (audible.fr)"},
    {"value": "com", "label": "États-Unis (audible.com)"},
    {"value": "co.uk", "label": "Royaume-Uni (audible.co.uk)"},
    {"value": "de", "label": "Allemagne (audible.de)"},
    {"value": "ca", "label": "Canada (audible.ca)"},
    {"value": "es", "label": "Espagne (audible.es)"},
    {"value": "it", "label": "Italie (audible.it)"},
    {"value": "com.au", "label": "Australie (audible.com.au)"},
]
_RESPONSE_GROUPS = (
    "contributors,product_attrs,product_desc,product_extended_attrs,media,rating,series"
)
_TIMEOUT_SECONDS = 20
_MAX_RESULTS = 50
_VOWELS = "uaeio"


def _spelling_variants(query: str, max_variants: int = 5) -> list[str]:
    """Build a small set of likely vowel-typo corrections for a failed search."""
    words = query.split()
    if len(words) != 1 or len(words[0]) < 4:
        return []

    word = words[0]
    variants: list[str] = []
    for index, character in enumerate(word):
        if character.lower() not in _VOWELS:
            continue
        for replacement in _VOWELS:
            if replacement == character.lower():
                continue
            candidate_word = word[:index] + replacement + word[index + 1 :]
            candidate = candidate_word if word.islower() else candidate_word.capitalize()
            if candidate.casefold() not in {word.casefold(), *(item.casefold() for item in variants)}:
                variants.append(candidate)
                if len(variants) >= max_variants:
                    return variants
    return variants


def _text(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, dict):
        value = value.get("name") or value.get("value") or value.get("display_name")
    result = " ".join(str(value).split())
    return result or None


class _DescriptionParser(HTMLParser):
    """Convert Audible HTML descriptions to readable plain text."""

    _BLOCK_TAGS = {"p", "div", "br", "li", "ul", "ol", "h1", "h2", "h3"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() in self._BLOCK_TAGS:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in self._BLOCK_TAGS:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        self.parts.append(data)


def _clean_description(value: Any) -> str | None:
    raw = _text(value)
    if not raw:
        return None
    parser = _DescriptionParser()
    with suppress(Exception):
        parser.feed(unescape(raw))
        parser.close()
        cleaned = "".join(parser.parts)
        lines = [" ".join(line.split()) for line in cleaned.splitlines()]
        result = "\n".join(line for line in lines if line)
        return result or None
    return " ".join(raw.split())


def _names(value: Any) -> list[str]:
    if isinstance(value, dict):
        value = [value]
    elif isinstance(value, str):
        value = [value]
    if not isinstance(value, list):
        return []
    names = []
    for item in value:
        name = _text(item)
        if name and name not in names:
            names.append(name)
    return names


def _contributors(product: dict[str, Any]) -> tuple[list[str], list[str]]:
    authors: list[str] = []
    narrators: list[str] = []
    raw = product.get("contributors")
    if isinstance(raw, dict):
        authors = _names(raw.get("authors") or raw.get("author"))
        narrators = _names(raw.get("narrators") or raw.get("narrator"))
    elif isinstance(raw, list):
        for entry in raw:
            if not isinstance(entry, dict):
                continue
            role = str(entry.get("role") or entry.get("role_name") or "").casefold()
            name = _text(entry)
            if not name:
                continue
            if "author" in role and name not in authors:
                authors.append(name)
            if "narrat" in role and name not in narrators:
                narrators.append(name)

    if not authors:
        authors = _names(product.get("authors") or product.get("author"))
    if not narrators:
        narrators = _names(product.get("narrators") or product.get("narrator"))
    return authors, narrators


def _series_fields(product: dict[str, Any]) -> tuple[str | None, str | None, float | None]:
    """Extract Audible series metadata from its supported nested response shapes."""
    candidates: list[Any] = [
        product.get("series"),
        product.get("series_list"),
        product.get("series_info"),
        product.get("featured_series"),
        product.get("product_extended_attrs"),
    ]
    relationships = product.get("relationships")
    if isinstance(relationships, dict):
        candidates.extend(
            [relationships.get("series"), relationships.get("series_list")]
        )

    for raw in candidates:
        if isinstance(raw, dict):
            # Some responses wrap the actual series object one level deeper.
            nested = raw.get("series")
            if isinstance(nested, dict):
                entry = dict(raw)
                entry.update(nested)
            else:
                entry = raw
            entries = [entry]
        elif isinstance(raw, list):
            entries = [item for item in raw if isinstance(item, dict)]
        else:
            continue

        for entry in entries:
            nested_series = entry.get("series")
            series = nested_series if isinstance(nested_series, dict) else entry
            series_id = _text(
                series.get("asin") or series.get("id") or series.get("series_id")
            )
            series_name = _text(
                series.get("title") or series.get("name") or series.get("series_title")
            )
            raw_position = (
                entry.get("sequence")
                or entry.get("position")
                or entry.get("sequence_number")
                or series.get("sequence")
                or series.get("position")
                or series.get("sequence_number")
            )
            position = None
            with suppress(TypeError, ValueError):
                position = float(str(raw_position).replace(",", "."))
            if series_name or series_id:
                return series_id, series_name, position

    return None, None, None

def _product_items(payload: Any) -> list[dict[str, Any]]:
    if not isinstance(payload, dict):
        return []
    for key in ("items", "products", "product_list"):
        items = payload.get(key)
        if isinstance(items, list):
            return [item for item in items if isinstance(item, dict)]
    nested = payload.get("response")
    if isinstance(nested, dict):
        return _product_items(nested)
    return []


def _cover_url(product: dict[str, Any]) -> str | None:
    images = product.get("product_images") or product.get("images") or {}
    if isinstance(images, dict):
        for key in ("500", "large", "high", "medium"):
            value = images.get(key)
            if isinstance(value, str) and value:
                return value
        for value in images.values():
            if isinstance(value, str) and value:
                return value
    elif isinstance(images, list):
        for image in images:
            if isinstance(image, dict):
                url = image.get("url") or image.get("image_url")
                if url:
                    return str(url)
    return None


def _duration(product: dict[str, Any]) -> str | None:
    raw = product.get("runtime_length_min") or product.get("runtime_length")
    with suppress(TypeError, ValueError):
        minutes = int(float(raw))
        if minutes > 0:
            hours, remainder = divmod(minutes, 60)
            if hours and remainder:
                return f"{hours} h {remainder} min"
            if hours:
                return f"{hours} h"
            return f"{remainder} min"
    return None


def _year(product: dict[str, Any]) -> int | None:
    raw = product.get("release_date") or product.get("publication_date")
    if not raw:
        return None
    with suppress(TypeError, ValueError):
        if isinstance(raw, (int, float)):
            return date.fromtimestamp(raw).year
        return int(str(raw)[:4])
    return None


def _language(product: dict[str, Any]) -> str | None:
    attrs = product.get("language") or product.get("language_code")
    if isinstance(attrs, dict):
        return _text(attrs.get("display_name") or attrs.get("name") or attrs.get("code"))
    return _text(attrs)


def _is_french_language(language: str | None) -> bool:
    if not language:
        return False
    normalized = language.strip().lower().replace("_", "-")
    return (
        normalized in {"fr", "fre", "fra", "french", "français", "francais"}
        or normalized.startswith("fr-")
    )


def _parse_product(product: dict[str, Any], marketplace: str) -> BookMetadata | None:
    asin = _text(product.get("asin") or product.get("product_id"))
    title = _text(product.get("title") or product.get("short_title"))
    if not asin or not title:
        return None

    authors, narrators = _contributors(product)
    publisher = _text(product.get("publisher_name") or product.get("publisher"))
    description = _clean_description(
        product.get("publisher_summary")
        or product.get("merchandising_summary")
        or product.get("product_description")
        or product.get("description")
    )
    series_id, series_name, series_position = _series_fields(product)
    genres = _names(product.get("category_ladders") or product.get("categories"))
    rating = product.get("rating") or {}
    rating_value = None
    if isinstance(rating, dict):
        rating_value = rating.get("average_rating") or rating.get("display_stars") or rating.get("overall_distribution")
        if isinstance(rating_value, dict):
            rating_value = rating_value.get("display_stars") or rating_value.get("average_rating")
    else:
        rating_value = rating

    display_fields: list[DisplayField] = []
    duration = _duration(product)
    if duration:
        display_fields.append(DisplayField(label="Durée", value=duration, icon="clock"))
    if narrators:
        display_fields.append(DisplayField(label="Narrateur", value=", ".join(narrators), icon="mic"))
    if rating_value is not None:
        display_fields.append(DisplayField(label="Note Audible", value=str(rating_value), icon="star"))

    return BookMetadata(
        provider="audible",
        provider_id=asin,
        title=title,
        provider_display_name="Audible",
        authors=authors,
        cover_url=_cover_url(product),
        description=description,
        publisher=publisher,
        publish_year=_year(product),
        language=_language(product),
        genres=genres,
        source_url=f"https://www.audible.{marketplace}/pd/{quote(asin)}",
        cover_aspect="square",
        display_fields=display_fields,
        series_id=series_id,
        series_name=series_name,
        series_position=series_position,
    )


@register_provider("audible")
class AudibleProvider(MetadataProvider):
    """Search public Audible audiobook catalogues."""

    name = "audible"
    display_name = "Audible"
    requires_auth = False
    supported_sorts = (SortOrder.RELEVANCE, SortOrder.POPULARITY, SortOrder.NEWEST, SortOrder.SERIES_ORDER)
    capabilities = (
        MetadataCapability(key="view_series", field_key="series", sort=SortOrder.SERIES_ORDER),
    )
    search_fields = (
        TextSearchField(
            key="series",
            label="Série",
            placeholder="Rechercher une série Audible...",
            description="Afficher les livres audio appartenant à une série",
            suggestions_endpoint="/api/metadata/field-options?provider=audible&field=series",
        ),
    )

    def __init__(self, marketplace: str = "fr", french_only: bool = False) -> None:
        self.marketplace = marketplace if marketplace in {item["value"] for item in _AUDIBLE_MARKETPLACES} else "fr"
        self.french_only = bool(french_only)
        self.base_url = f"https://api.audible.{self.marketplace}/1.0"

    def is_available(self) -> bool:
        return True

    def _request(self, path: str, params: dict[str, Any]) -> dict[str, Any] | None:
        try:
            response = requests.get(
                f"{self.base_url}/{path.lstrip('/')}",
                params=params,
                headers={
                    "Accept": "application/json",
                    "User-Agent": "ShelfSeerr/1.0 (audiobook metadata search)",
                },
                timeout=_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            payload = response.json()
            return payload if isinstance(payload, dict) else None
        except requests.HTTPError as exc:
            response = exc.response
            detail = ""
            if response is not None:
                with suppress(Exception):
                    detail = response.text[:1000].strip()
            logger.warning(
                "Audible catalogue request failed (%s) [%s] %s: %s",
                self.marketplace,
                response.status_code if response is not None else "HTTP",
                exc,
                detail or "no response body",
            )
            return None
        except (requests.RequestException, ValueError) as exc:
            logger.warning("Audible catalogue request failed (%s): %s", self.marketplace, exc)
            return None

    def _search_once(self, query: str, options: MetadataSearchOptions) -> dict[str, Any] | None:
        page_size = min(max(options.limit, 1), _MAX_RESULTS)
        sort_values = {
            SortOrder.RELEVANCE: "Relevance",
            SortOrder.POPULARITY: "BestSellers",
            SortOrder.NEWEST: "-ReleaseDate",
        }
        params: dict[str, Any] = {
            "keywords": query,
            "content_type": "Audiobook",
            "num_results": page_size,
            "page": max(options.page - 1, 0),
            "products_sort_by": sort_values.get(options.sort, "Relevance"),
            "response_groups": _RESPONSE_GROUPS,
        }
        if options.search_type == SearchType.AUTHOR:
            params.pop("keywords")
            params["author"] = query
        elif options.search_type == SearchType.TITLE:
            params.pop("keywords")
            params["title"] = query

        payload = self._request("catalog/search", params)
        if payload and _product_items(payload):
            return payload

        # The catalog/products fallback does not accept content_type.
        fallback_params = dict(params)
        fallback_params.pop("content_type", None)
        payload = self._request("catalog/products", fallback_params)
        return payload if payload and _product_items(payload) else None

    def _search_payload(self, options: MetadataSearchOptions) -> dict[str, Any] | None:
        query = options.query.strip()
        if not query:
            return None

        payload = self._search_once(query, options)
        initial_products = _product_items(payload)
        if options.search_type not in (SearchType.GENERAL, SearchType.TITLE):
            return payload

        # A misspelled query can still return one weak match. Do not treat that
        # as a successful search: enrich it with likely spelling corrections
        # until the requested page is reasonably full.
        page_size = min(max(options.limit, 1), _MAX_RESULTS)
        merged: list[dict[str, Any]] = list(initial_products)
        seen = {
            str(item.get("asin") or item.get("product_id") or "").strip().upper()
            for item in merged
            if item.get("asin") or item.get("product_id")
        }
        if len(merged) >= page_size:
            return payload

        for variant in _spelling_variants(query):
            logger.info(
                "Audible search for %r returned %s result(s); enriching with spelling variant %r",
                query,
                len(merged),
                variant,
            )
            variant_payload = self._search_once(variant, options)
            for product in _product_items(variant_payload):
                asin = str(product.get("asin") or product.get("product_id") or "").strip().upper()
                if asin and asin in seen:
                    continue
                if asin:
                    seen.add(asin)
                merged.append(product)
                if len(merged) >= page_size:
                    break
            if len(merged) >= page_size:
                break

        if merged:
            return {"products": merged}
        return payload



    def get_search_field_options(self, field_key: str, query: str | None = None) -> list[dict[str, str]]:
        """Return Audible series suggestions backed by catalog series relations."""
        if field_key != "series" or len((query or "").strip()) < 2:
            return []
        payload = self._request("catalog/products", {
            "keywords": (query or "").strip(),
            "num_results": 50,
            "response_groups": "series,product_attrs",
        })
        options: list[dict[str, str]] = []
        seen: set[str] = set()
        for product in _product_items(payload):
            raw_series = product.get("series")
            if isinstance(raw_series, dict):
                raw_series = [raw_series]
            if not isinstance(raw_series, list):
                continue
            for series in raw_series:
                if not isinstance(series, dict):
                    continue
                asin = _text(series.get("asin") or series.get("id"))
                name = _text(series.get("title") or series.get("name"))
                if not asin or not name or asin in seen:
                    continue
                seen.add(asin)
                options.append({"value": f"asin:{asin}", "label": name})
        return options[:15]

    def _fetch_series_books(self, series_asin: str, page: int, limit: int) -> SearchResult:
        """Load child products from Audible series relationships in reading order."""
        empty = SearchResult(books=[], page=page, total_found=0, has_more=False)
        payload = self._request("catalog/products", {
            "asins": series_asin,
            "num_results": 1,
            "response_groups": "relationships,product_attrs",
        })
        series_products = _product_items(payload)
        if not series_products:
            return empty
        series_product = series_products[0]
        relationships = series_product.get("relationships")
        if not isinstance(relationships, list):
            return empty

        children: list[tuple[float, str]] = []
        seen: set[str] = set()
        for relation in relationships:
            if not isinstance(relation, dict):
                continue
            asin = _text(relation.get("asin"))
            if relation.get("relationship_to_product") != "child" or relation.get("relationship_type") != "series" or not asin or asin in seen:
                continue
            seen.add(asin)
            try:
                position = float(str(relation.get("sequence")).replace(",", "."))
            except (TypeError, ValueError):
                position = float("inf")
            children.append((position, asin))

        children.sort(key=lambda item: (item[0], item[1]))
        total = len(children)
        offset = max(page - 1, 0) * max(limit, 1)
        page_children = children[offset:offset + max(limit, 1)]
        if not page_children:
            return SearchResult(books=[], page=page, total_found=total, has_more=False)

        book_payload = self._request("catalog/products", {
            "asins": ",".join(asin for _position, asin in page_children),
            "num_results": len(page_children),
            "response_groups": _RESPONSE_GROUPS,
        })
        products = {str(item.get("asin") or "").upper(): item for item in _product_items(book_payload)}
        books: list[BookMetadata] = []
        series_name = _text(series_product.get("title") or series_product.get("name"))
        for position, asin in page_children:
            product = products.get(asin.upper())
            if not product:
                continue
            book = _parse_product(product, self.marketplace)
            if not book or (self.french_only and not _is_french_language(book.language)):
                continue
            book.series_id = series_asin
            book.series_name = series_name or book.series_name
            book.series_position = position if position != float("inf") else book.series_position
            book.series_count = total
            books.append(book)
        return SearchResult(books=books, page=page, total_found=total, has_more=offset + len(page_children) < total)

    def search_paginated(self, options: MetadataSearchOptions) -> SearchResult:
        """Support the full series view workflow, with accurate page metadata."""
        series_value = str(options.fields.get("series", "")).strip()
        if series_value:
            series_asin = series_value.removeprefix("id:").removeprefix("asin:").strip().upper()
            if not re.fullmatch(r"[A-Z0-9]{10}", series_asin):
                return SearchResult(books=[], page=options.page, total_found=0, has_more=False)
            return self._fetch_series_books(series_asin, options.page, options.limit)
        books = self.search(options)
        return SearchResult(books=books, page=options.page, total_found=0, has_more=len(books) >= options.limit)

    def search(self, options: MetadataSearchOptions) -> list[BookMetadata]:
        if options.search_type == SearchType.ISBN:
            return []
        payload = self._search_payload(options)
        results = []
        for product in _product_items(payload):
            book = _parse_product(product, self.marketplace)
            if book and (not self.french_only or _is_french_language(book.language)):
                results.append(book)
        return results

    def get_book(self, book_id: str) -> BookMetadata | None:
        asin = book_id.strip().upper()
        if not asin:
            return None
        payload = self._request(
            f"catalog/products/{quote(asin)}",
            {"response_groups": _RESPONSE_GROUPS},
        )
        products = _product_items(payload)
        if not products and isinstance(payload, dict):
            product = payload.get("product")
            if isinstance(product, dict):
                products = [product]
        return _parse_product(products[0], self.marketplace) if products else None

    def search_by_isbn(self, isbn: str) -> BookMetadata | None:
        # Audible identifies audiobook editions by ASIN, not ISBN.
        return None


@register_provider_kwargs("audible")
def _audible_provider_kwargs() -> dict[str, Any]:
    return {
        "marketplace": app_config.get("AUDIBLE_MARKETPLACE", "fr"),
        "french_only": app_config.get("AUDIBLE_FRENCH_ONLY", False),
    }


def _test_audible_connection(current_values: dict[str, Any] | None = None) -> dict[str, Any]:
    values = current_values or {}
    marketplace = str(values.get("AUDIBLE_MARKETPLACE") or app_config.get("AUDIBLE_MARKETPLACE", "fr"))
    provider = AudibleProvider(marketplace=marketplace)
    payload = provider._request(
        "catalog/search",
        {"keywords": "Harry Potter", "content_type": "Audiobook", "num_results": 1, "response_groups": "product_attrs"},
    )
    if payload is None:
        return {
            "success": False,
            "message": "Impossible de joindre le catalogue Audible. Vérifiez la connexion réseau ou le marketplace.",
        }
    if _product_items(payload):
        return {"success": True, "message": f"Connexion au catalogue Audible ({marketplace}) réussie."}
    return {
        "success": False,
        "message": "Audible répond, mais aucun résultat n'a été retourné par le catalogue.",
    }


@register_settings("audible", "Audible", icon="headphones", order=52, group="metadata_providers")
def audible_settings() -> list[SettingsField]:
    return [
        HeadingField(
            key="audible_heading",
            title="Audible",
            description="Catalogue public de livres audio Audible. Aucun identifiant de compte Audible n'est nécessaire.",
            link_url="https://www.audible.fr",
            link_text="audible.fr",
        ),
        CheckboxField(
            key="AUDIBLE_ENABLED",
            label="Activer Audible",
            description="Rendre Audible disponible comme fournisseur de métadonnées pour les livres audio.",
            default=False,
        ),
        SelectField(
            key="AUDIBLE_MARKETPLACE",
            label="Catalogue Audible",
            description="Le marketplace détermine les langues et les éditions disponibles. France est sélectionné par défaut.",
            options=_AUDIBLE_MARKETPLACES,
            default="fr",
        ),
        CheckboxField(
            key="AUDIBLE_FRENCH_ONLY",
            label="Afficher uniquement les livres en français",
            description="Masquer les livres audio dont la langue n'est pas identifiée comme français, y compris lorsque la langue est inconnue.",
            default=False,
        ),
        ActionButton(
            key="test_connection",
            label="Tester la connexion",
            description="Vérifier l'accès au catalogue public Audible.",
            style="primary",
            callback=_test_audible_connection,
        ),
    ]
