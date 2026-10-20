import { useEffect, useRef } from 'react'
import type { Photo } from '@/content/types'
import { formatDate } from '@/lib/format'
import { ResponsiveImage } from './ResponsiveImage'
import { Icon } from './Icon'
import styles from './Lightbox.module.scss'

type Props = {
  photos: readonly Photo[]
  current: Photo
  onNavigate: (id: string) => void
  onClose: () => void
}

/**
 * Full-screen photo viewer on a native <dialog>, which brings focus
 * trapping, Esc and an inert page behind it for free. ← / → or a swipe move
 * between photos; clicking the backdrop closes.
 */
export function Lightbox({ photos, current, onNavigate, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const swipeStart = useRef<number | null>(null)

  const index = photos.findIndex((photo) => photo.id === current.id)
  const previous = index > 0 ? photos[index - 1] : undefined
  const next = index < photos.length - 1 ? photos[index + 1] : undefined

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    // showModal doesn't stop the page behind from scrolling.
    const html = document.documentElement
    const overflow = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = overflow
      dialog.close()
    }
  }, [])

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft' && previous) onNavigate(previous.id)
    if (event.key === 'ArrowRight' && next) onNavigate(next.id)
  }

  const exif = current.exif
  const exifParts = exif
    ? [exif.focalLength, exif.aperture, exif.shutter, exif.iso ? `ISO ${exif.iso}` : undefined].filter(
        Boolean,
      )
    : []

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label={current.title}
      onCancel={(event) => {
        // Esc: let the URL drive closing, so the router stays the source of truth.
        event.preventDefault()
        onClose()
      }}
      onKeyDown={onKeyDown}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className={styles.frame}>
        <div className={styles.top}>
          <span className={styles.counter}>
            {index + 1} / {photos.length}
          </span>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close" autoFocus>
            <Icon name="close" size={22} />
          </button>
        </div>

        <div
          className={styles.stage}
          onPointerDown={(event) => {
            swipeStart.current = event.clientX
          }}
          onPointerUp={(event) => {
            if (swipeStart.current === null) return
            const delta = event.clientX - swipeStart.current
            swipeStart.current = null
            if (delta > 50 && previous) onNavigate(previous.id)
            if (delta < -50 && next) onNavigate(next.id)
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <ResponsiveImage
            key={current.id}
            image={current.image}
            alt={current.title}
            sizes="100vw"
            className={styles.image}
            eager
          />
        </div>

        <button
          type="button"
          className={styles.prev}
          onClick={() => previous && onNavigate(previous.id)}
          disabled={!previous}
          aria-label="Previous photo"
        >
          <Icon name="arrowLeft" size={22} />
        </button>
        <button
          type="button"
          className={styles.next}
          onClick={() => next && onNavigate(next.id)}
          disabled={!next}
          aria-label="Next photo"
        >
          <Icon name="arrowRight" size={22} />
        </button>

        <div className={styles.info}>
          <div>
            <h2 className={styles.title}>{current.title}</h2>
            {current.caption ? <p className={styles.caption}>{current.caption}</p> : null}
          </div>
          <dl className={styles.exif}>
            {current.date ? (
              <div>
                <dt>Taken</dt>
                <dd>{formatDate(current.date)}</dd>
              </div>
            ) : null}
            {exif?.camera ? (
              <div>
                <dt>Camera</dt>
                <dd>{exif.camera}</dd>
              </div>
            ) : null}
            {exif?.lens ? (
              <div>
                <dt>Lens</dt>
                <dd>{exif.lens}</dd>
              </div>
            ) : null}
            {exifParts.length > 0 ? (
              <div>
                <dt>Settings</dt>
                <dd>{exifParts.join(' · ')}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </dialog>
  )
}
