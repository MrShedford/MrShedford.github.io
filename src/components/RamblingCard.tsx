import { Link } from '@tanstack/react-router'
import type { RamblingMeta } from '@/content/types'
import { formatDate } from '@/lib/format'
import { ResponsiveImage } from './ResponsiveImage'
import { DraftBadge } from './Badge'
import styles from './RamblingCard.module.scss'

type Props = {
  post: RamblingMeta
  /** "row" for the ramblings index, "stack" for grids like the home page. */
  layout?: 'row' | 'stack'
}

export function RamblingCard({ post, layout = 'row' }: Props) {
  return (
    <article className={layout === 'row' ? styles.row : styles.stack}>
      {post.cover ? (
        <div className={styles.cover}>
          <ResponsiveImage
            image={post.cover}
            alt=""
            sizes={layout === 'row' ? '(min-width: 900px) 280px, 100vw' : '(min-width: 900px) 360px, 100vw'}
          />
        </div>
      ) : null}
      <div className={styles.body}>
        <p className={styles.meta}>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span aria-hidden="true">·</span>
          <span>{post.readingMinutes} min read</span>
          {post.draft ? <DraftBadge /> : null}
        </p>
        <h2 className={styles.title}>
          {/* The whole card is clickable via the stretched ::after on this link. */}
          <Link to="/ramblings/$slug" params={{ slug: post.slug }} className={styles.link}>
            {post.title}
          </Link>
        </h2>
        {post.summary ? <p className={styles.summary}>{post.summary}</p> : null}
        {post.tags.length > 0 ? (
          <ul className={styles.tags} aria-label="Tags">
            {post.tags.map((tag) => (
              <li key={tag}>#{tag}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  )
}
