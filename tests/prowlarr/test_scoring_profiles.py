import pytest

from shelfmark.release_sources.prowlarr.scoring_config_store import default_scoring_configuration
from shelfmark.release_sources.prowlarr.scoring_evaluator import MatchState
from shelfmark.release_sources.prowlarr.scoring_models import (
    Condition,
    ConditionGroup,
    CustomFormat,
    ProfileFormatScore,
    ScoringConfiguration,
    ScoringProfile,
)
from shelfmark.release_sources.prowlarr.scoring_profiles import (
    ScoreDecision,
    score_release,
)


def _configuration(*, enabled=True, minimum=0, target=0, gap=0, assignments=None):
    formats = (
        CustomFormat(
            id="french",
            name="Langue française",
            content_types=("ebook",),
            conditions=ConditionGroup(
                conditions=(Condition(field="language", operator="equals", value="fr"),),
            ),
        ),
        CustomFormat(
            id="epub",
            name="Format EPUB",
            content_types=("ebook",),
            conditions=ConditionGroup(
                conditions=(Condition(field="format", operator="equals", value="epub"),),
            ),
        ),
        CustomFormat(
            id="bundle",
            name="Compilation",
            content_types=("ebook",),
            conditions=ConditionGroup(
                conditions=(Condition(field="multi_volume_bundle", operator="equals", value=True),),
            ),
        ),
    )
    return ScoringConfiguration(
        custom_formats=formats,
        profiles=(
            ScoringProfile(
                id="balanced",
                name="Équilibré",
                content_type="ebook",
                enabled=enabled,
                format_scores=tuple(assignments or (
                    ProfileFormatScore(format_id="french", score=50),
                    ProfileFormatScore(format_id="epub", score=20),
                    ProfileFormatScore(format_id="bundle", score=-100),
                )),
                minimum_score=minimum,
                target_score=target,
                minimum_improvement=gap,
            ),
        ),
    )


def test_matching_formats_add_profile_specific_scores():
    result = score_release(
        _configuration(),
        "balanced",
        {"language": "fr", "format": "epub", "multi_volume_bundle": False},
    )

    assert result.known_score == 70
    assert result.minimum_possible_score == result.maximum_possible_score == 70
    assert result.decision == ScoreDecision.ACCEPTABLE
    assert [item.contribution for item in result.breakdown] == [50, 20, 0]
    assert [item.state for item in result.breakdown] == [
        MatchState.MATCH, MatchState.MATCH, MatchState.NO_MATCH,
    ]


def test_unknown_positive_and_negative_formats_create_score_interval():
    result = score_release(_configuration(), "balanced", {"language": "fr"})

    assert result.known_score == 50
    assert result.minimum_possible_score == -50
    assert result.maximum_possible_score == 70
    assert result.decision == ScoreDecision.ACCEPTABLE


def test_unknown_positive_format_can_make_minimum_threshold_uncertain():
    result = score_release(
        _configuration(minimum=60),
        "balanced",
        {"language": "fr"},
    )

    assert result.minimum_possible_score == 50
    assert result.maximum_possible_score == 70
    assert result.decision == ScoreDecision.UNKNOWN
    assert result.is_possibly_eligible
    assert not result.is_definitely_eligible


def test_unknown_negative_format_can_make_release_definitely_below_minimum():
    result = score_release(
        _configuration(minimum=0),
        "balanced",
        {"language": "en", "format": "pdf"},
    )

    assert result.minimum_possible_score == -100
    assert result.maximum_possible_score == 0
    assert result.decision == ScoreDecision.UNKNOWN


def test_release_below_minimum_is_rejected_when_even_upper_bound_is_too_low():
    result = score_release(
        _configuration(minimum=10),
        "balanced",
        {"language": "en", "format": "pdf", "multi_volume_bundle": True},
    )

    assert result.minimum_possible_score == -100
    assert result.maximum_possible_score == -100
    assert result.decision == ScoreDecision.BELOW_MINIMUM


def test_disabled_assignment_and_format_do_not_contribute():
    configuration = _configuration(assignments=(
        ProfileFormatScore(format_id="french", score=50, enabled=False),
        ProfileFormatScore(format_id="epub", score=20),
        ProfileFormatScore(format_id="bundle", score=-100),
    ))
    formats = tuple(
        CustomFormat(
            id=item.id,
            name=item.name,
            description=item.description,
            enabled=False if item.id == "epub" else item.enabled,
            content_types=item.content_types,
            conditions=item.conditions,
        )
        for item in configuration.custom_formats
    )
    configuration = ScoringConfiguration(
        custom_formats=formats,
        profiles=configuration.profiles,
    )

    result = score_release(
        configuration,
        "balanced",
        {"language": "fr", "format": "epub", "multi_volume_bundle": True},
    )

    assert result.known_score == -100
    assert result.breakdown[0].skipped_reason == "assignment_disabled"
    assert result.breakdown[1].skipped_reason == "format_disabled"
    assert result.breakdown[2].contribution == -100


def test_target_is_reported_only_when_guaranteed_by_score_interval():
    certain = score_release(
        _configuration(target=60),
        "balanced",
        {"language": "fr", "format": "epub", "multi_volume_bundle": False},
    )
    uncertain = score_release(
        _configuration(target=60),
        "balanced",
        {"language": "fr"},
    )

    assert certain.decision == ScoreDecision.TARGET_REACHED
    assert uncertain.decision == ScoreDecision.UNKNOWN


def test_minimum_improvement_compares_incoming_score_to_current_release():
    enough = score_release(
        _configuration(gap=25),
        "balanced",
        {"language": "fr", "format": "epub", "multi_volume_bundle": False},
        current_score=40,
    )
    too_small = score_release(
        _configuration(gap=35),
        "balanced",
        {"language": "fr", "format": "epub", "multi_volume_bundle": False},
        current_score=40,
    )

    assert enough.minimum_improvement_delta == 30
    assert enough.decision == ScoreDecision.ACCEPTABLE
    assert too_small.decision == ScoreDecision.IMPROVEMENT_TOO_SMALL


def test_unknown_score_can_make_improvement_gap_uncertain():
    result = score_release(
        _configuration(gap=25),
        "balanced",
        {"language": "fr"},
        current_score=40,
    )

    assert result.minimum_improvement_delta == 10
    assert result.maximum_improvement_delta == 30
    assert result.decision == ScoreDecision.UNKNOWN


def test_no_current_release_means_no_improvement_gate():
    result = score_release(
        _configuration(gap=100),
        "balanced",
        {"language": "fr", "format": "epub", "multi_volume_bundle": False},
    )

    assert result.minimum_improvement_delta is None
    assert result.maximum_improvement_delta is None
    assert result.decision == ScoreDecision.ACCEPTABLE


def test_disabled_or_unknown_profile_is_not_scored():
    with pytest.raises(ValueError, match="disabled"):
        score_release(_configuration(enabled=False), "balanced", {})

    with pytest.raises(ValueError, match="unknown scoring profile"):
        score_release(_configuration(), "missing", {})


def test_default_profiles_remain_disabled_and_are_not_activated_by_scoring():
    configuration = default_scoring_configuration()
    profile = next(item for item in configuration.profiles if item.id == "ebook-equilibre")

    with pytest.raises(ValueError, match="disabled"):
        score_release(configuration, profile.id, {"language": "fr"})
