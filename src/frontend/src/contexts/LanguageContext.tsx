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
