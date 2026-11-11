"""Audible marketplace metadata provider for audiobook catalogue searches.

The public catalogue endpoint is unofficial and may change without notice. No
Audible account credentials are required for public catalogue searches.
"""

from contextlib import suppress
from datetime import date
from typing import Any
from urllib.parse import quote

import requests

from shelfmark.core.config import config as app_config
from shelfmark.core.logger import setup_logger
from shelfmark.core.settings_registry import (
    CheckboxField,
    HeadingField,
    SelectField,
    SettingsField,
    register_settings,
)
from shelfmark.metadata_providers import (
    BookMetadata,
    DisplayField,
    MetadataProvider,
    MetadataSearchOptions,
    SearchType,
    SortOrder,
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
    "contributors,product_attrs,product_desc,product_extended_attrs,media,rating"
)
_TIMEOUT_SECONDS = 20
_MAX_RESULTS = 50


def _text(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, dict):
        value = value.get("name") or value.get("value") or value.get("display_name")
    result = " ".join(str(value).split())
    return result or None


def _names(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    names = []
    for item in value:
        name = _text(item)
        if name and name not in names:
            names.append(name)
    return names


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


def _parse_product(product: dict[str, Any], marketplace: str) -> BookMetadata | None:
    asin = _text(product.get("asin") or product.get("product_id"))
    title = _text(product.get("title") or product.get("short_title"))
    if not asin or not title:
        return None

    contributors = product.get("contributors") or {}
    if isinstance(contributors, list):
        authors = _names(
            [entry for entry in contributors if isinstance(entry, dict) and
             str(entry.get("role") or entry.get("role_name") or "").lower() in ("author", "authors")]
        )
        narrators = _names(
            [entry for entry for entry in []]
        )
    else:
        authors = _names(contributors.get("authors") or contributors.get("author"))
        narrators = _names(contributors.get("narrators") or contributors.get("narrator"))

    if isinstance(contributors, list):
        narrators = _names(
            [entry for entry in contributors if isinstance(entry, dict) and
             "narrat" in str(entry.get("role") or entry.get("role_name") or "").lower()]
        )

    publisher = _text(product.get("publisher_name") or product.get("publisher"))
    description = _text(
        product.get("publisher_summary")
        or product.get("merchandising_summary")
        or product.get("product_description")
        or product.get("description")
    )
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
    )


@register_provider("audible")
class AudibleProvider(MetadataProvider):
    """Search public Audible audiobook catalogues."""

    name = "audible"
    display_name = "Audible"
    requires_auth = False
    supported_sorts = (SortOrder.RELEVANCE, SortOrder.POPULARITY, SortOrder.NEWEST)

    def __init__(self, marketplace: str = "fr") -> None:
        self.marketplace = marketplace if marketplace in {item["value"] for item in _AUDIBLE_MARKETPLACES} else "fr"
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
        except (requests.RequestException, ValueError) as exc:
            logger.warning("Audible catalogue request failed (%s): %s", self.marketplace, exc)
            return None

    def _search_payload(self, options: MetadataSearchOptions) -> dict[str, Any] | None:
        query = options.query.strip()
        if not query:
            return None
        page_size = min(max(options.limit, 1), _MAX_RESULTS)
        params: dict[str, Any] = {
            "keywords": query,
            "content_type": "Audiobook",
            "num_results": page_size,
            "page": max(options.page - 1, 0),
            "response_groups": _RESPONSE_GROUPS,
        }
        if options.search_type == SearchType.AUTHOR:
            params.pop("keywords")
            params["author"] = query
        elif options.search_type == SearchType.TITLE:
            params.pop("keywords")
            params["title"] = query

        # Audible's catalogue search endpoint is the storefront search API.
        payload = self._request("catalog/search", params)
        if payload and _product_items(payload):
            return payload

        # Some marketplaces expose the same search through catalog/products.
        return self._request("catalog/products", params)

    def search(self, options: MetadataSearchOptions) -> list[BookMetadata]:
        if options.search_type == SearchType.ISBN:
            return []
        payload = self._search_payload(options)
        results = []
        for product in _product_items(payload):
            book = _parse_product(product, self.marketplace)
            if book:
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
    return {"marketplace": app_config.get("AUDIBLE_MARKETPLACE", "fr")}


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
        ActionButton(
            key="test_connection",
            label="Tester la connexion",
            description="Vérifier l'accès au catalogue public Audible.",
            style="primary",
            callback=_test_audible_connection,
        ),
    ]
