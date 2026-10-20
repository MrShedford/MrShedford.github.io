import type { ReactNode } from 'react'
import styles from './PageHeader.module.scss'

type Props = {
  eyebrow?: string
  title: string
  children?: ReactNode
}

export function PageHeader({ eyebrow, title, children }: Props) {
  return (
    <header className={styles.header}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      <h1 className={styles.title}>{title}</h1>
      {children ? <div className={styles.intro}>{children}</div> : null}
    </header>
  )
}
