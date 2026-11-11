"""Rule-based scoring for Prowlarr book releases.

The scorer deliberately distinguishes a book title from its series name. A series
match is useful context, but it must not make every sequel look like the requested
volume. Missing release metadata never triggers a negative rule.
"""
import re
import unicodedata
from typing import Any

from shelfmark.core.config import config
from shelfmark.release_sources import Release

_NUMBER = re.compile(r"-?\d+(?:\.\d+)?")
_PLACEHOLDER = re.compile(r"{{\s*([a-z_]+)\s*}}", re.I)


def _text(value: object) -> str:
    raw = unicodedata.normalize("NFKD", str(value or "").casefold())
    raw = "".join(char for char in raw if not unicodedata.combining(char))
    return re.sub(r"[^\w]+", " ", raw, flags=re.UNICODE).strip()


def _num(value: object) -> float | None:
    match = _NUMBER.search(str(value or "").replace(",", "."))
    try:
        return float(match.group()) if match else None
    except ValueError:
        return None


def _first(*values: object) -> object | None:
    return next((v for v in values if v is not None and str(v).strip()), None)


def _volume_from_title(title: str, series_name: str | None = None) -> float | None:
    """Extract explicit volume markers without mistaking publication years/bitrates."""
    patterns = (
        r"\b(?:tome|tom[eé]|t)\.?\s*0*(\d+(?:\.\d+)?)\b",
        r"\b(?:vol(?:ume)?)\.?\s*0*(\d+(?:\.\d+)?)\b",
        r"\b(?:season|saison)\s*0*(\d+(?:\.\d+)?)\b",
        r"\b#\s*0*(\d+(?:\.\d+)?)\b",
    )
    for pattern in patterns:
        match = re.search(pattern, title, re.I)
        if match:
            return _num(match.group(1))

    # Common release convention: "Series Name 2 - Book subtitle".
    if series_name:
        match = re.search(
            re.escape(series_name) + r"\s+(\d{1,2})(?=\s*(?:[-:–—.]|$))",
            title,
            re.I,
        )
        if match:
            return _num(match.group(1))
    return None


def _actual(release: Release, field: str, book: Any) -> object | None:
    extra = release.extra or {}
    attrs = extra.get("torznab_attrs")
    attrs = attrs if isinstance(attrs, dict) else {}
    if field == "title":
        return _first(extra.get("book_title"), release.title)
    if field == "series":
        return _first(extra.get("series_name"), extra.get("series"))
    if field == "volume":
        value = _first(extra.get("series_position"), extra.get("volume"))
        if value is not None:
            return value
        series = getattr(book, "series_name", None)
        return _volume_from_title(release.title or "", str(series) if series else None)
    if field == "author":
        return extra.get("author")
    if field == "language":
        return _first(release.language, extra.get("language"))
    if field == "format":
        formats = extra.get("formats") or []
        match = re.search(r"\b(epub|mobi|azw3?|pdf|cbz|cbr|fb2|djvu|m4b|mp3|m4a)\b", release.title or "", re.I)
        return _first(release.format, *formats, match.group(1) if match else None)
    if field == "indexer":
        return release.indexer
    if field == "bitrate":
        return _first(extra.get("bitrate_value"), attrs.get("bitrate"))
    if field == "sample_rate":
        return _first(extra.get("sample_rate"), attrs.get("samplerate"), attrs.get("sample_rate"))
    if field == "codec":
        match = re.search(r"\b(flac|mp3|aac|m4b|opus|ogg|wav)\b", release.title or "", re.I)
        return _first(extra.get("codec"), attrs.get("codec"), match.group(1) if match else None)
    if field == "channels":
        return _first(extra.get("channels"), attrs.get("channels"))
    if field == "duration":
        return _first(extra.get("duration"), attrs.get("duration"), attrs.get("runtime"))
    return None


