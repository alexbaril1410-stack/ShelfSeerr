"""Native ShelfSeerr custom release-scoring settings."""

from shelfmark.core.settings_registry import (
    CheckboxField,
    HeadingField,
    NumberField,
    TableField,
    register_settings,
)

# Values wrapped in {{...}} are runtime placeholders resolved against the requested book.
# Keep this schema deliberately generic so the same engine can score releases from any source.
_RULE_COLUMNS = [
    {"key": "enabled", "label": "Active", "type": "checkbox", "defaultValue": True},
    {
        "key": "name",
        "label": "Rule name",
        "type": "text",
        "placeholder": "Nom de la règle",
    },
    {
        "key": "field",
        "label": "Critère",
        "type": "select",
        "options": [
            {"value": "title", "label": "Titre"},
            {"value": "series", "label": "Série"},
            {"value": "volume", "label": "Tome / volume"},
            {"value": "author", "label": "Auteur"},
            {"value": "language", "label": "Langue"},
            {"value": "format", "label": "Format"},
            {"value": "indexer", "label": "Indexer"},
            {"value": "bitrate", "label": "Débit audio (kbps)"},
            {"value": "sample_rate", "label": "Fréquence audio (Hz)"},
            {"value": "codec", "label": "Codec audio"},
            {"value": "channels", "label": "Canaux audio"},
            {"value": "duration", "label": "Durée"},
        ],
    },
    {
        "key": "operator",
        "label": "Condition",
        "type": "select",
        "options": [
            {"value": "equals", "label": "Est égal à"},
            {"value": "not_equals", "label": "Est différent de"},
            {"value": "contains", "label": "Contient"},
            {"value": "not_contains", "label": "Ne contient pas"},
            {"value": "greater_than", "label": "Supérieur à"},
            {"value": "greater_or_equal", "label": "Supérieur ou égal à"},
            {"value": "less_than", "label": "Inférieur à"},
            {"value": "less_or_equal", "label": "Inférieur ou égal à"},
            {"value": "exists", "label": "Information disponible"},
            {"value": "missing", "label": "Information absente"},
            {"value": "regex", "label": "Expression régulière"},
        ],
    },
    {"key": "value", "label": "Valeur", "type": "text", "placeholder": "Valeur ou variable"},
    {"key": "score", "label": "Score", "type": "text", "placeholder": "Ex. 100 ou -50"},
]

_DEFAULT_EBOOK_RULES = [
    {"enabled": True, "name": "Titre exact", "field": "title", "operator": "equals", "value": "{{book_title}}", "score": 220},
    {"enabled": True, "name": "Titre correspondant", "field": "title", "operator": "contains", "value": "{{book_title}}", "score": 90},
    {"enabled": True, "name": "Série correspondante", "field": "series", "operator": "contains", "value": "{{series_name}}", "score": 15},
    {"enabled": True, "name": "Tome demandé", "field": "volume", "operator": "equals", "value": "{{requested_volume}}", "score": 300},
    {"enabled": True, "name": "Mauvais tome", "field": "volume", "operator": "not_equals", "value": "{{requested_volume}}", "score": -500},
    {"enabled": True, "name": "Auteur correspondant", "field": "author", "operator": "contains", "value": "{{book_author}}", "score": 60},
    {"enabled": True, "name": "Langue française", "field": "language", "operator": "equals", "value": "fr", "score": 40},
    {"enabled": True, "name": "Format EPUB", "field": "format", "operator": "equals", "value": "epub", "score": 25},
    {"enabled": True, "name": "Format PDF", "field": "format", "operator": "equals", "value": "pdf", "score": 10},
]

_DEFAULT_AUDIOBOOK_RULES = [
    {"enabled": True, "name": "Titre exact", "field": "title", "operator": "equals", "value": "{{book_title}}", "score": 120},
    {"enabled": True, "name": "Titre correspondant", "field": "title", "operator": "contains", "value": "{{book_title}}", "score": 70},
    {"enabled": True, "name": "Série correspondante", "field": "series", "operator": "contains", "value": "{{series_name}}", "score": 50},
    {"enabled": True, "name": "Tome demandé", "field": "volume", "operator": "equals", "value": "{{requested_volume}}", "score": 150},
    {"enabled": True, "name": "Mauvais tome", "field": "volume", "operator": "not_equals", "value": "{{requested_volume}}", "score": -200},
    {"enabled": True, "name": "Auteur correspondant", "field": "author", "operator": "contains", "value": "{{book_author}}", "score": 60},
    {"enabled": True, "name": "Langue française", "field": "language", "operator": "equals", "value": "fr", "score": 40},
    {"enabled": True, "name": "Débit élevé (192 kbps et plus)", "field": "bitrate", "operator": "greater_or_equal", "value": "192", "score": 35},
    {"enabled": True, "name": "Débit faible (moins de 128 kbps)", "field": "bitrate", "operator": "less_than", "value": "128", "score": -20},
    {"enabled": True, "name": "Fréquence 44,1 kHz et plus", "field": "sample_rate", "operator": "greater_or_equal", "value": "44100", "score": 15},
    {"enabled": True, "name": "Codec FLAC", "field": "codec", "operator": "contains", "value": "flac", "score": 25},
    {"enabled": True, "name": "Codec MP3", "field": "codec", "operator": "contains", "value": "mp3", "score": 5},
    {"enabled": True, "name": "Stéréo", "field": "channels", "operator": "equals", "value": "2", "score": 10},
]


@register_settings("custom_scores", "Scores personnalisés", icon="sliders", order=16)
def custom_scores_settings():
    """Configure independent ebook and audiobook release-scoring profiles."""
    return [
        HeadingField(
            key="custom_scores_intro",
            title="Classement personnalisé des résultats",
            description=(
                "Les profils sont préconfigurés avec une base de règles modifiables. "
                "Ajustez les scores selon vos préférences, désactivez une règle ou ajoutez-en. "
                "Les valeurs entre doubles accolades sont des informations du livre recherché."
            ),
        ),
        CheckboxField(
            key="CUSTOM_SCORES_EBOOKS_ENABLED",
            label="Activer le scoring des ebooks",
            description="Activer le profil de classement personnalisé pour les ebooks.",
            default=True,
            env_supported=False,
        ),
        TableField(
            key="CUSTOM_SCORES_EBOOK_RULES",
            label="Règles ebooks",
            description=(
                "Les règles de tome sont prioritaires : un résultat d'un autre tome est pénalisé. "
                "Un critère dont l'information est inconnue ne déclenche aucune règle."
            ),
            columns=_RULE_COLUMNS,
            default=_DEFAULT_EBOOK_RULES,
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
                "Le débit est exprimé en kbps et la fréquence d'échantillonnage en Hz. "
                "Les critères audio ne s'appliquent qu'aux audiobooks et une métadonnée "
                "absente ne donne jamais de malus."
            ),
        ),
        CheckboxField(
            key="CUSTOM_SCORES_AUDIOBOOKS_ENABLED",
            label="Activer le scoring des audiobooks",
            description="Activer le profil de classement personnalisé pour les audiobooks.",
            default=True,
            env_supported=False,
        ),
        TableField(
            key="CUSTOM_SCORES_AUDIOBOOK_RULES",
            label="Règles audiobooks",
            description="Modifiez les points, désactivez les règles ou ajoutez vos propres critères.",
            columns=_RULE_COLUMNS,
            default=_DEFAULT_AUDIOBOOK_RULES,
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
