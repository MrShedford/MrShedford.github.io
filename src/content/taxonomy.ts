/**
 * The fixed vocabularies the site filters on. Shared by the zod schemas
 * (build time), the CMS config (by hand, keep in sync) and the UI.
 *
 * Relative imports with .ts extensions only in src/content and the few
 * src/lib modules the content pipeline uses: Node runs that code directly,
 * and Node knows nothing about Vite's @/ alias.
 */

export const RAVING_CATEGORIES = ['music', 'video-games', 'movies', 'tv'] as const
export type RavingCategory = (typeof RAVING_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<RavingCategory, string> = {
  music: 'Music',
  'video-games': 'Video Games',
  movies: 'Movies',
  tv: 'TV',
}

export const TIMELINE_KINDS = ['job', 'project', 'education', 'award'] as const
export type TimelineKind = (typeof TIMELINE_KINDS)[number]

export const KIND_LABELS: Record<TimelineKind, string> = {
  job: 'Work',
  project: 'Project',
  education: 'Education',
  award: 'Award',
}

export function isRavingCategory(value: unknown): value is RavingCategory {
  return (RAVING_CATEGORIES as readonly unknown[]).includes(value)
}

export function isTimelineKind(value: unknown): value is TimelineKind {
  return (TIMELINE_KINDS as readonly unknown[]).includes(value)
}
