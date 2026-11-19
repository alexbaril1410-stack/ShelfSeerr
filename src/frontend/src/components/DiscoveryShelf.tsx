import { memo, useCallback, useRef, useState } from 'react';

import { useLanguage } from '../contexts/LanguageContext';
import { useLatestCallback } from '../hooks/useLatestCallback';
import type { Book, ButtonStateInfo } from '../types';
import { withBasePath } from '../utils/basePath';
import { BookGetButton } from './BookGetButton';
import { LibraryBadge } from './shared';

export type DiscoveryShelfKey =
  | 'ebook-trending'
  | 'ebook-popular'
  | 'audiobook-trending'
  | 'audiobook-popular';

interface DiscoveryShelfProps {
  shelfKey: DiscoveryShelfKey;
  title: string;
  books: Book[];
  isLoading: boolean;
  isTouchDevice: boolean;
  getButtonState: (book: Book) => ButtonStateInfo;
  onBookSelect: (book: Book) => void;
  onGetReleases: (book: Book) => Promise<void>;
}

interface DiscoveryBookCardProps {
  book: Book;
  isAudiobook: boolean;
  isTouchDevice: boolean;
  isActive: boolean;
  buttonState: ButtonStateInfo;
  onActivate: (id: string) => void;
  onSelect: (book: Book) => void;
  onGetReleases: (book: Book) => Promise<void>;
}

const sameButtonState = (left: ButtonStateInfo, right: ButtonStateInfo): boolean =>
  left === right ||
  (left.state === right.state &&
    left.text === right.text &&
    left.progress === right.progress);

const DiscoveryBookCard = memo(({
  book,
  isAudiobook,
  isTouchDevice,
  isActive,
  buttonState,
  onActivate,
  onSelect,
  onGetReleases,
}: DiscoveryBookCardProps) => {
  const { t } = useLanguage();
  const selectLatest = useLatestCallback(onSelect);
  const getReleasesLatest = useLatestCallback(onGetReleases);
  const creator = isAudiobook
    ? (book.authors?.length ? book.authors : book.author ? [book.author] : [])
        .flatMap((author) => author.split(/,\s*/))
        .map((author) => author.trim())
        .filter(
          (author) =>
            author &&
            !/(translator|translat|traduct|adaptat|übersetz|traducc|traduz)/i.test(author),
        )
        .join(', ')
    : book.author;

  const handleSelect = useCallback(() => {
    if (isTouchDevice && !isActive) {
      onActivate(book.id);
      return;
    }
    selectLatest(book);
    onActivate('');
  }, [book, isActive, isTouchDevice, onActivate, selectLatest]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectLatest(book);
      onActivate('');
    }
  }, [book, onActivate, selectLatest]);

  const handleGetReleases = useCallback((selectedBook: Book) => {
    void getReleasesLatest(selectedBook);
  }, [getReleasesLatest]);

  return (
    <article
      className={'group relative shrink-0 snap-start overflow-hidden rounded-xl bg-gray-100 text-left shadow-sm ring-1 ring-black/5 transition duration-200 hover:-translate-y-1 hover:shadow-xl dark:bg-slate-900 dark:ring-white/10 ' + (isAudiobook ? 'w-[160px] sm:w-[220px]' : 'w-[132px] sm:w-[176px]')}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleSelect}
        onKeyDown={handleKeyDown}
        className="relative block w-full cursor-pointer overflow-hidden bg-slate-200 dark:bg-slate-800"
        style={{ aspectRatio: book.cover_aspect === 'square' ? '1 / 1' : '2 / 3' }}
        title={t('Search') + ' ' + book.title}
        aria-label={book.title}
      >
        {book.preview ? (
          <img
            src={book.preview}
            alt={book.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
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
          <span className={'absolute top-2 left-2 z-20 rounded-md border border-emerald-700 bg-emerald-600 px-2 py-1 text-xs font-bold text-white shadow-lg opacity-0 transition-opacity duration-200 sm:group-hover:opacity-100 ' + (isActive ? 'opacity-100' : '')}>
            #{book.series_position}
          </span>
        )}
        <div className={'pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent opacity-0 transition-opacity duration-200 sm:group-hover:opacity-100 ' + (isActive ? 'opacity-100' : '')} />
        <div className={'pointer-events-none absolute inset-x-0 bottom-0 px-2.5 pb-[54px] pt-16 text-left text-white opacity-0 transition-opacity duration-200 sm:group-hover:opacity-100 ' + (isActive ? 'opacity-100' : '')}>
          <p className="mb-1 text-[11px] font-semibold leading-tight text-white/90 sm:text-xs">
            {book.year || '—'}
          </p>
          <h3 className="line-clamp-4 text-xs leading-tight font-bold sm:text-sm" title={book.title}>
            {book.title}
          </h3>
          <p className="mt-1 line-clamp-3 text-[10px] leading-tight text-white/85 sm:text-xs">
            {creator || t('Unknown author')}
          </p>
        </div>
      </div>
      <div
        className={'absolute inset-x-2 bottom-2 z-30 opacity-0 pointer-events-none transition-opacity duration-200 sm:group-hover:pointer-events-auto sm:group-hover:opacity-100 ' + (isActive ? 'pointer-events-auto opacity-100' : '')}
        onClick={(event) => event.stopPropagation()}
      >
        <BookGetButton
          book={book}
          buttonState={buttonState}
          onGetReleases={handleGetReleases}
          size="sm"
          className="w-full shadow-lg"
          fullWidth
        />
      </div>
    </article>
  );
}, (previous, next) =>
  previous.book === next.book &&
  previous.isAudiobook === next.isAudiobook &&
  previous.isTouchDevice === next.isTouchDevice &&
  previous.isActive === next.isActive &&
  sameButtonState(previous.buttonState, next.buttonState) &&
  previous.onActivate === next.onActivate &&
  previous.onSelect === next.onSelect &&
  previous.onGetReleases === next.onGetReleases,
);

