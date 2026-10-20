import { Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { galleryQuery, portfolioQuery, ramblingsQuery, ravingsQuery, siteQuery } from '@/lib/queries'
import { formatRange } from '@/lib/timeline'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { Prose } from '@/components/Prose'
import { RamblingCard } from '@/components/RamblingCard'
import { RaveCard } from '@/components/RaveCard'
import { ResponsiveImage } from '@/components/ResponsiveImage'
import { KindBadge } from '@/components/Badge'
import { Icon } from '@/components/Icon'
import pageStyles from './Page.module.scss'
import styles from './HomePage.module.scss'

export function HomePage() {
  const { data: site } = useSuspenseQuery(siteQuery)
  const { data: ramblings } = useSuspenseQuery(ramblingsQuery)
  const { data: ravings } = useSuspenseQuery(ravingsQuery)
  const { data: timeline } = useSuspenseQuery(portfolioQuery)
  const { data: photos } = useSuspenseQuery(galleryQuery)
  useDocumentTitle()

  const sections = [
    {
      to: '/ramblings',
      label: 'Ramblings',
      blurb: 'Long-form posts about whatever won’t leave my head.',
      count: `${ramblings.length} ${ramblings.length === 1 ? 'post' : 'posts'}`,
      tone: 'terracotta',
    },
    {
      to: '/raving',
      label: 'Raving',
      blurb: 'Music, games, movies and TV, scored out of ten.',
      count: `${ravings.length} ${ravings.length === 1 ? 'review' : 'reviews'}`,
      tone: 'red',
    },
    {
      to: '/portfolio',
      label: 'Portfolio',
      blurb: 'An interactive timeline of the work I’m proud of.',
      count: `${timeline.length} milestones`,
      tone: 'forest',
    },
    {
      to: '/gallery',
      label: 'Gallery',
      blurb: 'Photography, mostly of light doing interesting things.',
      count: `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}`,
      tone: 'ochre',
    },
  ] as const

  return (
    <div className={pageStyles.container}>
      <section className={styles.hero}>
        <p className={styles.hello}>Hello, I’m</p>
        <h1 className={styles.name}>{site.name}</h1>
        <p className={styles.tagline}>{site.tagline}</p>
        {site.introHtml ? <Prose html={site.introHtml} className={styles.intro} /> : null}
      </section>

      <nav className={styles.sections} aria-label="Sections">
        {sections.map((section) => (
          <Link key={section.to} to={section.to} className={styles.section} data-tone={section.tone}>
            <span className={styles.sectionLabel}>
              {section.label}
              <Icon name="arrowRight" size={18} />
            </span>
            <span className={styles.sectionBlurb}>{section.blurb}</span>
            <span className={styles.sectionCount}>{section.count}</span>
          </Link>
        ))}
      </nav>

      {ramblings.length > 0 ? (
        <section className={styles.block}>
          <div className={pageStyles.sectionHeading}>
            <h2>Latest ramblings</h2>
            <Link to="/ramblings">
              All ramblings <Icon name="arrowRight" size={16} />
            </Link>
          </div>
          <ul className={styles.twoUp}>
            {ramblings.slice(0, 2).map((post) => (
              <li key={post.slug}>
                <RamblingCard post={post} layout="stack" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {ravings.length > 0 ? (
        <section className={styles.block}>
          <div className={pageStyles.sectionHeading}>
            <h2>Recent raves</h2>
            <Link to="/raving">
              All raves <Icon name="arrowRight" size={16} />
            </Link>
          </div>
          <ul className={styles.fourUp}>
            {ravings.slice(0, 4).map((rave) => (
              <li key={rave.slug}>
                <RaveCard rave={rave} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {timeline.length > 0 ? (
        <section className={styles.block}>
          <div className={pageStyles.sectionHeading}>
            <h2>Lately</h2>
            <Link to="/portfolio">
              Full timeline <Icon name="arrowRight" size={16} />
            </Link>
          </div>
          <ol className={styles.miniTimeline}>
            {timeline.slice(0, 3).map((entry) => (
              <li key={entry.slug} data-kind={entry.kind}>
                <span className={styles.miniDot} aria-hidden="true" />
                <div>
                  <p className={styles.miniMeta}>
                    <KindBadge kind={entry.kind} /> {formatRange(entry)}
                  </p>
                  <p className={styles.miniTitle}>
                    {entry.title}
                    {entry.org ? <span> · {entry.org}</span> : null}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {photos.length > 0 ? (
        <section className={styles.block}>
          <div className={pageStyles.sectionHeading}>
            <h2>From the gallery</h2>
            <Link to="/gallery">
              All photos <Icon name="arrowRight" size={16} />
            </Link>
          </div>
          <ul className={styles.strip}>
            {photos.slice(0, 4).map((photo) => (
              <li key={photo.id}>
                <Link to="/gallery" search={{ photo: photo.id }} className={styles.stripLink}>
                  <ResponsiveImage
                    image={photo.image}
                    alt={photo.title}
                    sizes="(min-width: 900px) 270px, 50vw"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
