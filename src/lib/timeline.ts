import type { TimelineEntry } from '../content/types.ts'
import { isTimelineKind, type TimelineKind } from '../content/taxonomy.ts'
import { formatMonth, yearOf } from './format.ts'

export type PortfolioSearch = {
  kind?: TimelineKind
}

export function parsePortfolioSearch(search: Record<string, unknown>): PortfolioSearch {
  return isTimelineKind(search.kind) ? { kind: search.kind } : {}
}

/** "Mar 2024 – Present", "Jan 2021 – Feb 2024", or just "Jun 2023". */
export function formatRange(entry: Pick<TimelineEntry, 'date' | 'endDate' | 'ongoing'>): string {
  const start = formatMonth(entry.date)
  if (entry.ongoing) return `${start} – Present`
  if (!entry.endDate) return start
  const end = formatMonth(entry.endDate)
  return end === start ? start : `${start} – ${end}`
}

export type TimelineRow<T> =
  | { type: 'year'; year: string }
  | { type: 'entry'; entry: T; side: 'left' | 'right' }

/**
 * Interleaves a year marker wherever the year changes, and alternates which
 * side of the spine each entry sits on (desktop only; mobile stacks them).
 * Entries are expected newest-first, as the pipeline writes them.
 */
export function toTimelineRows<T extends { date: string }>(entries: readonly T[]): TimelineRow<T>[] {
  const rows: TimelineRow<T>[] = []
  let year: string | undefined
  let index = 0
  for (const entry of entries) {
    const entryYear = yearOf(entry.date)
    if (entryYear !== year) {
      rows.push({ type: 'year', year: entryYear })
      year = entryYear
    }
    rows.push({ type: 'entry', entry, side: index % 2 === 0 ? 'left' : 'right' })
    index++
  }
  return rows
}
