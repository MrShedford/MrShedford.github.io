import { Link } from '@tanstack/react-router'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import styles from './Page.module.scss'

export function NotFoundPage() {
  useDocumentTitle('Not found')
  return (
    <div className={styles.centered}>
      <h1>Wandered off the path</h1>
      <p>There’s nothing at this address. It may have moved, or never existed.</p>
      <Link to="/" className={styles.button}>
        Back home
      </Link>
    </div>
  )
}
