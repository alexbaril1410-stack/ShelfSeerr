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
  ButtonStateInfo,
} from '../types';
import { listRequests } from '../services/api';
import { requestToActivityItem } from './activity/activityMappers';
import { withBasePath } from '../utils/basePath';
import { AdvancedFilters } from './AdvancedFilters';
import { useLanguage } from '../contexts/LanguageContext';
import { SearchBar } from './SearchBar';
import { BookGetButton } from './BookGetButton';
import { LibraryBadge } from './shared';

interface SearchSectionProps {
  onSearch: () => void;
  discoveryShelves: { ebook: { trending: Book[]; popular: Book[] }; audiobook: { trending: Book[]; popular: Book[] } };
  showDiscoveryShelves: boolean;
  isDiscoveryLoading: boolean;
  onDiscoveryBookSelect: (book: Book) => void;
  onDiscoveryGetReleases: (book: Book) => Promise<void>;
  getDiscoveryButtonState: (book: Book) => ButtonStateInfo;
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
  onDiscoveryGetReleases,
  getDiscoveryButtonState,
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
  const discoveryRailRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  const scrollDiscoveryRail = (key: string, direction: -1 | 1) => {
    const rail = discoveryRailRefs.current[key];
    rail?.scrollBy({
      left: direction * Math.max(320, rail.clientWidth * 0.8),
      behavior: 'smooth',
    });
  };

  const renderCarouselControls = (onScroll: (direction: -1 | 1) => void, label: string) => (
    <div className="flex shrink-0 items-center gap-2">
      <button type="button" onClick={() => onScroll(-1)} aria-label={`${t('Previous')} ${label}`} className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-indigo-400 hover:text-indigo-500 dark:border-white/10 dark:text-gray-300">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <button type="button" onClick={() => onScroll(1)} aria-label={`${t('Next')} ${label}`} className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-indigo-400 hover:text-indigo-500 dark:border-white/10 dark:text-gray-300">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </div>
  );

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

      <div className={isInitialState ? 'space-y-3 sm:space-y-4' : 'hidden'}>
        {showDiscoveryShelves && (requestsLoading || requestCardItems.length > 0) && (
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
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${status === 'Request status: Available' ? 'bg-emerald-500 text-white' : status === 'Request status: Problem' ? 'bg-red-500 text-white' : status === 'Request status: Requested' ? 'bg-indigo-500 text-white' : 'bg-slate-500 text-white'}`}>{t(status)}</span>
                            </span>
                          </div>
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
                <div className="flex min-w-0 items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white sm:text-xl">{t(shelf.title)}</h2>
                  <a
                    href={withBasePath(
                      shelf.key === 'ebook-trending'
                        ? '/books#content_type=ebook&sort=trending'
                        : shelf.key === 'ebook-popular'
                          ? '/books#content_type=ebook'
                          : shelf.key === 'audiobook-trending'
                            ? '/audiobooks#content_type=audiobook'
                            : '/audiobooks#content_type=audiobook&sort=popularity',
                    )}
                    aria-label={`${t('View full selection')} – ${t(shelf.title)}`}
                    title={t('View full selection')}
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-indigo-300"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="m10 8 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {shelfBooks.length > 0 && (
                    <span className="hidden text-xs text-gray-500 dark:text-gray-400 sm:inline">{shelfBooks.length} {t('titles')}</span>
                  )}
                  {renderCarouselControls((direction) => scrollDiscoveryRail(shelf.key, direction), t(shelf.title))}
                </div>
              </div>
              <div ref={(element) => { discoveryRailRefs.current[shelf.key] = element; }} className="shelfseerr-discovery-rail flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:gap-4">
                {isDiscoveryLoading && shelfBooks.length === 0
                  ? Array.from({ length: 6 }, (_, index) => (
                      <div
                        key={index}
                        className={`shrink-0 animate-pulse ${shelf.key.startsWith('audiobook') ? 'w-[160px] sm:w-[220px]' : 'w-[132px] sm:w-[176px]'}`}
                      >
                        <div className="aspect-[2/3] rounded-xl bg-gray-200 dark:bg-slate-800" />
                        <div className="mt-2 h-3 rounded bg-gray-200 dark:bg-slate-800" />
                        <div className="mt-1 h-2.5 w-2/3 rounded bg-gray-100 dark:bg-slate-800/70" />
                      </div>
                    ))
                  : shelfBooks.map((book) => {
                      const isAudiobook = shelf.key.startsWith('audiobook');
                      const creator = isAudiobook
                        ? book.narrators?.filter(Boolean).join(', ') || book.author
                        : book.author;
                      return (
                        <article
                          key={book.id}
                          className={`group relative shrink-0 snap-start overflow-hidden rounded-xl bg-gray-100 text-left shadow-sm ring-1 ring-black/5 transition duration-200 hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900 dark:ring-white/10 ${isAudiobook ? 'w-[160px] sm:w-[220px]' : 'w-[132px] sm:w-[176px]'}`}
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => onDiscoveryBookSelect(book)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onDiscoveryBookSelect(book);
                              }
                            }}
                            className="relative block w-full cursor-pointer overflow-hidden bg-slate-200 dark:bg-slate-800"
                            style={{ aspectRatio: book.cover_aspect === 'square' ? '1 / 1' : '2 / 3' }}
                            title={`${t('Search')} ${book.title}`}
                            aria-label={book.title}
                          >
                            {book.preview ? (
                              <img
                                src={book.preview}
                                alt={book.title}
                                loading="lazy"
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center px-3 text-center text-xs text-gray-500 dark:text-gray-400">
                                {book.title}
                              </div>
                            )}
                            <LibraryBadge
                              library={book.library}
                              contentType={isAudiobook ? 'audiobook' : 'ebook'}
                              overlay
                              className="absolute top-2 right-2 z-20"
                            />
                            {book.series_position != null && (
                              <span className="absolute top-2 left-2 z-20 rounded-md border border-emerald-700 bg-emerald-600 px-2 py-1 text-xs font-bold text-white shadow-lg">
                                #{book.series_position}
                              </span>
                            )}
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100" />
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 px-2.5 pb-[54px] pt-16 text-left text-white opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
                              <p className="mb-1 text-[11px] font-semibold leading-tight text-white/90 sm:text-xs">
                                {book.year || '—'}
                              </p>
                              <h3 className="line-clamp-4 text-xs leading-tight font-bold sm:text-sm" title={book.title}>
                                {book.title}
                              </h3>
                              <p className="mt-1 line-clamp-3 text-[10px] leading-tight text-white/85 sm:text-xs">
                                {creator || t(isAudiobook ? 'Unknown narrator' : 'Unknown author')}
                              </p>
                            </div>
                          </div>
                          <div
                            className="absolute inset-x-2 bottom-2 z-30"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <BookGetButton
                              book={book}
                              buttonState={getDiscoveryButtonState(book)}
                              onGetReleases={onDiscoveryGetReleases}
                              size="sm"
                              className="w-full shadow-lg"
                              fullWidth
                            />
                          </div>
                          <div className="px-2.5 py-2 sm:hidden">
                            <p className="line-clamp-2 text-xs font-semibold leading-tight text-gray-900 dark:text-gray-100">
                              {book.title}
                            </p>
                            <p className="mt-1 truncate text-[11px] text-gray-500 dark:text-gray-400">
                              {creator || t(isAudiobook ? 'Unknown narrator' : 'Unknown author')}
                            </p>
                          </div>
                        </article>
                      );
                    })}
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
