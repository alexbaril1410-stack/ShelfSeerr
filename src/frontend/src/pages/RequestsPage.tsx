import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { listRequests } from '../services/api';
import type { RequestRecord } from '../types';

type RequestStatus = 'pending' | 'approved' | 'completed' | 'processing' | 'problem' | 'rejected';
type TypeFilter = 'all' | 'ebook' | 'audiobook';
type StatusFilter = 'all' | RequestStatus;
type DateField = 'created_at' | 'updated_at';
type SortDirection = 'asc' | 'desc';

const STATUSES: { id: RequestStatus; label: string }[] = [
  { id: 'pending', label: 'En attente de validation' },
  { id: 'approved', label: 'Approuvées' },
  { id: 'processing', label: 'En cours de traitement' },
  { id: 'completed', label: 'Terminées' },
  { id: 'problem', label: 'Problème' },
  { id: 'rejected', label: 'Refusées' },
];
const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  ...STATUSES,
];
const getStatus = (r: RequestRecord): RequestStatus => {
  if (r.status === 'pending') return 'pending';
  if (r.status === 'rejected' || r.status === 'cancelled') return 'rejected';
  if (r.delivery_state === 'complete') return 'completed';
  if (['queued', 'resolving', 'locating', 'downloading'].includes(r.delivery_state || '')) return 'processing';
  if (r.delivery_state === 'error') return 'problem';
  return 'approved';
};
const textValue = (v: unknown) => typeof v === 'string' ? v : '';
const field = (r: RequestRecord, k: string) => textValue(r.book_data?.[k]) || textValue(r.release_data?.[k]);
const dateLabel = (value: string) => new Date(value).toLocaleDateString(undefined, {
  day: 'numeric', month: 'short', year: 'numeric',
});
const statusStyle: Record<RequestStatus, string> = {
  pending: 'bg-indigo-500/90 text-white',
  approved: 'bg-sky-500/90 text-white',
  processing: 'bg-amber-500/90 text-white',
  completed: 'bg-emerald-500/90 text-white',
  problem: 'bg-red-500/90 text-white',
  rejected: 'bg-slate-500/90 text-white',
};

