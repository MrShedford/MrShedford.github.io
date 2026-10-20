import { notFound } from '@tanstack/react-router'
import { queryOptions } from '@tanstack/react-query'
import type {
  Photo,
  Rambling,
  RamblingMeta,
  Raving,
  RavingMeta,
  Site,
  TimelineEntry,
} from '@/content/types'
import { fetchJson, NotFoundError } from '@/lib/fetchJson'

/**
 * One factory per JSON file. Route loaders call ensureQueryData with these
 * and components read the same keys with useSuspenseQuery, so whatever a
 * hover-prefetch already loaded renders instantly.
 *
 * Keys nest (['raving'] is the list, ['raving', slug] a post), so
 * invalidating ['raving'] after a content edit refreshes both.
 */

function dataUrl(file: string): string {
  return `${import.meta.env.BASE_URL}data/${file}?v=${import.meta.env.VITE_BUILD_ID}`
}

export const siteQuery = queryOptions({
  queryKey: ['site'],
  queryFn: () => fetchJson<Site>(dataUrl('site.json')),
})

export const ramblingsQuery = queryOptions({
  queryKey: ['ramblings'],
  queryFn: () => fetchJson<RamblingMeta[]>(dataUrl('ramblings.json')),
})

export const ramblingQuery = (slug: string) =>
  queryOptions({
    queryKey: ['ramblings', slug],
    queryFn: () => fetchJson<Rambling>(dataUrl(`ramblings/${encodeURIComponent(slug)}.json`)),
  })

export const ravingsQuery = queryOptions({
  queryKey: ['raving'],
  queryFn: () => fetchJson<RavingMeta[]>(dataUrl('raving.json')),
})

export const ravingQuery = (slug: string) =>
  queryOptions({
    queryKey: ['raving', slug],
    queryFn: () => fetchJson<Raving>(dataUrl(`raving/${encodeURIComponent(slug)}.json`)),
  })

export const portfolioQuery = queryOptions({
  queryKey: ['portfolio'],
  queryFn: () => fetchJson<TimelineEntry[]>(dataUrl('portfolio.json')),
})

export const galleryQuery = queryOptions({
  queryKey: ['gallery'],
  queryFn: () => fetchJson<Photo[]>(dataUrl('gallery.json')),
})

/** For loaders: a missing file becomes the router's not-found page. */
export function rethrowNotFound(error: unknown): never {
  if (error instanceof NotFoundError) throw notFound()
  throw error
}
