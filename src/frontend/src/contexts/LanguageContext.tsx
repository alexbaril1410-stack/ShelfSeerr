import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type AppLanguage = 'fr' | 'en';

const LANGUAGE_STORAGE_KEY = 'shelfseerr-language';

const FRENCH_TRANSLATIONS: Record<string, string> = {
  Language: 'Langue',
  French: 'Français',
  English: 'Anglais',
  Settings: 'Paramètres',
  Activity: 'Activité',
  'Report a Bug': 'Signaler un problème',
  Debug: 'Débogage',
  Restart: 'Redémarrer',
  'Sign Out': 'Déconnexion',
  'Download as': 'Télécharger en tant que',
  Myself: 'Moi-même',
  'Loading users...': 'Chargement des utilisateurs…',
  Retry: 'Réessayer',
  'User menu': 'Menu utilisateur',
  'Open book library': 'Ouvrir la bibliothèque de livres',
  'Open audiobook library': 'Ouvrir la bibliothèque de livres audio',
  'View activity': 'Voir l’activité',
  'Close settings': 'Fermer les paramètres',
  'Go back': 'Retour',
  'My Account': 'Mon compte',
  'Loading account settings...': 'Chargement des paramètres du compte…',
  'Close account settings': 'Fermer les paramètres du compte',
  'Unable to load account details.': 'Impossible de charger les informations du compte.',
  'Password must be at least 4 characters': 'Le mot de passe doit contenir au moins 4 caractères',
  'Account updated': 'Compte mis à jour',
  'Failed to load account settings': 'Impossible de charger les paramètres du compte',
  'Failed to update account': 'Impossible de mettre à jour le compte',
  'Password is required': 'Le mot de passe est obligatoire',
  'Current password is required': 'Le mot de passe actuel est obligatoire',
  'Passwords do not match': 'Les mots de passe ne correspondent pas',
  Username: 'Nom d’utilisateur',
  Password: 'Mot de passe',
  'Remember me for 7 days': 'Se souvenir de moi pendant 7 jours',
  'Sign in': 'Se connecter',
  'Sign In': 'Se connecter',
  'Signing in...': 'Connexion en cours…',
  'Sign in with OIDC': 'Se connecter avec OIDC',
  Hide: 'Masquer',
  'Use password': 'Utiliser un mot de passe',
  'Hide password': 'Masquer le mot de passe',
  'Show password': 'Afficher le mot de passe',
  'Your next read starts here': 'Votre prochaine lecture commence ici',
  'Listen. Discover. Share.': 'À écouter. À découvrir. À partager.',
  'Find your next favorite book.': 'Trouvez votre prochain livre préféré.',
  'Explore audiobooks, find your next listen, and add it to your library.':
    'Explorez les livres audio, trouvez votre prochaine écoute et ajoutez-la à votre bibliothèque.',
  'Explore the catalog, discover new worlds, and find the books you want to read.':
    'Explorez le catalogue, découvrez de nouveaux univers et retrouvez les livres que vous souhaitez lire.',
  'Manual search queries release sources directly. Some sources may return limited metadata, which can affect file naming templates.':
    'La recherche manuelle interroge directement les sources de téléchargement. Certaines sources peuvent fournir peu de métadonnées, ce qui peut affecter les modèles de nommage des fichiers.',
  Explore: 'Explorer',
  'Browse by genre': 'Explorer par univers',
  'Listen by mood': 'À écouter selon vos envies',
  'Choose a theme to search your catalog.':
    'Choisissez un thème pour lancer une recherche dans votre catalogue.',
  Fantasy: 'Fantasy',
  'Imaginary worlds and epic sagas': 'Mondes imaginaires et grandes sagas',
  'Mystery & thriller': 'Polar & thriller',
  'Investigations, suspense, and mysteries': 'Enquêtes, suspense et mystères',
  'Science fiction': 'Science-fiction',
  'Tomorrow starts here': 'Demain commence ici',
  Romance: 'Romance',
  'Stories to devour': 'Des histoires à dévorer',
  'Personal development': 'Développement personnel',
  'Learn and grow': 'Apprendre et progresser',
  History: 'Histoire',
  'Understand the world': 'Comprendre le monde',
  'Fiction to listen to': 'Romans à écouter',
  'Let yourself be carried away by a story': 'Laissez-vous porter par une histoire',
  'Mysteries & thrillers': 'Polars & thrillers',
  'Suspense in your ears': 'Le suspense dans les oreilles',
  'Great adventures to listen to': 'De grandes aventures à écouter',
  'Ideas to take with you': 'Des idées à emporter',
  Biographies: 'Biographies',
  'Inspiring journeys': 'Des parcours inspirants',
  'Somewhere else, in a different way': 'Ailleurs, autrement',
  'Popular audiobooks': 'Les livres audio populaires',
  'Books trending now': 'Les livres du moment',
  'Latest audiobook releases': 'Les dernières sorties audio',
  'New releases': 'Les nouveautés',
  Trends: 'Tendances',
  'Coming soon and recently published': 'À paraître et récemment publiés',
  titles: 'titres',
  Search: 'Rechercher',
  'Unknown author': 'Auteur inconnu',
  'Your next listen': 'Votre prochaine écoute',
  'Discover next': 'À découvrir',
  'An audiobook is waiting for you.': 'Un livre audio vous attend.',
  'A new story is waiting for you.': 'Une nouvelle histoire vous attend.',
  'Search for a title or author, or browse genres to find your next listen.':
    'Recherchez un titre, un auteur ou parcourez les genres pour trouver votre prochaine écoute.',
  'Search the configured metadata catalog to discover available titles.':
    'Lancez une recherche dans le catalogue de métadonnées configuré pour découvrir les titres disponibles.',
  'Explore the catalog': 'Explorer le catalogue',
  'Search Books & Audiobooks': 'Rechercher des livres et des livres audio',
  'Search Books': 'Rechercher des livres',
  'Search Audiobooks': 'Rechercher des livres audio',
  'Search releases directly…': 'Rechercher directement des fichiers à télécharger…',
  'Search books': 'Rechercher des livres',
  'Clear search input': 'Effacer le champ de recherche',
  'Clear search': 'Effacer la recherche',
  'Loading…': 'Chargement…',
  'Loading...': 'Chargement…',
  Options: 'Options',
  Content: 'Contenu',
  Combined: 'Combinée',
  'Combined search': 'Recherche combinée',
  'Search by': 'Rechercher par',
  'Search context': 'Contexte de recherche',
  Direct: 'Direct',
  'Search web sources for books and download directly. Works out of the box.':
    'Recherche des livres sur les sources en ligne et permet de les télécharger directement. Fonctionne sans configuration préalable.',
  'Disabled in Settings': 'Désactivé dans les paramètres',
  'Not configured': 'Non configuré',
  'API key required': 'Clé API requise',
  'Book Metadata Provider': 'Fournisseur de métadonnées des livres',
  'Combined Metadata Provider': 'Fournisseur de métadonnées combiné',
  'Audiobook Metadata Provider': 'Fournisseur de métadonnées des livres audio',
  'Close filters': 'Fermer les filtres',
  'Search Mode': 'Mode de recherche',
  'Choose a mode': 'Choisir un mode',
  'Choose a provider': 'Choisir un fournisseur',
  All: 'Tous',
  Any: 'Tous',
  'Card view': 'Vue en cartes',
  'Compact view': 'Vue compacte',
  'List view': 'Vue en liste',
  'No results found.': 'Aucun résultat trouvé.',
  'Load More': 'Charger plus',
  'Showing {count} of {total} results': '{count} résultats affichés sur {total}',
  'Change sort order': 'Modifier le tri',
  'Sort results': 'Trier les résultats',
  'Most relevant': 'Les plus pertinents',
  'Close details': 'Fermer les détails',
  Book: 'Livre',
  Untitled: 'Sans titre',
  'Book cover': 'Couverture du livre',
  'No cover': 'Aucune couverture',
  Description: 'Description',
  Publisher: 'Éditeur',
  Year: 'Année',
  Genres: 'Genres',
  Format: 'Format',
  Size: 'Taille',
  Downloads: 'Téléchargements',
  Library: 'Bibliothèque',
  ISBN: 'ISBN',
  Series: 'Série',
  of: 'sur',
  in: 'dans',
  'View series': 'Voir la série',
  'View on': 'Voir sur',
  Books: 'Livres',
  Audiobooks: 'Livres audio',
  'Books and Audiobooks': 'Livres et livres audio',
  Searching: 'Recherche',
  by: 'par',
  'Click to change.': 'Cliquer pour modifier.',
  general: 'général',
  'Most downloads': 'Les plus téléchargés',
  'Newest (publication year)': 'Les plus récents (année de publication)',
  'Oldest (publication year)': 'Les plus anciens (année de publication)',
  'Largest (filesize)': 'Les fichiers les plus volumineux',
  'Smallest (filesize)': 'Les fichiers les plus légers',
  'Newest (open sourced)': 'Les plus récemment ajoutés',
  'Oldest (open sourced)': 'Les plus anciens ajouts',
  'Book (non-fiction)': 'Livre (non-fiction)',
  'Book (fiction)': 'Livre (fiction)',
  'Book (unknown)': 'Livre (type inconnu)',
  Magazine: 'Magazine',
  'Comic Book': 'Bande dessinée',
  'Standards document': 'Document normatif',
  Other: 'Autre',
  'Musical score': 'Partition musicale',
  'No activity': 'Aucune activité',
  'Loading requests...': 'Chargement des demandes…',
  'No requests': 'Aucune demande',
  'Loading history...': 'Chargement de l’historique…',
  'No history': 'Aucun historique',
  'No downloads': 'Aucun téléchargement',
  'Loading rejected requests...': 'Chargement des demandes refusées…',
  'No rejected requests': 'Aucune demande refusée',
  'No rejected requests shown ({count} hidden)':
    'Aucune demande refusée affichée ({count} masquées)',
  Rejected: 'Refusées',
  'Unpin activity sidebar': 'Désépingler le panneau d’activité',
  'Pin activity sidebar': 'Épingler le panneau d’activité',
  'Filter by user': 'Filtrer par utilisateur',
  'Filtered: {user}': 'Filtré : {user}',
  'Filtered by user {user}': 'Filtré par utilisateur : {user}',
  'All users': 'Tous les utilisateurs',
  'Back to activity': 'Retour à l’activité',
  'Open rejected requests': 'Ouvrir les demandes refusées',
  'Open history': 'Ouvrir l’historique',
  'Close activity sidebar': 'Fermer le panneau d’activité',
  'Show hidden': 'Afficher les éléments masqués',
  Requests: 'Demandes',
  'Load more': 'Charger plus',
  'No Match Yet': 'Aucune correspondance pour le moment',
  Waiting: 'En attente',
  'Retrying Automatically': 'Nouvelle tentative automatique',
  'In Progress': 'En cours',
  Complete: 'Terminé',
  Failed: 'Échec',
  'Searched automatically on every sync. Choose a release yourself, decline, or leave it.':
    'Recherche automatique à chaque synchronisation. Choisissez une version, refusez la demande ou laissez-la en attente.',
  'A download failed and another copy is being tried. Nothing to do.':
    'Un téléchargement a échoué et une autre copie est en cours d’essai. Aucune action nécessaire.',
  'Remove from queue': 'Retirer de la file',
  'Stop download': 'Arrêter le téléchargement',
  Clear: 'Effacer',
  Approve: 'Approuver',
  Reject: 'Refuser',
  'Reopen request': 'Rouvrir la demande',
  'Hide from Rejected': 'Masquer des demandes refusées',
  'Show in Rejected again': 'Réafficher dans les demandes refusées',
  'Cancel request': 'Annuler la demande',
  Action: 'Action',
  'Attached File': 'Fichier associé',
  Requested: 'Demandé le',
  Type: 'Type',
  Title: 'Titre',
  'Working...': 'Traitement…',
  'Manually Mark as Approved': 'Marquer manuellement comme approuvé',
  'Reject request for': 'Refuser la demande pour',
  'Untitled request': 'Demande sans titre',
  'Optional note shown to the user': 'Note facultative visible par l’utilisateur',
  'Rejecting...': 'Refus en cours…',
  'Unknown title': 'Titre inconnu',
  Unknown: 'Inconnu',
  Audiobook: 'Livre audio',
  'No attached release data is available. Choose a release before approval.':
    'Aucun fichier associé n’est disponible. Choisissez une version avant de valider la demande.',
  'Previous download failed. Choose a release before re-approving.':
    'Le téléchargement précédent a échoué. Choisissez une version avant de valider à nouveau.',
  'This is a book-level request without an attached file. Choose a release before approval.':
    'Cette demande concerne un livre et ne comporte aucun fichier associé. Choisissez une version avant validation.',
  'Previous download failed and the attached release was cleared. Choose a release before re-approving.':
    'Le téléchargement précédent a échoué et le fichier associé a été supprimé. Choisissez une version avant de valider à nouveau.',
  'Download file': 'Télécharger le fichier',
  'Hide details': 'Masquer les détails',
  'Show details': 'Afficher les détails',
  'Picked up where it left off instead of starting again':
    'Reprise du téléchargement au lieu d’un nouveau départ',
  Reattached: 'Repris',
  'Browse Releases To Retry': 'Parcourir les versions pour réessayer',
  'Browse Releases To Approve': 'Parcourir les versions à approuver',
  'Approve Attached File': 'Approuver le fichier associé',
  Cancel: 'Annuler',
  Source: 'Source',
  Results: 'Résultats',
  Total: 'au total',

  'Title shown above the main search box on the homepage.':
    'Titre affiché au-dessus du champ de recherche principal sur la page d’accueil.',
  Theme: 'Thème',
  'Choose your preferred color scheme.': 'Choisissez votre thème de couleurs préféré.',
  Light: 'Clair',
  Dark: 'Sombre',
  'Auto (System)': 'Automatique (système)',
  'Adds a navigation button to your book library (Calibre-Web Automated, Grimmory, etc).':
    'Ajoute un bouton de navigation vers votre bibliothèque de livres (Calibre-Web Automated, Grimmory, etc.).',
  'Adds a separate navigation button for your audiobook library (Audiobookshelf, Plex, etc). When both URLs are set, icons are shown instead of text.':
    'Ajoute un bouton de navigation distinct vers votre bibliothèque de livres audio (Audiobookshelf, Plex, etc.). Lorsque les deux URL sont renseignées, des icônes remplacent les libellés.',
  'Default filters applied to searches. Can be overridden using advanced search options.':
    'Filtres appliqués par défaut aux recherches. Ils peuvent être remplacés dans les options de recherche avancées.',
  'How you want to search for and download books.':
    'Méthode utilisée pour rechercher et télécharger des livres.',
  'Default sort order for search results.':
    'Ordre de tri appliqué par défaut aux résultats de recherche.',
  'Show the option to search for and download both a book and audiobook together.':
    'Affiche l’option permettant de rechercher et télécharger simultanément un livre et sa version audio.',
  'Force combined search whenever it is available. Locks the combined toggle on.':
    'Force la recherche combinée lorsqu’elle est disponible et verrouille son activation.',
  'Configure metadata providers and release sources for Universal search mode.':
    'Configurez les fournisseurs de métadonnées et les sources de téléchargement du mode universel.',
  'Choose which metadata provider to use for book searches.':
    'Choisissez le fournisseur de métadonnées utilisé pour les recherches de livres.',
  'Metadata provider for audiobook searches. Uses the book provider if not set.':
    'Fournisseur de métadonnées utilisé pour les livres audio. Celui des livres est utilisé si aucun fournisseur n’est défini.',
  'Controls SSL/TLS certificate verification for outbound connections. Disable for self-signed certificates on internal services (e.g., OIDC providers, Prowlarr).':
    'Contrôle la vérification des certificats SSL/TLS des connexions sortantes. Désactivez cette option pour les certificats autosignés de services internes (fournisseurs OIDC, Prowlarr, etc.).',
  'Comma-separated list of DNS server IP addresses (e.g., 8.8.8.8, 1.1.1.1).':
    'Liste d’adresses IP de serveurs DNS séparées par des virgules (ex. : 8.8.8.8, 1.1.1.1).',
  'DNS is managed by Tor when Tor routing is enabled.':
    'Le DNS est géré par Tor lorsque le routage via Tor est activé.',
  'Proxy settings are not used when Tor routing is enabled.':
    'Les paramètres du proxy ne sont pas utilisés lorsque le routage via Tor est activé.',
  'Directory where downloaded files are saved. Use {User} for per-user folders (e.g. /books/{User}).':
    'Répertoire dans lequel les fichiers téléchargés sont enregistrés. Utilisez {User} pour créer des dossiers par utilisateur (ex. : /books/{User}).',
  'Choose how downloaded book files are named and organized.':
    'Choisissez comment les fichiers de livres téléchargés sont nommés et organisés.',
  "Create hardlinks instead of copying. Preserves seeding but archives won't be extracted. Don't use if destination is a library ingest folder.":
    'Crée des liens physiques au lieu de copier les fichiers. Préserve le partage des torrents, mais les archives ne seront pas extraites. À éviter si la destination est un dossier d’import de bibliothèque.',
  'Base URL of your Grimmory instance': 'URL de base de votre instance Grimmory.',
  'Choose whether uploads go directly to a specific library path or to Bookdrop for review.':
    'Choisissez si les fichiers sont envoyés directement vers un chemin de bibliothèque ou vers Bookdrop pour vérification.',
  "Maximum total attachment size per email. Email encoding adds overhead; keep this below your provider's limit.":
    'Taille totale maximale des pièces jointes par e-mail. L’encodage augmente le volume : restez sous la limite de votre fournisseur.',
  'Send books as email attachments via SMTP. Audiobooks always use folder mode.':
    'Envoie les livres en pièces jointes par SMTP. Les livres audio utilisent toujours le mode dossier.',
  'Configure where audiobooks are saved.':
    'Configurez l’emplacement d’enregistrement des livres audio.',
  'Choose how downloaded audiobook files are named and organized.':
    'Choisissez comment les fichiers de livres audio téléchargés sont nommés et organisés.',
  'Automatically open the downloads sidebar when a new download is queued.':
    'Ouvre automatiquement le panneau des téléchargements lorsqu’un nouveau téléchargement est ajouté à la file.',
  'Automatically download completed files to your browser for the selected content types.':
    'Télécharge automatiquement dans votre navigateur les fichiers terminés pour les types de contenu sélectionnés.',
  'Maximum retry attempts for failed downloads.':
    'Nombre maximal de nouvelles tentatives en cas d’échec du téléchargement.',
  'Wait time between download retry attempts.':
    'Temps d’attente entre deux tentatives de téléchargement.',
  'Sources are tried in order until a download succeeds. Mirror-backed entries unlock automatically when you configure their mirrors.':
    'Les sources sont essayées dans l’ordre jusqu’à ce qu’un téléchargement réussisse. Les entrées reposant sur des miroirs sont déverrouillées automatiquement lorsque vous les configurez.',
  'Cache book cover images locally for faster loading. Works for both Direct Download and Universal mode.':
    'Met en cache localement les couvertures pour accélérer leur chargement. Fonctionne en téléchargement direct et en mode universel.',
  'Cache book metadata from providers (Hardcover, Open Library) to reduce API calls and speed up repeated searches.':
    'Met en cache les métadonnées des fournisseurs (Hardcover, Open Library) afin de réduire les appels API et d’accélérer les recherches répétées.',
  'How many open requests a user can have at a time.':
    'Nombre de demandes qu’un utilisateur peut avoir simultanément en attente.',
  'Let users add a note when they submit a request.':
    'Autorise les utilisateurs à ajouter une note lorsqu’ils soumettent une demande.',
  'Send a test notification to all configured global route URLs.':
    'Envoie une notification de test à toutes les URL de destination globales configurées.',
  'Fetch the OIDC discovery document and validate configuration.':
    'Récupère le document de découverte OIDC et vérifie la configuration.',
  'These options can only be set via environment variables because changing them through the UI could lock you out of the application.':
    'Ces options ne peuvent être définies que par variables d’environnement : une modification depuis l’interface pourrait vous empêcher d’accéder à l’application.',
  'and {count} more...': 'et {count} de plus…',

  'Select...': 'Sélectionner…',
  'Select categories...': 'Sélectionner des catégories…',
  'Show less': 'Afficher moins',
  'Show all {count} options': 'Afficher les {count} options',
  Remove: 'Supprimer',
  'Add item': 'Ajouter un élément',
  'No values': 'Aucune valeur',
  Add: 'Ajouter',
  Row: 'Ligne',
  'Remove row': 'Supprimer la ligne',
  'Move up': 'Déplacer vers le haut',
  'Move down': 'Déplacer vers le bas',
  'Running...': 'Exécution…',
  'Action failed': 'Échec de l’action',
  'Unknown field type': 'Type de champ inconnu',

  Default: 'Par défaut',
  'Not supported': 'Non pris en charge',
  override: 'dérogation',
  'Clear all overrides': 'Effacer toutes les dérogations',
  'Everything can be downloaded directly.': 'Tout peut être téléchargé directement.',
  'Users must request a specific release.':
    'Les utilisateurs doivent demander une version précise.',
  'Users request a book, admin picks the release.':
    'Les utilisateurs demandent un livre et l’administrateur choisit la version.',
  'No downloads or requests allowed.': 'Les téléchargements et les demandes sont interdits.',
  'Naming template schema is unavailable.': 'Le schéma du modèle de nommage est indisponible.',
  'Rename templates cannot contain folder separators. Use Path Template instead.':
    'Les modèles de renommage ne peuvent pas contenir de séparateurs de dossiers. Utilisez plutôt le modèle de chemin.',
  'Unknown variable: ': 'Variable inconnue : ',
  'Unknown variables: ': 'Variables inconnues : ',
  'Preview:': 'Aperçu :',
  'Insert variable': 'Insérer une variable',
  Core: 'Essentiel',
  Universal: 'Universel',
  Files: 'Fichiers',
  'Request policy schema is unavailable for this tab.':
    'Le schéma des règles de demande est indisponible pour cet onglet.',
  'This setting is controlled by an environment variable':
    'Ce paramètre est contrôlé par une variable d’environnement',

  'No providers enabled': 'Aucun fournisseur activé',
  'Use book provider': 'Utiliser le fournisseur des livres',
  'Use first available source': 'Utiliser la première source disponible',
  'Use book release source': 'Utiliser la source de téléchargement des livres',
  'Auto (Recommended)': 'Automatique (recommandé)',
  Ebook: 'Livre numérique',
  'Enabled (Recommended)': 'Activé (recommandé)',
  'Disabled for Local Addresses': 'Désactivé pour les adresses locales',
  Disabled: 'Désactivé',
  System: 'Système',
  Google: 'Google',
  Cloudflare: 'Cloudflare',
  Manual: 'Manuel',
  'None (Direct Connection)': 'Aucun (connexion directe)',
  'HTTP/HTTPS Proxy': 'Proxy HTTP/HTTPS',
  Folder: 'Dossier',
  'Email (SMTP)': 'E-mail (SMTP)',
  'Grimmory (API)': 'Grimmory (API)',
  None: 'Aucun',
  'Rename Only': 'Renommer uniquement',
  'Rename and Organize': 'Renommer et organiser',
  'Rename and Group': 'Renommer et regrouper',
  'Specific Library': 'Bibliothèque spécifique',
  Bookdrop: 'Bookdrop',
  'No TLS (not recommended).': 'Pas de TLS (déconseillé).',
  STARTTLS: 'STARTTLS',
  'Connect using TLS (SMTPS).': 'Connexion utilisant TLS (SMTPS).',
  'AA Fast Downloads': 'Téléchargements rapides AA',
  'Library Genesis': 'Library Genesis',
  'AA Slow Downloads (No Waitlist)': 'Téléchargements lents AA (sans liste d’attente)',
  'AA Slow Downloads (Waitlist)': 'Téléchargements lents AA (avec liste d’attente)',
  Zlib: 'Z-Library',
  'New request submitted': 'Nouvelle demande soumise',
  'Request approved': 'Demande approuvée',
  'Request rejected': 'Demande refusée',
  'Download complete': 'Téléchargement terminé',
  'Download failed': 'Échec du téléchargement',
  Event: 'Événement',
  'Notification URL': 'URL de notification',
  'No Authentication': 'Aucune authentification',
  Local: 'Locale',
  'Proxy Authentication': 'Authentification par proxy',
  'OIDC (OpenID Connect)': 'OIDC (OpenID Connect)',
  'Calibre-Web Database': 'Base de données Calibre-Web',
  'A local admin account is required before Local authentication can be enabled.':
    'Un compte administrateur local est nécessaire avant de pouvoir activer l’authentification locale.',
  'A local admin account is required before OIDC can be enabled.':
    'Un compte administrateur local est nécessaire avant de pouvoir activer OIDC.',
  'Discovery URL': 'URL de découverte',
  'Client ID': 'Identifiant client',
  'Client Secret': 'Secret client',
  Scopes: 'Autorisations (scopes)',
  'Group Claim Name': 'Nom de la revendication de groupe',
  'Admin Group Name': 'Nom du groupe administrateur',
  'Use Admin Group for Authorization': 'Utiliser le groupe administrateur pour les autorisations',
  'Auto-Provision Users': 'Créer automatiquement les comptes utilisateurs',
  'Login Button Label': 'Libellé du bouton de connexion',
  'Proxy Auth User Header': 'En-tête utilisateur de l’authentification proxy',
  'Role for users the proxy authenticates for the first time when no admin group is configured. The first account is always an admin so the instance is never left without one.':
    'Rôle attribué aux utilisateurs authentifiés pour la première fois par le proxy lorsqu’aucun groupe administrateur n’est configuré. Le premier compte est toujours administrateur afin que l’instance ne soit jamais dépourvue d’administrateur.',
  'Configure local users and admin access in the Users tab.':
    'Configurez les utilisateurs locaux et les accès administrateur dans l’onglet Utilisateurs.',
  'Choose what users can download directly and what needs approval first.':
    'Définissez ce que les utilisateurs peuvent télécharger directement et ce qui nécessite une approbation préalable.',
  'Sets the baseline for all ebook sources.':
    'Définit le comportement par défaut pour toutes les sources de livres numériques.',
  'Sets the baseline for all audiobook sources.':
    'Définit le comportement par défaut pour toutes les sources de livres audio.',
  'No request policy rules configured.': 'Aucune règle de demande configurée.',
  'Allow book requests alongside downloads':
    'Autoriser les demandes de livres en parallèle des téléchargements',
  'Delivery Preferences': 'Préférences de livraison',
  'Search Preferences': 'Préférences de recherche',
  'Request Release': 'Demander une version',
  'Request Book': 'Demander un livre',
  Blocked: 'Bloqué',
  Download: 'Télécharger',
  Close: 'Fermer',

  'Direct Download': 'Téléchargement direct',
  General: 'Général',
  Network: 'Réseau',
  'Users & Requests': 'Utilisateurs et demandes',
  Notifications: 'Notifications',
  Security: 'Sécurité',
  Advanced: 'Avancé',
  Mirrors: 'Miroirs',
  'Release Sources': 'Sources de téléchargement',
  'Metadata Providers': 'Fournisseurs de métadonnées',
  'Download Clients': 'Clients de téléchargement',
  'Search Page Title': 'Titre de la page de recherche',
  'Library URL': 'URL de la bibliothèque',
  'Audiobook Library URL': 'URL de la bibliothèque de livres audio',
  'Mark books already in your Calibre library':
    'Signaler les livres déjà présents dans votre bibliothèque Calibre',
  'Calibre metadata.db path': 'Chemin du fichier metadata.db de Calibre',
  'Test Calibre library': 'Tester la bibliothèque Calibre',
  'Read the Calibre metadata.db and mark search results you already own, so you do not download a second copy. Read only, nothing is written to the library.':
    'Consulte la base metadata.db de Calibre et signale les résultats que vous possédez déjà afin d’éviter les doublons. Lecture seule : aucune donnée n’est écrite dans la bibliothèque.',
  'Path to metadata.db as seen from inside the Shelfmark container. Mount the Calibre library folder read-only, e.g. /path/to/calibre-library:/calibre-library:ro.':
    'Chemin vers metadata.db tel qu’il est vu depuis le conteneur Shelfmark. Montez le dossier de la bibliothèque Calibre en lecture seule, par exemple /path/to/calibre-library:/calibre-library:ro.',
  'Check that Shelfmark can read the Calibre database and count the books.':
    'Vérifie que Shelfmark peut lire la base de données Calibre et compter les livres.',
  'Mark audiobooks already in your Audiobookshelf library':
    'Signaler les livres audio déjà présents dans Audiobookshelf',
  'Audiobookshelf URL': 'URL d’Audiobookshelf',
  'Audiobookshelf API Token': 'Jeton API Audiobookshelf',
  'Audiobookshelf Library IDs (optional)':
    'Identifiants des bibliothèques Audiobookshelf (facultatif)',
  'Test Audiobookshelf library': 'Tester la bibliothèque Audiobookshelf',
  'Ask your Audiobookshelf server which audiobooks you already own, so synced and automatic downloads skip them. Read only, nothing is written to Audiobookshelf.':
    'Demande à votre serveur Audiobookshelf quels livres audio vous possédez déjà afin que les synchronisations et téléchargements automatiques les ignorent. Lecture seule : aucune donnée n’est écrite dans Audiobookshelf.',
  'Base URL reachable from the Shelfmark container (not the public URL). Often the host LAN IP, e.g. http://10.0.0.91:13378.':
    'URL de base accessible depuis le conteneur Shelfmark (et non l’URL publique). Il s’agit souvent de l’adresse IP locale du serveur, par exemple http://10.0.0.91:13378.',
  'API token from Audiobookshelf (Settings > Users > your user > API Token).':
    'Jeton API Audiobookshelf (Settings > Users > votre utilisateur > API Token).',
  'Comma-separated library IDs to check. Leave blank for all book libraries.':
    'Identifiants des bibliothèques à vérifier, séparés par des virgules. Laissez vide pour vérifier toutes les bibliothèques de livres.',
  'Check that Shelfmark can reach Audiobookshelf and count the items.':
    'Vérifie que Shelfmark peut accéder à Audiobookshelf et compter les éléments.',
  'Default Search Filters': 'Filtres de recherche par défaut',
  'Supported Book Formats': 'Formats de livres pris en charge',
  'Book formats to include in search results. ZIP/RAR archives are extracted automatically and book files are used if found.':
    'Formats de livres à inclure dans les résultats de recherche. Les archives ZIP/RAR sont extraites automatiquement et les fichiers de livres sont utilisés si elles en contiennent.',
  'Supported Audiobook Formats': 'Formats de livres audio pris en charge',
  'Audiobook formats to include in search results. ZIP/RAR archives are extracted automatically and audiobook files are used if found.':
    'Formats de livres audio à inclure dans les résultats de recherche. Les archives ZIP/RAR sont extraites automatiquement et les fichiers audio sont utilisés si elles en contiennent.',
  'Default Book Languages': 'Langues des livres par défaut',
  'Default language filter for searches. Users can override this for their own account.':
    'Filtre de langue appliqué par défaut aux recherches. Chaque utilisateur peut le remplacer dans son compte.',
  'Default Content Type': 'Type de contenu par défaut',
  'Which tab the search page opens on. Users can override this for their own account, and a browser that has already picked a tab keeps its choice.':
    'Onglet affiché à l’ouverture de la page de recherche. Chaque utilisateur peut choisir son onglet ; le navigateur conserve également son choix précédent.',
  'Default Sort Order': 'Ordre de tri par défaut',
  'Show Release Source Links': 'Afficher les liens des sources de téléchargement',
  'Show clickable release-source links in release and details modals. Metadata provider links stay enabled.':
    'Affiche des liens cliquables vers les sources dans les fenêtres des versions et des détails. Les liens des fournisseurs de métadonnées restent activés.',
  'Show Combined Download Selector': 'Afficher le sélecteur de téléchargement combiné',
  'Always Use Combined Search': 'Toujours utiliser la recherche combinée',
  "Force combined search whenever it's available. Locks the combined toggle on.":
    'Force la recherche combinée lorsqu’elle est disponible et verrouille son activation.',
  'Universal Mode Settings': 'Paramètres du mode universel',
  'Direct mode uses the optional Direct Download source. Universal mode uses metadata search with whichever release sources you have enabled.':
    'Le mode direct utilise la source de téléchargement direct si elle est configurée. Le mode universel recherche des métadonnées avec les sources de téléchargement activées.',
  'Search with the Direct Download source. Requires enabling the source and adding your own mirror URLs.':
    'Recherche avec la source de téléchargement direct. Vous devez activer cette source et ajouter vos propres URL de miroirs.',
  'Metadata-based search with downloads from all sources. Book and Audiobook support.':
    'Recherche à partir des métadonnées avec téléchargement depuis toutes les sources. Compatible avec les livres et les livres audio.',
  'Combined Mode Metadata Provider': 'Fournisseur de métadonnées du mode combiné',
  'Metadata provider for combined mode searches. Uses the book provider if not set.':
    'Fournisseur de métadonnées utilisé pour les recherches combinées. Celui des livres est utilisé si aucun fournisseur n’est défini.',
  'Default Book Release Source': 'Source de téléchargement des livres par défaut',
  'The release source tab to open by default in the release modal for books. Leave unset to use the first available source.':
    'Onglet de source affiché par défaut dans la fenêtre des versions de livres. Laissez ce champ vide pour utiliser la première source disponible.',
  'Default Audiobook Release Source': 'Source de téléchargement des livres audio par défaut',
  'The release source tab to open by default in the release modal for audiobooks. Uses the book release source if not set.':
    'Onglet de source affiché par défaut dans la fenêtre des versions de livres audio. La source des livres est utilisée si aucune valeur n’est définie.',
  'Release List Columns': 'Colonnes de la liste des résultats',
  'Show Series Column': 'Afficher la colonne Série',
  'Show Narrator Column': 'Afficher la colonne Narrateur',
  'Show Bitrate Column': 'Afficher la colonne Débit binaire',
  'Certificate Validation': 'Validation des certificats',
  'DNS Provider': 'Fournisseur DNS',
  'Manual DNS Servers': 'Serveurs DNS manuels',
  'Use DNS over HTTPS': 'Utiliser DNS over HTTPS',
  'Tor Routing': 'Routage via Tor',
  'Proxy Mode': 'Mode proxy',
  'HTTP Proxy': 'Proxy HTTP',
  'HTTPS Proxy': 'Proxy HTTPS',
  'SOCKS5 Proxy': 'Proxy SOCKS5',
  'No Proxy': 'Pas de proxy',
  'Output Mode': 'Mode de sortie',
  Destination: 'Destination',
  'Test Destination': 'Tester la destination',
  'File Organization': 'Organisation des fichiers',
  'Word Separator': 'Séparateur de mots',
  'Naming Template': 'Modèle de nommage',
  'Path Template': 'Modèle de chemin',
  'Hardlink Book Torrents': 'Créer des liens physiques pour les torrents de livres',
  Grimmory: 'Grimmory',
  'Grimmory URL': 'URL de Grimmory',
  'Upload Destination': 'Destination du téléversement',
  Path: 'Chemin',
  'Test Connection': 'Tester la connexion',
  Email: 'E-mail',
  'Default Email Recipient': 'Destinataire e-mail par défaut',
  'Attachment Size Limit (MB)': 'Taille maximale des pièces jointes (Mo)',
  'SMTP Host': 'Hôte SMTP',
  'SMTP Port': 'Port SMTP',
  'SMTP Security': 'Sécurité SMTP',
  'From Address': 'Adresse d’expédition',
  'Subject Template': 'Modèle d’objet',
  'SMTP Timeout (seconds)': 'Délai d’expiration SMTP (secondes)',
  'Allow Unverified TLS': 'Autoriser TLS sans vérification',
  'Test SMTP Connection': 'Tester la connexion SMTP',
  'Hardlink Audiobook Torrents': 'Créer des liens physiques pour les torrents de livres audio',
  'Auto-Open Downloads Sidebar': 'Ouvrir automatiquement le panneau des téléchargements',
  'Download to Browser': 'Télécharger dans le navigateur',
  'Max Concurrent Downloads': 'Nombre maximal de téléchargements simultanés',
  'Max Concurrent Downloads Per Source': 'Nombre maximal de téléchargements simultanés par source',
  'Status Timeout (seconds)': 'Durée d’affichage des statuts (secondes)',
  'Enable Direct Download Source': 'Activer la source de téléchargement direct',
  'Detect Language From Distant Path': 'Détecter la langue à partir du chemin distant',
  'Account Donator Key': 'Clé donateur du compte',
  'Source Priority': 'Priorité des sources',
  'Fast downloads': 'Téléchargements rapides',
  'Slow downloads': 'Téléchargements lents',
  'Max Retries': 'Nombre maximal de tentatives',
  'Retry Delay (seconds)': 'Délai entre les tentatives (secondes)',
  'Release Search Timeout (seconds)': 'Délai maximal de recherche des versions (secondes)',
  'Content-Type Routing': 'Routage par type de contenu',
  'Enable Content-Type Routing': 'Activer le routage par type de contenu',
  'Fiction Books': 'Livres de fiction',
  'Non-Fiction Books': 'Livres documentaires',
  'Unknown Books': 'Livres de type inconnu',
  Magazines: 'Magazines',
  'Comic Books': 'Bandes dessinées',
  'Standards Documents': 'Documents normatifs',
  'Musical Scores': 'Partitions musicales',
  'Enable Cloudflare Bypass': 'Activer le contournement de Cloudflare',
  'Use External Bypasser': 'Utiliser un service de contournement externe',
  'External Bypasser URL': 'URL du service de contournement externe',
  'External Bypasser Path': 'Chemin API du service de contournement externe',
  'External Bypasser Timeout (ms)': 'Délai du service externe (ms)',
  'Page Read Timeout (seconds)': 'Délai de lecture de la page (secondes)',
  'Bypasser Idle Timeout (seconds)': 'Délai d’inactivité du service de contournement (secondes)',
  "Anna's Archive": 'Anna’s Archive',
  'Primary Mirror': 'Miroir principal',
  LibGen: 'LibGen',
  'Z-Library': 'Z-Library',
  Welib: 'Welib',
  OceanofPDF: 'OceanofPDF',
  'Base Path': 'Chemin de base',
  'Debug Mode': 'Mode débogage',
  'Log Level': 'Niveau de journalisation',
  'Queue Check Interval (seconds)': 'Intervalle de vérification de la file (secondes)',
  'Progress Update Interval (seconds)': 'Intervalle de mise à jour de la progression (secondes)',
  'Custom Script Path': 'Chemin du script personnalisé',
  'Custom Script Path Mode': 'Mode du chemin du script personnalisé',
  'Custom Script JSON Payload': 'Charge utile JSON du script personnalisé',
  'Remote Path Mappings': 'Correspondances de chemins distants',
  'Completed Path Wait (seconds)': 'Attente du chemin terminé (secondes)',
  'Path Mappings': 'Correspondances de chemins',
  'Add Mapping': 'Ajouter une correspondance',
  'No mappings configured.': 'Aucune correspondance configurée.',
  'Cover Image Cache': 'Cache des couvertures',
  'Enable Cover Cache': 'Activer le cache des couvertures',
  'Cache TTL (days)': 'Durée de conservation du cache (jours)',
  'Max Cache Size (MB)': 'Taille maximale du cache (Mo)',
  'Clear Cover Cache': 'Vider le cache des couvertures',
  'Metadata Cache': 'Cache des métadonnées',
  'Enable Metadata Caching': 'Activer le cache des métadonnées',
  'Search Results Cache (seconds)': 'Cache des résultats de recherche (secondes)',
  'Book Details Cache (seconds)': 'Cache des fiches de livres (secondes)',
  'Clear Metadata Cache': 'Vider le cache des métadonnées',
  Users: 'Utilisateurs',
  'Visible Self-Settings Sections': 'Sections de paramètres personnels visibles',
  'Enable Requests': 'Activer les demandes',
  'Request Rules': 'Règles de demande',
  'Default Ebook Mode': 'Mode e-book par défaut',
  'Default Audiobook Mode': 'Mode livre audio par défaut',
  'Max pending requests per user': 'Nombre maximal de demandes en attente par utilisateur',
  'Allow notes on requests': 'Autoriser les notes dans les demandes',
  'Global Notifications': 'Notifications globales',
  'Add Route': 'Ajouter une destination',
  'No routes configured.': 'Aucune destination configurée.',
  'Test Notification': 'Tester la notification',
  'Authentication Method': 'Méthode d’authentification',
  'Go to Users': 'Accéder aux utilisateurs',
  'Proxy Auth Logout URL': 'URL de déconnexion du proxy',
  'Proxy Auth Admin Group Header': 'En-tête du groupe administrateur du proxy',
  'Proxy Auth Admin Group': 'Groupe administrateur du proxy',
  'Proxy Auth Default Role': 'Rôle par défaut de l’authentification proxy',
  'Callback URL': 'URL de rappel',
  'Environment-Only Options': 'Options réservées aux variables d’environnement',
  'Save Changes': 'Enregistrer les modifications',
  'Saving...': 'Enregistrement…',
  'Loading settings...': 'Chargement des paramètres…',
  'Select a category to configure': 'Sélectionnez une catégorie à configurer',
  'This setting is not available': 'Ce paramètre n’est pas disponible',
  Unavailable: 'Indisponible',
  Reset: 'Réinitialiser',
  'Changing this setting requires a container restart to take effect':
    'La modification de ce paramètre nécessite le redémarrage du conteneur',
  'Some settings require a container restart to take effect':
    'Certains paramètres nécessitent le redémarrage du conteneur pour être pris en compte',
  'User overridden': 'Remplacé par un paramètre utilisateur',
  'Close request confirmation': 'Fermer la confirmation de demande',
  'Request Book & Audiobook': 'Demander le livre et le livre audio',
  'Cover for {title}': 'Couverture de {title}',
  'Book: ': 'Livre : ',
  'Audiobook: ': 'Livre audio : ',
  'Note (optional)': 'Note (facultative)',
  'Add context for admins reviewing this request...':
    'Ajoutez une précision à destination des administrateurs qui examineront cette demande…',
  'Requesting...': 'Envoi de la demande…',
  Request: 'Demander',
  'Book Library': 'Bibliothèque de livres',
  'Go To Library': 'Accéder à la bibliothèque',
  'Audiobook Library': 'Bibliothèque de livres audio',
  'Submit a bug report': 'Signaler un problème',
  'Downloading as {user}': 'Téléchargement au nom de {user}',
  'Reset search': 'Réinitialiser la recherche',
  'Close download confirmation': 'Fermer la confirmation de téléchargement',
  'This download will use {user}’s output preferences and destination settings.':
    'Ce téléchargement utilisera les préférences de sortie et la destination de {user}.',
  'Queuing...': 'Mise en file d’attente…',
  Confirm: 'Confirmer',
  Downloaded: 'Téléchargé',
  Loading: 'Chargement',
  Downloading: 'Téléchargement en cours',
  'Locating files': 'Recherche des fichiers',
  Resolving: 'Résolution en cours',
  Queued: 'En attente',
  Get: 'Obtenir',
  'Close settings setup dialog': 'Fermer la fenêtre de configuration des paramètres',
  'Settings Setup Information': 'Informations de configuration des paramètres',
  'Config Volume Required': 'Volume de configuration requis',
  'New Feature: Settings Page': 'Nouveauté : page des paramètres',
  'To save settings, add a config volume to your Docker Compose file:':
    'Pour enregistrer les paramètres, ajoutez un volume de configuration à votre fichier Docker Compose :',
  'Shelfmark now has a settings page! To enable it, add a config volume to your Docker Compose file:':
    'Shelfmark dispose désormais d’une page de paramètres ! Pour l’activer, ajoutez un volume de configuration à votre fichier Docker Compose :',
  'Without this volume, settings changes will not persist across container restarts.':
    'Sans ce volume, les modifications des paramètres ne seront pas conservées après le redémarrage du conteneur.',
  'This allows you to configure settings through the UI and persist them across container restarts.':
    'Cela vous permet de configurer les paramètres depuis l’interface et de les conserver après le redémarrage du conteneur.',
  'Continue to Settings': 'Accéder aux paramètres',
  'Unsupported onboarding field type': 'Type de champ non pris en charge dans l’assistant',
  'Failed to load setup wizard': 'Impossible de charger l’assistant de configuration',
  'Setup skipped - using defaults': 'Configuration ignorée : utilisation des valeurs par défaut',
  'Failed to skip setup': 'Impossible d’ignorer la configuration',
  'Setup complete!': 'Configuration terminée !',
  'Failed to save settings': 'Impossible d’enregistrer les paramètres',
  'No current step': 'Aucune étape en cours',
  'Loading setup wizard...': 'Chargement de l’assistant de configuration…',
  'Close setup wizard': 'Fermer l’assistant de configuration',
  'Setup Wizard': 'Assistant de configuration',
  Setup: 'Configuration',
  'Step {current} of {total}': 'Étape {current} sur {total}',
  'Skip setup': 'Ignorer la configuration',
  Back: 'Retour',
  'Finish Setup': 'Terminer la configuration',
  Next: 'Suivant',
  'No releases found for this book.': 'Aucune version disponible pour ce livre.',
  'No {format} releases found. Try a different format.':
    'Aucune version au format {format} trouvée. Essayez un autre format.',
  'No {contentType} releases found.': 'Aucune version de type {contentType} trouvée.',
  'Find Releases': 'Trouver des versions',
  'Manual Query': 'Requête manuelle',
  'Adding...': 'Ajout en cours…',
  'Add to requests': 'Ajouter aux demandes',
  'No release sources are available for this book.':
    'Aucune source de téléchargement n’est disponible pour ce livre.',
  'All Formats': 'Tous les formats',
  'Close release modal': 'Fermer la fenêtre des versions',
  'No cover available': 'Aucune couverture disponible',
  'Request Both': 'Demander les deux',
  'Download & Request': 'Télécharger et demander',
  'Download Both': 'Télécharger les deux',
  Home: 'Accueil',
  'Requests and activity': 'Demandes et activité',
  'Main navigation': 'Navigation principale',
  'Choose formats to download': 'Choisissez les formats à télécharger',
  'comes in several formats. Switch off any you don’t want; they won’t be filed.':
    'est disponible dans plusieurs formats. Désactivez ceux que vous ne souhaitez pas conserver.',
  'Include {format} format': 'Inclure le format {format}',
  file: 'fichier',
  files: 'fichiers',
  'This release contains several books': 'Cette version contient plusieurs livres',
  'Each book below is filed separately with its own title. Fix any titles before downloading — the author and series come from the book you searched.':
    'Chaque livre ci-dessous sera classé séparément sous son propre titre. Corrigez les titres avant le téléchargement : l’auteur et la série proviennent du livre recherché.',
  'Treat as a single book': 'Traiter comme un seul livre',
  'Use this if the split is wrong and the files are really one audiobook.':
    'Utilisez cette option si le découpage est incorrect et que les fichiers correspondent en réalité à un seul livre audio.',
  'Title for book {number}': 'Titre du livre {number}',
  'Series position for book {number}': 'Position dans la série du livre {number}',
  'Year for book {number}': 'Année du livre {number}',
  'Skip book {number}': 'Ignorer le livre {number}',
  'Skip this book': 'Ignorer ce livre',
  'Include {file}': 'Inclure {file}',
  'of {total} files skipped': 'sur {total} fichiers ignorés',
  'ignored (not a book format)': 'ignorés (pas un format de livre)',
  'Download as one book': 'Télécharger comme un seul livre',
  'Download {count} book': 'Télécharger {count} livre',
  'Download {count} books': 'Télécharger {count} livres',
  'Download {count} file': 'Télécharger {count} fichier',
  'Download {count} files': 'Télécharger {count} fichiers',
  'Queuing…': 'Mise en file d’attente…',
  Details: 'Détails',
  'Book details': 'Détails du livre',
  Today: 'Aujourd’hui',
  '1 day': '1 jour',
  '{count} days': '{count} jours',
  Added: 'Ajouté',
  Posted: 'Publié',
  Bitrate: 'Débit binaire',
  Narrator: 'Narrateur',
  'Sample Rate': 'Fréquence d’échantillonnage',
  Runtime: 'Durée',
  Grabs: 'Téléchargements',
  Unsupported: 'Non pris en charge',
  'Unsupported format ({format}) - Shelfmark cannot process this release':
    'Format non pris en charge ({format}) : Shelfmark ne peut pas traiter cette version',
  Torrent: 'Torrent',
  Usenet: 'Usenet',
  Online: 'En ligne',
  Offline: 'Hors ligne',
  'Failed to load Hardcover lists': 'Impossible de charger les listes Hardcover',
  'No writable Hardcover targets': 'Aucune liste Hardcover modifiable',
  'Added to {list}': 'Ajouté à {list}',
  'Removed from {list}': 'Retiré de {list}',
  'Failed to update Hardcover list': 'Impossible de mettre à jour la liste Hardcover',
  'Hardcover Lists': 'Listes Hardcover',
  'On {count} Hardcover list(s)': 'Dans {count} liste(s) Hardcover',
  'All languages': 'Toutes les langues',
  'Select an option': 'Choisir une option',
  Build: 'Build',
  'Text field': 'Champ texte',
  'Password field': 'Champ mot de passe',
  User: 'Utilisateur',
  Admin: 'Administrateur',
  Role: 'Rôle',
  'No email': 'Aucun e-mail',
  'Inactive for current authentication mode': 'Inactif pour le mode d’authentification actuel',
  'Role cannot be changed': 'Le rôle ne peut pas être modifié',
  'Role is managed by the {group} group in your identity provider.':
    'Le rôle est géré par le groupe {group} de votre fournisseur d’identité.',
  'Role is managed by OIDC group authorization.':
    'Le rôle est géré par les groupes d’autorisation OIDC.',
  'Role can only be changed by admins.': 'Seuls les administrateurs peuvent modifier le rôle.',
  'Role is managed by the external authentication source.':
    'Le rôle est géré par la source d’authentification externe.',
  'Deleting...': 'Suppression…',
  'Confirm Delete': 'Confirmer la suppression',
  'Delete User': 'Supprimer l’utilisateur',
  'Create Local User': 'Créer un utilisateur local',
  'Creating...': 'Création…',
  'This will be the first account and will be created as admin.':
    'Il s’agira du premier compte, créé avec le rôle administrateur.',
  'An admin account is required before OIDC can be enabled.':
    'Un compte administrateur est nécessaire avant de pouvoir activer OIDC.',
  'Display Name': 'Nom affiché',
  'Display name': 'Nom affiché',
  'Min 4 characters': '4 caractères minimum',
  'Confirm Password': 'Confirmer le mot de passe',
  'Confirm password': 'Confirmer le mot de passe',
  'Current Password': 'Mot de passe actuel',
  'Required to set a new password': 'Obligatoire pour définir un nouveau mot de passe',
  'New Password': 'Nouveau mot de passe',
  'Leave empty to keep current': 'Laisser vide pour conserver le mot de passe actuel',
  'Confirm new password': 'Confirmer le nouveau mot de passe',
  'Display name is managed by the identity provider.':
    'Le nom affiché est géré par le fournisseur d’identité.',
  'Email is synced from Calibre-Web.': 'L’adresse e-mail est synchronisée depuis Calibre-Web.',
  'Email is managed by your identity provider.':
    'L’adresse e-mail est gérée par votre fournisseur d’identité.',
  'User Preferences': 'Préférences utilisateur',
  'Open User Preferences': 'Ouvrir les préférences utilisateur',
  'Customise delivery and request settings for this user.':
    'Personnalisez les paramètres de livraison et de demande de cet utilisateur.',
  Inactive: 'Inactif',
  'No users yet.': 'Aucun utilisateur pour le moment.',
  'Create a local admin account before enabling OIDC to avoid getting locked out.':
    'Créez un compte administrateur local avant d’activer OIDC afin d’éviter de perdre l’accès à l’application.',
  'Collapse user editor': 'Réduire l’éditeur utilisateur',
  'Expand {user} editor': 'Développer l’éditeur de {user}',
  'Loading user details...': 'Chargement des informations utilisateur…',
  'Syncing with CWA...': 'Synchronisation avec CWA…',
  'Sync with CWA': 'Synchroniser avec CWA',
  'Built-in': 'Intégré',
  OIDC: 'OIDC',
  CWA: 'CWA',
  LDAP: 'LDAP',
  'Remove selected {label}': 'Retirer la sélection {label}',
  'Sort releases': 'Trier les versions',
  'Best Match (Default)': 'Meilleure correspondance (par défaut)',
  environment: 'environnement',
  'Hide the local login form': 'Masquer le formulaire de connexion local',
  'Disable username/password login': 'Désactiver la connexion par identifiant et mot de passe',
  'Skip login page, redirect straight to OIDC':
    'Ignorer la page de connexion et rediriger directement vers OIDC',
  'Gathering debug logs... This may take a minute.':
    'Préparation des journaux de débogage… Cela peut prendre une minute.',
  'Debug download failed: {error}': 'Échec du téléchargement des journaux de débogage : {error}',
  'Debug logs downloaded successfully': 'Journaux de débogage téléchargés avec succès',
  'Debug download failed. Check console for details.':
    'Échec du téléchargement des journaux de débogage. Consultez la console pour plus de détails.',
  'Multi-book pack': 'Lot de plusieurs livres',
  'Multi-book pack: file each subfolder (or each file) as a separate book. Only needed when a release can’t be inspected before download.':
    'Lot de plusieurs livres : classe chaque sous-dossier (ou fichier) comme un livre distinct. À utiliser uniquement si la version ne peut pas être analysée avant le téléchargement.',
  'Choose formats': 'Choisir les formats',
  'Choose formats: when a release has several formats, pick which ones to download.':
    'Choisir les formats : lorsqu’une version propose plusieurs formats, sélectionnez ceux à télécharger.',
  'Manual search query': 'Requête de recherche manuelle',
  'Manual query': 'Requête manuelle',
  'Results 1–{end} ({total} total)': 'Résultats 1–{end} ({total} au total)',
  'Filter releases': 'Filtrer les versions',
  Indexers: 'Trackers',
  'All Indexers': 'Tous les trackers',
  'Show results with 0 seeders': 'Afficher les résultats sans seeders',
  Apply: 'Appliquer',
  'Type a custom search query (overrides all sources)':
    'Saisissez une requête personnalisée (remplace toutes les sources)',
  'Searching…': 'Recherche…',
  'Find Downloads': 'Trouver des téléchargements',
  'Create one route per URL. Start with All, then add event-specific routes for targeted delivery. Need format examples? [View Apprise URL formats](https://appriseit.com/services/).':
    'Créez une destination par URL. Commencez par « Tous », puis ajoutez des destinations spécifiques à chaque événement. Des exemples de formats sont disponibles ici : [Voir les formats d’URL Apprise](https://appriseit.com/services/).',
  'Create one route per URL. Start with All, then add event-specific routes for targeted delivery. Use {User} or {Email} in the path or query to fill in your account details, e.g. ntfys://ntfy.sh/shelfmark-{User}. Personal routes can use ntfy, Gotify, Discord, Slack, Telegram, Pushover and PushBullet. Need format examples? [View Apprise URL formats](https://appriseit.com/services/).':
    'Créez une destination par URL. Commencez par « Tous », puis ajoutez des destinations spécifiques à chaque événement. Utilisez {User} ou {Email} dans le chemin ou la requête pour insérer les informations de votre compte (ex. : ntfys://ntfy.sh/shelfmark-{User}). Les destinations personnelles peuvent utiliser ntfy, Gotify, Discord, Slack, Telegram, Pushover et PushBullet. Des exemples de formats sont disponibles ici : [Voir les formats d’URL Apprise](https://appriseit.com/services/).',
  "Create one route per URL. Start with All, then add event-specific routes for targeted delivery. Use {User} or {Email} in the path or query to fill in each user's account details, e.g. ntfys://ntfy.sh/shelfmark-{User}, or mailtos://...?to={Email} in the admin default. Need format examples? [View Apprise URL formats](https://appriseit.com/services/).":
    'Créez une destination par URL. Commencez par « Tous », puis ajoutez des destinations spécifiques à chaque événement. Utilisez {User} ou {Email} dans le chemin ou la requête pour insérer les informations du compte (ex. : ntfys://ntfy.sh/shelfmark-{User} ou mailtos://...?to={Email} dans la destination par défaut). Des exemples de formats sont disponibles ici : [Voir les formats d’URL Apprise](https://appriseit.com/services/).',
  'The routes below replace the default your administrator set.':
    'Les destinations ci-dessous remplacent celle définie par votre administrateur.',
  'Your administrator has set a default route that applies to you until you add your own. Routes added below replace it.':
    'Votre administrateur a défini une destination par défaut qui s’applique jusqu’à ce que vous ajoutiez les vôtres. Les destinations ajoutées ci-dessous la remplacent.',
  'Select events...': 'Sélectionner les événements…',
  'Personal notification preferences for this user. Reset to inherit global defaults from the Notifications tab.':
    'Préférences de notification personnelles de cet utilisateur. Réinitialisez-les pour hériter des paramètres par défaut de l’onglet Notifications.',
  'Send a test notification to the configured personal route URLs.':
    'Envoyer une notification de test aux URL personnelles configurées.',
  'Number field': 'Champ numérique',
  Formats: 'Formats',
  'Series #': 'N° de série',
  Genre: 'Genre',
  Pages: 'Pages',
  'Custom search query': 'Requête de recherche personnalisée',
  'No Cover': 'Pas de couverture',
  'Browse Alternatives': 'Parcourir les alternatives',
  'Clear Completed': 'Effacer les éléments terminés',
  'Clear History': 'Effacer l’historique',
  'Got it': 'Compris',
  'Error Loading Releases': 'Erreur lors du chargement des versions',
  More: 'plus',
  'Result 1 (1 Total)': 'Résultat 1 (1 au total)',
  'Manual query overrides ISBN/title/author/language expansion.':
    'La requête manuelle remplace l’expansion par ISBN, titre, auteur et langue.',
  'Checking authentication…': 'Vérification de l’authentification…',
  'Loading configuration…': 'Chargement de la configuration…',
  'Per-source settings become available when a default is set to Download or Request Release.':
    'Les réglages par source sont disponibles lorsqu’une valeur par défaut est définie sur « Télécharger » ou « Demander une version ».',
  '← Back': '← Retour',
  'Hardcover Wishlist Sync': 'Synchronisation de la liste de souhaits Hardcover',
  'Automatically pull books from your Hardcover reading shelves into Shelfmark as requests, on a schedule.':
    'Importez automatiquement et régulièrement dans Shelfmark les livres de vos étagères de lecture Hardcover sous forme de demandes.',
  'Periodically sync the selected Hardcover shelves into requests.':
    'Synchroniser périodiquement les étagères Hardcover sélectionnées avec les demandes.',
  'Enable scheduled sync': 'Activer la synchronisation planifiée',
  'Hardcover API Token': 'Jeton API Hardcover',
  'Reuses metadata provider token if blank':
    'Réutilise le jeton du fournisseur de métadonnées si ce champ est vide',
  'Shelves to sync': 'Étagères à synchroniser',
  'Request as': 'Créer les demandes en tant que',
  'Sync interval': 'Intervalle de synchronisation',
  'Interval unit': 'Unité de l’intervalle',
  'Automatic Downloads': 'Téléchargements automatiques',
  'Enable automatic downloads': 'Activer les téléchargements automatiques',
  'Audiobook source priority': 'Priorité des sources de livres audio',
  'Ebook source priority': 'Priorité des sources de livres numériques',
  'Minimum seeders (torrents)': 'Nombre minimal de seeders (torrents)',
  'Retry failed downloads after (days)': 'Réessayer les téléchargements échoués après (jours)',
  'Try another release after a failed download (minutes)':
    'Essayer une autre version après un échec de téléchargement (minutes)',
  'Try a failed release again after (days)': 'Réessayer une version échouée après (jours)',
  'Look the book up after (unmatched passes)':
    'Vérifier la disponibilité après (cycles sans correspondance)',
  'Smallest acceptable audiobook copy (%)': 'Copie de livre audio minimale acceptable (%)',
  'Sync now': 'Synchroniser maintenant',
  'Welcome to Shelfmark': 'Bienvenue sur Shelfmark',
  "Let's configure how you want to search for and download books.":
    'Configurons la recherche et le téléchargement de vos livres.',
  'Metadata Provider': 'Fournisseur de métadonnées',
  'Get API Key': 'Obtenir une clé API',
  'Enable Google Books': 'Activer Google Books',
  'Enable Moly.hu': 'Activer Moly.hu',
  'Search by author name': 'Rechercher par nom d’auteur',
  'Search by book title': 'Rechercher par titre de livre',
  'Enable AudiobookBay': 'Activer AudiobookBay',
  'Max Pages to Search': 'Nombre maximal de pages à parcourir',
  'Prefer Exact-Phrase Search': 'Privilégier la recherche exacte',
  'Seed Time (minutes)': 'Durée de partage (minutes)',
  'Rate Limit Delay (seconds)': 'Délai entre les requêtes (secondes)',
  Hostname: 'Nom d’hôte',
  Chinese: 'Chinois',
  Russian: 'Russe',
  Spanish: 'Espagnol',
  German: 'Allemand',
  Italian: 'Italien',
  Portuguese: 'Portugais',
  Polish: 'Polonais',
  Bulgarian: 'Bulgare',
  Dutch: 'Néerlandais',
  Japanese: 'Japonais',
  Arabic: 'Arabe',
  Hebrew: 'Hébreu',
  Turkish: 'Turc',
  Hungarian: 'Hongrois',
  Latin: 'Latin',
  Czech: 'Tchèque',
  Korean: 'Coréen',
  Ukrainian: 'Ukrainien',
  Indonesian: 'Indonésien',
  Romanian: 'Roumain',
  Swedish: 'Suédois',
  Greek: 'Grec',
  Lithuanian: 'Lituanien',
  Bangla: 'Bengali',
  'Traditional Chinese': 'Chinois traditionnel',
  Afrikaans: 'Afrikaans',
  Catalan: 'Catalan',
  Danish: 'Danois',
  Thai: 'Thaï',
  Hindi: 'Hindi',
  Irish: 'Irlandais',
  Latvian: 'Letton',
  Tibetan: 'Tibétain',
  Kannada: 'Kannada',
  Serbian: 'Serbe',
  Persian: 'Persan',
  Croatian: 'Croate',
  Slovak: 'Slovaque',
  Javanese: 'Javanais',
  Vietnamese: 'Vietnamien',
  Urdu: 'Ourdou',
  Finnish: 'Finnois',
  Norwegian: 'Norvégien',
  Kinyarwanda: 'Kinyarwanda',
  Tamil: 'Tamoul',
  Belarusian: 'Biélorusse',
  Kazakh: 'Kazakh',
  Mongolian: 'Mongol',
  Georgian: 'Géorgien',
  Slovenian: 'Slovène',
  Esperanto: 'Espéranto',
  Galician: 'Galicien',
  Marathi: 'Marathi',
  Filipino: 'Filipino',
  Gujarati: 'Gujarati',
  Malayalam: 'Malayalam',
  Kyrgyz: 'Kirghize',
  Azerbaijani: 'Azerbaïdjanais',
  Quechua: 'Quechua',
  Swahili: 'Swahili',
  Bashkir: 'Bachkir',
  Punjabi: 'Pendjabi',
  Malay: 'Malais',
  Telugu: 'Télougou',
  Albanian: 'Albanais',
  Uyghur: 'Ouïghour',
  Armenian: 'Arménien',
  Shan: 'Shan',
  Bosnian: 'Bosniaque',
  Burmese: 'Birman',
  Estonian: 'Estonien',
  Icelandic: 'Islandais',
  Manx: 'Mannois',
  'Scottish Gaelic': 'Gaélique écossais',
  Sanskrit: 'Sanskrit',
  'Expand search': 'Élargir la recherche',
  'Configure where ebooks, comics, and magazines are saved.':
    'Choisissez où enregistrer les livres numériques, bandes dessinées et magazines.',
  'Choose where completed book files are sent.':
    'Choisissez où envoyer les fichiers de livres terminés.',
  'Save files to the destination folder': 'Enregistrer les fichiers dans le dossier de destination',
  'Send files as an email attachment': 'Envoyer les fichiers en pièce jointe par e-mail',
  'Upload files directly to Grimmory': 'Envoyer les fichiers directement vers Grimmory',
  'Check that Shelfmark can create and write to this destination.':
    'Vérifie que Shelfmark peut créer ce dossier et y écrire.',
  'Create folders and rename files using a template. Do not use with ingest folders.':
    'Crée des dossiers et renomme les fichiers à l’aide d’un modèle. À éviter avec les dossiers d’import de bibliothèque.',
  'Create folders and rename files using a template. Recommended for Audiobookshelf. Do not use with ingest folders.':
    'Crée des dossiers et renomme les fichiers à l’aide d’un modèle. Recommandé pour Audiobookshelf. À éviter avec les dossiers d’import de bibliothèque.',
  'Keep original filename from source': 'Conserver le nom de fichier d’origine',
  'Rename single-file downloads; multi-file keeps original names.':
    'Renommer les téléchargements avec un seul fichier ; conserver les noms d’origine pour les téléchargements multiples.',
  'Rename single-file downloads; keep multi-file downloads grouped in their source folder. Do not use with ingest folders.':
    'Renommer les téléchargements avec un seul fichier ; conserver les téléchargements multiples ensemble dans leur dossier source. À éviter avec les dossiers d’import de bibliothèque.',
  "Replaces spaces inside naming template values (e.g. 'Conan Doyle' -> 'Conan.Doyle' with '.'). Applies to books and audiobooks, rename and organize templates alike. Literal characters typed into a template (like the '-' in '{Author} - {Title}') are left as-is. Leave empty to keep spaces as-is.":
    'Remplace les espaces dans les valeurs du modèle de nommage (par exemple « Conan Doyle » devient « Conan.Doyle » avec « . »). S’applique aux modèles de renommage et d’organisation des livres et livres audio. Les caractères saisis directement dans le modèle (comme le « - » de « {Author} - {Title} ») restent inchangés. Laissez vide pour conserver les espaces.',
  'Directory where downloaded audiobook files are saved. Leave empty to use the Books destination.':
    'Dossier où enregistrer les fichiers de livres audio téléchargés. Laissez vide pour utiliser la destination des livres.',
  'Check that Shelfmark can create and write to this audiobook destination.':
    'Vérifie que Shelfmark peut créer le dossier de destination des livres audio et y écrire.',
  'Maximum number of simultaneous downloads. Not used while Max Concurrent Downloads Per Source is above 0.':
    'Nombre maximal de téléchargements simultanés. Cette limite ne s’applique pas si le nombre maximal de téléchargements simultanés par source est supérieur à 0.',
  "Simultaneous downloads allowed from each source (Soulseek, AudiobookBay, Direct Download and so on). A source at its limit does not hold the others back, so a Soulseek download waiting in a peer's queue cannot stop a torrent from starting. Above 0 this replaces Max Concurrent Downloads: the total can be this number for every source that has downloads at once. 0 uses the single limit above for all sources together.":
    'Nombre de téléchargements simultanés autorisés pour chaque source (Soulseek, AudiobookBay, téléchargement direct, etc.). Une source ayant atteint sa limite ne bloque pas les autres : un téléchargement Soulseek en attente chez un pair n’empêche donc pas le démarrage d’un torrent. Au-dessus de 0, cette valeur remplace le nombre maximal global : chaque source peut atteindre cette limite. À 0, la limite globale ci-dessus s’applique à toutes les sources.',
  'How long to keep completed/failed downloads in the queue display.':
    'Durée pendant laquelle les téléchargements terminés ou échoués restent affichés dans la file.',
  'Select the authentication method for accessing Shelfmark. Restart container after changing Calibre-Web passwords.':
    'Choisissez la méthode d’authentification pour accéder à Shelfmark. Redémarrez le conteneur après toute modification des mots de passe Calibre-Web.',
  'Authentication is disabled. Anyone can access Shelfmark without signing in.':
    'L’authentification est désactivée. Tout le monde peut accéder à Shelfmark sans se connecter.',
  'Choose which personal settings sections are shown in My Account for non-admin users.':
    'Choisissez les sections de paramètres personnels affichées dans « Mon compte » pour les utilisateurs non administrateurs.',
  'Turn this off to let everyone download directly without needing approval.':
    'Désactivez cette option pour autoriser tout le monde à télécharger directement, sans approbation.',
  'Global notifications send selected events for all users to configured routes. Users can manage personal notifications in User Preferences.':
    'Les notifications globales envoient les événements sélectionnés pour tous les utilisateurs vers les destinations configurées. Chaque utilisateur peut gérer ses notifications personnelles dans ses préférences.',
  'Bearer token for your Hardcover account. Leave blank to reuse the token from the Hardcover metadata provider.':
    'Jeton Bearer de votre compte Hardcover. Laissez vide pour réutiliser le jeton du fournisseur de métadonnées Hardcover.',
  'Which Hardcover reading shelf to pull from.': 'Étagère de lecture Hardcover à importer.',
  'Content type for synced requests. "Ebooks and audiobooks" creates one request of each per shelf book; every request is checked against its own library and downloaded with its own format guard and source priority.':
    'Type de contenu des demandes synchronisées. « Livres numériques et livres audio » crée une demande de chaque type pour chaque livre de l’étagère. Chaque demande est comparée à sa propre bibliothèque et téléchargée selon ses formats et la priorité de ses sources.',
  'How often the scheduled sync runs (minimum 1 minute).':
    'Fréquence d’exécution de la synchronisation planifiée (minimum : 1 minute).',
  'Whether the sync interval is measured in minutes or hours.':
    'Indique si l’intervalle de synchronisation est exprimé en minutes ou en heures.',
  Minutes: 'Minutes',
  Hours: 'Heures',
  "When enabled, pending Hardcover requests (synced from a shelf, or made by a user whose request policy lets them download directly) are auto-approved and downloaded from the first source in the matching list below that yields a strict title/author/format match for the request's content type (ebook formats for ebook requests, audiobook formats for audiobook requests). If no confident match is found, the request is left pending for manual review.":
    'Lorsque cette option est activée, les demandes Hardcover en attente (synchronisées depuis une étagère ou créées par un utilisateur autorisé à télécharger directement) sont approuvées automatiquement et téléchargées depuis la première source ci-dessous qui trouve une correspondance exacte pour le titre, l’auteur et le format adapté au type de demande. Sans correspondance suffisamment fiable, la demande reste en attente d’une vérification manuelle.',
  "Auto-approve and auto-download matching releases for Hardcover requests. Another user's request is only approved this way where their request policy already lets them download directly; the rest wait for an admin.":
    'Approuve et télécharge automatiquement les versions correspondant aux demandes Hardcover. La demande d’un autre utilisateur n’est approuvée ainsi que si ses règles l’autorisent déjà à télécharger directement ; les autres demandes attendent un administrateur.',
  'Drag to set which release sources are tried first for audiobook requests. The first source with a strict match wins. Disabled sources are skipped.':
    'Faites glisser les sources pour définir leur ordre de priorité pour les demandes de livres audio. La première source proposant une correspondance exacte est utilisée. Les sources désactivées sont ignorées.',
  'Drag to set which release sources are tried first for ebook requests. The first source with a strict match wins. Disabled sources are skipped.':
    'Faites glisser les sources pour définir leur ordre de priorité pour les demandes de livres numériques. La première source proposant une correspondance exacte est utilisée. Les sources désactivées sont ignorées.',
  'Skip torrent releases with fewer seeders than this.':
    'Ignore les versions torrent qui ont moins de seeders que ce nombre.',
  'A synced request whose download failed, or was interrupted (a restart, say), goes back to pending after this many days and is tried again, a few per pass. A release that failed is not picked again, and a request is given up on after three failed retries. A download the stall timer cancelled counts as failed; one cancelled by a person, and rejected requests, are never retried. 0 turns retries off.':
    'Une demande synchronisée dont le téléchargement a échoué ou a été interrompu (par exemple par un redémarrage) repasse en attente après ce nombre de jours et est réessayée, quelques-unes par cycle. Une version ayant échoué ne sera pas reprise et la demande est abandonnée après trois tentatives infructueuses. Une annulation par le délai d’inactivité compte comme un échec ; les annulations manuelles et les demandes rejetées ne sont jamais réessayées. 0 désactive les nouvelles tentatives.',
  'A download that failed, or that was given up on (stalled, no seeders), goes back to pending this many minutes later and another release is chosen, without waiting for the retry days above or the next sync cycle. The release that failed is not picked again, and a request is given up on after three failed attempts. 0 turns this off.':
    'Un téléchargement échoué ou abandonné (bloqué ou sans seeders) repasse en attente après ce nombre de minutes et une autre version est choisie, sans attendre le délai de réessai ci-dessus ni le prochain cycle de synchronisation. La version échouée ne sera pas reprise et la demande est abandonnée après trois tentatives infructueuses. 0 désactive cette fonction.',
  'A release that failed or stalled is kept out of the search for this many days, then it may be picked again. A torrent that stalled can be revived by new seeds, so a failure should not shut a book out for good. A request is still given up on after three failed attempts.':
    'Une version échouée ou bloquée est exclue des recherches pendant ce nombre de jours, puis peut être sélectionnée de nouveau. Un torrent bloqué peut repartir si de nouveaux seeders apparaissent ; un échec ne doit donc pas exclure définitivement un livre. La demande est tout de même abandonnée après trois tentatives infructueuses.',
  'Longest wait between searches for an unmatched request (days)':
    'Délai maximal entre les recherches d’une demande sans correspondance (jours)',
  'A request that no source has a match for is searched every cycle at first. After three passes in a row with no match it is searched once a day, then every two days, and at most this often apart. A match, or Sync now, starts it over. 0 searches every unmatched request every cycle.':
    'Une demande sans correspondance est d’abord recherchée à chaque cycle. Après trois cycles sans résultat, elle est recherchée une fois par jour, puis tous les deux jours, sans dépasser cet intervalle. Une correspondance ou une synchronisation manuelle remet le compteur à zéro. 0 relance chaque demande sans correspondance à chaque cycle.',
  'Mark audiobooks no store sells': 'Signaler les livres audio indisponibles en magasin',
  'An audiobook request that stays unmatched is looked up on Audible (US and UK) through your Audiobookshelf server. Either way it stays pending and its reason says what the store answered (with the ASIN when listed), for you to decline or keep; it is checked again after a week. A lookup that fails decides nothing. Needs the Audiobookshelf URL and token below.':
    'Une demande de livre audio sans correspondance est vérifiée sur Audible (États-Unis et Royaume-Uni) via votre serveur Audiobookshelf. Elle reste en attente et indique la réponse du magasin (avec l’ASIN s’il est fourni), afin que vous puissiez la conserver ou la refuser ; elle est vérifiée à nouveau une semaine plus tard. Une vérification qui échoue ne conclut rien. Nécessite l’URL et le jeton Audiobookshelf ci-dessous.',
  'How many consecutive passes with no strict match a request goes through before the store is asked. A pass that matched, or a reopen, starts the count over.':
    'Nombre de cycles consécutifs sans correspondance exacte avant d’interroger le magasin. Une correspondance ou la réouverture de la demande remet le compteur à zéro.',
  'A copy of an audiobook smaller than this share of the largest copy found for the same book is probably a lower-bitrate copy. It is tried after the others, and a single m4b that small is not preferred over a fuller set of chapter files. 0 turns the check off.':
    'Une copie de livre audio dont la taille est inférieure à ce pourcentage de la plus grosse copie trouvée est probablement de qualité inférieure. Elle est essayée après les autres ; un seul fichier m4b de cette taille ne sera pas préféré à un ensemble plus complet de chapitres. 0 désactive cette vérification.',
  'Run a sync + auto-download pass immediately (uses saved settings).':
    'Lance immédiatement un cycle de synchronisation et de téléchargement automatique avec les paramètres enregistrés.',
  'Controls SSL/TLS certificate verification for outbound connections. Disable for self-signed certificates on internal services (e.g. OIDC providers, Prowlarr).':
    'Contrôle la vérification des certificats SSL/TLS des connexions sortantes. Désactivez cette option pour les certificats autosignés de services internes (par exemple les fournisseurs OIDC ou Prowlarr).',
  "DNS provider for domain resolution. 'Auto' rotates through providers on failure.":
    'Fournisseur DNS utilisé pour résoudre les noms de domaine. Le mode « Automatique » essaie d’autres fournisseurs en cas d’échec.',
  'Use encrypted DNS queries for improved reliability and privacy.':
    'Utilise des requêtes DNS chiffrées pour améliorer la fiabilité et la confidentialité.',
  'Route all traffic through Tor for enhanced privacy. Requires root startup.':
    'Fait transiter tout le trafic par Tor pour renforcer la confidentialité. Le démarrage avec les droits root est nécessaire.',
  'Set USING_TOR=true env var and restart as root.':
    'Définissez la variable d’environnement USING_TOR=true et redémarrez avec les droits root.',
  'Choose proxy type. SOCKS5 handles all traffic through a single proxy.':
    'Choisissez le type de proxy. SOCKS5 fait passer tout le trafic par un seul proxy.',
  'All traffic is routed through Tor. Requires container restart to change.':
    'Tout le trafic transite par Tor. Un redémarrage du conteneur est nécessaire pour modifier ce réglage.',
  'DNS over HTTPS is not used when Tor routing is enabled.':
    'DNS over HTTPS n’est pas utilisé lorsque le routage via Tor est activé.',
  'Auto mode always uses DNS over HTTPS for reliable provider rotation.':
    'Le mode automatique utilise toujours DNS over HTTPS pour garantir le changement de fournisseur en cas d’échec.',
  'Tor routing is active. Set USING_TOR=false and restart to disable.':
    'Le routage via Tor est actif. Définissez USING_TOR=false et redémarrez pour le désactiver.',
  'Not applicable when Tor routing is enabled.':
    'Non applicable lorsque le routage via Tor est activé.',
  'Fine-tune access per source. Source rules can only be the same or more restrictive than the default above.':
    'Ajustez les autorisations pour chaque source. Les règles ne peuvent être qu’identiques ou plus restrictives que le réglage par défaut ci-dessus.',
  'Add Rule': 'Ajouter une règle',
  'Let users who can download also request a book without choosing a release, for a book nobody has released yet or one no source has. The request waits for an admin. Admins can always do this.':
    'Autorise les utilisateurs pouvant télécharger à demander un livre sans choisir de version, lorsqu’aucune version n’est encore sortie ou disponible. La demande attend l’approbation d’un administrateur. Les administrateurs peuvent toujours le faire.',
  'Want to Read': 'À lire',
  'Currently Reading': 'En cours de lecture',
  Read: 'Lu',
  'Did Not Finish': 'Abandonné',
  Ebooks: 'Livres numériques',
  'Ebooks and audiobooks': 'Livres numériques et livres audio',
  'Source not configured / unavailable': 'Source non configurée ou indisponible',
  'A sync is already running. Try again shortly.':
    'Une synchronisation est déjà en cours. Réessayez dans un instant.',
  'Sync started. New wishlist books will appear as requests; matching audiobooks auto-download if enabled.':
    'Synchronisation lancée. Les nouveaux livres de la liste apparaîtront comme demandes ; les livres audio correspondants seront téléchargés automatiquement si l’option est activée.',
  'Create and manage user accounts directly. Passwords are stored locally and users sign in with their username and password.':
    'Créez et gérez directement les comptes utilisateurs. Les mots de passe sont stockés localement et les utilisateurs se connectent avec leur nom d’utilisateur et leur mot de passe.',
  'Users sign in through your identity provider. New accounts can be created automatically on first login when auto-provisioning is enabled, or you can pre-create users here and they’ll be linked by email on first sign-in.':
    'Les utilisateurs se connectent avec votre fournisseur d’identité. Si la création automatique est activée, les comptes sont créés lors de la première connexion ; vous pouvez aussi créer les utilisateurs ici, puis les comptes seront associés par adresse e-mail.',
  'Users are authenticated by your reverse proxy. Accounts are automatically created on first sign-in. If a local user with a matching username already exists, it will be linked instead.':
    'Les utilisateurs sont authentifiés par votre proxy inverse. Les comptes sont créés lors de la première connexion. Si un compte local porte déjà le même nom, il sera associé à la place.',
  'User accounts are synced from your Calibre-Web database. Users are matched by email, and new accounts are created here when new CWA users are found.':
    'Les comptes utilisateurs sont synchronisés depuis votre base Calibre-Web. Les utilisateurs sont associés par adresse e-mail et les nouveaux comptes sont créés ici lorsque de nouveaux utilisateurs CWA sont détectés.',
  'Calibre-Web database not detected. Mount your app.db to /auth/app.db to enable this method. Sign-in fails until the database is available.':
    'Base de données Calibre-Web introuvable. Montez votre fichier app.db dans /auth/app.db pour activer cette méthode. La connexion échouera tant que la base ne sera pas accessible.',
  'Choose where to search for book information. You can enable more providers in Settings later.':
    'Choisissez où rechercher les informations sur les livres. Vous pourrez activer d’autres fournisseurs dans les paramètres.',
  'Choose the release sources you want to configure now. You can always add or change sources later in Settings.':
    'Choisissez les sources de téléchargement à configurer maintenant. Vous pourrez toujours en ajouter ou en modifier dans les paramètres.',
  'Select one or more release sources to configure now.':
    'Sélectionnez une ou plusieurs sources de téléchargement à configurer maintenant.',
  "Add at least one Anna's Archive mirror URL to enable Direct Download. If you have an Anna's Archive donator key, you can add it here too. You can configure alternative mirrors later in Settings.":
    'Ajoutez au moins une URL de miroir Anna’s Archive pour activer le téléchargement direct. Vous pouvez également ajouter ici votre clé donateur Anna’s Archive. Les autres miroirs pourront être configurés plus tard dans les paramètres.',
  'Add the AudiobookBay domain you want Shelfmark to search.':
    'Ajoutez le domaine AudiobookBay à utiliser pour les recherches Shelfmark.',
  'Direct Download Setup': 'Configuration du téléchargement direct',
  'Google Books Setup': 'Configuration de Google Books',
  'Hardcover Setup': 'Configuration de Hardcover',
  'Sources to Set Up': 'Sources à configurer',
  'Get your free API key from hardcover.app/account/api':
    'Obtenez gratuitement votre clé API sur hardcover.app/account/api.',
  'Get your free API key from Google Cloud Console (APIs & Services > Credentials).':
    'Obtenez gratuitement votre clé API dans Google Cloud Console (APIs & Services > Credentials).',
  "Access Google's comprehensive book database. Requires a free API key with ~1000 requests/day quota.":
    'Accédez à la vaste base de données de livres de Google. Une clé API gratuite est nécessaire (environ 1 000 requêtes par jour).',
  'Enable Google Books as a metadata provider for book searches':
    'Activer Google Books comme fournisseur de métadonnées pour les recherches de livres',
  'Get your API key from Google Cloud Console (APIs & Services > Credentials)':
    'Obtenez votre clé API dans Google Cloud Console (APIs & Services > Credentials).',
  'Verify your API key works': 'Vérifie que votre clé API fonctionne.',
  'Default sort order for Google Books search results.':
    'Ordre de tri par défaut des résultats Google Books.',
  'Hungarian community book catalog with excellent coverage of Hungarian editions and translations. No API key required.':
    'Catalogue communautaire hongrois offrant une excellente couverture des éditions et traductions hongroises. Aucune clé API n’est nécessaire.',
  'Enable Moly.hu as a metadata provider for book searches':
    'Activer Moly.hu comme fournisseur de métadonnées pour les recherches de livres',
  'Verify moly.hu is accessible': 'Vérifie que moly.hu est accessible.',
  Rating: 'Note',
  'Enable AudiobookBay as a release source for audiobooks.':
    'Active AudiobookBay comme source de téléchargement de livres audio.',
  'AudiobookBay domain (e.g., audiobookbay.lu, audiobookbay.is). Required to enable searches.':
    'Domaine AudiobookBay (par exemple audiobookbay.lu ou audiobookbay.is). Obligatoire pour activer les recherches.',
  'Maximum number of search result pages to fetch (1-10).':
    'Nombre maximal de pages de résultats à récupérer (1 à 10).',
  'Wrap generated queries in quotes for stricter matching. If no results are found, Shelfmark retries without quotes.':
    'Place les requêtes générées entre guillemets pour une correspondance plus stricte. Sans résultat, Shelfmark réessaie sans guillemets.',
  "How long a finished AudiobookBay torrent keeps seeding before the client stops it. 0 uses the torrent client's own limit.":
    'Durée de partage d’un torrent AudiobookBay terminé avant son arrêt par le client. 0 utilise la limite définie dans le client torrent.',
  "Share ratio an AudiobookBay torrent should reach before the client stops it. 0 uses the torrent client's own limit.":
    'Ratio de partage qu’un torrent AudiobookBay doit atteindre avant son arrêt par le client. 0 utilise la limite définie dans le client torrent.',
  'Seed Ratio': 'Ratio de partage',
  'Delay between requests in seconds to avoid rate limiting (0-10).':
    'Délai entre les requêtes pour éviter les limitations de débit (0 à 10 secondes).',
  'Search and download ebook and audiobook releases from IRC channels. This source connects via IRC and uses DCC for file transfers. Configure the connection details below to enable IRC search. Note: DCC requires direct TCP connections to arbitrary ports, which may not work behind strict firewalls or NAT.':
    'Recherchez et téléchargez des livres numériques et audio depuis des canaux IRC. Cette source utilise IRC et DCC pour transférer les fichiers. Configurez la connexion ci-dessous pour activer la recherche. Remarque : DCC nécessite des connexions TCP directes sur des ports variables, ce qui peut être incompatible avec certains pare-feu stricts ou NAT.',
  'IRC server hostname': 'Nom d’hôte du serveur IRC',
  'IRC server port (usually 6697 for TLS, 6667 for plain)':
    'Port du serveur IRC (généralement 6697 avec TLS ou 6667 sans chiffrement)',
  "Enable TLS/SSL encryption for the IRC connection. Disable for servers that don't support TLS.":
    'Active le chiffrement TLS/SSL pour la connexion IRC. Désactivez cette option si le serveur ne prend pas TLS en charge.',
  'Use TLS': 'Utiliser TLS',
  'Channel name without the # prefix. Used for all searches unless a separate audiobook channel is configured below.':
    'Nom du canal sans le préfixe #. Utilisé pour toutes les recherches, sauf si un canal dédié aux livres audio est défini ci-dessous.',
  Channel: 'Canal',
  'Your IRC nickname (required). Must be unique on the IRC network.':
    'Votre pseudonyme IRC (obligatoire). Il doit être unique sur le réseau IRC.',
  Nickname: 'Pseudonyme',
  'The search bot to address queries to (required). Searches are sent as "@<bot> <query>".':
    'Bot de recherche auquel envoyer les requêtes (obligatoire). Les recherches sont envoyées sous la forme « @<bot> <query> ».',
  'Search bot': 'Bot de recherche',
  "Optional. Channel name (without the # prefix) for networks that index audiobooks separately, such as Undernet's bookz. Leave blank (the usual setting) to search the main channel above for audiobooks too.":
    'Facultatif. Nom du canal (sans le préfixe #) pour les réseaux qui indexent les livres audio séparément, comme le canal bookz d’Undernet. Laissez vide (réglage habituel) pour rechercher aussi les livres audio dans le canal principal ci-dessus.',
  'Audiobook channel': 'Canal de livres audio',
  'Optional. Search bot for the audiobook channel. Leave blank to reuse the main search bot above. Only used when an audiobook channel is set.':
    'Facultatif. Bot de recherche du canal de livres audio. Laissez vide pour réutiliser le bot principal ci-dessus. Utilisé uniquement si un canal de livres audio est défini.',
  'Audiobook search bot': 'Bot de recherche des livres audio',
  'IRC search results are cached to reduce load on IRC servers. Use the Refresh button in the release modal to force a new search.':
    'Les résultats IRC sont mis en cache pour réduire la charge des serveurs. Utilisez le bouton Actualiser dans la fenêtre des versions pour relancer une recherche.',
  'Search Cache': 'Cache de recherche',
  'How long to keep cached search results before they expire.':
    'Durée de conservation des résultats en cache avant leur expiration.',
  'Cache Duration': 'Durée du cache',
  'Remove all cached IRC search results.': 'Supprime tous les résultats IRC en cache.',
  'Clear Cache': 'Vider le cache',
  'Search for books across your torrent indexers via Jackett.':
    'Recherchez des livres parmi vos indexeurs torrent avec Jackett.',
  'Jackett Integration': 'Intégration Jackett',
  'Jackett URL': 'URL de Jackett',
  'Enable searching for books via Jackett indexers':
    'Activer la recherche de livres via les indexeurs Jackett',
  'Enable Jackett source': 'Activer la source Jackett',
  'Base URL of your Jackett instance': 'URL de base de votre instance Jackett',
  'Shown at the top right of the Jackett dashboard':
    'Affichée en haut à droite du tableau de bord Jackett',
  'Verify your Jackett configuration': 'Vérifie la configuration Jackett.',
  'Select which indexers to search. Leave empty to search all configured indexers.':
    'Choisissez les indexeurs à interroger. Laissez vide pour les utiliser tous.',
  'Indexers to Search': 'Indexeurs à interroger',
  'How long to wait for Jackett to answer a search. Searching all indexers waits for the slowest one, and indexers behind FlareSolverr can need 90 seconds or more on a cold Cloudflare challenge.':
    'Délai d’attente maximal d’une recherche Jackett. Une recherche sur tous les indexeurs attend le plus lent ; ceux qui utilisent FlareSolverr peuvent nécessiter 90 secondes ou plus lors d’un nouveau défi Cloudflare.',
  'Indexer Search Timeout (seconds)': 'Délai de recherche des indexeurs (secondes)',
  'Enable Libgen Search': 'Activer la recherche Libgen',
  "Search the Libgen catalogue directly, including CBZ/CBR comics and manga that Anna's Archive does not index. Uses the Libgen mirrors configured under Mirrors for both search and download.":
    'Recherche directement dans le catalogue Libgen, notamment les bandes dessinées et mangas CBZ/CBR absents d’Anna’s Archive. Utilise les miroirs Libgen définis dans la section Miroirs pour la recherche et le téléchargement.',
  'Maximum number of results to request per search (1-100).':
    'Nombre maximal de résultats à demander par recherche (1 à 100).',
  'Max Results': 'Nombre maximal de résultats',
  'Search for books via any Newznab-compatible indexer or aggregator (e.g. NZBHydra2, NZBGeek, Drunkenslug).':
    'Recherchez des livres via n’importe quel indexeur ou agrégateur compatible Newznab (par exemple NZBHydra2, NZBGeek ou Drunkenslug).',
  'Newznab Integration': 'Intégration Newznab',
  'Enable searching for books via a Newznab-compatible indexer':
    'Activer la recherche de livres via un indexeur compatible Newznab',
  'Enable Newznab source': 'Activer la source Newznab',
  'Auto-expand search on no results': 'Élargir automatiquement la recherche sans résultat',
  'Automatically retry search without category filtering if no results are found':
    'Relance automatiquement la recherche sans filtre de catégorie si aucun résultat n’est trouvé.',
  'Add each Newznab-compatible indexer separately. The configured name is shown beside every result from that indexer.':
    'Ajoutez séparément chaque indexeur compatible Newznab. Le nom configuré apparaît à côté de chacun de ses résultats.',
  'Named Indexers': 'Indexeurs nommés',
  'No named indexers configured. The legacy single-indexer fields below are used as a fallback.':
    'Aucun indexeur nommé n’est configuré. Les anciens champs pour un indexeur unique ci-dessous seront utilisés en solution de repli.',
  'Add Indexer': 'Ajouter un indexeur',
  'Used only when the named indexer list is empty':
    'Utilisé uniquement si aucun indexeur nommé n’est configuré',
  'Used only with the legacy Newznab URL': 'Utilisé uniquement avec l’ancienne URL Newznab',
  'Verify every named indexer, or the legacy connection when the list is empty':
    'Vérifie chaque indexeur nommé ou l’ancienne connexion si la liste est vide.',
  'Test Connections': 'Tester les connexions',
  'Newznab category IDs searched for ebooks. Most indexers use the standard 7000, but some use custom IDs. Leave empty to use 7000.':
    'Identifiants de catégories Newznab pour les livres numériques. La plupart des indexeurs utilisent la valeur standard 7000, mais certains ont leurs propres identifiants. Laissez vide pour utiliser 7000.',
  'Ebook Categories': 'Catégories de livres numériques',
  'Newznab category IDs searched for audiobooks. Most indexers use the standard 3030, but some use custom IDs. Leave empty to use 3030.':
    'Identifiants de catégories Newznab pour les livres audio. La plupart des indexeurs utilisent la valeur standard 3030, mais certains ont leurs propres identifiants. Laissez vide pour utiliser 3030.',
  'Audiobook Categories': 'Catégories de livres audio',
  'Legacy Newznab URL': 'Ancienne URL Newznab',
  'Legacy API Key': 'Ancienne clé API',
  'Search for books across your indexers via Prowlarr.':
    'Recherchez des livres parmi vos indexeurs avec Prowlarr.',
  'Prowlarr Integration': 'Intégration Prowlarr',
  'Prowlarr URL': 'URL de Prowlarr',
  'Enable searching for books via Prowlarr indexers':
    'Activer la recherche de livres via les indexeurs Prowlarr',
  'Enable Prowlarr source': 'Activer la source Prowlarr',
  'Base URL of your Prowlarr instance': 'URL de base de votre instance Prowlarr',
  'Found in Prowlarr: Settings > General > API Key':
    'À trouver dans Prowlarr : Settings > General > API Key',
  'Verify your Prowlarr configuration': 'Vérifie la configuration Prowlarr.',
  'Hide a result whose title ends in a file extension that is not in Supported Book Formats, such as a .doc or .rtf file. Titles without an extension, archives and audiobook searches are never hidden.':
    'Masque les résultats dont le titre se termine par une extension absente des formats de livres pris en charge, comme .doc ou .rtf. Les titres sans extension, les archives et les recherches de livres audio ne sont jamais masqués.',
  'Hide ebook results larger than this. 0 shows everything, and a result with no reported size is always shown. Audiobook searches are not limited.':
    'Masque les livres numériques dépassant cette taille. 0 affiche tout ; les résultats sans taille indiquée restent visibles. Les recherches de livres audio ne sont pas limitées.',
  'Hide ebook results larger than this. Expanded searches and general indexers can return TV series, courses and software next to the books. 0 shows everything, and a result with no reported size is always shown. Audiobook searches are not limited.':
    'Masque les livres numériques dépassant cette taille. Les recherches élargies et les indexeurs généralistes peuvent aussi renvoyer des séries, des formations ou des logiciels. 0 affiche tout ; les résultats sans taille indiquée restent visibles. Les livres audio ne sont pas limités.',
  'Maximum Ebook Size (MB)': 'Taille maximale des livres numériques (Mo)',
  'Hide torrents with no seeders from search results by default. You can temporarily show them from the release filters.':
    'Masque par défaut les torrents sans seeders. Vous pouvez les afficher temporairement dans les filtres de versions.',
  'Hide torrent results with 0 seeders': 'Masquer les torrents sans seeders',
  'Hide results in formats you did not enable': 'Masquer les formats non activés',
  'How long to wait for a single indexer to answer a search. Indexers behind FlareSolverr can need 90 seconds or more while a cold Cloudflare challenge is solved; raise this if searches come back empty and the Prowlarr log shows the search still running.':
    'Délai d’attente d’un indexeur pour répondre à une recherche. Les indexeurs utilisant FlareSolverr peuvent nécessiter 90 secondes ou plus lors d’un nouveau défi Cloudflare. Augmentez cette valeur si les recherches restent vides alors que le journal Prowlarr indique qu’elles sont toujours en cours.',
  'Collapse a release that several indexer entries returned down to a single row, keeping the entry with the best Prowlarr priority. Turn this off to see every entry that carried it, which is what makes results from filter-specific entries (freeleech and the like) visible.':
    'Regroupe sur une seule ligne les résultats d’une même version renvoyés par plusieurs indexeurs et conserve celui ayant la meilleure priorité Prowlarr. Désactivez cette option pour afficher toutes les entrées, notamment celles provenant de filtres spécifiques comme le freeleech.',
  'Show one row per release': 'Afficher une seule ligne par version',
  'Apply per-indexer seed time and ratio preferences from Prowlarr when sending torrents to the download client':
    'Applique les préférences de durée et de ratio de partage définies par indexeur dans Prowlarr lors de l’envoi des torrents au client de téléchargement.',
  'Use Prowlarr seed preferences': 'Utiliser les préférences de partage Prowlarr',
  "Prowlarr drops the narrator and series from MyAnonamouse results. With a MAM session ID, Shelfmark looks them up (plus bitrate, from the uploader's tags) directly from MyAnonamouse. Create the session under Preferences > Security on MyAnonamouse, locked to the IP or ASN Shelfmark connects from. Choose which columns show under Search Mode > Release List Columns.":
    'Prowlarr ne transmet pas le narrateur ni la série des résultats MyAnonamouse. Avec un identifiant de session MAM, Shelfmark les récupère directement auprès de MyAnonamouse, ainsi que le débit depuis les tags de l’uploader. Créez une session dans Preferences > Security sur MyAnonamouse et limitez-la à l’adresse IP ou à l’ASN utilisé par Shelfmark. Choisissez les colonnes à afficher dans Mode de recherche > Colonnes de la liste des résultats.',
  'MAM security settings': 'Paramètres de sécurité MAM',
  "The mam_id value MyAnonamouse shows when you create a session. MAM locks each session to one IP or ASN, so reusing Prowlarr's or another client's session often fails with a 403: you will likely need a separate session for Shelfmark if it reaches MAM from another IP (different host, VPN or proxy) or the existing session is ASN-locked to another network. Leave empty to turn enrichment off.":
    'Valeur mam_id affichée par MyAnonamouse lors de la création d’une session. MAM limite chaque session à une adresse IP ou un ASN ; la réutilisation de la session Prowlarr ou d’un autre client échoue souvent avec une erreur 403. Une session distincte peut être nécessaire si Shelfmark utilise une autre IP (autre hôte, VPN ou proxy) ou si la session est liée à un autre ASN. Laissez vide pour désactiver l’enrichissement.',
  'Test MAM Session': 'Tester la session MAM',
  'MAM Session ID': 'Identifiant de session MAM',
  'MyAnonamouse Enrichment': 'Enrichissement MyAnonamouse',
  'Check that MyAnonamouse accepts the session ID. A passing test also resumes enrichment after it stopped on repeated failures.':
    'Vérifie que MyAnonamouse accepte l’identifiant de session. Une vérification réussie relance aussi l’enrichissement après des échecs répétés.',
  'Search the Soulseek network and download files through a [slskd](https://github.com/slskd/slskd) instance. slskd must be logged in to Soulseek, and its downloads folder must be visible to Shelfmark.':
    'Recherchez sur le réseau Soulseek et téléchargez des fichiers via une instance [slskd](https://github.com/slskd/slskd). slskd doit être connecté à Soulseek et son dossier de téléchargements doit être accessible à Shelfmark.',
  'Soulseek via slskd': 'Soulseek via slskd',
  'Enable searching and downloading books through slskd':
    'Activer la recherche et le téléchargement de livres via slskd',
  'Enable Soulseek source': 'Activer la source Soulseek',
  'Base URL of the slskd web interface': 'URL de base de l’interface Web slskd',
  'slskd URL': 'URL de slskd',
  "An API key from slskd's configuration (web.authentication.api_keys) with the readwrite role":
    'Clé API définie dans la configuration slskd (web.authentication.api_keys) avec le rôle readwrite.',
  'Verify the URL and API key, and that slskd is logged in to Soulseek':
    'Vérifie l’URL, la clé API et la connexion de slskd à Soulseek.',
  'Downloads Path': 'Chemin des téléchargements',
  "Where slskd's completed downloads folder is mounted inside Shelfmark. Leave empty when both containers see it at the same path, or use Settings > Advanced > Remote Path Mappings with client 'slskd'.":
    'Chemin d’accès au dossier des téléchargements terminés de slskd depuis Shelfmark. Laissez vide si les deux conteneurs utilisent le même chemin, ou configurez Settings > Advanced > Remote Path Mappings avec le client « slskd ».',
  'Give each download its own folder': 'Créer un dossier distinct pour chaque téléchargement',
  "Download into a folder of its own inside slskd's downloads folder (needs slskd 0.26 or newer). Other apps using the same slskd cannot mix files with it or lose track of it when they clear slskd's list of finished transfers, and Shelfmark confirms a download by the files on disk.":
    'Télécharge chaque élément dans son propre dossier au sein du dossier de téléchargements slskd (slskd 0.26 ou ultérieur requis). Les autres applications utilisant slskd ne risquent ainsi pas de mélanger les fichiers ou de perdre leur suivi lors du nettoyage des transferts terminés. Shelfmark vérifie la présence des fichiers sur le disque.',
  'Download Folder': 'Dossier de téléchargement',
  "The folder, inside slskd's downloads folder, that holds one folder per download. It must not climb out of slskd's downloads folder.":
    'Dossier situé dans le répertoire de téléchargements slskd, qui contient un sous-dossier par téléchargement. Il doit rester à l’intérieur du dossier slskd.',
  'Keep finished files in slskd': 'Conserver les fichiers terminés dans slskd',
  'Leave the finished files (and their transfer records) in slskd after Shelfmark copies them to your library, so they stay shared with other Soulseek users. Turn off to delete them once imported.':
    'Conserve dans slskd les fichiers terminés et leurs transferts après leur copie dans votre bibliothèque, afin qu’ils restent partagés sur Soulseek. Désactivez cette option pour les supprimer après leur importation.',
  'Import finished folders an interruption left behind':
    'Importer les dossiers terminés laissés après une interruption',
  "A restart can land after the last file arrives and before it is copied to your library. Checked every 15 minutes, independent of the Hardcover sync, a download folder that holds every file asked for, whose download never completed and is still wanted, is imported once without downloading anything again (never one someone cancelled). If that import fails, the folder stays until you retry the download, or, with clean-up on, until it is a day old and its request has the book or was given up on. A transfer Shelfmark queued that no download is watching any more is picked up again if its request still needs it, a few per check, and cancelled otherwise, or when it cannot be picked up. Transfers queued by other apps or by hand in slskd are never touched, including the same file queued again after Shelfmark's download of it ended.":
    'Après un redémarrage, le dernier fichier peut être arrivé sans avoir encore été copié dans votre bibliothèque. Toutes les 15 minutes, indépendamment de la synchronisation Hardcover, Shelfmark importe une seule fois les dossiers contenant tous les fichiers attendus lorsque le téléchargement n’a pas été terminé mais reste nécessaire, sans rien télécharger à nouveau (sauf s’il a été annulé par un utilisateur). Si l’import échoue, le dossier est conservé jusqu’à une nouvelle tentative ou, si le nettoyage est activé, jusqu’à ce qu’il ait un jour et que la demande soit satisfaite ou abandonnée. Les transferts lancés par Shelfmark qui ne sont plus suivis sont repris s’ils sont encore nécessaires, sinon ils sont annulés. Les transferts lancés par d’autres applications ou manuellement dans slskd ne sont jamais modifiés.',
  'Remove leftover download folders after (days)':
    'Supprimer les dossiers de téléchargement restants après (jours)',
  'Remove the folder of a failed or cancelled download, or one nothing records, once the download is this old, or one day old when its request already has the book or was given up on. A folder that holds every file asked for is never removed while the download is still wanted (you started it yourself, or its request is still open): it is imported once, and after that it waits for you to retry the download. The folder of a running download is never removed. 0 keeps every leftover folder. Folders already imported follow Keep finished files in slskd, not this setting.':
    'Supprime le dossier d’un téléchargement échoué, annulé ou non répertorié lorsqu’il atteint cet âge, ou après un jour si la demande est déjà satisfaite ou abandonnée. Un dossier contenant tous les fichiers attendus n’est jamais supprimé tant que le téléchargement reste souhaité : il est importé une fois, puis conservé jusqu’à une nouvelle tentative. Le dossier d’un téléchargement en cours n’est jamais supprimé. 0 conserve tous les dossiers restants. Les dossiers déjà importés suivent le réglage « Conserver les fichiers terminés dans slskd ».',
  'How long a Soulseek search collects peer responses. Longer waits find more peers but make every search slower.':
    'Durée pendant laquelle une recherche Soulseek recueille les réponses des pairs. Une attente plus longue peut en trouver davantage, mais ralentit chaque recherche.',
  'Search Wait (seconds)': 'Durée d’attente de la recherche (secondes)',
  'Stop a search early once this many peers have answered':
    'Arrête la recherche dès que ce nombre de pairs a répondu.',
  'Max Peer Responses': 'Nombre maximal de réponses de pairs',
  'Give up when the peer has not started sending within this long. Set to 0 to wait indefinitely.':
    'Abandonne si le pair n’a pas commencé à envoyer les données après ce délai. Réglez sur 0 pour attendre indéfiniment.',
  'Queue Timeout (minutes)': 'Délai d’attente dans la file (minutes)',
  'Answer anti-leech chat challenges': 'Répondre aux demandes de vérification des uploaders',
  'Some uploaders block downloads until you type a word in a private message ("please type \'download\' in this chat"). Shelfmark replies with the word the message asks for, at most once per user every 12 hours, and logs each reply. It reads every unread private message in slskd, not only those from the peer of a running download, and marks a conversation it answered as read in slskd. Checked while a download is running.':
    'Certains uploaders bloquent les téléchargements tant qu’un mot n’est pas envoyé en message privé (par exemple « écrivez “download” dans cette conversation »). Shelfmark répond avec le mot demandé, au plus une fois par utilisateur toutes les 12 heures, et consigne chaque réponse. Il lit tous les messages privés non lus dans slskd et marque comme lus les conversations auxquelles il a répondu. Vérifié pendant un téléchargement.',
  'Remove completed transfers from slskd': 'Supprimer les transferts terminés de slskd',
  "Clear the transfer from slskd's download list after Shelfmark imports it. Applies when each download does not get its own folder.":
    'Retire le transfert de la liste de téléchargements slskd après son importation par Shelfmark. S’applique lorsque les téléchargements ne disposent pas de leur propre dossier.',
  'Search Webshare.cz by file name and download matching ebooks and audiobooks. Requires a Webshare account; a VIP account is recommended for full download speed.':
    'Recherchez des livres numériques et audio par nom de fichier sur Webshare.cz, puis téléchargez les résultats correspondants. Un compte Webshare est nécessaire ; un compte VIP est recommandé pour bénéficier de la vitesse maximale.',
  'Enable Webshare.cz': 'Activer Webshare.cz',
  'Your Webshare.cz login.': 'Identifiant de votre compte Webshare.cz.',
  'Username or Email': 'Nom d’utilisateur ou e-mail',
  'Your Webshare.cz password.': 'Mot de passe de votre compte Webshare.cz.',
  "Log in to Webshare.cz and show the account's VIP status.":
    'Se connecte à Webshare.cz et affiche le statut VIP du compte.',
  'Test Login': 'Tester la connexion',
  'Maximum number of files to request per search (1-200). Results are then filtered to your supported ebook or audiobook formats.':
    'Nombre maximal de fichiers à demander par recherche (1 à 200). Les résultats sont ensuite filtrés selon les formats de livres ou livres audio pris en charge.',
};

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (englishText: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const getInitialLanguage = (): AppLanguage => {
  if (typeof window === 'undefined') return 'fr';
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'en' ? 'en' : 'fr';
  } catch {
    return 'fr';
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<AppLanguage>(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch {
      // Keep the in-memory preference when browser storage is unavailable.
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (englishText: string) =>
        language === 'fr' ? (FRENCH_TRANSLATIONS[englishText] ?? englishText) : englishText,
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

