import { useCallback, useEffect, useState } from 'react';

import { useLanguage } from '../contexts/LanguageContext';
import { fetchBlockedBooks, removeBlockedBook, type BlockedBook } from '../services/api';

export const BlocklistPage = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState<BlockedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchBlockedBooks());
      setError(null);
    } catch {
      setError(t('Unable to load blocklist'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void refresh(); }, [refresh]);

  const handleUnblock = async (id: number) => {
    try {
      await removeBlockedBook(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch {
      setError(t('Unable to update blocklist'));
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">{t('Blocklist')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('Blocked books are added from their detail page. Users cannot request these titles.')}</p>
      </header>
      {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
      {loading ? (
        <p className="py-12 text-center text-sm text-gray-500">{t('Loading')}</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-(--border-muted) bg-(--bg-soft) px-6 py-14 text-center text-sm text-gray-500">{t('No blocked books')}</div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <article key={item.id} className="flex items-center gap-4 rounded-xl border border-(--border-muted) bg-(--bg-soft) p-3">
              {item.preview ? <img src={item.preview} alt="" className="h-20 w-14 rounded-md object-cover" /> : <div className="h-20 w-14 rounded-md bg-(--bg)" />}
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold">{item.title}</h2>
                <p className="truncate text-sm text-gray-500">{item.author || t('Unknown author')}</p>
                <p className="mt-1 text-xs text-gray-500">{item.content_type === 'audiobook' ? t('Audiobook') : t('Book')} · {item.provider}</p>
              </div>
              <button type="button" onClick={() => void handleUnblock(item.id)} className="shrink-0 rounded-lg border border-(--border-muted) px-3 py-2 text-sm font-medium transition-colors hover:bg-(--bg)">{t('Unblock')}</button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
