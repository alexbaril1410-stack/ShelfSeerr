import { memo, useState } from 'react';

import { useLanguage } from '../../contexts/LanguageContext';
import { useSearchMode } from '../../contexts/SearchModeContext';
import type { Book, ButtonStateInfo, ContentType } from '../../types';
import { getDownloadsCount } from '../../types';
import { BookActionButton } from '../BookActionButton';
import { DisplayFieldBadges, LibraryBadge } from '../shared';

const SkeletonLoader = () => (
  <div className="h-full w-full animate-pulse bg-linear-to-r from-gray-300 via-gray-200 to-gray-300 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700" />
);

interface CardViewProps {
  contentType: ContentType;
  book: Book;
  onDetails: (id: string) => Promise<void>;
  onDownload: (book: Book) => Promise<void>;
  onGetReleases: (book: Book) => Promise<void>;
  buttonState: ButtonStateInfo;
  animationDelay?: number;
  imageLoading?: 'eager' | 'lazy';
  imagePriority?: boolean;
  showSeriesPosition?: boolean;
  activeTouchCardId: string | null;
  onActivateTouchCard: (id: string) => void;
}

const sameButtonState = (left: ButtonStateInfo, right: ButtonStateInfo): boolean =>
  left === right ||
  (left.state === right.state && left.text === right.text && left.progress === right.progress);

const areCardViewPropsEqual = (previous: CardViewProps, next: CardViewProps): boolean =>
  previous.book === next.book &&
  previous.contentType === next.contentType &&
  previous.onDetails === next.onDetails &&
  previous.onDownload === next.onDownload &&
  previous.onGetReleases === next.onGetReleases &&
  sameButtonState(previous.buttonState, next.buttonState) &&
  previous.animationDelay === next.animationDelay &&
  previous.imageLoading === next.imageLoading &&
  previous.imagePriority === next.imagePriority &&
  previous.showSeriesPosition === next.showSeriesPosition &&
  (previous.activeTouchCardId === previous.book.id) ===
    (next.activeTouchCardId === next.book.id) &&
  previous.onActivateTouchCard === next.onActivateTouchCard;

