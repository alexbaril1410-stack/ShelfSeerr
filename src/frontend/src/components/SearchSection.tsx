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
import { SearchBar } from './SearchBar';

interface SearchSectionProps {
  onSearch: () => void;
  discoveryShelves: { trending: Book[]; new_releases: Book[] };
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
    { label: 'Fantasy', query: 'fantasy', description: 'Mondes imaginaires et grandes sagas', icon: '✦' },
    { label: 'Polar & thriller', query: 'thriller', description: 'Enquêtes, suspense et mystères', icon: '⌕' },
    { label: 'Science-fiction', query: 'science fiction', description: 'Demain commence ici', icon: '◈' },
    { label: 'Romance', query: 'romance', description: 'Des histoires à dévorer', icon: '♡' },
    { label: 'Développement personnel', query: 'personal development', description: 'Apprendre et progresser', icon: '↗' },
    { label: 'Histoire', query: 'history', description: 'Comprendre le monde', icon: '⌂' },
  ],
  audiobook: [
    { label: 'Romans à écouter', query: 'roman', description: 'Laissez-vous porter par une histoire', icon: '♫' },
    { label: 'Polars & thrillers', query: 'thriller', description: 'Le suspense dans les oreilles', icon: '⌕' },
    { label: 'Fantasy', query: 'fantasy', description: 'De grandes aventures à écouter', icon: '✦' },
    { label: 'Développement personnel', query: 'personal development', description: 'Des idées à emporter', icon: '↗' },
    { label: 'Biographies', query: 'biography', description: 'Des parcours inspirants', icon: '◉' },
    { label: 'Science-fiction', query: 'science fiction', description: 'Ailleurs, autrement', icon: '◈' },
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
  const topics = DISCOVERY_TOPICS[contentType];
  const selectTopic = (query: string) => onQueryValueChange(query);

  return (
    <section
      id="search-section"
      className={`${isInitialState ? 'search-initial-state mb-8' : 'mb-3 sm:mb-4'} ${showAdvanced ? 'search-advanced-visible' : ''}`}
    >
      {isInitialState && (
        <div className="relative isolate mb-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-950 px-5 py-10 text-white shadow-2xl sm:mb-12 sm:px-10 sm:py-14 lg:px-14">
          <div className="pointer-events-none absolute -right-20 -top-28 -z-10 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 -z-10 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-5 flex items-center justify-center gap-3">
              <img src={logoUrl} alt="ShelfSeerr" className="h-9 w-9 rounded-xl" />
              <span className="text-sm font-semibold tracking-[0.22em] text-slate-300">{searchPageTitle || 'SHELFSEERR'}</span>
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
              Votre prochaine lecture commence ici
            </p>
            <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {contentType === 'audiobook' ? 'À écouter. À découvrir. À partager.' : 'Trouvez votre prochain livre préféré.'}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              {contentType === 'audiobook'
                ? 'Explorez les livres audio, trouvez votre prochaine écoute et ajoutez-la à votre bibliothèque.'
                : 'Explorez le catalogue, découvrez de nouveaux univers et retrouvez les livres que vous souhaitez lire.'}
            </p>
            <div className="mx-auto mt-8 max-w-3xl rounded-2xl bg-white p-2 shadow-xl">
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
                Manual search queries release sources directly. Some sources may return limited metadata, which can affect file naming templates.
              </p>
            )}
          </div>
        </div>
      )}

      <div className={isInitialState ? 'space-y-8 sm:space-y-11' : 'hidden'}>
        <div>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-300">Explorer</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                {contentType === 'audiobook' ? 'À écouter selon vos envies' : 'Explorer par univers'}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Choisissez un thème pour lancer une recherche dans votre catalogue.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {topics.map((topic, index) => (
              <button
                key={topic.label}
                type="button"
                onClick={() => selectTopic(topic.query)}
                className="group min-h-32 rounded-2xl border border-gray-200/80 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg dark:border-white/10 dark:bg-slate-900 dark:hover:border-indigo-400/50"
              >
                <span className={`mb-4 flex h-9 w-9 items-center justify-center rounded-xl text-lg ${index % 2 === 0 ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300' : 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300'}`}>
                  {topic.icon}
                </span>
                <span className="block text-sm font-semibold text-gray-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300">
                  {topic.label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">
                  {topic.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {([
          { key: 'trending', title: contentType === 'audiobook' ? 'Les livres audio populaires' : 'Les livres du moment', eyebrow: 'Tendances' },
          { key: 'new_releases', title: contentType === 'audiobook' ? 'Les dernières sorties audio' : 'Les nouveautés', eyebrow: 'À paraître et récemment publiés' },
        ] as const).map((shelf) => {
          const shelfBooks = discoveryShelves[shelf.key];
          if (!isDiscoveryLoading && shelfBooks.length === 0) return null;

          return (
            <section key={shelf.key} className="min-w-0">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-300">{shelf.eyebrow}</p>
                  <h2 className="mt-1 text-lg font-bold tracking-tight text-gray-900 dark:text-white sm:text-xl">{shelf.title}</h2>
                </div>
                {shelfBooks.length > 0 && (
                  <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{shelfBooks.length} titres</span>
                )}
              </div>
              <div className="flex snap-x gap-3 overflow-x-auto pb-3 sm:gap-4">
                {isDiscoveryLoading && shelfBooks.length === 0
                  ? Array.from({ length: 6 }, (_, index) => (
                      <div key={index} className="w-[112px] shrink-0 animate-pulse sm:w-[142px]">
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
                        className="group w-[112px] shrink-0 snap-start text-left sm:w-[142px]"
                        title={`Rechercher ${book.title}`}
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
                          {book.author || 'Auteur inconnu'}
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
              {contentType === 'audiobook' ? 'Votre prochaine écoute' : 'À découvrir'}
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              {contentType === 'audiobook' ? 'Un livre audio vous attend.' : 'Une nouvelle histoire vous attend.'}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">
              {contentType === 'audiobook'
                ? 'Recherchez un titre, un auteur ou parcourez les genres pour trouver votre prochaine écoute.'
                : 'Lancez une recherche dans le catalogue de métadonnées configuré pour découvrir les titres disponibles.'}
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
            Explorer le catalogue
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
