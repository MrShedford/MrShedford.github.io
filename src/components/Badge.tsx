import { CATEGORY_LABELS, KIND_LABELS, type RavingCategory, type TimelineKind } from '@/content/taxonomy'
import styles from './Badge.module.scss'

export function CategoryBadge({ category }: { category: RavingCategory }) {
  return (
    <span className={styles.category} data-category={category}>
      {CATEGORY_LABELS[category]}
    </span>
  )
}

export function KindBadge({ kind }: { kind: TimelineKind }) {
  return (
    <span className={styles.kind} data-kind={kind}>
      {KIND_LABELS[kind]}
    </span>
  )
}

/** Only ever seen in `npm run dev`: production builds leave drafts out. */
export function DraftBadge() {
  return <span className={styles.draft}>Draft</span>
}
