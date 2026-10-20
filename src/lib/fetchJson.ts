/**
 * Fetches the static JSON the content pipeline writes to public/data.
 *
 * Everything is a plain GET of a file, so there's no auth or body handling.
 * A 404 gets its own error type, because "no post with that slug" should
 * render the not-found page rather than the something-broke one.
 */

export class NotFoundError extends Error {
  constructor(path: string) {
    super(`Not found: ${path}`)
    this.name = 'NotFoundError'
  }
}

export async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (response.status === 404) throw new NotFoundError(path)
  if (!response.ok) throw new Error(`Request failed (${response.status})`)
  // Vite's dev server (and `vite preview`) answer a missing file with the
  // SPA's index.html and a 200, so "not JSON" means "not there" too.
  if (!response.headers.get('content-type')?.includes('json')) throw new NotFoundError(path)
  return (await response.json()) as T
}
