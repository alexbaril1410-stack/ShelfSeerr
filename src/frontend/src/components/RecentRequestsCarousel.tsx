import { memo, useCallback, useMemo, useRef } from 'react';

import { useLanguage } from '../contexts/LanguageContext';
import type { RequestRecord } from '../types';
import { withBasePath } from '../utils/basePath';
import { requestToActivityItem } from './activity/activityMappers';

interface RecentRequestsCarouselProps {
  recentRequests: RequestRecord[];
  requestsLoading: boolean;
  isAdmin: boolean;
}

export const RecentRequestsCarousel = memo(({
  recentRequests,
  requestsLoading,
  isAdmin,
}: RecentRequestsCarouselProps) => {
  const { t } = useLanguage();
  const requestsRailRef = useRef<HTMLDivElement>(null);
  const requestCardItems = useMemo(
    () => recentRequests.map((record) => ({
      record,
      item: requestToActivityItem(record, isAdmin ? 'admin' : 'user'),
    })),
    [isAdmin, recentRequests],
  );

  const scrollRecentRequests = useCallback((direction: -1 | 1) => {
    const rail = requestsRailRef.current;
    rail?.scrollBy({
      left: direction * Math.max(320, rail.clientWidth * 0.8),
      behavior: 'smooth',
    });
  }, []);

  if (!requestsLoading && requestCardItems.length === 0) return null;

  return (
    <section className="min-w-0" aria-label={t('Recent requests')}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white sm:text-xl">
            {t('Recent requests')}
          </h2>
          <a
            href={withBasePath('/requests')}
            aria-label={t('View full selection')}
            title={t('View full selection')}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-indigo-300"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="m10 8 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs text-gray-500 dark:text-gray-400 sm:inline">
            {recentRequests.length} {t('requests')}
          </span>
          <button type="button" onClick={() => scrollRecentRequests(-1)} aria-label={t('Previous requests')} className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-indigo-400 hover:text-indigo-500 dark:border-white/10 dark:text-gray-300">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" onClick={() => scrollRecentRequests(1)} aria-label={t('Next requests')} className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-indigo-400 hover:text-indigo-500 dark:border-white/10 dark:text-gray-300">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
      <div ref={requestsRailRef} className="shelfseerr-discovery-rail flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:gap-4">
        {requestsLoading && requestCardItems.length === 0
          ? Array.from({ length: 3 }, (_, index) => <div key={index} className="h-36 w-[min(82vw,360px)] shrink-0 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />)
          : requestCardItems.map(({ record, item }) => {
              const data = record.book_data ?? record.release_data ?? {};
              const yearValue = data.year ?? data.release_year ?? data.publication_year;
              const year = typeof yearValue === 'number' || typeof yearValue === 'string' ? String(yearValue) : '';
              const title = item.title;
              const username = isAdmin ? record.username : undefined;
              const status = record.delivery_state === 'complete'
                ? 'Request status: Available'
                : record.delivery_state === 'error'
                  ? 'Request status: Problem'
                  : record.delivery_state && ['queued', 'resolving', 'locating', 'downloading'].includes(record.delivery_state)
                    ? 'Request status: In progress'
                    : record.status === 'pending'
                      ? 'Request status: Requested'
                      : record.status === 'rejected'
                        ? 'Request status: Rejected'
                        : record.status === 'cancelled'
                          ? 'Request status: Cancelled'
                          : 'Request status: Approved';
              const initials = (username || 'A').slice(0, 1).toUpperCase();
              return (
                <a
                  key={record.id}
                  href={withBasePath('/requests')}
                  className="shelfseerr-recent-request-card group relative flex h-44 w-[min(82vw,360px)] shrink-0 snap-start overflow-hidden rounded-xl border border-slate-300/20 bg-slate-900 text-left shadow-sm transition hover:border-indigo-400/60 hover:shadow-lg sm:h-44 sm:w-[386px]"
                  title={title}
                >
                  {item.preview && <img src={item.preview} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-20 blur-[1px] transition duration-300 group-hover:scale-105" />}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-900/45" />
                  <div className="relative z-10 flex min-w-0 flex-1 flex-col p-3.5 sm:p-4">
                    {year && <span className="text-[11px] font-semibold text-slate-300">{year}</span>}
                    <span className="mt-0.5 min-w-0 line-clamp-4 whitespace-normal break-words text-[13px] font-bold leading-[1.15rem] text-white sm:text-base [overflow-wrap:anywhere]">{title}</span>
                    <div className="mt-auto flex min-w-0 flex-col gap-2 pt-2">
                      <span className="flex min-w-0 items-center gap-2 text-xs text-slate-300">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-900">{initials}</span>
                        <span className="truncate">{username || t('You')}</span>
                      </span>
                      <span className="flex items-center gap-2 text-[11px] font-semibold text-slate-300">
                        <span>{t('Status')}</span>
                        <span className={'rounded-full px-2.5 py-1 text-[10px] font-bold ' + (status === 'Request status: Available' ? 'bg-emerald-500 text-white' : status === 'Request status: Problem' ? 'bg-red-500 text-white' : status === 'Request status: Requested' ? 'bg-indigo-500 text-white' : 'bg-slate-500 text-white')}>{t(status)}</span>
                      </span>
                    </div>
                  </div>
                  {item.preview && <img src={item.preview} alt="" loading="lazy" className="relative z-10 my-3 mr-3 w-20 shrink-0 rounded-lg object-cover shadow-xl sm:my-3.5 sm:mr-3.5 sm:w-24" />}
                </a>
              );
            })}
      </div>
    </section>
  );
});
