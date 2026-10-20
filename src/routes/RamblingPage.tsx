import { getRouteApi, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ramblingQuery, ramblingsQuery } from '@/lib/queries'
import { formatDate } from '@/lib/format'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { ResponsiveImage } from '@/components/ResponsiveImage'
import { Prose } from '@/components/Prose'
import { PostNav } from '@/components/PostNav'
import { DraftBadge } from '@/components/Badge'
import { Icon } from '@/components/Icon'
import styles from '@/components/Article.module.scss'

const route = getRouteApi('/ramblings/$slug')

export function RamblingPage() {
  const { slug } = route.useParams()
  const { data: post } = useSuspenseQuery(ramblingQuery(slug))
  const { data: posts } = useSuspenseQuery(ramblingsQuery)
  useDocumentTitle(post.title, post.summary)

  return (
    <article className={styles.article}>
      <Link to="/ramblings" className={styles.back}>
        <Icon name="arrowLeft" size={16} /> All ramblings
      </Link>

      <header>
        <p className={styles.meta}>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{post.readingMinutes} min read</span>
          {post.draft ? <DraftBadge /> : null}
        </p>
        <h1 className={styles.title}>{post.title}</h1>
        {post.summary ? <p className={styles.summary}>{post.summary}</p> : null}
      </header>

      {post.cover ? (
        <div className={styles.cover}>
          <ResponsiveImage image={post.cover} alt="" sizes="(min-width: 900px) 880px, 100vw" eager />
        </div>
      ) : null}

      <Prose html={post.html} className={styles.body} />

      {post.tags.length > 0 ? (
        <ul className={styles.tags} aria-label="Tags">
          {post.tags.map((tag) => (
            <li key={tag}>#{tag}</li>
          ))}
        </ul>
      ) : null}

      <PostNav to="/ramblings/$slug" posts={posts} current={post.slug} />
    </article>
  )
}
