import { useEffect, useMemo, useRef, useState } from 'react';

import type {
  AdvancedFilterState,
  Language,
  MetadataSearchField,
  ContentType,
  QueryTargetOption,
  SearchMode,
  MetadataProviderSummary,
  Book,
  RequestRecord,
} from '../types';
import { listRequests } from '../services/api';
import { requestToActivityItem } from './activity/activityMappers';
import { withBasePath } from '../utils/basePath';
import { AdvancedFilters } from './AdvancedFilters';
import { useLanguage } from '../contexts/LanguageContext';
import { SearchBar } from './SearchBar';

interface SearchSectionProps {
  onSearch: () => void;
  discoveryShelves: { ebook: { trending: Book[]; popular: Book[] }; audiobook: { trending: Book[]; popular: Book[] } };
  showDiscoveryShelves: boolean;
  isDiscoveryLoading: boolean;
  onDiscoveryBookSelect: (book: Book) => void;
  isLoading: boolean;
  isInitialState: boolean;
  searchPageTitle: string;
  bookLanguages: Language[];
  defaultLanguage: string[];
  logoUrl: string;
  queryValue: string | number | boolean;
  queryValueLabel?: string;
  onQueryValueChange: (value: string | number | boolean, label?: string) => void;
  queryTargets: QueryTargetOption[];
  activeQueryTarget: string;
  onQueryTargetChange: (key: string) => void;
  showAdvanced: boolean;
  onAdvancedToggle?: () => void;
  advancedFilters: AdvancedFilterState;
  onAdvancedFiltersChange: (updates: Partial<AdvancedFilterState>) => void;
  contentType?: ContentType;
  onContentTypeChange?: (type: ContentType) => void;
  allowedContentTypes?: ContentType[];
  combinedMode?: boolean;
  combinedModeLocked?: boolean;
  onCombinedModeChange?: (enabled: boolean) => void;
  activeQueryField?: MetadataSearchField | null;
  searchMode: SearchMode;
  onSearchModeChange: (mode: SearchMode) => void;
  metadataProviders?: MetadataProviderSummary[];
  activeMetadataProvider?: string | null;
  onMetadataProviderChange?: (provider: string) => void;
  isAdmin?: boolean;
}

