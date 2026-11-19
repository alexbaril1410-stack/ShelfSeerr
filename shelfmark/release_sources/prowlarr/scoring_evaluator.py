"""Tri-state evaluator for reusable Prowlarr custom formats.

This module is deliberately not wired into the active release-ranking pipeline yet.
Missing keys mean unavailable metadata (UNKNOWN); an explicit None or empty value
means the source knows the field is missing.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from enum import StrEnum
from typing import Any, Mapping

from shelfmark.release_sources.prowlarr.scoring_models import Condition, ConditionGroup


class MatchState(StrEnum):
    MATCH = "match"
    NO_MATCH = "no_match"
    UNKNOWN = "unknown"


@dataclass(frozen=True)
class ConditionEvaluation:
    """One node of the evaluation tree, retained for the future simulator."""

    state: MatchState
    path: str
    field: str | None = None
    operator: str | None = None
    actual: Any = None
    expected: Any = None
    required: bool = False
    children: tuple[ConditionEvaluation, ...] = ()


@dataclass(frozen=True)
class EvaluationResult:
    """Effective result plus explicit required-condition diagnostics."""

    state: MatchState
    tree: ConditionEvaluation
    required_failures: tuple[str, ...] = ()
    required_unknown: tuple[str, ...] = ()


_PLACEHOLDER = re.compile(r"^{{\s*([a-z_][a-z0-9_]*)\s*}}$", re.IGNORECASE)
_NUMERIC_OPERATORS = {
    "greater_than", "greater_or_equal", "less_than", "less_or_equal",
}


def _is_missing(value: Any) -> bool:
    return value is None or (isinstance(value, str) and not value.strip())


def _resolve_expected(value: Any, context: Mapping[str, Any]) -> tuple[Any, bool]:
    if isinstance(value, str):
        match = _PLACEHOLDER.fullmatch(value)
        if match:
            key = match.group(1)
            if key not in context or _is_missing(context[key]):
                return None, False
            return context[key], True
    return value, True


def _number(value: Any) -> float | None:
    if isinstance(value, bool) or value is None:
        return None
    try:
        return float(str(value).replace(",", "."))
    except (TypeError, ValueError):
        return None


def _compare(actual: Any, operator: str, expected: Any) -> MatchState:
    if operator == "exists":
        return MatchState.NO_MATCH if _is_missing(actual) else MatchState.MATCH
    if operator == "missing":
        return MatchState.MATCH if _is_missing(actual) else MatchState.NO_MATCH

    if operator in _NUMERIC_OPERATORS:
        left, right = _number(actual), _number(expected)
        if left is None or right is None:
            return MatchState.NO_MATCH
        comparisons = {
            "greater_than": left > right,
            "greater_or_equal": left >= right,
            "less_than": left < right,
            "less_or_equal": left <= right,
        }
        return MatchState.MATCH if comparisons[operator] else MatchState.NO_MATCH

    actual_text = str(actual).casefold()
    expected_text = str(expected).casefold()
    if operator == "equals":
        matched = actual_text == expected_text
    elif operator == "not_equals":
        matched = actual_text != expected_text
    elif operator == "contains":
        matched = expected_text in actual_text
    elif operator == "not_contains":
        matched = expected_text not in actual_text
    elif operator == "regex":
        try:
            matched = re.search(str(expected), str(actual), re.IGNORECASE) is not None
        except re.error:
            return MatchState.NO_MATCH
    else:
        return MatchState.NO_MATCH
    return MatchState.MATCH if matched else MatchState.NO_MATCH


def _evaluate_node(
    node: Condition | ConditionGroup,
    metadata: Mapping[str, Any],
    context: Mapping[str, Any],
    path: str,
) -> tuple[ConditionEvaluation, list[str], list[str]]:
    if isinstance(node, ConditionGroup):
        child_results = [
            _evaluate_node(child, metadata, context, f"{path}.conditions[{index}]")
            for index, child in enumerate(node.conditions)
        ]
        children = tuple(item[0] for item in child_results)
        states = [child.state for child in children]
        if node.operator == "all":
            state = (
                MatchState.NO_MATCH if MatchState.NO_MATCH in states
                else MatchState.UNKNOWN if MatchState.UNKNOWN in states
                else MatchState.MATCH
            )
        else:
            state = (
                MatchState.MATCH if MatchState.MATCH in states
                else MatchState.UNKNOWN if MatchState.UNKNOWN in states
                else MatchState.NO_MATCH
            )
        failures = [path for _, failed, _ in child_results for path in failed]
        unknown = [path for _, _, pending in child_results for path in pending]
        if failures:
            state = MatchState.NO_MATCH
        elif unknown and state == MatchState.MATCH:
            state = MatchState.UNKNOWN
        return (
            ConditionEvaluation(state=state, path=path, children=children),
            failures,
            unknown,
        )

    # An absent key means the provider did not supply this metadata. An explicit
    # None/empty value is a known absence and can therefore satisfy "missing".
    if node.field not in metadata:
        state, actual = MatchState.UNKNOWN, None
    else:
        actual = metadata[node.field]
        expected, resolved = _resolve_expected(node.value, context)
        if not resolved:
            state = MatchState.UNKNOWN
        elif _is_missing(actual) and node.operator not in ("exists", "missing"):
            state = MatchState.NO_MATCH
        else:
            state = _compare(actual, node.operator, expected)

    if node.negate:
        if state == MatchState.MATCH:
            state = MatchState.NO_MATCH
        elif state == MatchState.NO_MATCH:
            state = MatchState.MATCH

    failures = [path] if node.required and state == MatchState.NO_MATCH else []
    unknown = [path] if node.required and state == MatchState.UNKNOWN else []
    return (
        ConditionEvaluation(
            state=state,
            path=path,
            field=node.field,
            operator=node.operator,
            actual=actual,
            expected=node.value,
            required=node.required,
        ),
        failures,
        unknown,
    )


def evaluate_conditions(
    conditions: Condition | ConditionGroup,
    metadata: Mapping[str, Any],
    context: Mapping[str, Any] | None = None,
) -> EvaluationResult:
    """Evaluate a condition tree with three-valued logic and required constraints.

    A required condition that is false forces NO_MATCH. A required condition that
    is unknown prevents a positive MATCH, but does not override an already-false
    group. Negation never turns UNKNOWN into a known result.
    """
    tree, failures, unknown = _evaluate_node(
        conditions, metadata, context or {}, "conditions"
    )
    return EvaluationResult(
        state=tree.state,
        tree=tree,
        required_failures=tuple(failures),
        required_unknown=tuple(unknown),
    )


def build_release_metadata(release: Any) -> dict[str, Any]:
    """Project known Release fields into the stable custom-format field vocabulary.

    Unknown/unavailable fields are omitted so the evaluator can preserve UNKNOWN.
    This adapter intentionally does not infer a volume from a title or guess audio
    properties from a filename.
    """
    extra = getattr(release, "extra", None)
    extra = extra if isinstance(extra, Mapping) else {}
    metadata: dict[str, Any] = {}

    direct_fields = {
        "title": getattr(release, "title", None),
        "format": getattr(release, "format", None),
        "language": getattr(release, "language", None),
        "indexer": getattr(release, "indexer", None),
    }
    extra_fields = {
        "series": extra.get("series_name") or extra.get("series"),
        "author": extra.get("author"),
        "volume": extra.get("volume") or extra.get("series_position"),
        "multi_volume_bundle": extra.get("multi_volume_bundle"),
        "codec": extra.get("codec"),
        "sample_rate": extra.get("sample_rate"),
        "channels": extra.get("channels"),
        "duration": extra.get("duration"),
    }

    bitrate = extra.get("bitrate_value")
    if bitrate is None:
        bitrate = extra.get("bitrate")
    if bitrate is not None:
        extra_fields["bitrate"] = bitrate

    for field_name, value in (direct_fields | extra_fields).items():
        if value is not None and not (isinstance(value, str) and not value.strip()):
            metadata[field_name] = value

    return metadata


def build_book_context(book: Any, requested_volume: Any = None) -> dict[str, Any]:
    """Build the supported dynamic values used by custom-format placeholders."""
    context: dict[str, Any] = {}
    author = getattr(book, "search_author", None)
    if not author:
        authors = getattr(book, "authors", None) or []
        author = ", ".join(str(item) for item in authors if item)
    if author:
        context["book_author"] = author
    if requested_volume is not None:
        context["requested_volume"] = requested_volume
    return context
