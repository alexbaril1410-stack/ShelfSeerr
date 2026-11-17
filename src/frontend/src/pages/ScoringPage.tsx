import { useCallback, useEffect, useMemo, useState } from 'react';

import { useLanguage } from '../contexts/LanguageContext';
import { SettingsContent } from '../components/settings/SettingsContent';
import { executeSettingsAction, getSettingsTab, updateSettings } from '../services/api';
import type { ActionResult, SettingsTab } from '../types/settings';
import { extractSettingsValues } from '../utils/settingsValues';

interface ScoringPageProps {
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ScoringPage = ({ onShowToast }: ScoringPageProps) => {
  const { t } = useLanguage();
  const [tab, setTab] = useState<SettingsTab | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [originalValues, setOriginalValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getSettingsTab('custom_scores');
      const extracted = extractSettingsValues([result]).custom_scores || {};
      setTab(result);
      setValues(extracted);
      setOriginalValues(structuredClone(extracted));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Unable to load scoring settings'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  const hasChanges = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(originalValues),
    [values, originalValues],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const changed = Object.fromEntries(
        Object.entries(values).filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(originalValues[key])),
      );
      const result = await updateSettings('custom_scores', changed);
      if (!result.success) {
        onShowToast?.(t(result.message), 'error');
        return;
      }
      await load();
      onShowToast?.(t(result.message || 'Settings saved'), 'success');
    } catch (err) {
      onShowToast?.(err instanceof Error ? err.message : t('Unable to save scoring settings'), 'error');
    } finally {
      setSaving(false);
    }
  }, [load, onShowToast, originalValues, t, values]);

  const handleAction = useCallback(async (key: string): Promise<ActionResult> => {
    try {
      return await executeSettingsAction('custom_scores', key, values);
    } catch (err) {
      return { success: false, message: err instanceof Error ? err.message : t('Action failed') };
    }
  }, [t, values]);

  if (loading) {
    return <div className="flex min-h-64 items-center justify-center text-sm text-(--text-muted)">{t('Loading…')}</div>;
  }

  if (error || !tab) {
    return <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">{error || t('Unable to load scoring settings')}</div>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 pb-10">
      <header className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/15 via-(--bg-soft) to-(--bg) p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="7" cy="18" r="2"/></svg>
          </div>
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-400">{t('Administration')}</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('Scoring')}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-(--text-muted)">{t('Fine-tune how release results are ranked for ebooks and audiobooks. The scoring engine and its existing rules remain unchanged; this page gives you clearer control over them.')}</p>
          </div>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-(--border-muted) bg-(--bg-soft) p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-violet-400" />{t('Points are cumulative')}</div>
          <p className="text-sm leading-6 text-(--text-muted)">{t('Each matching active rule adds or subtracts its points. The total determines the order of the results.')}</p>
        </article>
        <article className="rounded-xl border border-(--border-muted) bg-(--bg-soft) p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-amber-400" />{t('Penalties matter')}</div>
          <p className="text-sm leading-6 text-(--text-muted)">{t('Use negative points to push unsuitable releases down, for example when the volume does not match the requested book.')}</p>
        </article>
        <article className="rounded-xl border border-(--border-muted) bg-(--bg-soft) p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-emerald-400" />{t('Missing data stays neutral')}</div>
          <p className="text-sm leading-6 text-(--text-muted)">{t('A rule is not triggered when the release does not provide the information needed to evaluate it.')}</p>
        </article>
      </section>

      <div className="rounded-xl border border-(--border-muted) bg-(--bg-soft) px-4 py-3 text-sm leading-6 text-(--text-muted)">
        <strong className="text-(--text)">{t('How to read a rule')}</strong>
        <p className="mt-1">{t('Choose the information to inspect, select a condition, enter the expected value, then assign a score. Positive values improve ranking; negative values lower it. You can disable a rule without deleting it.')}</p>
        <p className="mt-2">{t('Placeholders such as {{book_title}}, {{book_author}}, {{series_name}} and {{requested_volume}} are filled in automatically using the book being searched.')}</p>
      </div>

      <SettingsContent
        tab={tab}
        values={values}
        onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
        onSave={handleSave}
        onAction={handleAction}
        isSaving={saving}
        hasChanges={hasChanges}
        embedded
      />
    </div>
  );
};
