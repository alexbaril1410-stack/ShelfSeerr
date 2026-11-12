import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

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
  'Explore audiobooks, find your next listen, and add it to your library.': 'Explorez les livres audio, trouvez votre prochaine écoute et ajoutez-la à votre bibliothèque.',
  'Explore the catalog, discover new worlds, and find the books you want to read.': 'Explorez le catalogue, découvrez de nouveaux univers et retrouvez les livres que vous souhaitez lire.',
  'Manual search queries release sources directly. Some sources may return limited metadata, which can affect file naming templates.': 'La recherche manuelle interroge directement les sources de téléchargement. Certaines sources peuvent fournir peu de métadonnées, ce qui peut affecter les modèles de nommage des fichiers.',
  Explore: 'Explorer',
  'Browse by genre': 'Explorer par univers',
  'Listen by mood': 'À écouter selon vos envies',
  'Choose a theme to search your catalog.': 'Choisissez un thème pour lancer une recherche dans votre catalogue.',
  'Fantasy': 'Fantasy',
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
  'Search': 'Rechercher',
  'Unknown author': 'Auteur inconnu',
  'Your next listen': 'Votre prochaine écoute',
  'Discover next': 'À découvrir',
  'An audiobook is waiting for you.': 'Un livre audio vous attend.',
  'A new story is waiting for you.': 'Une nouvelle histoire vous attend.',
  'Search for a title or author, or browse genres to find your next listen.': 'Recherchez un titre, un auteur ou parcourez les genres pour trouver votre prochaine écoute.',
  'Search the configured metadata catalog to discover available titles.': 'Lancez une recherche dans le catalogue de métadonnées configuré pour découvrir les titres disponibles.',
  'Explore the catalog': 'Explorer le catalogue',
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

  const setLanguage = (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch {
      // Keep the in-memory preference when browser storage is unavailable.
    }
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (englishText: string) =>
        language === 'fr' ? (FRENCH_TRANSLATIONS[englishText] ?? englishText) : englishText,
    }),
    [language],
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
