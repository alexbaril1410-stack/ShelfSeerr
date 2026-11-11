"""Native ShelfSeerr custom release-scoring settings."""

from shelfmark.core.settings_registry import (
    CheckboxField,
    HeadingField,
    NumberField,
    TableField,
    register_settings,
)

_RULE_COLUMNS = [
    {"key": "enabled", "label": "Active", "type": "checkbox", "defaultValue": True},
    {
        "key": "name",
        "label": "Rule name",
        "type": "text",
        "placeholder": "e.g. Prefer exact title",
    },
    {
        "key": "field",
        "label": "Criterion",
        "type": "select",
        "options": [
            {"value": "title", "label": "Title"},
            {"value": "series", "label": "Series"},
            {"value": "volume", "label": "Volume / tome"},
            {"value": "author", "label": "Author"},
            {"value": "language", "label": "Language"},
            {"value": "format", "label": "Format"},
            {"value": "indexer", "label": "Indexer"},
            {"value": "bitrate", "label": "Audio bitrate"},
            {"value": "sample_rate", "label": "Sample rate"},
            {"value": "codec", "label": "Audio codec"},
            {"value": "channels", "label": "Audio channels"},
            {"value": "duration", "label": "Duration"},
        ],
    },
    {
        "key": "operator",
        "label": "Condition",
        "type": "select",
        "options": [
            {"value": "equals", "label": "Is"},
            {"value": "not_equals", "label": "Is not"},
            {"value": "contains", "label": "Contains"},
            {"value": "not_contains", "label": "Does not contain"},
            {"value": "greater_than", "label": "Greater than"},
            {"value": "greater_or_equal", "label": "At least"},
            {"value": "less_than", "label": "Less than"},
            {"value": "less_or_equal", "label": "At most"},
            {"value": "exists", "label": "Is available"},
            {"value": "missing", "label": "Is missing"},
            {"value": "regex", "label": "Matches regular expression"},
        ],
    },
    {"key": "value", "label": "Expected value", "type": "text", "placeholder": "Value"},
    {"key": "score", "label": "Score", "type": "number", "defaultValue": 0},
]


@register_settings("custom_scores", "Scores personnalisés", icon="sliders", order=16)
def custom_scores_settings():
    """Configure independent ebook and audiobook release-scoring profiles."""
    return [
        HeadingField(
            key="custom_scores_intro",
            title="Classement personnalisé des résultats",
            description=(
                "Créez des règles qui attribuent des points aux releases. "
                "Les règles ebooks et audiobooks sont indépendantes. "
                "Les critères audio ne s'appliquent qu'aux audiobooks."
            ),
        ),
        CheckboxField(
            key="CUSTOM_SCORES_EBOOKS_ENABLED",
            label="Activer le scoring des ebooks",
            description="Activer le profil de classement personnalisé pour les ebooks.",
            default=False,
            env_supported=False,
        ),
        TableField(
            key="CUSTOM_SCORES_EBOOK_RULES",
            label="Règles ebooks",
            description="Chaque règle ajoute ou retire son score lorsqu'elle correspond.",
            columns=_RULE_COLUMNS,
            default=[],
            add_label="Ajouter une règle ebook",
            empty_message="Aucune règle ebook configurée.",
            env_supported=False,
        ),
        NumberField(
            key="CUSTOM_SCORES_EBOOK_MINIMUM",
            label="Score minimal des ebooks",
            description="Laissez 0 pour ne pas masquer de résultat selon son score.",
            default=0,
            min_value=-10000,
            max_value=10000,
            env_supported=False,
        ),
        HeadingField(
            key="custom_scores_audiobooks_heading",
            title="Profil audiobooks",
            description=(
                "Les règles audio permettent notamment de scorer le débit en kbps, "
                "la fréquence d'échantillonnage en Hz, le codec, les canaux et la durée."
            ),
        ),
        CheckboxField(
            key="CUSTOM_SCORES_AUDIOBOOKS_ENABLED",
            label="Activer le scoring des audiobooks",
            description="Activer le profil de classement personnalisé pour les audiobooks.",
            default=False,
            env_supported=False,
        ),
        TableField(
            key="CUSTOM_SCORES_AUDIOBOOK_RULES",
            label="Règles audiobooks",
            description="Les informations audio absentes d'une release ne lui donnent aucun malus.",
            columns=_RULE_COLUMNS,
            default=[],
            add_label="Ajouter une règle audiobook",
            empty_message="Aucune règle audiobook configurée.",
            env_supported=False,
        ),
        NumberField(
            key="CUSTOM_SCORES_AUDIOBOOK_MINIMUM",
            label="Score minimal des audiobooks",
            description="Laissez 0 pour ne pas masquer de résultat selon son score.",
            default=0,
            min_value=-10000,
            max_value=10000,
            env_supported=False,
        ),
    ]
