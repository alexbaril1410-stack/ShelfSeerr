import { useLanguage } from '../../contexts/LanguageContext';
import type { ContentType, LibraryOwnership } from '../../types';

/** True when the selected content type is held in the library. */
export function isInLibrary(
  library?: LibraryOwnership | null,
  contentType: ContentType = 'ebook',
): boolean {
  if (!library) return false;
  const holding = library[contentType];
  return holding === 'owned' || holding === 'collection';
}

/** True when the selected content type is held only inside a larger volume. */
export function isCollectionOnly(
  library?: LibraryOwnership | null,
  contentType: ContentType = 'ebook',
): boolean {
  return library?.[contentType] === 'collection';
}

interface LibraryBadgeProps {
  library?: LibraryOwnership | null;
  contentType?: ContentType;
  /** Solid pill for use over cover art; otherwise a tinted inline pill. */
  overlay?: boolean;
  className?: string;
}

/** "Already in your library" badge. Renders nothing when this format is not held. */
export function LibraryBadge({
  library,
  contentType = 'ebook',
  overlay = false,
  className = '',
}: LibraryBadgeProps) {
  const { t } = useLanguage();
  if (!isInLibrary(library, contentType)) return null;

  const collectionOnly = isCollectionOnly(library, contentType);
  const label = collectionOnly ? 'In your library, inside a collection' : 'Already in your library';
  const text = collectionOnly ? 'In a collection' : 'In library';

  const pill = overlay
    ? 'rounded-md border border-sky-700 bg-sky-600 px-1.5 py-0.5 text-[10px] font-bold text-white'
    : 'rounded-md bg-sky-600/15 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-300';
  const style = overlay
    ? { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)' }
    : undefined;

  return (
    <span
      className={`flex w-fit items-center gap-0.5 ${pill} ${className}`}
      style={style}
      title={t(label)}
      aria-label={t(label)}
    >
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      {t(text)}
    </span>
  );
}
