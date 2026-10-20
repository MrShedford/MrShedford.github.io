import { useEffect, useState, type RefObject } from 'react'

/**
 * Everything scroll-driven about the timeline, in one place:
 *
 * - `--progress` (0 to 1) on the container: how far the reader has got,
 *   measured at the middle of the viewport. The spine's fill scales by it.
 *   Written straight to the style, so scrolling never re-renders React.
 * - `data-visible` on each `[data-reveal]` row once it scrolls into view,
 *   which the CSS animates in. Set once and left, so nothing flickers back
 *   out when scrolling up.
 * - The id of the entry crossing the middle of the viewport, returned, so the
 *   page can highlight it and show its year.
 *
 * `deps` should change whenever the rendered rows do (e.g. a filter), so the
 * observers pick up the new elements.
 */
export function useTimelineScroll(
  containerRef: RefObject<HTMLElement | null>,
  deps: readonly unknown[],
): string | undefined {
  const [active, setActive] = useState<string>()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let frame = 0
    const update = () => {
      frame = 0
      const rect = container.getBoundingClientRect()
      const progress = (window.innerHeight / 2 - rect.top) / rect.height
      container.style.setProperty('--progress', String(Math.min(1, Math.max(0, progress))))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)

    const rows = container.querySelectorAll<HTMLElement>('[data-reveal]')
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          ;(entry.target as HTMLElement).dataset.visible = 'true'
          reveal.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
    )
    rows.forEach((row) => reveal.observe(row))
    // Only now opt in to the hidden-until-revealed styles, so if this effect
    // never runs, every entry is simply visible.
    container.dataset.revealReady = 'true'

    // A zero-height band across the middle of the viewport: whichever entry
    // is crossing it is the one being read.
    const entries = container.querySelectorAll<HTMLElement>('[data-entry]')
    const focus = new IntersectionObserver(
      (observed) => {
        for (const entry of observed) {
          if (entry.isIntersecting) setActive((entry.target as HTMLElement).dataset.entry)
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    entries.forEach((entry) => focus.observe(entry))
    setActive((current) => current ?? entries[0]?.dataset.entry)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      reveal.disconnect()
      focus.disconnect()
    }
  }, [containerRef, ...deps])

  return active
}
