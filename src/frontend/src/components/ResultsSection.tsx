import { useEffect, useRef, useState } from 'react';

import { useLanguage } from '../contexts/LanguageContext';
import { useSearchMode } from '../contexts/SearchModeContext';
import { SORT_OPTIONS } from '../data/filterOptions';
import type { Book, ButtonStateInfo, ContentType, SortOption } from '../types';
import { Dropdown } from './Dropdown';
import { CardView } from './resultsViews/CardView';

// Une seule présentation en cartes, sur ordinateur comme sur mobile.
const GRID_CLASSES = {
  ebook: 'grid-cols-[repeat(2,minmax(0,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(156px,176px))] justify-between items-stretch',
  audiobook: 'grid-cols-[repeat(2,minmax(0,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(192px,220px))] justify-between items-stretch',
} as const;

interface ResultsSectionProps {
  contentType: ContentType;
  books: Book[];
  visible: boolean;
  onDetails: (id: string) => Promise<void>;
  onDownload: (book: Book) => Promise<void>;
  onGetReleases: (book: Book) => Promise<void>;
  getButtonState: (bookId: string) => ButtonStateInfo;
  getUniversalButtonState: (bookId: string) => ButtonStateInfo;
  sortValue: string;
  onSortChange: (value: string) => void;
  metadataSortOptions?: SortOption[];
  showSortControl?: boolean;
  // Pagination (universal mode)
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  totalFound?: number;
  // Direct mode: total result count from release sources
  directTotalResults?: number | string | null;
  onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  resultsSourceUrl?: string;
}

export const ResultsSection = ({
  contentType,
  books,
  visible,
  onDetails,
  onDownload,
  onGetReleases,
  getButtonState,
  getUniversalButtonState,
  sortValue,
  onSortChange,
  metadataSortOptions,
  showSortControl = true,
  hasMore,
  isLoadingMore,
  onLoadMore,
  directTotalResults,
}: ResultsSectionProps) => {
  const { t } = useLanguage();
  const { searchMode } = useSearchMode();
  const cardGridClass = contentType === 'audiobook'
    ? GRID_CLASSES.audiobook
    : GRID_CLASSES.ebook;
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const [activeTouchCardId, setActiveTouchCardId] = useState<string | null>(null);

  useEffect(() => {
    if (searchMode !== 'universal' || !hasMore || !onLoadMore || isLoadingMore) return;
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
      },
      { rootMargin: '700px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [searchMode, hasMore, onLoadMore, isLoadingMore]);



  if (!visible) return null;

  return (
    <section id="results-section" className="mb-4 w-full sm:mb-8">
      <div className="relative z-10 mb-2 flex items-center sm:mb-3">
        {/* Left: Sort control only; external Hardcover list link intentionally removed. */}
        <div>
          {showSortControl && (
            <SortControl
              value={sortValue}
              onChange={onSortChange}
              metadataSortOptions={metadataSortOptions}
            />
          )}

        </div>

        {/* Center: Results count */}
        <div className="flex flex-1 justify-center">
          {(() => {
            const count = directTotalResults ?? null;
            if (count === null || count === 0) return null;
            const isCapped = directTotalResults === '500+';
            const totalCount = isCapped ? 500 : Number(count);
            // AA-style: show page range + total
            if (totalCount === 1) {
              return (
                <span className="mx-2 mt-4 px-2 text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {t('Result 1 (1 Total)')}
                </span>
              );
            }
            const shownEnd = Math.min(totalCount, 50);
            const totalStr = isCapped ? '500+' : String(totalCount);
            return (
              <span className="mx-2 mt-4 px-2 text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                {t('Results')} 1-{shownEnd} ({totalStr} {t('Total')})
              </span>
            );
          })()}
        </div>


      </div>
      <div
        id="results-grid"
        className={`grid gap-4 sm:gap-8 ${cardGridClass}`}
      >
        {books.map((book, index) => {
          const animationDelay = index * 50;
          const buttonState =
            searchMode === 'universal'
              ? getUniversalButtonState(book.id)
              : getButtonState(book.id);

          return (
            <CardView
              key={book.id}
              book={book}
              contentType={contentType}
              onDetails={onDetails}
              onDownload={onDownload}
              onGetReleases={onGetReleases}
              buttonState={buttonState}
              animationDelay={animationDelay}
              showSeriesPosition={book.series_position != null}
            />
          );
        })}
      </div>
      {searchMode === 'universal' && hasMore && onLoadMore && (
        <div ref={loadMoreSentinelRef} className="flex min-h-12 items-center justify-center py-4" aria-live="polite">
          {isLoadingMore && (
            <svg className="h-5 w-5 animate-spin text-gray-500" viewBox="0 0 24 24" role="status" aria-label={t('Loading...')}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
        </div>
      )}
    </section>
  );
};

interface SortControlProps {
  value: string;
  onChange: (value: string) => void;
  metadataSortOptions?: SortOption[];
}

// Default universal mode sort options (fallback if not provided by API)
const DEFAULT_UNIVERSAL_SORT_OPTIONS: SortOption[] = [
  { value: 'relevance', label: 'Most relevant' },
];

const SortControl = ({ value, onChange, metadataSortOptions }: SortControlProps) => {
  const { searchMode } = useSearchMode();
  const { t } = useLanguage();
  // Use different sort options based on search mode
  // For universal mode, use dynamic options from API (with fallback)
  let sortOptions = SORT_OPTIONS;
  if (searchMode === 'universal') {
    sortOptions =
      metadataSortOptions && metadataSortOptions.length > 0
        ? metadataSortOptions
        : DEFAULT_UNIVERSAL_SORT_OPTIONS;
  }
  const localizedSortOptions = sortOptions.map((option) => ({ ...option, label: t(option.label) }));
  const selected =
    localizedSortOptions.find((option) => option.value === value) ?? localizedSortOptions[0];

  return (
    <Dropdown
      align="left"
      widthClassName="w-60 sm:w-72"
      renderTrigger={({ isOpen, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className={`hover-action relative flex items-center gap-2 rounded-full px-3 py-2 text-gray-900 transition-all duration-200 dark:text-gray-100 ${
            isOpen ? 'bg-(--hover-action)' : ''
          } animate-pop-up`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={t('Change sort order')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5 sm:h-6 sm:w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
            />
          </svg>
          <span className="text-sm font-medium whitespace-nowrap">{t(selected.label)}</span>
        </button>
      )}
    >
      {({ close }) => (
        <div role="listbox" aria-label={t('Sort results')}>
          {localizedSortOptions.map((option) => {
            const isSelected = option.value === selected.value;
            let selectedClassName = '';
            if (isSelected) {
              selectedClassName =
                searchMode === 'universal'
                  ? 'font-medium text-emerald-600 dark:text-emerald-400'
                  : 'font-medium text-sky-600 dark:text-sky-300';
            }
            return (
              <button
                type="button"
                key={option.value || 'default'}
                className={`hover-surface flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-base ${selectedClassName}`}
                onClick={() => {
                  onChange(option.value);
                  close();
                }}
                role="option"
                aria-selected={isSelected}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-4 w-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </Dropdown>
  );
};

