import { useSuspenseQuery } from '@tanstack/react-query'
import { ramblingsQuery } from '@/lib/queries'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { PageHeader } from '@/components/PageHeader'
import { RamblingCard } from '@/components/RamblingCard'
import styles from './Page.module.scss'

export function RamblingsPage() {
  const { data: posts } = useSuspenseQuery(ramblingsQuery)
  useDocumentTitle('Ramblings', 'Long-form posts about whatever is on my mind.')

  return (
    <div className={styles.container}>
      <PageHeader eyebrow="The blog" title="Ramblings">
        Long-form posts about whatever won't leave my head. No particular topic, no particular
        schedule.
      </PageHeader>

      {posts.length === 0 ? (
        <p className={styles.empty}>Nothing here yet. The first rambling is brewing.</p>
      ) : (
        <ol className={styles.list}>
          {posts.map((post) => (
            <li key={post.slug}>
              <RamblingCard post={post} />
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
