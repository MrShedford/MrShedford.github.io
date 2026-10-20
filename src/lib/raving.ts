import {
  isRavingCategory,
  RAVING_CATEGORIES,
  type RavingCategory,
} from '../content/taxonomy.ts'

export type RavingSearch = {
  category?: RavingCategory
}

/** Unknown or missing ?category= means "all", rather than an error page. */
export function parseRavingSearch(search: Record<string, unknown>): RavingSearch {
  return isRavingCategory(search.category) ? { category: search.category } : {}
}

export function filterByCategory<T extends { category: RavingCategory }>(
  items: readonly T[],
  category: RavingCategory | undefined,
): T[] {
  return category ? items.filter((item) => item.category === category) : [...items]
}

export function countByCategory(
  items: readonly { category: RavingCategory }[],
): Record<RavingCategory, number> {
  const counts = Object.fromEntries(RAVING_CATEGORIES.map((c) => [c, 0])) as Record<
    RavingCategory,
    number
  >
  for (const item of items) counts[item.category]++
  return counts
}

/** The words under the rave meter. */
export function raveLabel(rating: number): string {
  if (rating >= 10) return 'All-timer'
  if (rating >= 9) return 'Instant classic'
  if (rating >= 8) return 'Full rave'
  if (rating >= 7) return 'Strong recommend'
  if (rating >= 5) return 'Worth a look'
  if (rating >= 3) return 'Mixed feelings'
  return 'Not for me'
}
