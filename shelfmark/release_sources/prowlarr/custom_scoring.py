"""Rule-based scoring for Prowlarr book releases."""
import re
from typing import Any

from shelfmark.core.config import config
from shelfmark.release_sources import Release

_NUMBER = re.compile(r"-?\d+(?:\.\d+)?")
_PLACEHOLDER = re.compile(r"{{\s*([a-z_]+)\s*}}", re.I)
_VOLUME = re.compile(r"\b(?:tome|t\.?|vol(?:ume)?|book)\s*#?\s*(\d+(?:\.\d+)?)\b", re.I)


def _text(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "").casefold()).strip()


def _num(value: object) -> float | None:
    match = _NUMBER.search(str(value or "").replace(",", "."))
    try:
        return float(match.group()) if match else None
    except ValueError:
        return None


def _first(*values: object) -> object | None:
    return next((v for v in values if v is not None and str(v).strip()), None)


def _actual(release: Release, field: str) -> object | None:
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
        match = _VOLUME.search(release.title or "")
        return match.group(1) if match else None
    if field == "author":
        return extra.get("author")
    if field == "language":
        return _first(release.language, extra.get("language"))
    if field == "format":
        match = re.search(r"\b(epub|mobi|azw3?|pdf|cbz|cbr|fb2|djvu)\b", release.title or "", re.I)
        return _first(release.format, *(extra.get("formats") or []), match.group(1) if match else None)
    if field == "indexer":
        return release.indexer
    if field == "bitrate":
        return _first(extra.get("bitrate_value"), extra.get("bitrate"), attrs.get("bitrate"))
    if field == "sample_rate":
        return _first(extra.get("sample_rate"), attrs.get("samplerate"), attrs.get("sample_rate"))
    if field == "codec":
        match = re.search(r"\b(flac|mp3|aac|m4b|opus|ogg|wav)\b", release.title or "", re.I)
        return _first(extra.get("codec"), attrs.get("codec"), match.group(1) if match else None)
    if field == "channels":
        return _first(extra.get("channels"), attrs.get("channels"))
    if field == "duration":
        return _first(extra.get("duration"), attrs.get("duration"))
    return None


def _expected(value: object, book: Any) -> str | None:
    raw = str(value or "").strip()
    if not raw:
        return None
    variables = {
        "book_title": _first(getattr(book, "search_title", None), getattr(book, "title", None)),
        "series_name": getattr(book, "series_name", None),
        "requested_volume": getattr(book, "series_position", None),
        "book_author": _first(getattr(book, "search_author", None), ", ".join(getattr(book, "authors", []) or [])),
    }
    had_placeholder = bool(_PLACEHOLDER.search(raw))
    resolved = _PLACEHOLDER.sub(lambda m: str(variables.get(m.group(1).lower()) or ""), raw).strip()
    if had_placeholder and (not resolved or "{{" in resolved):
        return None
    return resolved or None


def _matches(actual: object, expected: str, op: str) -> bool:
    if op == "exists":
        return actual is not None and bool(str(actual).strip())
    if op == "missing":
        return actual is None or not str(actual).strip()
    if actual is None or not str(actual).strip():
        return False
    a, b = _text(actual), _text(expected)
    if op in {"greater_than", "greater_or_equal", "less_than", "less_or_equal"}:
        x, y = _num(actual), _num(expected)
        if x is None or y is None:
            return False
        return {"greater_than": x > y, "greater_or_equal": x >= y, "less_than": x < y, "less_or_equal": x <= y}[op]
    if op in {"equals", "not_equals"}:
        x, y = _num(actual), _num(expected)
        equal = x == y if x is not None and y is not None else a == b
        return equal if op == "equals" else not equal
    if op == "contains":
        return b in a
    if op == "not_contains":
        return b not in a
    if op == "regex":
        try:
            return re.search(expected, str(actual), re.I) is not None
        except re.error:
            return False
    return False


def score_release(release: Release, book: Any, content_type: str) -> int:
    """Apply the active profile, storing score and matched rules in release.extra."""
    audio = content_type == "audiobook"
    enabled_key = "CUSTOM_SCORES_AUDIOBOOKS_ENABLED" if audio else "CUSTOM_SCORES_EBOOKS_ENABLED"
    rules_key = "CUSTOM_SCORES_AUDIOBOOK_RULES" if audio else "CUSTOM_SCORES_EBOOK_RULES"
    if not config.get(enabled_key, True):
        release.extra["custom_score"] = 0
        release.extra["custom_score_breakdown"] = []
        return 0

    allowed = {"title", "series", "volume", "author", "language", "format", "indexer",
               "bitrate", "sample_rate", "codec", "channels", "duration"}
    total = 0
    breakdown: list[dict[str, Any]] = []
    for rule in config.get(rules_key, []) or []:
        if not isinstance(rule, dict) or not rule.get("enabled", True):
            continue
        field, op = str(rule.get("field") or ""), str(rule.get("operator") or "")
        if field not in allowed:
            continue
        expected = _expected(rule.get("value"), book)
        if expected is None and op not in {"exists", "missing"}:
            continue
        actual = _actual(release, field)
        if not _matches(actual, expected or "", op):
            continue
        points = _num(rule.get("score"))
        if points is None:
            continue
        points = int(points)
        total += points
        breakdown.append({"name": str(rule.get("name") or field), "field": field,
                          "score": points, "matched_value": str(actual) if actual is not None else None})
    release.extra["custom_score"] = total
    release.extra["custom_score_breakdown"] = breakdown
    return total


def minimum_score(content_type: str) -> int:
    key = "CUSTOM_SCORES_AUDIOBOOK_MINIMUM" if content_type == "audiobook" else "CUSTOM_SCORES_EBOOK_MINIMUM"
    return int(_num(config.get(key, 0)) or 0)
