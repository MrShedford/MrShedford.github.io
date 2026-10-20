/**
 * The JSON shapes the pipeline writes to public/data and the app fetches.
 * Derived from the frontmatter schemas, with image paths swapped for
 * processed image sets and Markdown swapped for HTML.
 */
import type { z } from 'zod'
import type {
  photoSchema,
  ramblingSchema,
  ravingSchema,
  siteSchema,
  timelineSchema,
} from './schema.ts'

/** A processed image: responsive WebP sizes plus what's needed to avoid layout shift. */
export type ImageSet = {
  src: string
  srcset: string
  width: number
  height: number
  /** Tiny blurred WebP as a data: URI, shown while the real image loads. */
  placeholder: string
}

export type Exif = {
  camera?: string
  lens?: string
  focalLength?: string
  aperture?: string
  shutter?: string
  iso?: number
  takenAt?: string
}

type WithImage<T, K extends keyof T> = Omit<T, K> & { [P in K]?: ImageSet }

export type RamblingMeta = WithImage<z.output<typeof ramblingSchema>, 'cover'> & {
  slug: string
  readingMinutes: number
}
export type Rambling = RamblingMeta & { html: string }

export type RavingMeta = WithImage<z.output<typeof ravingSchema>, 'cover'> & {
  slug: string
  readingMinutes: number
}
export type Raving = RavingMeta & { html: string }

export type TimelineEntry = WithImage<z.output<typeof timelineSchema>, 'image'> & {
  slug: string
  html: string
}

export type Photo = Omit<z.output<typeof photoSchema>, 'image'> & {
  id: string
  image: ImageSet
  exif?: Exif
}

export type Site = Omit<z.output<typeof siteSchema>, 'intro'> & {
  introHtml?: string
}
