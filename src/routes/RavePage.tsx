import { getRouteApi, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { CATEGORY_LABELS } from '@/content/taxonomy'
import { ravingQuery, ravingsQuery } from '@/lib/queries'
import { formatDate } from '@/lib/format'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ResponsiveImage } from '@/components/ResponsiveImage'
import { Prose } from '@/components/Prose'
import { PostNav } from '@/components/PostNav'
import { CategoryBadge, DraftBadge } from '@/components/Badge'
import { RaveMeter } from '@/components/RaveMeter'
import { Icon } from '@/components/Icon'
import styles from '@/components/Article.module.scss'

const route = getRouteApi('/raving/$slug')

export function RavePage() {
  const { slug } = route.useParams()
  const { data: rave } = useSuspenseQuery(ravingQuery(slug))
  const { data: ravings } = useSuspenseQuery(ravingsQuery)
  useDocumentTitle(rave.title, rave.summary)

  return (
    <article className={styles.article} data-category={rave.category}>
      <Link to="/raving" search={{ category: rave.category }} className={styles.back}>
        <Icon name="arrowLeft" size={16} /> All {CATEGORY_LABELS[rave.category].toLowerCase()} raves
      </Link>

      <header>
        <p className={styles.meta}>
          <CategoryBadge category={rave.category} />
          <time dateTime={rave.date}>{formatDate(rave.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{rave.readingMinutes} min read</span>
          {rave.draft ? <DraftBadge /> : null}
        </p>
        <h1 className={styles.title}>{rave.title}</h1>
        {rave.summary ? <p className={styles.summary}>{rave.summary}</p> : null}
      </header>

      <section className={styles.verdict} aria-label="Verdict">
        <p className={styles.verdictScore}>
          {rave.rating}
          <small>/10</small>
        </p>
        <div className={styles.verdictDetails}>
          <p className={styles.verdictSubject}>
            {rave.subject}{' '}
            {rave.creator || rave.year ? (
              <span>
                {[rave.creator, rave.year].filter(Boolean).join(', ')}
              </span>
            ) : null}
          </p>
          <RaveMeter rating={rave.rating} size="large" />
        </div>
      </section>

      {rave.cover ? (
        <div className={styles.cover}>
          <ResponsiveImage image={rave.cover} alt={rave.subject} sizes="(min-width: 900px) 880px, 100vw" />
        </div>
      ) : null}

      <Prose html={rave.html} className={styles.body} />

      {rave.tags.length > 0 ? (
        <ul className={styles.tags} aria-label="Tags">
          {rave.tags.map((tag) => (
            <li key={tag}>#{tag}</li>
          ))}
        </ul>
      ) : null}

      <PostNav to="/raving/$slug" posts={ravings} current={rave.slug} />
    </article>
  )
}
