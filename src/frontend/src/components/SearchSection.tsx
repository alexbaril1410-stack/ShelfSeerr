import type {
  AdvancedFilterState,
  Language,
  MetadataSearchField,
  ContentType,
  QueryTargetOption,
  SearchMode,
  MetadataProviderSummary,
  Book,
} from '../types';
import { AdvancedFilters } from './AdvancedFilters';
import { useLanguage } from '../contexts/LanguageContext';
import { SearchBar } from './SearchBar';

interface SearchSectionProps {
  onSearch: () => void;
  discoveryShelves: { trending: Book[]; popular: Book[] };
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

const DISCOVERY_TOPICS = {
  ebook: [
    { label: 'Fantasy', query: 'fantasy', description: 'Imaginary worlds and epic sagas', icon: '✦' },
    { label: 'Mystery & thriller', query: 'thriller', description: 'Investigations, suspense, and mysteries', icon: '⌕' },
    { label: 'Science fiction', query: 'science fiction', description: 'Tomorrow starts here', icon: '◈' },
    { label: 'Romance', query: 'romance', description: 'Stories to devour', icon: '♡' },
    { label: 'Personal development', query: 'personal development', description: 'Learn and grow', icon: '↗' },
    { label: 'History', query: 'history', description: 'Understand the world', icon: '⌂' },
  ],
  audiobook: [
    { label: 'Fiction to listen to', query: 'roman', description: 'Let yourself be carried away by a story', icon: '♫' },
    { label: 'Mysteries & thrillers', query: 'thriller', description: 'Suspense in your ears', icon: '⌕' },
    { label: 'Fantasy', query: 'fantasy', description: 'Great adventures to listen to', icon: '✦' },
    { label: 'Personal development', query: 'personal development', description: 'Ideas to take with you', icon: '↗' },
    { label: 'Biographies', query: 'biography', description: 'Inspiring journeys', icon: '◉' },
    { label: 'Science fiction', query: 'science fiction', description: 'Somewhere else, in a different way', icon: '◈' },
  ],
} as const;

export const SearchSection = ({
  onSearch,
  isLoading,
  discoveryShelves,
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
  const topics = DISCOVERY_TOPICS[contentType];
  const selectTopic = (query: string) => onQueryValueChange(query);

  return (
    <section
      id="search-section"
      className={`${isInitialState ? 'search-initial-state mb-8' : 'mb-3 sm:mb-4'} ${showAdvanced ? 'search-advanced-visible' : ''}`}
    >
      {isInitialState && (
        <div className="relative isolate mb-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 px-4 py-7 text-white shadow-2xl sm:mb-12 sm:rounded-3xl sm:px-10 sm:py-14 lg:px-14">
          <div className="pointer-events-none absolute -right-20 -top-28 -z-10 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 -z-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-5 flex items-center justify-center gap-3">
              <img src={logoUrl} alt="ShelfSeerr" className="h-9 w-9 rounded-xl" />
              <span className="text-sm font-semibold tracking-[0.22em] text-slate-300">{searchPageTitle || 'SHELFSEERR'}</span>
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
              {t('Your next read starts here')}
            </p>
            <h1 className="mx-auto max-w-3xl text-[1.75rem] leading-tight font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {contentType === 'audiobook' ? t('Listen. Discover. Share.') : t('Find your next favorite book.')}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              {contentType === 'audiobook'
                ? t('Explore audiobooks, find your next listen, and add it to your library.')
                : t('Explore the catalog, discover new worlds, and find the books you want to read.')}
            </p>
            <div className="mx-auto mt-6 max-w-3xl rounded-xl bg-white p-1.5 shadow-xl sm:mt-8 sm:rounded-2xl sm:p-2">
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

      <div className={isInitialState ? 'space-y-8 sm:space-y-11' : 'hidden'}>
        <div>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-300">{t('Explore')}</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                {contentType === 'audiobook' ? t('Listen by mood') : t('Browse by genre')}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('Choose a theme to search your catalog.')}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {topics.map((topic, index) => (
              <button
                key={topic.query}
                type="button"
                onClick={() => selectTopic(topic.query)}
                className="group min-h-32 rounded-2xl border border-gray-200/80 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg dark:border-white/10 dark:bg-slate-900 dark:hover:border-indigo-400/50"
              >
                <span className={`mb-4 flex h-9 w-9 items-center justify-center rounded-xl text-lg ${index % 2 === 0 ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300' : 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300'}`}>
                  {topic.icon}
                </span>
                <span className="block text-sm font-semibold text-gray-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300">
                  {t(topic.label)}
                </span>
                <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">
                  {t(topic.description)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {([
          { key: 'trending', title: t('Trending') },
          { key: 'popular', title: t('Popular') },
        ] as const).map((shelf) => {
          const shelfBooks = discoveryShelves[shelf.key];
          if (!isDiscoveryLoading && shelfBooks.length === 0) return null;

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
                        <span className="mt-2 block line-clamp-2 text-xs font-semibold leading-4 text-gray-900 group-hover:text-indigo-600 dark:text-gray-100 dark:group-hover:text-indigo-300 sm:text-sm">
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

        <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-5 dark:border-white/10 dark:from-indigo-950/50 dark:via-slate-900 dark:to-cyan-950/40 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
              {contentType === 'audiobook' ? t('Your next listen') : t('Discover next')}
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              {contentType === 'audiobook' ? t('An audiobook is waiting for you.') : t('A new story is waiting for you.')}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">
              {contentType === 'audiobook'
                ? t('Search for a title or author, or browse genres to find your next listen.')
                : t('Search the configured metadata catalog to discover available titles.')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onQueryValueChange('');
              onQueryTargetChange('general');
            }}
            className="mt-4 shrink-0 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 sm:mt-0"
          >
            {t('Explore the catalog')}
          </button>
        </div>
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
