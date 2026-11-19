import { afterEach, describe, expect, it, vi } from 'vitest';

import { clearMetadataSearchCache, searchMetadata } from '../services/api';

describe('metadata search cache', () => {
  afterEach(() => {
    clearMetadataSearchCache();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const response = (title: string) => ({
    books: [{
      id: title,
      title,
      author: 'Test author',
      provider: 'hardcover',
      provider_id: title,
    }],
    provider: 'hardcover',
    query: 'test',
    page: 1,
    total_found: 1,
    has_more: false,
  });

  it('reuses a successful result for identical search parameters', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => response('Cached book'),
    });
    vi.stubGlobal('fetch', fetchMock);

    const first = await searchMetadata('test', 40, 'popularity', {}, 1, 'ebook', 'hardcover');
    const second = await searchMetadata('test', 40, 'popularity', {}, 1, 'ebook', 'hardcover');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it('keeps provider, content type and page results separate', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => response('Hardcover book') })
      .mockResolvedValueOnce({ ok: true, json: async () => response('Audible book') })
      .mockResolvedValueOnce({ ok: true, json: async () => response('Audio book') })
      .mockResolvedValueOnce({ ok: true, json: async () => response('Second page') });
    vi.stubGlobal('fetch', fetchMock);

    await searchMetadata('test', 40, 'popularity', {}, 1, 'ebook', 'hardcover');
    await searchMetadata('test', 40, 'popularity', {}, 1, 'ebook', 'audible');
    await searchMetadata('test', 40, 'popularity', {}, 1, 'audiobook', 'audible');
    await searchMetadata('test', 40, 'popularity', {}, 2, 'ebook', 'hardcover');

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('does not cache aborted requests', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn().mockRejectedValue(
      new DOMException('Aborted', 'AbortError'),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      searchMetadata('test', 40, 'popularity', {}, 1, 'ebook', 'hardcover', {
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(() => controller.abort()).not.toThrow();
  });

  it('does not cache empty search results', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ books: [], provider: 'hardcover', query: 'test' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await searchMetadata('test', 40, 'popularity', {}, 1, 'ebook', 'hardcover');
    await searchMetadata('test', 40, 'popularity', {}, 1, 'ebook', 'hardcover');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