export const DiscoveryShelf = memo(({
  shelfKey,
  title,
  books,
  isLoading,
  isTouchDevice,
  getButtonState,
  onBookSelect,
  onGetReleases,
}: DiscoveryShelfProps) => {
  const { t } = useLanguage();
  const railRef = useRef<HTMLDivElement>(null);
  const [activeCardId, setActiveCardId] = useState('');
  const getButtonStateLatest = useLatestCallback(getButtonState);
  const onBookSelectLatest = useLatestCallback(onBookSelect);
  const onGetReleasesLatest = useLatestCallback(onGetReleases);
  const isAudiobook = shelfKey.startsWith('audiobook');

  const scroll = useCallback((direction: -1 | 1) => {
    const rail = railRef.current;
    rail?.scrollBy({
      left: direction * Math.max(320, rail.clientWidth * 0.8),
      behavior: 'smooth',
    });
  }, []);

  const fullSelectionPath = shelfKey === 'ebook-trending'
    ? '/books#content_type=ebook&sort=trending'
    : shelfKey === 'ebook-popular'
      ? '/books#content_type=ebook'
      : shelfKey === 'audiobook-trending'
        ? '/audiobooks#content_type=audiobook'
        : '/audiobooks#content_type=audiobook&sort=popularity';

  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white sm:text-xl">{t(title)}</h2>
          <a
            href={withBasePath(fullSelectionPath)}
            aria-label={t('View full selection') + ' – ' + t(title)}
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
          {books.length > 0 && (
            <span className="hidden text-xs text-gray-500 dark:text-gray-400 sm:inline">{books.length} {t('titles')}</span>
          )}
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => scroll(-1)} aria-label={t('Previous') + ' ' + t(title)} className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-indigo-400 hover:text-indigo-500 dark:border-white/10 dark:text-gray-300">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" onClick={() => scroll(1)} aria-label={t('Next') + ' ' + t(title)} className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-indigo-400 hover:text-indigo-500 dark:border-white/10 dark:text-gray-300">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>
      </div>
      <div ref={railRef} className="shelfseerr-discovery-rail flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:gap-4">
        {isLoading && books.length === 0
          ? Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className={'shrink-0 animate-pulse ' + (isAudiobook ? 'w-[160px] sm:w-[220px]' : 'w-[132px] sm:w-[176px]')}
              >
                <div className="aspect-[2/3] rounded-xl bg-gray-200 dark:bg-slate-800" />
                <div className="mt-2 h-3 rounded bg-gray-200 dark:bg-slate-800" />
                <div className="mt-1 h-2.5 w-2/3 rounded bg-gray-100 dark:bg-slate-800/70" />
              </div>
            ))
          : books.map((book) => (
              <DiscoveryBookCard
                key={book.id}
                book={book}
                isAudiobook={isAudiobook}
                isTouchDevice={isTouchDevice}
                isActive={activeCardId === book.id}
                buttonState={getButtonStateLatest(book)}
                onActivate={setActiveCardId}
                onSelect={onBookSelectLatest}
                onGetReleases={onGetReleasesLatest}
              />
            ))}
      </div>
    </section>
  );
});
