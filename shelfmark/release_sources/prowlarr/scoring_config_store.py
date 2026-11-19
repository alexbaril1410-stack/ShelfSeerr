"""Persistence helpers for the next-generation scoring configuration.

The new configuration is stored alongside the existing custom scoring settings,
under its own key. The current scoring engine does not read this key.
"""

from __future__ import annotations

from typing import Any

from shelfmark.core.settings_registry import load_config_file, save_config_file
from shelfmark.release_sources.prowlarr.scoring_models import (
    Condition,
    ConditionGroup,
    ContentType,
    CustomFormat,
    ProfileFormatScore,
    ScoringConfiguration,
    ScoringProfile,
    configuration_from_dict,
    configuration_to_dict,
)

CONFIG_KEY = "SCORING_V2_CONFIG"


def default_scoring_configuration() -> ScoringConfiguration:
    """Return reusable starter formats and disabled profiles for both content types."""
    formats = (
        CustomFormat(
            id="language-french",
            name="Langue française",
            description="La version proposée est explicitement identifiée comme française.",
            content_types=("ebook", "audiobook"),
            conditions=ConditionGroup(conditions=(
                Condition(field="language", operator="equals", value="fr"),
            )),
        ),
        CustomFormat(
            id="ebook-epub",
            name="Format EPUB",
            description="Le fichier proposé est au format EPUB.",
            content_types=("ebook",),
            conditions=ConditionGroup(conditions=(
                Condition(field="format", operator="equals", value="epub"),
            )),
        ),
        CustomFormat(
            id="ebook-matching-author",
            name="Auteur correspondant",
            description="L'auteur du résultat correspond à celui du livre recherché.",
            content_types=("ebook", "audiobook"),
            conditions=ConditionGroup(conditions=(
                Condition(field="author", operator="contains", value="{{book_author}}"),
            )),
        ),
        CustomFormat(
            id="requested-volume",
            name="Tome demandé",
            description="Le résultat correspond au tome recherché.",
            content_types=("ebook", "audiobook"),
            conditions=ConditionGroup(conditions=(
                Condition(field="volume", operator="equals", value="{{requested_volume}}", required=True),
            )),
        ),
        CustomFormat(
            id="multi-volume-bundle",
            name="Compilation de plusieurs tomes",
            description="Le résultat regroupe plusieurs tomes dans un seul fichier ou lot.",
            content_types=("ebook", "audiobook"),
            conditions=ConditionGroup(conditions=(
                Condition(field="multi_volume_bundle", operator="equals", value=True),
            )),
        ),
        CustomFormat(
            id="audio-flac",
            name="Codec FLAC",
            description="Le livre audio est encodé en FLAC.",
            content_types=("audiobook",),
            conditions=ConditionGroup(conditions=(
                Condition(field="codec", operator="equals", value="flac"),
            )),
        ),
        CustomFormat(
            id="audio-high-bitrate",
            name="Débit audio élevé",
            description="Le débit audio est d'au moins 192 kbps.",
            content_types=("audiobook",),
            conditions=ConditionGroup(conditions=(
                Condition(field="bitrate", operator="greater_or_equal", value=192),
            )),
        ),
    )

    ebook_formats = ("language-french", "ebook-epub", "ebook-matching-author", "requested-volume", "multi-volume-bundle")
    audio_formats = ("language-french", "ebook-matching-author", "requested-volume", "multi-volume-bundle", "audio-flac", "audio-high-bitrate")
    profiles = []
    content_profiles: tuple[tuple[ContentType, tuple[str, ...]], ...] = (
        ("ebook", ebook_formats),
        ("audiobook", audio_formats),
    )
    for content_type, format_ids in content_profiles:
        label = "ebooks" if content_type == "ebook" else "livres audio"
        for profile_id, profile_name, weights in (
            ("equilibre", "Équilibré", (40, 25, 60, 120, -500, 25, 20)),
            ("exigeant", "Exigeant", (80, 40, 80, 250, -800, 60, 40)),
            ("souple", "Souple", (20, 10, 40, 60, -250, 10, 10)),
            ("personnalise", "Personnalisé", (0, 0, 0, 0, 0, 0, 0)),
        ):
            score_by_id = dict(zip(
                ("language-french", "ebook-epub", "ebook-matching-author", "requested-volume",
                 "multi-volume-bundle", "audio-flac", "audio-high-bitrate"),
                weights,
                strict=True,
            ))
            profiles.append(ScoringProfile(
                id=f"{content_type}-{profile_id}",
                name=f"{profile_name} – {label}",
                content_type=content_type,
                enabled=False,
                format_scores=tuple(
                    ProfileFormatScore(format_id=format_id, score=score_by_id[format_id])
                    for format_id in format_ids
                ),
                minimum_score=0,
                target_score=0,
                minimum_improvement=0,
            ))

    configuration = ScoringConfiguration(custom_formats=formats, profiles=tuple(profiles))
    return configuration


def load_scoring_configuration() -> ScoringConfiguration:
    """Load and validate the saved configuration, or return safe starter defaults."""
    settings = load_config_file("custom_scores")
    raw = settings.get(CONFIG_KEY)
    if raw is None:
        return default_scoring_configuration()
    if not isinstance(raw, dict):
        raise ValueError(f"{CONFIG_KEY} must contain a JSON object")
    return configuration_from_dict(raw)


def save_scoring_configuration(configuration: ScoringConfiguration) -> bool:
    """Validate and persist the new configuration without changing legacy settings."""
    serialized: dict[str, Any] = configuration_to_dict(configuration)
    return save_config_file("custom_scores", {CONFIG_KEY: serialized})


def save_scoring_configuration_dict(raw: dict[str, Any]) -> bool:
    """Validate a JSON-compatible payload before persisting it."""
    return save_scoring_configuration(configuration_from_dict(raw))
