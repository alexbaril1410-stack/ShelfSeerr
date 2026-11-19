import pytest

from shelfmark.release_sources.prowlarr.scoring_models import (
    Condition,
    ConditionGroup,
    CustomFormat,
    ProfileFormatScore,
    ScoringConfiguration,
    ScoringProfile,
    configuration_from_dict,
    configuration_to_dict,
    validate_configuration,
)


def _configuration():
    reusable = CustomFormat(
        id="french-flac",
        name="Audio français sans perte",
        content_types=("audiobook",),
        conditions=ConditionGroup(
            operator="all",
            conditions=(
                Condition(field="language", operator="equals", value="fr", required=True),
                ConditionGroup(
                    operator="any",
                    conditions=(
                        Condition(field="codec", operator="equals", value="flac"),
                        Condition(field="codec", operator="equals", value="wav"),
                    ),
                ),
            ),
        ),
    )
    return ScoringConfiguration(
        custom_formats=(reusable,),
        profiles=(
            ScoringProfile(
                id="audio-equilibre",
                name="Audiobooks équilibré",
                content_type="audiobook",
                format_scores=(ProfileFormatScore(format_id="french-flac", score=80),),
                minimum_score=-100,
                target_score=100,
                minimum_improvement=25,
            ),
            ScoringProfile(
                id="audio-exigeant",
                name="Audiobooks exigeant",
                content_type="audiobook",
                format_scores=(ProfileFormatScore(format_id="french-flac", score=250),),
                minimum_score=100,
                target_score=300,
                minimum_improvement=50,
            ),
        ),
    )


def test_custom_format_is_reusable_with_profile_specific_scores():
    configuration = _configuration()

    validate_configuration(configuration)

    assert configuration.profiles[0].format_scores[0].format_id == "french-flac"
    assert configuration.profiles[0].format_scores[0].score == 80
    assert configuration.profiles[1].format_scores[0].format_id == "french-flac"
    assert configuration.profiles[1].format_scores[0].score == 250


def test_nested_condition_groups_support_and_or_and_condition_flags():
    configuration = _configuration()
    serialized = configuration_to_dict(configuration)

    conditions = serialized["custom_formats"][0]["conditions"]
    assert conditions["operator"] == "all"
    assert conditions["conditions"][0]["required"] is True
    assert conditions["conditions"][1]["operator"] == "any"


def test_configuration_round_trip_preserves_nested_groups_and_profiles():
    configuration = _configuration()

    restored = configuration_from_dict(configuration_to_dict(configuration))

    assert restored == configuration


def test_duplicate_custom_format_ids_are_rejected():
    configuration = _configuration()
    duplicate = configuration.custom_formats[0]
    invalid = ScoringConfiguration(custom_formats=(duplicate, duplicate))

    with pytest.raises(ValueError, match="IDs must be unique"):
        validate_configuration(invalid)


def test_profile_cannot_reference_unknown_custom_format():
    configuration = ScoringConfiguration(
        profiles=(
            ScoringProfile(
                id="ebook-default",
                name="Ebooks",
                content_type="ebook",
                format_scores=(ProfileFormatScore(format_id="missing", score=10),),
            ),
        ),
    )

    with pytest.raises(ValueError, match="unknown custom format"):
        validate_configuration(configuration)


def test_custom_format_cannot_be_assigned_to_incompatible_content_type():
    configuration = ScoringConfiguration(
        custom_formats=(
            CustomFormat(
                id="ebook-only",
                name="EPUB",
                content_types=("ebook",),
                conditions=ConditionGroup(
                    conditions=(Condition(field="format", operator="equals", value="epub"),),
                ),
            ),
        ),
        profiles=(
            ScoringProfile(
                id="audio",
                name="Audiobooks",
                content_type="audiobook",
                format_scores=(ProfileFormatScore(format_id="ebook-only", score=10),),
            ),
        ),
    )

    with pytest.raises(ValueError, match="unavailable for audiobook"):
        validate_configuration(configuration)


def test_invalid_regular_expression_is_rejected():
    configuration = ScoringConfiguration(
        custom_formats=(
            CustomFormat(
                id="invalid-regex",
                name="Expression invalide",
                conditions=ConditionGroup(
                    conditions=(Condition(field="title", operator="regex", value="["),),
                ),
            ),
        ),
    )

    with pytest.raises(ValueError, match="invalid regular expression"):
        validate_configuration(configuration)


def test_empty_condition_group_is_rejected():
    configuration = ScoringConfiguration(
        custom_formats=(
            CustomFormat(id="empty", name="Vide", conditions=ConditionGroup()),
        ),
    )

    with pytest.raises(ValueError, match="cannot be empty"):
        validate_configuration(configuration)


def test_negative_minimum_improvement_is_rejected():
    configuration = ScoringConfiguration(
        profiles=(
            ScoringProfile(
                id="ebook",
                name="Ebooks",
                content_type="ebook",
                minimum_improvement=-1,
            ),
        ),
    )

    with pytest.raises(ValueError, match="cannot be negative"):
        validate_configuration(configuration)
