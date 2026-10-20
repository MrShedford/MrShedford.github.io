import { useMemo, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { KIND_LABELS, TIMELINE_KINDS, type TimelineKind } from '@/content/taxonomy'
import type { TimelineEntry } from '@/content/types'
import { portfolioQuery, siteQuery } from '@/lib/queries'
import { yearOf } from '@/lib/format'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { PageHeader } from '@/components/PageHeader'
import { FilterChips, type ChipOption } from '@/components/FilterChips'
import { Timeline } from '@/components/Timeline'
import { Icon } from '@/components/Icon'
import pageStyles from './Page.module.scss'
import styles from './PortfolioPage.module.scss'

const route = getRouteApi('/portfolio')

export function PortfolioPage() {
  const { data: entries } = useSuspenseQuery(portfolioQuery)
  const { data: site } = useSuspenseQuery(siteQuery)
  const { kind } = route.useSearch()
  const navigate = route.useNavigate()
  const [activeEntry, setActiveEntry] = useState<TimelineEntry>()
  useDocumentTitle('Portfolio', 'A timeline of the work, projects and milestones I’m proud of.')

  const visible = useMemo(
    () => (kind ? entries.filter((entry) => entry.kind === kind) : entries),
    [entries, kind],
  )

  const options: ChipOption<TimelineKind>[] = [
    { value: undefined, label: 'Everything', count: entries.length },
    ...TIMELINE_KINDS.filter((k) => entries.some((entry) => entry.kind === k)).map((k) => ({
      value: k,
      label: KIND_LABELS[k],
      count: entries.filter((entry) => entry.kind === k).length,
      accent: { kind: k },
    })),
  ]

  const span = entries.length > 0 ? spanOf(entries) : undefined

  return (
    <div className={pageStyles.container}>
      <PageHeader eyebrow="Portfolio" title="The story so far">
        Scroll through the jobs, projects and milestones that got me here. Open any entry for the
        details.
        {span ? (
          <span className={styles.span}>
            {span.from}–{span.to}
          </span>
        ) : null}
      </PageHeader>

      {/* Sticks under the site header: filters, the year being read, and the PDF. */}
      <div className={styles.bar}>
        <FilterChips
          label="Filter the timeline"
          options={options}
          selected={kind}
          onSelect={(value) =>
            navigate({ search: value ? { kind: value } : {}, replace: true, resetScroll: false })
          }
        />
        <div className={styles.barEnd}>
          {activeEntry ? (
            <span className={styles.now} aria-hidden="true" key={yearOf(activeEntry.date)}>
              {yearOf(activeEntry.date)}
            </span>
          ) : null}
          {site.portfolioPdf ? (
            <a href={site.portfolioPdf} className={pageStyles.button} download>
              <Icon name="download" size={16} />
              <span>
                PDF<span className={styles.pdfLong}> version</span>
              </span>
            </a>
          ) : null}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className={pageStyles.empty}>Nothing on the timeline yet.</p>
      ) : (
        <Timeline entries={visible} onActiveChange={setActiveEntry} />
      )}
    </div>
  )
}

function spanOf(entries: readonly TimelineEntry[]) {
  const years = entries.flatMap((entry) => [
    Number(yearOf(entry.date)),
    entry.ongoing ? new Date().getFullYear() : Number(yearOf(entry.endDate ?? entry.date)),
  ])
  return { from: Math.min(...years), to: Math.max(...years) }
}
