import { useCallback, useEffect, useState } from 'react';

import { useLanguage } from '../contexts/LanguageContext';
import { UsersManagementField } from '../components/settings/customFields/UsersManagementField';
import type { CustomComponentFieldConfig, SettingsTab } from '../types/settings';
import { getSettingsTab } from '../services/api';
import { extractSettingsValues } from '../utils/settingsValues';

interface UsersPageProps {
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const usersField = {
  key: 'users_management',
  label: 'Users',
  type: 'CustomComponentField',
  component: 'users_management',
} as CustomComponentFieldConfig;

export const UsersPage = ({ onShowToast }: UsersPageProps) => {
  const { t } = useLanguage();
  const [tab, setTab] = useState<SettingsTab | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [authMode, setAuthMode] = useState('none');
  const [uiState, setUiState] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [usersSettings, securitySettings] = await Promise.all([
          getSettingsTab('users'),
          getSettingsTab('security'),
        ]);
        const extracted = extractSettingsValues([usersSettings]).users || {};
        const security = extractSettingsValues([securitySettings]).security || {};
        if (!active) return;
        setTab(usersSettings);
        setValues(extracted);
        setAuthMode(typeof security.AUTH_METHOD === 'string' ? security.AUTH_METHOD : 'none');
        setError(null);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : t('Unable to load users'));
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [t]);

  const handleUiStateChange = useCallback((key: string, value: unknown) => {
    setUiState((current) => ({ ...current, [key]: value }));
  }, []);

  if (loading) return <div className="flex min-h-64 items-center justify-center text-sm text-(--text-muted)">{t('Loading users...')}</div>;
  if (error || !tab) return <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error || t('Unable to load users')}</div>;

  const isOverrides = uiState.routeKind === 'edit-overrides';
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      {!isOverrides && (
        <header className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/15 via-(--bg-soft) to-(--bg) p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="relative">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-400">{t('Administration')}</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('Users')}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-(--text-muted)">{t('Manage user accounts, access rights and personal preferences.')}</p>
          </div>
        </header>
      )}
      <UsersManagementField
        field={usersField}
        tab={tab}
        values={values}
        onChange={() => undefined}
        onAction={async () => ({ success: false, message: 'Unsupported action' })}
        uiState={uiState}
        onUiStateChange={handleUiStateChange}
        isDisabled={false}
        authMode={authMode}
        onShowToast={onShowToast}
      />
      {isOverrides && typeof uiState.onSave === 'function' && (
        <div className="sticky bottom-3 flex justify-end rounded-xl border border-(--border-muted) bg-(--bg) p-3 shadow-xl">
          <button type="button" onClick={() => { void (uiState.onSave as () => void | Promise<void>)(); }} disabled={Boolean(uiState.isSaving)} className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{t(uiState.isSaving ? 'Saving...' : 'Save changes')}</button>
        </div>
      )}
    </div>
  );
};
