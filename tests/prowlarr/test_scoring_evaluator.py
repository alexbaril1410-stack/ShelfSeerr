import pytest

from shelfmark.release_sources.prowlarr.scoring_evaluator import (
    MatchState,
    evaluate_conditions,
)
from shelfmark.release_sources.prowlarr.scoring_models import Condition, ConditionGroup


@pytest.mark.parametrize(
    ("operator", "metadata", "expected"),
    [
        ("all", {"a": True, "b": True}, MatchState.MATCH),
        ("all", {"a": True, "b": False}, MatchState.NO_MATCH),
        ("all", {"a": True}, MatchState.UNKNOWN),
        ("any", {"a": True, "b": False}, MatchState.MATCH),
        ("any", {"a": False, "b": False}, MatchState.NO_MATCH),
        ("any", {"a": False}, MatchState.UNKNOWN),
    ],
)
def test_and_or_groups_use_three_valued_logic(operator, metadata, expected):
    tree = ConditionGroup(
        operator=operator,
        conditions=(
            Condition(field="a", operator="equals", value=True),
            Condition(field="b", operator="equals", value=True),
        ),
    )

    assert evaluate_conditions(tree, metadata).state == expected


def test_nested_and_or_groups_are_evaluated_recursively():
    tree = ConditionGroup(
        operator="all",
        conditions=(
            Condition(field="language", operator="equals", value="fr"),
            ConditionGroup(
                operator="any",
                conditions=(
                    Condition(field="codec", operator="equals", value="flac"),
                    Condition(field="codec", operator="equals", value="wav"),
                ),
            ),
        ),
    )

    result = evaluate_conditions(tree, {"language": "fr", "codec": "wav"})

    assert result.state == MatchState.MATCH
    assert len(result.tree.children) == 2
    assert result.tree.children[1].state == MatchState.MATCH


def test_missing_key_is_unknown_but_explicit_none_is_known_missing():
    condition = Condition(field="author", operator="exists")

    assert evaluate_conditions(condition, {}).state == MatchState.UNKNOWN
    assert evaluate_conditions(condition, {"author": None}).state == MatchState.NO_MATCH
    assert evaluate_conditions(
        Condition(field="author", operator="missing"), {"author": None}
    ).state == MatchState.MATCH


@pytest.mark.parametrize(
    ("negate", "expected"),
    [(False, MatchState.UNKNOWN), (True, MatchState.UNKNOWN)],
)
def test_negation_preserves_unknown(negate, expected):
    condition = Condition(
        field="codec", operator="equals", value="flac", negate=negate
    )

    assert evaluate_conditions(condition, {}).state == expected


def test_required_false_condition_forces_group_to_no_match():
    tree = ConditionGroup(
        operator="any",
        conditions=(
            Condition(field="codec", operator="equals", value="flac"),
            Condition(field="language", operator="equals", value="fr", required=True),
        ),
    )

    result = evaluate_conditions(tree, {"codec": "flac", "language": "en"})

    assert result.state == MatchState.NO_MATCH
    assert result.required_failures == ("conditions.conditions[1]",)


def test_required_unknown_prevents_positive_match_and_is_reported():
    tree = ConditionGroup(
        operator="any",
        conditions=(
            Condition(field="codec", operator="equals", value="flac"),
            Condition(field="volume", operator="equals", value=2, required=True),
        ),
    )

    result = evaluate_conditions(tree, {"codec": "flac"})

    assert result.state == MatchState.UNKNOWN
    assert result.required_unknown == ("conditions.conditions[1]",)


def test_required_unknown_does_not_hide_an_already_failed_group():
    tree = ConditionGroup(
        operator="all",
        conditions=(
            Condition(field="codec", operator="equals", value="flac"),
            Condition(field="volume", operator="equals", value=2, required=True),
        ),
    )

    result = evaluate_conditions(tree, {"codec": "mp3"})

    assert result.state == MatchState.NO_MATCH
    assert result.required_unknown == ("conditions.conditions[1]",)


def test_missing_context_placeholder_is_unknown_and_resolves_when_available():
    condition = Condition(field="author", operator="contains", value="{{book_author}}")

    assert evaluate_conditions(condition, {"author": "Ursula Le Guin"}).state == MatchState.UNKNOWN
    assert evaluate_conditions(
        condition,
        {"author": "Ursula Le Guin"},
        {"book_author": "Ursula"},
    ).state == MatchState.MATCH


@pytest.mark.parametrize(
    ("operator", "actual", "expected", "state"),
    [
        ("greater_than", 192, 128, MatchState.MATCH),
        ("greater_or_equal", "192", 192, MatchState.MATCH),
        ("less_than", 96, 128, MatchState.MATCH),
        ("less_or_equal", 128, 128, MatchState.MATCH),
        ("greater_than", "unknown", 128, MatchState.NO_MATCH),
    ],
)
def test_numeric_operators(operator, actual, expected, state):
    condition = Condition(field="bitrate", operator=operator, value=expected)

    assert evaluate_conditions(condition, {"bitrate": actual}).state == state


def test_string_operators_are_case_insensitive_and_regex_works():
    assert evaluate_conditions(
        Condition(field="codec", operator="equals", value="FLAC"),
        {"codec": "flac"},
    ).state == MatchState.MATCH
    assert evaluate_conditions(
        Condition(field="title", operator="regex", value=r"tome\s+0?2"),
        {"title": "Saga - Tome 02"},
    ).state == MatchState.MATCH
    assert evaluate_conditions(
        Condition(field="title", operator="contains", value="dune"),
        {"title": "DUNE - tome 1"},
    ).state == MatchState.MATCH


def test_negation_inverts_known_results():
    result = evaluate_conditions(
        Condition(field="codec", operator="equals", value="flac", negate=True),
        {"codec": "mp3"},
    )

    assert result.state == MatchState.MATCH


def test_condition_tree_keeps_a_detailed_breakdown():
    result = evaluate_conditions(
        ConditionGroup(
            conditions=(
                Condition(field="language", operator="equals", value="fr"),
                Condition(field="codec", operator="equals", value="flac"),
            ),
        ),
        {"language": "fr"},
    )

    assert result.tree.children[0].field == "language"
    assert result.tree.children[0].state == MatchState.MATCH
    assert result.tree.children[1].field == "codec"
    assert result.tree.children[1].state == MatchState.UNKNOWN
