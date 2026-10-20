import { Link } from '@tanstack/react-router'
import { Icon } from './Icon'
import styles from './Article.module.scss'

type Neighbour = { slug: string; title: string }

type Props = {
  to: '/ramblings/$slug' | '/raving/$slug'
  /** The list, newest first, as the index pages show it. */
  posts: readonly Neighbour[]
  current: string
}

/** "Older" / "Newer" links at the foot of a post. */
export function PostNav({ to, posts, current }: Props) {
  const index = posts.findIndex((post) => post.slug === current)
  if (index === -1) return null
  const newer = posts[index - 1]
  const older = posts[index + 1]
  if (!newer && !older) return null

  return (
    <nav className={styles.postNav} aria-label="More posts">
      {older ? (
        <Link to={to} params={{ slug: older.slug }} className={styles.postNavLink}>
          <span className={styles.postNavLabel}>
            <Icon name="arrowLeft" size={14} /> Older
          </span>
          {older.title}
        </Link>
      ) : (
        <span />
      )}
      {newer ? (
        <Link to={to} params={{ slug: newer.slug }} className={styles.postNavLinkNext}>
          <span className={styles.postNavLabel}>
            Newer <Icon name="arrowRight" size={14} />
          </span>
          {newer.title}
        </Link>
      ) : null}
    </nav>
  )
}
