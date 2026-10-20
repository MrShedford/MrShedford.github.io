export type GallerySearch = {
  tag?: string
  /** The photo open in the lightbox, so a single photo can be linked to. */
  photo?: string
}

export function parseGallerySearch(search: Record<string, unknown>): GallerySearch {
  const parsed: GallerySearch = {}
  if (typeof search.tag === 'string' && search.tag) parsed.tag = search.tag
  if (typeof search.photo === 'string' && search.photo) parsed.photo = search.photo
  return parsed
}

/** Every tag in use, most-used first, so the common ones lead the chip row. */
export function tagsByUse(photos: readonly { tags: readonly string[] }[]): string[] {
  const counts = new Map<string, number>()
  for (const photo of photos) {
    for (const tag of photo.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()]
    .toSorted((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag)
}
