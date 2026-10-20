import { raveLabel } from '@/lib/raving'
import styles from './RaveMeter.module.scss'

type Props = {
  rating: number
  size?: 'small' | 'large'
}

/**
 * Ten pips filled to the rating, in the category's colour (inherited from
 * the nearest data-category ancestor), with the verdict in words.
 */
export function RaveMeter({ rating, size = 'small' }: Props) {
  return (
    <div className={size === 'large' ? styles.large : styles.meter}>
      <div className={styles.pips} role="img" aria-label={`Rated ${rating} out of 10`}>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className={i < rating ? styles.pipOn : styles.pip} />
        ))}
      </div>
      <span className={styles.label}>
        <strong>{rating}/10</strong> · {raveLabel(rating)}
      </span>
    </div>
  )
}