interface Props {
  isAdmin: boolean;
  onApprove: (request: RequestRecord) => void;
  onReject: (id: number) => void;
  onReopen: (id: number) => void;
  onCancel: (id: number) => void;
}
export const RequestsPage = ({ isAdmin, onApprove, onReject, onReopen, onCancel }: Props) => {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [status, setStatus] = useState<StatusFilter>('all');
  const [type, setType] = useState<TypeFilter>('all');
  const [dateField, setDateField] = useState<DateField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      setError('');
      const rows = await listRequests(isAdmin);
      setRequests(rows.filter((r) => r.status !== 'cancelled'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('Unable to load requests'));
    } finally { setLoading(false); }
  }, [isAdmin, t]);
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  const visible = useMemo(() => requests
    .filter((r) => status === 'all' || getStatus(r) === status)
    .filter((r) => type === 'all' || r.content_type === type)
    .sort((a, b) => {
      const comparison = (a[dateField] || '').localeCompare(b[dateField] || '');
      return sortDirection === 'asc' ? comparison : -comparison;
    }), [requests, status, type, dateField, sortDirection]);

  const selectClass = 'min-w-0 rounded-lg border border-(--border-muted) bg-(--card-background) px-3 py-2.5 text-sm text-(--text-primary) outline-none transition-colors hover:border-violet-500/60 focus:border-violet-500';
  const labelClass = 'flex min-w-0 items-center gap-2 text-sm text-(--text-muted)';

  return <section className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-violet-400">{t('Requests')}</h1>
        <p className="mt-1 text-sm text-(--text-muted)">{t('Suivez et gérez vos demandes de livres et de livres audio')}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className={labelClass}>
          <span className="sr-only">{t('Type de contenu')}</span>
          <select aria-label={t('Type de contenu')} value={type} onChange={(e) => setType(e.target.value as TypeFilter)} className={selectClass}>
            <option value="all">{t('Tous')}</option><option value="ebook">{t('Livres')}</option><option value="audiobook">{t('Livres audio')}</option>
          </select>
        </label>
        <label className={labelClass}>
          <span className="sr-only">{t('Statut')}</span>
          <select aria-label={t('Statut')} value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className={selectClass}>
            {STATUS_FILTERS.map((s) => <option key={s.id} value={s.id}>{t(s.label)}</option>)}
          </select>
        </label>
        <label className={labelClass}>
          <span className="sr-only">{t('Chronologie')}</span>
          <select aria-label={t('Chronologie')} value={dateField} onChange={(e) => setDateField(e.target.value as DateField)} className={selectClass}>
            <option value="created_at">{t('Date de demande')}</option><option value="updated_at">{t('Date de modification')}</option>
          </select>
        </label>
        <label className={labelClass}>
          <span className="sr-only">{t('Ordre de tri')}</span>
          <select aria-label={t('Ordre de tri')} value={sortDirection} onChange={(e) => setSortDirection(e.target.value as SortDirection)} className={selectClass}>
            <option value="desc">{t('Décroissant')}</option><option value="asc">{t('Croissant')}</option>
          </select>
        </label>
      </div>
    </div>

    <div className="flex items-center justify-between text-sm text-(--text-muted)">
      <span>{visible.length} {visible.length > 1 ? t('demandes') : t('demande')}</span>
      <span>{loading ? t('Actualisation…') : ''}</span>
    </div>

    {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
    {loading ? <div className="py-16 text-center text-sm text-(--text-muted)">{t('Chargement des demandes…')}</div> : visible.length === 0 ?
      <div className="rounded-xl border border-(--border-muted) py-16 text-center text-sm text-(--text-muted)">{t('Aucune demande dans cette catégorie')}</div> :
      <div className="space-y-3">
        {visible.map((r) => {
          const title = field(r, 'title') || t('Titre inconnu');
          const author = field(r, 'author');
          const cover = field(r, 'preview') || field(r, 'cover');
          const current = getStatus(r);
          const created = dateLabel(r.created_at);
          const modified = dateLabel(r.updated_at || r.created_at);
          return <article key={r.id} className="group relative isolate grid min-h-40 grid-cols-[76px_minmax(0,1fr)] gap-4 overflow-hidden rounded-xl border border-(--border-muted) bg-(--card-background) p-4 shadow-sm transition-colors hover:border-violet-500/50 sm:grid-cols-[88px_minmax(0,1.15fr)_minmax(190px,0.9fr)_minmax(190px,0.85fr)] sm:items-center sm:gap-5 sm:p-5">
            {cover && <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-[0.16]">
              <img src={cover} alt="" className="h-full w-full object-cover blur-[1px]" />
              <div className="absolute inset-0 bg-gradient-to-r from-(--card-background) via-(--card-background)/90 to-(--card-background)/75" />
            </div>}
            <div className="row-span-2 h-28 w-[76px] overflow-hidden rounded-lg bg-(--hover-surface) shadow-md sm:row-span-1 sm:h-32 sm:w-[88px]">
              {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-3xl text-(--text-muted)">▤</div>}
            </div>
            <div className="min-w-0 self-center">
              <div className="mb-1 text-xs font-medium text-(--text-muted)">{r.content_type === 'audiobook' ? t('Livre audio') : t('Livre')}</div>
              <h2 className="line-clamp-2 text-lg font-bold leading-tight text-(--text-primary) sm:text-xl">{title}</h2>
              {author && <p className="mt-1 truncate text-sm text-(--text-muted)">{author}</p>}
              {r.note && <p className="mt-2 line-clamp-2 text-xs italic text-(--text-muted)">{r.note}</p>}
            </div>
            <div className="col-start-2 min-w-0 self-center text-sm sm:col-start-auto">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-(--text-muted)">{t('Statut')}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${statusStyle[current]}`}>{t(STATUSES.find((s) => s.id === current)?.label || '')}</span>
              </div>
              <p className="text-(--text-muted)"><span className="font-semibold">{t('Demandé')}</span> {created}{isAdmin && r.username ? <> {t('par')} <span className="font-semibold text-(--text-primary)">{r.username}</span></> : null}</p>
              <p className="mt-1 text-(--text-muted)"><span className="font-semibold">{t('Modifié')}</span> {modified}</p>
              {isAdmin && r.reviewer_username && <p className="mt-1 truncate text-xs text-(--text-muted)">{t('Traité par')} {r.reviewer_username}</p>}
              {r.last_failure_reason && current === 'problem' && <p className="mt-2 line-clamp-2 text-xs text-red-400">{r.last_failure_reason}</p>}
            </div>
            <div className="col-start-2 flex min-w-0 flex-wrap items-center gap-2 sm:col-start-auto sm:flex-col sm:items-stretch sm:justify-center">
              {isAdmin && current === 'pending' && <>
                <button type="button" onClick={() => onApprove(r)} className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-500">{t('Examiner / approuver')}</button>
                <button type="button" onClick={() => onReject(r.id)} className="rounded-lg border border-(--border-muted) bg-(--card-background)/80 px-4 py-2.5 text-sm font-medium text-(--text-primary) transition-colors hover:border-red-500/60 hover:text-red-400">{t('Refuser')}</button>
              </>}
              {isAdmin && current === 'problem' && <button type="button" onClick={() => onApprove(r)} className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500">{t('Relancer le téléchargement')}</button>}
              {isAdmin && current === 'rejected' && <button type="button" onClick={() => onReopen(r.id)} className="rounded-lg border border-(--border-muted) bg-(--card-background)/80 px-4 py-2.5 text-sm font-medium text-(--text-primary) transition-colors hover:border-violet-500/60">{t('Rouvrir la demande')}</button>}
              {!isAdmin && current === 'pending' && <button type="button" onClick={() => onCancel(r.id)} className="rounded-lg border border-(--border-muted) bg-(--card-background)/80 px-4 py-2.5 text-sm font-medium text-(--text-primary) hover:border-red-500/60">{t('Annuler la demande')}</button>}
            </div>
          </article>;
        })}
      </div>}
  </section>;
};
