import { getRouteApi } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { CATEGORY_LABELS, CATEGORY_NOUNS, RAVING_CATEGORIES, type RavingCategory } from '@/content/taxonomy'
import { ravingsQuery } from '@/lib/queries'
import { countByCategory, filterByCategory } from '@/lib/raving'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { PageHeader } from '@/components/PageHeader'
import { FilterChips, type ChipOption } from '@/components/FilterChips'
import { RaveCard } from '@/components/RaveCard'
import styles from './Page.module.scss'

const route = getRouteApi('/raving')

export function RavingPage() {
  const { data: ravings } = useSuspenseQuery(ravingsQuery)
  const { category } = route.useSearch()
  const navigate = route.useNavigate()
  useDocumentTitle(
    category ? `Raving: ${CATEGORY_LABELS[category]}` : 'Raving',
    'Reviews of music, video games, movies and TV.',
  )

  const counts = countByCategory(ravings)
  const visible = filterByCategory(ravings, category)
  const options: ChipOption<RavingCategory>[] = [
    { value: undefined, label: 'All', count: ravings.length },
    ...RAVING_CATEGORIES.map((c) => ({
      value: c,
      label: CATEGORY_LABELS[c],
      count: counts[c],
      accent: { category: c },
    })),
  ]

  return (
    <div className={styles.container}>
      <PageHeader eyebrow="Reviews" title="Raving">
        How great I think something is, out of ten. Music, video games, movies and TV.
      </PageHeader>

      <div className={styles.toolbar}>
        <FilterChips
          label="Filter by category"
          options={options}
          selected={category}
          // The filter lives in the URL (?category=music), so a filtered
          // view can be shared or bookmarked. replace: chip clicks shouldn't
          // pile up in the back button.
          onSelect={(value) =>
            navigate({ search: value ? { category: value } : {}, replace: true, resetScroll: false })
          }
        />
        <p className={styles.resultCount} aria-live="polite">
          {visible.length} {visible.length === 1 ? 'rave' : 'raves'}
        </p>
      </div>

      {visible.length === 0 ? (
        <p className={styles.empty}>
          No {category ? `${CATEGORY_NOUNS[category]} ` : ''}raves yet.
        </p>
      ) : (
        <ul className={styles.grid}>
          {visible.map((rave) => (
            <li key={rave.slug}>
              <RaveCard rave={rave} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
