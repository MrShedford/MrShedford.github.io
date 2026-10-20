import { useEffect, useId, useRef, useState } from 'react'
import type { TimelineEntry } from '@/content/types'
import { formatRange, toTimelineRows } from '@/lib/timeline'
import { useTimelineScroll } from '@/hooks/useTimelineScroll'
import { ResponsiveImage } from './ResponsiveImage'
import { DraftBadge, KindBadge } from './Badge'
import { Prose } from './Prose'
import { Icon } from './Icon'
import styles from './Timeline.module.scss'

type Props = {
  entries: TimelineEntry[]
  /** Reports the entry being read, so the page can show its year. */
  onActiveChange?: (entry: TimelineEntry | undefined) => void
}

export function Timeline({ entries, onActiveChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const active = useTimelineScroll(containerRef, [entries])

  useEffect(() => {
    onActiveChange?.(entries.find((entry) => entry.slug === active))
  }, [active, entries, onActiveChange])

  const rows = toTimelineRows(entries)

  return (
    <div ref={containerRef} className={styles.timeline}>
      <div className={styles.track} aria-hidden="true" />
      <div className={styles.progress} aria-hidden="true" />
      <ol className={styles.rows}>
        {rows.map((row) =>
          row.type === 'year' ? (
            <li key={`year-${row.year}`} className={styles.yearRow} data-reveal>
              <span className={styles.year}>{row.year}</span>
            </li>
          ) : (
            <EntryRow
              key={row.entry.slug}
              entry={row.entry}
              side={row.side}
              active={row.entry.slug === active}
            />
          ),
        )}
      </ol>
    </div>
  )
}

function EntryRow({
  entry,
  side,
  active,
}: {
  entry: TimelineEntry
  side: 'left' | 'right'
  active: boolean
}) {
  const [open, setOpen] = useState(false)
  const detailsId = useId()
  const hasDetails = Boolean(entry.html.trim() || entry.image || entry.link)

  return (
    <li
      className={styles.entryRow}
      data-side={side}
      data-kind={entry.kind}
      data-entry={entry.slug}
      data-active={active || undefined}
      data-reveal
    >
      <span className={styles.dot} aria-hidden="true" />
      <article className={styles.card}>
        <header className={styles.cardHeader}>
          <KindBadge kind={entry.kind} />
          <span className={styles.range}>{formatRange(entry)}</span>
          {entry.draft ? <DraftBadge /> : null}
        </header>
        <h3 className={styles.title}>{entry.title}</h3>
        {entry.org || entry.location ? (
          <p className={styles.org}>{[entry.org, entry.location].filter(Boolean).join(' · ')}</p>
        ) : null}
        {entry.summary ? <p className={styles.summary}>{entry.summary}</p> : null}

        {hasDetails ? (
          <>
            <button
              type="button"
              className={styles.toggle}
              aria-expanded={open}
              aria-controls={detailsId}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? 'Show less' : 'Read more'}
              <span className={open ? styles.chevronOpen : styles.chevron}>
                <Icon name="chevronDown" size={16} />
              </span>
            </button>
            <div id={detailsId} className={styles.details} hidden={!open}>
              {entry.image ? (
                <ResponsiveImage
                  image={entry.image}
                  alt=""
                  sizes="(min-width: 900px) 480px, 100vw"
                  className={styles.image}
                />
              ) : null}
              {entry.html.trim() ? <Prose html={entry.html} className={styles.prose} /> : null}
              {entry.link ? (
                <a href={entry.link} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  Visit <Icon name="external" size={14} />
                </a>
              ) : null}
            </div>
          </>
        ) : null}
      </article>
    </li>
  )
}
