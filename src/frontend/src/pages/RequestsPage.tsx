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
  return <section className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-bold">Demandes</h1><p className="mt-1 text-sm opacity-60">Suivez et gérez vos demandes de livres et de livres audio</p></div>
      <label className="flex items-center gap-2 text-sm"><span className="opacity-60">Type de contenu</span>
        <select value={type} onChange={(e) => setType(e.target.value as TypeFilter)} className="rounded-lg border border-(--border-muted) bg-(--card-background) px-3 py-2">
          <option value="all">Tous</option><option value="ebook">Livres</option><option value="audiobook">Livres audio</option>
        </select>
      </label>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <label className="flex items-center gap-2 text-sm"><span className="opacity-60">Statut</span>
        <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="rounded-lg border border-(--border-muted) bg-(--card-background) px-3 py-2">
          {STATUS_FILTERS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </label>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm opacity-60">{visible.length} {visible.length > 1 ? 'demandes' : 'demande'}</span>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm"><span className="opacity-60">Chronologie</span>
          <select value={dateField} onChange={(e) => setDateField(e.target.value as DateField)} className="rounded-lg border border-(--border-muted) bg-(--card-background) px-3 py-2">
            <option value="created_at">Date de demande</option><option value="updated_at">Date de modification</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <select aria-label="Ordre de tri" value={sortDirection} onChange={(e) => setSortDirection(e.target.value as SortDirection)} className="rounded-lg border border-(--border-muted) bg-(--card-background) px-3 py-2">
            <option value="desc">Décroissant</option><option value="asc">Croissant</option>
          </select>
        </label>
      </div>
    </div>
    {error && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm">{error}</div>}
    {loading ? <div className="py-16 text-center text-sm opacity-60">Chargement des demandes…</div> : visible.length === 0 ?
      <div className="rounded-xl border border-(--border-muted) py-16 text-center text-sm opacity-60">Aucune demande dans cette catégorie</div> :
      <div className="divide-y divide-(--border-muted) rounded-xl border border-(--border-muted)">
        {visible.map((r) => {
          const title = field(r, 'title') || 'Titre inconnu';
          const author = field(r, 'author');
          const cover = field(r, 'preview') || field(r, 'cover');
          const current = getStatus(r);
          return <article key={r.id} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
            <div className="h-24 w-16 shrink-0 overflow-hidden rounded-md bg-(--hover-surface)">{cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-2xl opacity-30">▤</div>}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="font-semibold leading-snug">{title}</h3>{author && <p className="mt-0.5 truncate text-sm opacity-60">{author}</p>}</div><span className="rounded-full bg-(--hover-surface) px-2.5 py-1 text-xs">{STATUSES.find((s) => s.id === current)?.label || ''}</span></div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs opacity-60"><span>{r.content_type === 'audiobook' ? 'Livre audio' : 'Livre'}</span>{isAdmin && r.username && <span>Demandé par {r.username}</span>}<span>{new Date(r.created_at).toLocaleDateString()}</span>{r.updated_at && r.updated_at !== r.created_at && <span>Modifié le : {new Date(r.updated_at).toLocaleDateString()}</span>}</div>
              {r.last_failure_reason && current === 'problem' && <p className="mt-2 text-xs text-red-500">{r.last_failure_reason}</p>}
              {r.note && <p className="mt-2 text-xs italic opacity-60">{r.note}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {isAdmin && current === 'pending' && <><button type="button" onClick={() => onApprove(r)} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white">Examiner / approuver</button><button type="button" onClick={() => onReject(r.id)} className="rounded-lg border border-(--border-muted) px-3 py-1.5 text-xs">Refuser</button></>}
                {isAdmin && current === 'problem' && <button type="button" onClick={() => onApprove(r)} className="rounded-lg border border-(--border-muted) px-3 py-1.5 text-xs">Relancer le téléchargement</button>}
                {isAdmin && current === 'rejected' && <button type="button" onClick={() => onReopen(r.id)} className="rounded-lg border border-(--border-muted) px-3 py-1.5 text-xs">Rouvrir la demande</button>}
                {!isAdmin && current === 'pending' && <button type="button" onClick={() => onCancel(r.id)} className="rounded-lg border border-(--border-muted) px-3 py-1.5 text-xs">Annuler la demande</button>}
              </div>
            </div>
          </article>;
        })}
      </div>}
  </section>;
};
