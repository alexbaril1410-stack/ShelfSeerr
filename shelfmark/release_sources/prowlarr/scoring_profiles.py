"""Profile-specific scoring for the next-generation Prowlarr engine.

This module is intentionally separate from the active release-ranking pipeline.
Unknown format matches are represented as score intervals, not silently treated
as either matches or failures.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Any, Mapping

from shelfmark.release_sources.prowlarr.scoring_evaluator import (
    EvaluationResult,
    MatchState,
    evaluate_conditions,
)
from shelfmark.release_sources.prowlarr.scoring_models import (
    ContentType,
    ScoringConfiguration,
    ScoringProfile,
    validate_configuration,
)


class ScoreDecision(StrEnum):
    BELOW_MINIMUM = "below_minimum"
    ACCEPTABLE = "acceptable"
    TARGET_REACHED = "target_reached"
    IMPROVEMENT_TOO_SMALL = "improvement_too_small"
    UNKNOWN = "unknown"


@dataclass(frozen=True)
class FormatScoreBreakdown:
    """One profile assignment and its evaluated score contribution."""

    format_id: str
    format_name: str
    state: MatchState | None
    configured_score: int
    contribution: int
    evaluation: EvaluationResult | None
    skipped_reason: str | None = None


@dataclass(frozen=True)
class ProfileScoreResult:
    """Score, uncertainty interval, and threshold decision for one profile."""

    profile_id: str
    profile_name: str
    content_type: ContentType
    known_score: int
    minimum_possible_score: int
    maximum_possible_score: int
    minimum_score: int
    target_score: int
    minimum_improvement: int
    current_score: int | None
    minimum_improvement_delta: int | None
    maximum_improvement_delta: int | None
    decision: ScoreDecision
    breakdown: tuple[FormatScoreBreakdown, ...]

    @property
    def is_definitely_eligible(self) -> bool:
        return self.minimum_possible_score >= self.minimum_score

    @property
    def is_possibly_eligible(self) -> bool:
        return self.maximum_possible_score >= self.minimum_score


def _decision(
    *,
    lower: int,
    upper: int,
    profile: ScoringProfile,
    current_score: int | None,
) -> tuple[ScoreDecision, int | None, int | None]:
    if upper < profile.minimum_score:
        return ScoreDecision.BELOW_MINIMUM, None, None
    if lower < profile.minimum_score:
        return ScoreDecision.UNKNOWN, None, None

    min_delta = max_delta = None
    if current_score is not None and profile.minimum_improvement > 0:
        min_delta = lower - current_score
        max_delta = upper - current_score
        if max_delta < profile.minimum_improvement:
            return ScoreDecision.IMPROVEMENT_TOO_SMALL, min_delta, max_delta
        if min_delta < profile.minimum_improvement:
            return ScoreDecision.UNKNOWN, min_delta, max_delta

    if profile.target_score > 0:
        if lower >= profile.target_score:
            return ScoreDecision.TARGET_REACHED, min_delta, max_delta
        if upper >= profile.target_score:
            return ScoreDecision.UNKNOWN, min_delta, max_delta

    return ScoreDecision.ACCEPTABLE, min_delta, max_delta


def score_release(
    configuration: ScoringConfiguration,
    profile_id: str,
    metadata: Mapping[str, Any],
    context: Mapping[str, Any] | None = None,
    current_score: int | None = None,
) -> ProfileScoreResult:
    """Evaluate a release against one enabled profile without mutating inputs.

    MATCH contributes the assigned score. NO_MATCH contributes zero. UNKNOWN
    contributes zero to the known subtotal and expands the possible score range
    by the negative/positive value it could contribute.
    """
    validate_configuration(configuration)
    profiles = {profile.id: profile for profile in configuration.profiles}
    profile = profiles.get(profile_id)
    if profile is None:
        raise ValueError(f"unknown scoring profile '{profile_id}'")
    if not profile.enabled:
        raise ValueError(f"scoring profile '{profile_id}' is disabled")

    formats = {item.id: item for item in configuration.custom_formats}
    known_score = 0
    lower = 0
    upper = 0
    breakdown: list[FormatScoreBreakdown] = []

    for assignment in profile.format_scores:
        custom_format = formats[assignment.format_id]
        configured_score = assignment.score

        if not assignment.enabled:
            breakdown.append(FormatScoreBreakdown(
                format_id=custom_format.id,
                format_name=custom_format.name,
                state=None,
                configured_score=configured_score,
                contribution=0,
                evaluation=None,
                skipped_reason="assignment_disabled",
            ))
            continue
        if not custom_format.enabled:
            breakdown.append(FormatScoreBreakdown(
                format_id=custom_format.id,
                format_name=custom_format.name,
                state=None,
                configured_score=configured_score,
                contribution=0,
                evaluation=None,
                skipped_reason="format_disabled",
            ))
            continue

        evaluation = evaluate_conditions(custom_format.conditions, metadata, context)
        contribution = 0
        if evaluation.state == MatchState.MATCH:
            contribution = configured_score
            known_score += contribution
            lower += contribution
            upper += contribution
        elif evaluation.state == MatchState.UNKNOWN:
            lower += min(configured_score, 0)
            upper += max(configured_score, 0)
        breakdown.append(FormatScoreBreakdown(
            format_id=custom_format.id,
            format_name=custom_format.name,
            state=evaluation.state,
            configured_score=configured_score,
            contribution=contribution,
            evaluation=evaluation,
        ))

    decision, min_delta, max_delta = _decision(
        lower=lower,
        upper=upper,
        profile=profile,
        current_score=current_score,
    )
    return ProfileScoreResult(
        profile_id=profile.id,
        profile_name=profile.name,
        content_type=profile.content_type,
        known_score=known_score,
        minimum_possible_score=lower,
        maximum_possible_score=upper,
        minimum_score=profile.minimum_score,
        target_score=profile.target_score,
        minimum_improvement=profile.minimum_improvement,
        current_score=current_score,
        minimum_improvement_delta=min_delta,
        maximum_improvement_delta=max_delta,
        decision=decision,
        breakdown=tuple(breakdown),
    )
