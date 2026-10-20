/**
 * Frontmatter schemas for everything under content/. The pipeline validates
 * every file against these, so a typo in a post fails the build with the file
 * and field named, instead of shipping a page that renders "undefined".
 *
 * The app only ever does `import type` from here, so zod stays out of the
 * browser bundle.
 */
import { z } from 'zod'
import { RAVING_CATEGORIES, TIMELINE_KINDS } from './taxonomy.ts'

/**
 * The CMS writes empty optional fields as '' or null rather than leaving them
 * out. Treat both as absent.
 */
function optional<T extends z.ZodType>(schema: T) {
  return z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    schema.optional(),
  )
}

/**
 * YAML turns an unquoted 2024-05-01 into a Date, while the CMS writes a
 * string. Normalise both to a plain YYYY-MM-DD so sorting and display never
 * meet a timezone.
 */
const isoDate = z.union([z.date(), z.string()]).transform((value, ctx) => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    ctx.addIssue({ code: 'custom', message: `"${String(value)}" is not a date` })
    return z.NEVER
  }
  return date.toISOString().slice(0, 10)
})

const tags = z.preprocess(
  (value) => (value === null || value === undefined ? [] : value),
  z.array(z.string().min(1)),
)

const draft = z.boolean().default(false)

export const ramblingSchema = z.object({
  title: z.string().min(1),
  date: isoDate,
  summary: optional(z.string()),
  tags,
  cover: optional(z.string()),
  draft,
})

export const ravingSchema = z.object({
  title: z.string().min(1),
  date: isoDate,
  category: z.enum(RAVING_CATEGORIES),
  /** The album / game / film / show being raved about. */
  subject: z.string().min(1),
  /** Artist, studio, director, network: whoever made it. */
  creator: optional(z.string()),
  year: optional(z.number().int()),
  rating: z.number().int().min(1).max(10),
  summary: optional(z.string()),
  tags,
  cover: optional(z.string()),
  draft,
})

export const timelineSchema = z.object({
  title: z.string().min(1),
  date: isoDate,
  endDate: optional(isoDate),
  /** Still going. Shows "Present" instead of an end date. */
  ongoing: z.boolean().default(false),
  kind: z.enum(TIMELINE_KINDS),
  org: optional(z.string()),
  location: optional(z.string()),
  link: optional(z.url()),
  summary: optional(z.string()),
  image: optional(z.string()),
  draft,
})

export const photoSchema = z.object({
  image: z.string().min(1),
  title: z.string().min(1),
  caption: optional(z.string()),
  date: optional(isoDate),
  tags,
  draft,
})

export const siteSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  intro: optional(z.string()),
  portfolioPdf: optional(z.string()),
  socials: z.preprocess(
    (value) => value ?? [],
    z.array(z.object({ label: z.string().min(1), url: z.url() })),
  ),
})
