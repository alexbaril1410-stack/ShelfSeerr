import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { listRequests } from '../services/api';
import type { RequestRecord } from '../types';

type RequestStatus = 'pending' | 'approved' | 'available' | 'processing' | 'problem' | 'rejected';
type TypeFilter = 'all' | 'ebook' | 'audiobook';
const STATUSES: { id: RequestStatus; label: string }[] = [
  { id: 'pending', label: 'En attente de validation' },
  { id: 'approved', label: 'Approuvées' },
  { id: 'available', label: 'Disponibles' },
  { id: 'processing', label: 'En cours de traitement' },
  { id: 'problem', label: 'Problème' },
  { id: 'rejected', label: 'Refusées' },
];
const getStatus = (r: RequestRecord): RequestStatus => {
  if (r.status === 'pending') return 'pending';
  if (r.status === 'rejected' || r.status === 'cancelled') return 'rejected';
  if (r.delivery_state === 'complete') return 'available';
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
  const [status, setStatus] = useState<RequestStatus>('pending');
  const [type, setType] = useState<TypeFilter>('all');
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
  const counts = useMemo(() => {
    const result = Object.fromEntries(STATUSES.map((s) => [s.id, 0])) as Record<RequestStatus, number>;
    requests.forEach((r) => { result[getStatus(r)] += 1; });
    return result;
  }, [requests]);
  const visible = useMemo(() => requests
    .filter((r) => getStatus(r) === status)
    .filter((r) => type === 'all' || r.content_type === type)
    .sort((a, b) => b.created_at.localeCompare(a.created_at)), [requests, status, type]);
  return <section className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-2xl font-bold">{t('Requests')}</h1><p className="mt-1 text-sm opacity-60">{t('Manage and track your book requests')}</p></div>
      <label className="flex items-center gap-2 text-sm"><span className="opacity-60">{t('Content type')}</span>
        <select value={type} onChange={(e) => setType(e.target.value as TypeFilter)} className="rounded-lg border border-(--border-muted) bg-(--card-background) px-3 py-2">
          <option value="all">{t('All')}</option><option value="ebook">{t('Books')}</option><option value="audiobook">{t('Audiobooks')}</option>
        </select>
      </label>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      {STATUSES.map((s) => <button key={s.id} type="button" onClick={() => setStatus(s.id)} className={`rounded-xl border p-3 text-left transition-colors ${status === s.id ? 'border-violet-500 bg-violet-500/10' : 'border-(--border-muted) hover:bg-(--hover-surface)'}`}>
        <span className="block text-2xl font-semibold tabular-nums">{counts[s.id]}</span><span className="mt-1 block text-xs opacity-65">{t(s.label)}</span>
      </button>)}
    </div>
    <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-semibold">{t(STATUSES.find((s) => s.id === status)?.label || 'Requests')}</h2><span className="text-xs opacity-55">{visible.length} {t('requests')}</span></div>
    {error && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm">{error}</div>}
    {loading ? <div className="py-16 text-center text-sm opacity-60">{t('Loading requests…')}</div> : visible.length === 0 ?
      <div className="rounded-xl border border-(--border-muted) py-16 text-center text-sm opacity-60">{t('No requests in this category')}</div> :
      <div className="divide-y divide-(--border-muted) rounded-xl border border-(--border-muted)">
        {visible.map((r) => {
          const title = field(r, 'title') || t('Unknown title');
          const author = field(r, 'author');
          const cover = field(r, 'preview') || field(r, 'cover');
          const current = getStatus(r);
          return <article key={r.id} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
            <div className="h-24 w-16 shrink-0 overflow-hidden rounded-md bg-(--hover-surface)">{cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-2xl opacity-30">▤</div>}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h3 className="font-semibold leading-snug">{title}</h3>{author && <p className="mt-0.5 truncate text-sm opacity-60">{author}</p>}</div><span className="rounded-full bg-(--hover-surface) px-2.5 py-1 text-xs">{t(STATUSES.find((s) => s.id === current)?.label || '')}</span></div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs opacity-60"><span>{r.content_type === 'audiobook' ? t('Audiobook') : t('Book')}</span>{isAdmin && r.username && <span>{t('Requested by')} {r.username}</span>}<span>{new Date(r.created_at).toLocaleDateString()}</span></div>
              {r.last_failure_reason && current === 'problem' && <p className="mt-2 text-xs text-red-500">{r.last_failure_reason}</p>}
              {r.note && <p className="mt-2 text-xs italic opacity-60">{r.note}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {isAdmin && current === 'pending' && <><button type="button" onClick={() => onApprove(r)} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white">{t('Review / approve')}</button><button type="button" onClick={() => onReject(r.id)} className="rounded-lg border border-(--border-muted) px-3 py-1.5 text-xs">{t('Reject')}</button></>}
                {isAdmin && current === 'problem' && <button type="button" onClick={() => onApprove(r)} className="rounded-lg border border-(--border-muted) px-3 py-1.5 text-xs">{t('Retry download')}</button>}
                {isAdmin && current === 'rejected' && <button type="button" onClick={() => onReopen(r.id)} className="rounded-lg border border-(--border-muted) px-3 py-1.5 text-xs">{t('Reopen request')}</button>}
                {!isAdmin && current === 'pending' && <button type="button" onClick={() => onCancel(r.id)} className="rounded-lg border border-(--border-muted) px-3 py-1.5 text-xs">{t('Cancel request')}</button>}
              </div>
            </div>
          </article>;
        })}
      </div>}
  </section>;
};
