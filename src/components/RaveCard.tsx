import { Link } from '@tanstack/react-router'
import type { RavingMeta } from '@/content/types'
import { formatDate } from '@/lib/format'
import { ResponsiveImage } from './ResponsiveImage'
import { CategoryBadge, DraftBadge } from './Badge'
import { RaveMeter } from './RaveMeter'
import styles from './RaveCard.module.scss'

export function RaveCard({ rave }: { rave: RavingMeta }) {
  return (
    <article className={styles.card} data-category={rave.category}>
      <div className={styles.cover}>
        {rave.cover ? (
          <ResponsiveImage
            image={rave.cover}
            alt=""
            sizes="(min-width: 1100px) 260px, (min-width: 640px) 45vw, 100vw"
          />
        ) : (
          // No artwork: a block of the category colour with the subject's initial.
          <span className={styles.monogram} aria-hidden="true">
            {rave.subject.charAt(0)}
          </span>
        )}
        <div className={styles.badges}>
          <CategoryBadge category={rave.category} />
          {rave.draft ? <DraftBadge /> : null}
        </div>
      </div>
      <div className={styles.body}>
        <p className={styles.subject}>
          {rave.subject}
          {rave.creator ? <span> · {rave.creator}</span> : null}
          {rave.year ? <span> ({rave.year})</span> : null}
        </p>
        <h2 className={styles.title}>
          <Link to="/raving/$slug" params={{ slug: rave.slug }} className={styles.link}>
            {rave.title}
          </Link>
        </h2>
        <div className={styles.footer}>
          <RaveMeter rating={rave.rating} />
          <time dateTime={rave.date} className={styles.date}>
            {formatDate(rave.date)}
          </time>
        </div>
      </div>
    </article>
  )
}
