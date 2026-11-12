import { describe, it, expect } from 'vitest';

import type { Book, Release } from '../types';
import { buildReleaseDownloadPayload } from '../utils/releasePayload';

const book: Book = {
  id: 'hc-1',
  title: 'Drive',
  author: 'James S. A. Corey',
  year: '2012',
  preview: 'https://img/drive.jpg',
  series_name: 'The Expanse',
  series_position: 2.6,
  subtitle: 'An Expanse Short Story',
  provider: 'hardcover',
  provider_id: 'hc-1',
  source: 'direct_download',
};

const release: Release = {
  source: 'audiobookbay',
  source_id: 'abb-1',
  title: 'James S. A. Corey - The Expanse Complete 2.0',
  format: 'm4b',
  language: 'en',
  download_url: 'https://audiobookbay.lu/abss/expanse/',
};

describe('buildReleaseDownloadPayload', () => {
  it('describes the searched book and the chosen release', () => {
    const payload = buildReleaseDownloadPayload(book, release, 'audiobook');
    expect(payload).toMatchObject({
      source: 'audiobookbay',
      source_id: 'abb-1',
      title: 'Drive',
      author: 'James S. A. Corey',
      series_name: 'The Expanse',
      series_position: 2.6,
      language: 'en',
      content_type: 'audiobook',
    });
    expect(payload.multi_book).toBeUndefined();
    expect(payload.book_plan).toBeUndefined();
  });

  it('forwards Audible metadata needed by audiobook post-processing', () => {
    const audibleBook: Book = {
      ...book,
      provider: 'audible',
      provider_id: 'B0ASIN1234',
      description: 'Description du livre',
      publisher: 'Éditeur audio',
      genres: ['Thriller'],
      isbn_10: '1234567890',
      isbn_13: '9781234567890',
      language: 'fr',
      authors: ['Maxime Chattam'],
      narrators: [' comédien '],
    };
    const payload = buildReleaseDownloadPayload(audibleBook, release, 'audiobook');
    expect(payload).toMatchObject({
      metadata_provider: 'audible',
      metadata_provider_id: 'B0ASIN1234',
      metadata_description: 'Description du livre',
      metadata_publisher: 'Éditeur audio',
      metadata_genres: ['Thriller'],
      metadata_isbn_10: '1234567890',
      metadata_isbn_13: '9781234567890',
      metadata_language: 'fr',
      metadata_authors: ['Maxime Chattam'],
      metadata_narrators: [' comédien '],
    });
  });

  it('uses the release title and author for manual books', () => {
    const manual: Book = { ...book, provider: 'manual', title: 'ignored' };
    const withAuthor = { ...release, extra: { author: 'Release Author' } };
    const payload = buildReleaseDownloadPayload(manual, withAuthor, 'audiobook');
    expect(payload.title).toBe(release.title);
    expect(payload.author).toBe('Release Author');
  });

  it('flags a manual multi-book pack', () => {
    const payload = buildReleaseDownloadPayload(book, release, 'audiobook', { multiBook: true });
    expect(payload.multi_book).toBe(true);
    expect(payload.book_plan).toBeUndefined();
  });

  it('attaches the approved book plan', () => {
    const plan = [{ title: 'Leviathan Wakes', series_position: 1, year: 2011, files: ['a.m4b'] }];
    const payload = buildReleaseDownloadPayload(book, release, 'audiobook', {
      multiBook: true,
      bookPlan: plan,
    });
    expect(payload.multi_book).toBe(true);
    expect(payload.book_plan).toEqual(plan);
  });
});
