"""Versioned data model for reusable release formats and scoring profiles.

This module is intentionally independent from the active Prowlarr scoring engine.
It defines and validates the persisted shape for the next scoring architecture;
evaluation and migration are introduced in later steps.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Literal
import re


SCHEMA_VERSION = 1

ContentType = Literal["ebook", "audiobook"]
GroupOperator = Literal["all", "any"]

SUPPORTED_FIELDS = frozenset({
    "title", "series", "volume", "multi_volume_bundle", "author", "language",
    "format", "indexer", "bitrate", "sample_rate", "codec", "channels", "duration",
})
SUPPORTED_OPERATORS = frozenset({
    "equals", "not_equals", "contains", "not_contains", "greater_than",
    "greater_or_equal", "less_than", "less_or_equal", "exists", "missing", "regex",
})


@dataclass(frozen=True)
class Condition:
    """One atomic condition inside a custom format."""

    field: str
    operator: str
    value: str | int | float | bool | None = None
    negate: bool = False
    required: bool = False


@dataclass(frozen=True)
class ConditionGroup:
    """A recursively nested group; all=AND and any=OR."""

    operator: GroupOperator = "all"
    conditions: tuple[Condition | ConditionGroup, ...] = ()


@dataclass(frozen=True)
class CustomFormat:
    """Reusable release-matching definition, independent from profile scores."""

    id: str
    name: str
    description: str = ""
    enabled: bool = True
    content_types: tuple[ContentType, ...] = ("ebook", "audiobook")
    conditions: ConditionGroup = field(default_factory=ConditionGroup)


@dataclass(frozen=True)
class ProfileFormatScore:
    """A profile-specific score assigned to a reusable custom format."""

    format_id: str
    score: int
    enabled: bool = True


@dataclass(frozen=True)
class ScoringProfile:
    """Scoring policy for one content type."""

    id: str
    name: str
    content_type: ContentType
    enabled: bool = True
    format_scores: tuple[ProfileFormatScore, ...] = ()
    minimum_score: int = 0
    target_score: int = 0
    minimum_improvement: int = 0


@dataclass(frozen=True)
class ScoringConfiguration:
    """Top-level persisted configuration with reusable formats and profiles."""

    schema_version: int = SCHEMA_VERSION
    custom_formats: tuple[CustomFormat, ...] = ()
    profiles: tuple[ScoringProfile, ...] = ()


def _require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def _validate_condition(node: Condition | ConditionGroup, path: str) -> None:
    if isinstance(node, ConditionGroup):
        _require(node.operator in ("all", "any"), f"{path}: operator must be 'all' or 'any'")
        _require(bool(node.conditions), f"{path}: condition group cannot be empty")
        for index, child in enumerate(node.conditions):
            _validate_condition(child, f"{path}.conditions[{index}]")
        return

    _require(node.field in SUPPORTED_FIELDS, f"{path}: unsupported field '{node.field}'")
    _require(node.operator in SUPPORTED_OPERATORS, f"{path}: unsupported operator '{node.operator}'")
    if node.operator not in ("exists", "missing"):
        _require(node.value is not None and str(node.value).strip() != "",
                 f"{path}: this operator requires a value")
    if node.operator == "regex":
        try:
            re.compile(str(node.value))
        except re.error as exc:
            raise ValueError(f"{path}: invalid regular expression: {exc}") from exc


def validate_configuration(configuration: ScoringConfiguration) -> None:
    """Validate IDs, references, content types, conditions and thresholds."""
    _require(configuration.schema_version == SCHEMA_VERSION,
             f"unsupported scoring schema version: {configuration.schema_version}")

    format_ids = [item.id for item in configuration.custom_formats]
    profile_ids = [item.id for item in configuration.profiles]
    _require(all(format_ids), "custom format IDs cannot be empty")
    _require(len(format_ids) == len(set(format_ids)), "custom format IDs must be unique")
    _require(all(profile_ids), "profile IDs cannot be empty")
    _require(len(profile_ids) == len(set(profile_ids)), "profile IDs must be unique")

    formats = {item.id: item for item in configuration.custom_formats}
    for item in configuration.custom_formats:
        _require(bool(item.name.strip()), f"custom format '{item.id}' needs a name")
        _require(bool(item.content_types), f"custom format '{item.id}' needs a content type")
        _require(set(item.content_types) <= {"ebook", "audiobook"},
                 f"custom format '{item.id}' has an invalid content type")
        _validate_condition(item.conditions, f"custom_formats.{item.id}.conditions")

    for profile in configuration.profiles:
        _require(bool(profile.name.strip()), f"profile '{profile.id}' needs a name")
        _require(profile.content_type in ("ebook", "audiobook"),
                 f"profile '{profile.id}' has an invalid content type")
        _require(profile.minimum_score <= profile.target_score or profile.target_score == 0,
                 f"profile '{profile.id}': target_score must be 0 or at least minimum_score")
        _require(profile.minimum_improvement >= 0,
                 f"profile '{profile.id}': minimum_improvement cannot be negative")
        assigned_ids = [item.format_id for item in profile.format_scores]
        _require(len(assigned_ids) == len(set(assigned_ids)),
                 f"profile '{profile.id}' assigns a custom format more than once")
        for assignment in profile.format_scores:
            _require(assignment.format_id in formats,
                     f"profile '{profile.id}' references unknown custom format '{assignment.format_id}'")
            _require(profile.content_type in formats[assignment.format_id].content_types,
                     f"profile '{profile.id}' uses a custom format unavailable for {profile.content_type}")


def configuration_to_dict(configuration: ScoringConfiguration) -> dict[str, Any]:
    """Serialize the immutable model to JSON-compatible dictionaries and lists."""
    validate_configuration(configuration)
    return asdict(configuration)


def _condition_from_dict(raw: dict[str, Any]) -> Condition | ConditionGroup:
    if "conditions" in raw:
        return ConditionGroup(
            operator=raw.get("operator", "all"),
            conditions=tuple(_condition_from_dict(child) for child in raw.get("conditions", [])),
        )
    return Condition(
        field=raw.get("field", ""),
        operator=raw.get("operator", ""),
        value=raw.get("value"),
        negate=bool(raw.get("negate", False)),
        required=bool(raw.get("required", False)),
    )


def configuration_from_dict(raw: dict[str, Any]) -> ScoringConfiguration:
    """Parse and validate a configuration loaded from JSON."""
    formats = tuple(
        CustomFormat(
            id=item.get("id", ""),
            name=item.get("name", ""),
            description=item.get("description", ""),
            enabled=bool(item.get("enabled", True)),
            content_types=tuple(item.get("content_types", ("ebook", "audiobook"))),
            conditions=_condition_from_dict(item.get("conditions", {"operator": "all", "conditions": []})),
        )
        for item in raw.get("custom_formats", [])
    )
    profiles = tuple(
        ScoringProfile(
            id=item.get("id", ""),
            name=item.get("name", ""),
            content_type=item.get("content_type", "ebook"),
            enabled=bool(item.get("enabled", True)),
            format_scores=tuple(
                ProfileFormatScore(
                    format_id=assignment.get("format_id", ""),
                    score=int(assignment.get("score", 0)),
                    enabled=bool(assignment.get("enabled", True)),
                )
                for assignment in item.get("format_scores", [])
            ),
            minimum_score=int(item.get("minimum_score", 0)),
            target_score=int(item.get("target_score", 0)),
            minimum_improvement=int(item.get("minimum_improvement", 0)),
        )
        for item in raw.get("profiles", [])
    )
    configuration = ScoringConfiguration(
        schema_version=int(raw.get("schema_version", SCHEMA_VERSION)),
        custom_formats=formats,
        profiles=profiles,
    )
    validate_configuration(configuration)
    return configuration