export const SearchSection = ({
  onSearch,
  isLoading,
  discoveryShelves,
  showDiscoveryShelves,
  isDiscoveryLoading,
  onDiscoveryBookSelect,
  isInitialState,
  searchPageTitle,
  bookLanguages,
  defaultLanguage,
  logoUrl,
  queryValue,
  queryValueLabel,
  onQueryValueChange,
  queryTargets,
  activeQueryTarget,
  onQueryTargetChange,
  showAdvanced,
  onAdvancedToggle,
  advancedFilters,
  onAdvancedFiltersChange,
  contentType = 'ebook',
  onContentTypeChange,
  allowedContentTypes,
  combinedMode,
  combinedModeLocked,
  onCombinedModeChange,
  activeQueryField,
  searchMode,
  onSearchModeChange,
  metadataProviders,
  activeMetadataProvider,
  onMetadataProviderChange,
  isAdmin = false,
}: SearchSectionProps) => {
  const { t } = useLanguage();
  const [recentRequests, setRecentRequests] = useState<RequestRecord[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const requestsRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDiscoveryShelves) return;
    let active = true;
    setRequestsLoading(true);
    listRequests(isAdmin)
      .then((records) => {
        if (active) {
          setRecentRequests(
            [...records]
              .filter((record) => record.status !== 'cancelled')
              .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
              .slice(0, 12),
          );
        }
      })
      .catch(() => {
        if (active) setRecentRequests([]);
      })
      .finally(() => {
        if (active) setRequestsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isAdmin, showDiscoveryShelves]);

  const scrollRecentRequests = (direction: -1 | 1) => {
    requestsRailRef.current?.scrollBy({
      left: direction * Math.max(320, requestsRailRef.current.clientWidth * 0.8),
      behavior: 'smooth',
    });
  };

  const requestCardItems = useMemo(
    () => recentRequests.map((record) => ({
      record,
      item: requestToActivityItem(record, isAdmin ? 'admin' : 'user'),
    })),
    [isAdmin, recentRequests],
  );
  const discoverySections = [
    { key: 'ebook-trending', title: 'Tendances – Livres', books: discoveryShelves.ebook.trending },
    { key: 'ebook-popular', title: 'Populaire – Livres', books: discoveryShelves.ebook.popular },
    { key: 'audiobook-trending', title: 'Tendances – Livres audio', books: discoveryShelves.audiobook.trending },
    { key: 'audiobook-popular', title: 'Populaire – Livres audio', books: discoveryShelves.audiobook.popular },
  ] as const;

  return (
    <section
      id="search-section"
      className={`${isInitialState ? 'search-initial-state mb-3 sm:mb-4' : 'mb-3 sm:mb-4'} ${showAdvanced ? 'search-advanced-visible' : ''}`}
    >
      {isInitialState && (
        <div className="relative isolate mb-3 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white shadow-2xl sm:mb-4 sm:rounded-3xl sm:px-8 sm:py-4 lg:px-10">
          <div className="pointer-events-none absolute -right-20 -top-28 -z-10 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 -z-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-5 flex items-center justify-center gap-3">
              <img src={logoUrl} alt="ShelfSeerr" className="h-9 w-9 rounded-xl" />
              <span className="text-sm font-semibold tracking-[0.22em] text-slate-300">{searchPageTitle || 'SHELFSEERR'}</span>
            </div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
              {t('Your next read starts here')}
            </p>
            <h1 className="mx-auto max-w-3xl text-[1.75rem] leading-tight font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {contentType === 'audiobook' ? t('Listen. Discover. Share.') : t('Find your next favorite book.')}
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              {contentType === 'audiobook'
                ? t('Explore audiobooks, find your next listen, and add it to your library.')
                : t('Explore the catalog, discover new worlds, and find the books you want to read.')}
            </p>
            <div className="mx-auto mt-3 max-w-3xl rounded-xl bg-white p-1.5 shadow-xl sm:mt-4 sm:rounded-2xl sm:p-2">
              <SearchBar
                value={queryValue}
                valueLabel={queryValueLabel}
                onChange={onQueryValueChange}
                onSubmit={onSearch}
                isLoading={isLoading}
                onAdvancedToggle={onAdvancedToggle}
                isAdvancedActive={showAdvanced}
                contentType={contentType}
                onContentTypeChange={onContentTypeChange}
                allowedContentTypes={allowedContentTypes}
                combinedMode={combinedMode}
                combinedModeLocked={combinedModeLocked}
                onCombinedModeChange={onCombinedModeChange}
                queryTargets={queryTargets}
                activeQueryTarget={activeQueryTarget}
                onQueryTargetChange={onQueryTargetChange}
                activeQueryField={activeQueryField}
                optionsLayout="inline"
              />
            </div>
            {activeQueryTarget === 'manual' && (
              <p className="mt-3 text-left text-xs text-slate-400">
                {t('Manual search queries release sources directly. Some sources may return limited metadata, which can affect file naming templates.')}
              </p>
            )}
          </div>
        </div>
      )}

      <div className={isInitialState ? 'space-y-4 sm:space-y-5' : 'hidden'}>
        {showDiscoveryShelves && (requestsLoading || requestCardItems.length > 0) && (
          <section className="min-w-0" aria-label={t('Recent requests')}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white sm:text-xl">
                {t('Recent requests')}
              </h2>
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
                        className="group relative flex h-36 w-[min(82vw,360px)] shrink-0 snap-start overflow-hidden rounded-xl border border-slate-300/20 bg-slate-900 text-left shadow-sm transition hover:border-indigo-400/60 hover:shadow-lg sm:h-40 sm:w-[386px]"
                        title={title}
                      >
                        {item.preview && <img src={item.preview} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-20 blur-[1px] transition duration-300 group-hover:scale-105" />}
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-900/45" />
                        <div className="relative z-10 flex min-w-0 flex-1 flex-col p-3.5 sm:p-4">
                          {year && <span className="text-[11px] font-semibold text-slate-300">{year}</span>}
                          <span className="mt-0.5 line-clamp-2 text-sm font-bold leading-5 text-white sm:text-base">{title}</span>
                          <span className="mt-2 flex min-w-0 items-center gap-2 text-xs text-slate-300">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-900">{initials}</span>
                            <span className="truncate">{username || t('You')}</span>
                          </span>
                          <span className="mt-auto flex items-center gap-2 pt-2 text-[11px] font-semibold text-slate-300">
                            <span>{t('Status')}</span>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${status === 'Request status: Available' ? 'bg-emerald-500 text-white' : status === 'Request status: Problem' ? 'bg-red-500 text-white' : status === 'Request status: Requested' ? 'bg-indigo-500 text-white' : 'bg-slate-500 text-white'}`}>{t(status)}</span>
                          </span>
                        </div>
                        {item.preview && <img src={item.preview} alt="" loading="lazy" className="relative z-10 my-3 mr-3 w-20 shrink-0 rounded-lg object-cover shadow-xl sm:my-3.5 sm:mr-3.5 sm:w-24" />}
                      </a>
                    );
                  })}
            </div>
          </section>
        )}
        {showDiscoveryShelves && discoverySections.map((shelf) => {
          const shelfBooks = shelf.books;

          return (
            <section key={shelf.key} className="min-w-0">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white sm:text-xl">{t(shelf.title)}</h2>
                </div>
                {shelfBooks.length > 0 && (
                  <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{shelfBooks.length} {t('titles')}</span>
                )}
              </div>
              <div className="shelfseerr-discovery-rail flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:gap-4">
                {isDiscoveryLoading && shelfBooks.length === 0
                  ? Array.from({ length: 6 }, (_, index) => (
                      <div key={index} className="w-[124px] shrink-0 animate-pulse sm:w-[142px]">
                        <div className="aspect-[2/3] rounded-xl bg-gray-200 dark:bg-slate-800" />
                        <div className="mt-2 h-3 rounded bg-gray-200 dark:bg-slate-800" />
                        <div className="mt-1 h-2.5 w-2/3 rounded bg-gray-100 dark:bg-slate-800/70" />
                      </div>
                    ))
                  : shelfBooks.map((book) => (
                      <button
                        key={book.id}
                        type="button"
                        onClick={() => onDiscoveryBookSelect(book)}
                        className="group w-[124px] shrink-0 snap-start text-left sm:w-[142px]"
                        title={`${t('Search')} ${book.title}`}
                      >
                        <div
                          className="relative overflow-hidden rounded-xl bg-gray-100 shadow-sm ring-1 ring-black/5 transition duration-200 group-hover:-translate-y-1 group-hover:shadow-xl dark:bg-slate-800 dark:ring-white/10"
                          style={{ aspectRatio: book.cover_aspect === 'square' ? '1 / 1' : '2 / 3' }}
                        >
                          {book.preview ? (
                            <img
                              src={book.preview}
                              alt={book.title}
                              loading="lazy"
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center px-3 text-center text-xs text-gray-500 dark:text-gray-400">
                              {book.title}
                            </div>
                          )}
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <span className="mt-2 block h-12 line-clamp-3 text-xs font-semibold leading-4 text-gray-900 group-hover:text-indigo-600 dark:text-gray-100 dark:group-hover:text-indigo-300 sm:text-sm">
                          {book.title}
                        </span>
                        <span className="mt-1 block truncate text-[11px] text-gray-500 dark:text-gray-400 sm:text-xs">
                          {book.author || t('Unknown author')}
                        </span>
                      </button>
                    ))}
              </div>
            </section>
          );
        })}


      </div>

      <AdvancedFilters
        visible={showAdvanced}
        bookLanguages={bookLanguages}
        defaultLanguage={defaultLanguage}
        filters={advancedFilters}
        onFiltersChange={onAdvancedFiltersChange}
        formClassName="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        renderWrapper={(form) => form}
        searchMode={searchMode}
        onSearchModeChange={onSearchModeChange}
        metadataProviders={metadataProviders}
        activeMetadataProvider={activeMetadataProvider}
        onMetadataProviderChange={onMetadataProviderChange}
        contentType={contentType}
        combinedMode={combinedMode}
        isAdmin={isAdmin}
        onClose={onAdvancedToggle}
      />
    </section>
  );
};
