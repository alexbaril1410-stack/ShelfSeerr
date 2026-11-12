import { useLanguage } from '../contexts/LanguageContext';

interface LanguageSelectorProps {
  compact?: boolean;
}

export const LanguageSelector = ({ compact = false }: LanguageSelectorProps) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className={compact ? 'flex items-center gap-2 px-4 py-2 text-sm' : 'flex items-center gap-2'}>
      <span className="text-sm opacity-70">{t('Language')}</span>
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value === 'en' ? 'en' : 'fr')}
        aria-label={t('Language')}
        className="rounded-md border border-(--border-muted) bg-(--bg) px-2 py-1 text-sm"
      >
        <option value="fr">Français</option>
        <option value="en">English</option>
      </select>
    </label>
  );
};
