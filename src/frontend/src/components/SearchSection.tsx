import { useEffect, useState } from 'react';

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
import { RecentRequestsCarousel } from './RecentRequestsCarousel';
import { AdvancedFilters } from './AdvancedFilters';
import { useLanguage } from '../contexts/LanguageContext';
import { SearchBar } from './SearchBar';
import { DiscoveryShelf } from './DiscoveryShelf';
import { useLatestCallback } from '../hooks/useLatestCallback';

interface SearchSectionProps {
  onSearch: () => void;
  discoveryShelves: { ebook: { trending: Book[]; popular: Book[] }; audiobook: { trending: Book[]; popular: Book[] } };
  showDiscoveryShelves: boolean;
  isDiscoveryLoading: boolean;
  onDiscoveryBookSelect: (book: Book) => void;
  onDiscoveryGetReleases: (book: Book) => Promise<void>;
  getDiscoveryButtonState: (bookId: string) => ButtonStateInfo;
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
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [activeDiscoveryCardId, setActiveDiscoveryCardId] = useState<string | null>(null);

  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(hover: none), (pointer: coarse)').matches);
  }, []);

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

  const onDiscoveryBookSelectLatest = useLatestCallback(onDiscoveryBookSelect);
  const onDiscoveryGetReleasesLatest = useLatestCallback(onDiscoveryGetReleases);

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
        {showDiscoveryShelves && (
          <RecentRequestsCarousel
            recentRequests={recentRequests}
            requestsLoading={requestsLoading}
            isAdmin={isAdmin}
          />
        )}
        {showDiscoveryShelves && discoverySections.map((shelf) => (
          <DiscoveryShelf
            key={shelf.key}
            shelfKey={shelf.key}
            title={shelf.title}
            books={shelf.books}
            isLoading={isDiscoveryLoading}
            isTouchDevice={isTouchDevice}
            activeDiscoveryCardId={activeDiscoveryCardId}
            onActivateCard={setActiveDiscoveryCardId}
            getButtonState={getDiscoveryButtonState}
            onBookSelect={onDiscoveryBookSelectLatest}
            onGetReleases={onDiscoveryGetReleasesLatest}
          />
        ))}


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