export const CardView = memo(({
  book,
  contentType,
  onDetails,
  onDownload,
  onGetReleases,
  buttonState,
  animationDelay = 0,
  imageLoading = 'lazy',
  imagePriority = false,
  showSeriesPosition = false,
  activeTouchCardId,
  onActivateTouchCard,
}: CardViewProps) => {
  const { searchMode } = useSearchMode();
  const { t } = useLanguage();
  const isAudiobook = contentType === 'audiobook';
  const creatorLabel = isAudiobook
    ? (book.authors?.length ? book.authors : book.author ? [book.author] : [])
        .flatMap((author) => author.split(/,\\s*/))
        .map((author) => author.trim())
        .filter(
          (author) =>
            author &&
            !/(translator|translat|traduct|adaptat|übersetz|traducc|traduz)/i.test(author),
        )
        .join(', ')
    : book.author;
  const detailsLabel = isAudiobook ? t('Open audiobook details') : t('Open book details');
  const coverLabel = isAudiobook ? t('Audiobook cover') : t('Book cover');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLoadingReleases, setIsLoadingReleases] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const showInfoOnTouch = activeTouchCardId === book.id;
  let zIndex: number | undefined;
  if (isHovered) {
    zIndex = 10;
  }

  const handleDetails = async (id: string) => {
    setIsLoadingDetails(true);
    try {
      await onDetails(id);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleGetReleases = async (selectedBook: Book) => {
    setIsLoadingReleases(true);
    try {
      await onGetReleases(selectedBook);
    } finally {
      setIsLoadingReleases(false);
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- mouse handlers drive a decorative hover shadow only; no interactive behavior requiring keyboard support
    <article
      className={`book-card space-between animate-pop-up relative flex h-full w-full flex-col transition-shadow duration-300 ${isAudiobook ? 'max-w-[220px]' : 'max-w-[176px]'}`}
      style={{
        background: 'var(--bg-soft)',
        borderRadius: '.75rem',
        boxShadow: isHovered ? '0 10px 30px rgba(0, 0, 0, 0.15)' : 'none',
        zIndex,
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'both',
      }}
      onMouseEnter={() => {
        if (typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative w-full"
        style={{ aspectRatio: book.cover_aspect === 'square' ? '1/1' : '2/3' }}
        onClick={() => {
          const isTouchLayout =
            typeof window !== 'undefined' &&
            window.matchMedia('(hover: none), (pointer: coarse)').matches;
          if (!isTouchLayout) {
            void handleDetails(book.id);
          } else if (!showInfoOnTouch) {
            onActivateTouchCard(book.id);
          } else {
            void handleDetails(book.id);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            void handleDetails(book.id);
          }
        }}
        role="button"
        aria-busy={isLoadingDetails}
        tabIndex={0}
        aria-label={detailsLabel}
      >
        <div className="absolute inset-0 overflow-hidden rounded-t-[.75rem]">
          {/* Series position badge: shown with the card information */}
          {showSeriesPosition && book.series_position != null && (
            <div
              className="absolute top-2 left-2 z-20 rounded-md border border-emerald-700 bg-emerald-600 px-2 py-1 text-xs font-bold text-white transition-opacity duration-200"
              style={{
                opacity: isHovered || showInfoOnTouch ? 1 : 0,
                pointerEvents: 'none',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
              }}
            >
              #{book.series_position}
            </div>
          )}
          <LibraryBadge library={book.library} contentType={contentType} overlay className="absolute top-2 right-2 z-10" />
          {book.preview && !imageError ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0">
                  <SkeletonLoader />
                </div>
              )}
              <img
                src={book.preview}
                alt={book.title || coverLabel}
                className="h-full w-full"
                loading={imageLoading}
                decoding="async"
                fetchPriority={imagePriority ? 'high' : 'auto'}
                style={{
                  opacity: imageLoaded ? 1 : 0,
                  transition: 'opacity 0.3s ease-in-out',
                  objectFit: 'cover',
                  objectPosition: 'top',
                }}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </>
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-sm opacity-50"
              style={{ background: 'var(--border-muted)' }}
            >
              {t('No Cover')}
            </div>
          )}

          <div
            className="pointer-events-none absolute inset-0 bg-white transition-opacity duration-300"
            style={{ opacity: isHovered ? 0.02 : 0 }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/95 via-black/65 to-transparent px-2.5 pb-[46px] pt-16 text-white transition-opacity duration-200"
            style={{ opacity: isHovered || showInfoOnTouch ? 1 : 0 }}
          >
            <p className="mb-1 text-xs font-semibold leading-tight text-white/90">
              {book.year || '—'}
            </p>
            <h3
              className="line-clamp-4 text-sm leading-tight font-bold"
              title={book.title || t('Untitled')}
            >
              {book.title || t('Untitled')}
            </h3>
            <p className="mt-1 line-clamp-3 text-xs leading-tight text-white/85">
              {creatorLabel || t('Unknown author')}
            </p>
          </div>
        </div>

        <div
          className="absolute inset-x-2 bottom-2 z-20 transition-opacity duration-200"
          style={{
            opacity: isHovered || showInfoOnTouch ? 1 : 0,
            pointerEvents: isHovered || showInfoOnTouch ? 'auto' : 'none',
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <BookActionButton
            book={book}
            buttonState={buttonState}
            onDownload={onDownload}
            onGetReleases={(selectedBook) => {
              void handleGetReleases(selectedBook);
            }}
            isLoadingReleases={isLoadingReleases}
            size="sm"
            className="w-full shadow-lg"
            fullWidth
          />
        </div>
      </div>

      <div className="hidden">
        <div className="space-y-1 max-sm:min-w-0 max-sm:space-y-0.5">
          <h3
            className="line-clamp-2 text-base leading-tight font-semibold max-sm:line-clamp-3 max-sm:min-w-0"
            title={book.title || t('Untitled')}
          >
            {book.title || t('Untitled')}
          </h3>
          <p className="truncate text-sm opacity-80 max-sm:min-w-0 max-sm:text-xs">
            {book.author || t('Unknown author')}
          </p>
          {searchMode === 'universal' && book.display_fields && book.display_fields.length > 0 ? (
            <div className="flex flex-wrap gap-2 text-xs opacity-70 max-sm:gap-1 max-sm:text-[10px]">
              <span>{book.year || '-'}</span>
              <span>•</span>
              <DisplayFieldBadges
                fields={book.display_fields.filter((f) => f.icon !== 'editions')}
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 text-xs opacity-70 max-sm:gap-1 max-sm:text-[10px]">
              <span>{book.year || '-'}</span>
              <span>•</span>
              <span>{book.language || '-'}</span>
              <span>•</span>
              <span>{book.format || '-'}</span>
              {book.size && (
                <>
                  <span>•</span>
                  <span>{book.size}</span>
                </>
              )}
              {searchMode !== 'universal' &&
                (() => {
                  const d = getDownloadsCount(book);
                  return d != null && d > 0 ? (
                    <>
                      {' '}
                      <span>•</span> <span>{d.toLocaleString()}</span>{' '}
                    </>
                  ) : null;
                })()}
            </div>
          )}
        </div>


      </div>


    </article>
  );
}, areCardViewPropsEqual);