def _expected(value: object, book: Any) -> str | None:
    raw = str(value or "").strip()
    if not raw:
        return None
    variables = {
        "book_title": _first(getattr(book, "search_title", None), getattr(book, "title", None)),
        "series_name": getattr(book, "series_name", None),
        "requested_volume": getattr(book, "series_position", None),
        "book_author": _first(
            getattr(book, "search_author", None),
            ", ".join(getattr(book, "authors", []) or []),
        ),
    }
    has_placeholder = bool(_PLACEHOLDER.search(raw))
    resolved = _PLACEHOLDER.sub(
        lambda match: str(variables.get(match.group(1).lower()) or ""), raw
    ).strip()
    if has_placeholder and (not resolved or "{{" in resolved):
        return None
    return resolved or None


def _matches(actual: object, expected: str, operator: str) -> bool:
    if operator == "exists":
        return actual is not None and bool(str(actual).strip())
    if operator == "missing":
        return actual is None or not str(actual).strip()
    if actual is None or not str(actual).strip():
        return False

    actual_text, expected_text = _text(actual), _text(expected)
    if operator in {"greater_than", "greater_or_equal", "less_than", "less_or_equal"}:
        left, right = _num(actual), _num(expected)
        if left is None or right is None:
            return False
        return {
            "greater_than": left > right,
            "greater_or_equal": left >= right,
            "less_than": left < right,
            "less_or_equal": left <= right,
        }[operator]
    if operator in {"equals", "not_equals"}:
        left, right = _num(actual), _num(expected)
        equal = left == right if left is not None and right is not None else actual_text == expected_text
        return equal if operator == "equals" else not equal
    if operator == "contains":
        return bool(expected_text) and expected_text in actual_text
    if operator == "not_contains":
        return bool(expected_text) and expected_text not in actual_text
    if operator == "regex":
        try:
            return re.search(expected, str(actual), re.I) is not None
        except re.error:
            return False
    return False


def score_release(release: Release, book: Any, content_type: str) -> int:
    """Apply the configured scoring profile and store a rule-by-rule explanation."""
    is_audio = content_type == "audiobook"
    enabled_key = "CUSTOM_SCORES_AUDIOBOOKS_ENABLED" if is_audio else "CUSTOM_SCORES_EBOOKS_ENABLED"
    rules_key = "CUSTOM_SCORES_AUDIOBOOK_RULES" if is_audio else "CUSTOM_SCORES_EBOOK_RULES"
    if not config.get(enabled_key, True):
        release.extra["custom_score"] = 0
        release.extra["custom_score_breakdown"] = []
        return 0

    allowed = {
        "title", "series", "volume", "author", "language", "format", "indexer",
        "bitrate", "sample_rate", "codec", "channels", "duration",
    }
    total = 0
    breakdown: list[dict[str, Any]] = []
    for rule in config.get(rules_key, []) or []:
        if not isinstance(rule, dict) or not rule.get("enabled", True):
            continue
        field = str(rule.get("field") or "")
        operator = str(rule.get("operator") or "")
        if field not in allowed:
            continue
        expected = _expected(rule.get("value"), book)
        if expected is None and operator not in {"exists", "missing"}:
            continue
        actual = _actual(release, field, book)
        if not _matches(actual, expected or "", operator):
            continue
        points_value = _num(rule.get("score"))
        if points_value is None:
            continue
        points = int(points_value)
        total += points
        breakdown.append({
            "name": str(rule.get("name") or field),
            "field": field,
            "score": points,
            "matched_value": str(actual) if actual is not None else None,
        })

    release.extra["custom_score"] = total
    release.extra["custom_score_breakdown"] = breakdown
    return total


def minimum_score(content_type: str) -> int:
    key = "CUSTOM_SCORES_AUDIOBOOK_MINIMUM" if content_type == "audiobook" else "CUSTOM_SCORES_EBOOK_MINIMUM"
    return int(_num(config.get(key, 0)) or 0)
