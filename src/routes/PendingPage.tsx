import styles from './Page.module.scss'

/** Shown only if a route's data takes longer than 300ms (router defaultPendingMs). */
export function PendingPage() {
  return <div className={styles.spinner} role="status" aria-label="Loading" />
}
