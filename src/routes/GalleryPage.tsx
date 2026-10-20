import { getRouteApi } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { galleryQuery } from '@/lib/queries'
import { tagsByUse } from '@/lib/gallery'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { PageHeader } from '@/components/PageHeader'
import { FilterChips, type ChipOption } from '@/components/FilterChips'
import { ResponsiveImage } from '@/components/ResponsiveImage'
import { Lightbox } from '@/components/Lightbox'
import pageStyles from './Page.module.scss'
import styles from './GalleryPage.module.scss'

const route = getRouteApi('/gallery')

export function GalleryPage() {
  const { data: photos } = useSuspenseQuery(galleryQuery)
  const { tag, photo: openId } = route.useSearch()
  const navigate = route.useNavigate()
  useDocumentTitle('Gallery', 'Photography.')

  const visible = tag ? photos.filter((photo) => photo.tags.includes(tag)) : photos
  const open = openId ? photos.find((photo) => photo.id === openId) : undefined
  // Step through the filtered set if the open photo is in it, else all of them
  // (e.g. someone followed a shared link to a photo outside the filter).
  const sequence = open && visible.includes(open) ? visible : photos

  const options: ChipOption<string>[] = [
    { value: undefined, label: 'All', count: photos.length },
    ...tagsByUse(photos).map((t) => ({ value: t, label: t })),
  ]

  return (
    <div className={pageStyles.container}>
      <PageHeader eyebrow="Photography" title="Gallery">
        Moments I stopped to look at properly.
      </PageHeader>

      {options.length > 2 ? (
        <div className={pageStyles.toolbar}>
          <FilterChips
            label="Filter by tag"
            options={options}
            selected={tag}
            onSelect={(value) =>
              navigate({ search: value ? { tag: value } : {}, replace: true, resetScroll: false })
            }
          />
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className={pageStyles.empty}>No photos yet.</p>
      ) : (
        <ul className={styles.masonry}>
          {visible.map((photo, i) => (
            <li key={photo.id} className={styles.item}>
              <button
                type="button"
                className={styles.tile}
                // Opening pushes a history entry, so Back on a phone closes the
                // photo instead of leaving the page.
                onClick={() =>
                  navigate({ search: (prev) => ({ ...prev, photo: photo.id }), resetScroll: false })
                }
              >
                <ResponsiveImage
                  image={photo.image}
                  alt={photo.title}
                  sizes="(min-width: 1100px) 360px, (min-width: 640px) 45vw, 100vw"
                  eager={i < 3}
                />
                <span className={styles.overlay}>
                  <span className={styles.tileTitle}>{photo.title}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <Lightbox
          photos={sequence}
          current={open}
          onNavigate={(id) =>
            navigate({ search: (prev) => ({ ...prev, photo: id }), replace: true, resetScroll: false })
          }
          onClose={() =>
            navigate({
              search: ({ photo, ...rest }) => rest,
              replace: true,
              resetScroll: false,
            })
          }
        />
      ) : null}
    </div>
  )
}
