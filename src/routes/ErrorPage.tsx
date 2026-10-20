import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import styles from './Page.module.scss'

export function ErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  useDocumentTitle('Something went wrong')
  return (
    <div className={styles.centered} role="alert">
      <h1>Something went sideways</h1>
      <p>{error instanceof Error ? error.message : 'An unexpected error occurred.'}</p>
      <button
        type="button"
        className={styles.button}
        onClick={() => {
          reset()
          void router.invalidate()
        }}
      >
        Try again
      </button>
    </div>
  )
}
