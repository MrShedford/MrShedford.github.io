/**
 * The content pipeline: content/ (Markdown, YAML, full-size images) in,
 * public/data/*.json and public/img/*.webp out. The app never sees a
 * Markdown file; it fetches the JSON this writes, through TanStack Query.
 *
 * Runs from the Vite plugin in vite.config.ts (on dev start, on every content
 * change, and at the start of a build) and standalone via `npm run content`.
 */
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { parse as parseYaml } from 'yaml'
import type { z } from 'zod'
import {
  photoSchema,
  ramblingSchema,
  ravingSchema,
  siteSchema,
  timelineSchema,
} from '../src/content/schema.ts'
import type {
  Photo,
  Rambling,
  RamblingMeta,
  Raving,
  RavingMeta,
  Site,
  TimelineEntry,
} from '../src/content/types.ts'
import { ContentError } from './errors.ts'
import { createImageProcessor, type ImageProcessor } from './images.ts'
import { readingMinutes, renderMarkdown } from './markdown.ts'

export { ContentError }

export type BuildOptions = {
  /** Project root: the folder holding content/ and public/. */
  root: string
  /** URL prefix the site is served under. Must start and end with "/". */
  base: string
  /** Dev shows drafts (with a badge); production builds leave them out. */
  includeDrafts: boolean
}

export type BuildResult = {
  counts: Record<'ramblings' | 'raving' | 'portfolio' | 'gallery', number>
}

type Loaded<T> = { slug: string; file: string; data: T; body: string }

export async function buildContent(options: BuildOptions): Promise<BuildResult> {
  const { root, base, includeDrafts } = options
  const contentDir = path.join(root, 'content')
  const dataDir = path.join(root, 'public', 'data')
  const images = await createImageProcessor({
    uploadsDir: path.join(contentDir, 'uploads'),
    outDir: path.join(root, 'public', 'img'),
    base,
  })

  const problems: string[] = []
  const collect = <T>(promise: Promise<T>, fallback: T): Promise<T> =>
    promise.catch((error: unknown) => {
      if (error instanceof ContentError) {
        problems.push(error.message)
        return fallback
      }
      throw error
    })

  const relative = (file: string) => path.relative(root, file).replaceAll('\\', '/')
  const visible = <T extends { data: { draft: boolean } }>(items: T[]) =>
    includeDrafts ? items : items.filter((item) => !item.data.draft)

  const report = (message: string) => problems.push(message)
  const load = <S extends z.ZodType>(folder: string, schema: S) =>
    collect(loadCollection(path.join(contentDir, folder), schema, relative, report), [])

  const [ramblingFiles, ravingFiles, timelineFiles, photoFiles, siteFile] = await Promise.all([
    load('ramblings', ramblingSchema),
    load('raving', ravingSchema),
    load('portfolio', timelineSchema),
    load('gallery', photoSchema),
    collect(loadSite(path.join(contentDir, 'site.yml'), relative), undefined),
  ])

  const render = (item: Loaded<unknown>) =>
    renderMarkdown(item.body, (ref) => images.process(ref, relative(item.file)))
  const image = (ref: string | undefined, file: string) =>
    ref ? images.process(ref, relative(file)).then(({ exif, ...set }) => set) : undefined

  const ramblings = await Promise.all(
    visible(ramblingFiles).map((item) =>
      collect(
        (async (): Promise<Rambling> => {
          const { cover, ...data } = item.data
          return {
            ...data,
            slug: item.slug,
            cover: await image(cover, item.file),
            readingMinutes: readingMinutes(item.body),
            html: await render(item),
          }
        })(),
        undefined,
      ),
    ),
  )

  const ravings = await Promise.all(
    visible(ravingFiles).map((item) =>
      collect(
        (async (): Promise<Raving> => {
          const { cover, ...data } = item.data
          return {
            ...data,
            slug: item.slug,
            cover: await image(cover, item.file),
            readingMinutes: readingMinutes(item.body),
            html: await render(item),
          }
        })(),
        undefined,
      ),
    ),
  )

  const timeline = await Promise.all(
    visible(timelineFiles).map((item) =>
      collect(
        (async (): Promise<TimelineEntry> => {
          const { image: ref, ...data } = item.data
          return {
            ...data,
            slug: item.slug,
            image: await image(ref, item.file),
            html: await render(item),
          }
        })(),
        undefined,
      ),
    ),
  )

  const photos = await Promise.all(
    visible(photoFiles).map((item) =>
      collect(
        (async (): Promise<Photo> => {
          const { image: ref, ...data } = item.data
          const { exif, ...set } = await images.process(ref, relative(item.file))
          return {
            ...data,
            id: item.slug,
            // Fall back to the camera's own date when the entry has none.
            date: data.date ?? exif?.takenAt,
            image: set,
            exif,
          }
        })(),
        undefined,
      ),
    ),
  )

  const site = siteFile ? await collect(renderSite(siteFile, base, images, relative), undefined) : undefined

  if (problems.length > 0) {
    throw new ContentError(
      `Content has ${problems.length} problem${problems.length === 1 ? '' : 's'}:\n` +
        problems.map((problem) => `  • ${problem}`).join('\n'),
    )
  }

  const sortedRamblings = present(ramblings).toSorted(byDateDesc)
  const sortedRavings = present(ravings).toSorted(byDateDesc)
  const sortedTimeline = present(timeline).toSorted(byDateDesc)
  const sortedPhotos = present(photos).toSorted(byDateDesc)

  const written = new Set<string>()
  const write = async (relativePath: string, value: unknown) => {
    const file = path.join(dataDir, ...relativePath.split('/'))
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, JSON.stringify(value))
    written.add(file)
  }

  await Promise.all([
    write('site.json', site),
    write('ramblings.json', sortedRamblings.map(({ html, ...meta }): RamblingMeta => meta)),
    write('raving.json', sortedRavings.map(({ html, ...meta }): RavingMeta => meta)),
    write('portfolio.json', sortedTimeline),
    write('gallery.json', sortedPhotos),
    ...sortedRamblings.map((post) => write(`ramblings/${post.slug}.json`, post)),
    ...sortedRavings.map((post) => write(`raving/${post.slug}.json`, post)),
  ])

  // Overwrite-then-prune rather than wipe-then-write, so the dev server never
  // has a moment where a page it's about to fetch doesn't exist.
  await pruneExcept(dataDir, written)
  await images.finish()

  return {
    counts: {
      ramblings: sortedRamblings.length,
      raving: sortedRavings.length,
      portfolio: sortedTimeline.length,
      gallery: sortedPhotos.length,
    },
  }
}

function byDateDesc<T extends { date?: string | undefined }>(a: T, b: T): number {
  return (b.date ?? '').localeCompare(a.date ?? '')
}

function present<T>(items: Array<T | undefined>): T[] {
  return items.filter((item): item is T => item !== undefined)
}

/**
 * Every .md (frontmatter + body) or .yml (fields only) file in a folder,
 * validated. A bad file is reported and skipped rather than thrown, so one
 * build lists every broken file instead of the first per folder.
 */
async function loadCollection<S extends z.ZodType>(
  dir: string,
  schema: S,
  relative: (file: string) => string,
  report: (message: string) => void,
): Promise<Array<Loaded<z.output<S>>>> {
  const files = await listFiles(dir, ['.md', '.yml', '.yaml'])
  const loaded = await Promise.all(
    files.map(async (file) => {
      try {
        const { data, body } = parseFile(await readFile(file, 'utf8'), file, relative(file))
        return { slug: slugFor(file), file, data: validate(schema, data, relative(file)), body }
      } catch (error) {
        if (!(error instanceof ContentError)) throw error
        report(error.message)
        return undefined
      }
    }),
  )
  return assertUniqueSlugs(relative)(present(loaded))
}

async function loadSite(file: string, relative: (file: string) => string) {
  if (!existsSync(file)) throw new ContentError(`${relative(file)} is missing`)
  const { data } = parseFile(await readFile(file, 'utf8'), file, relative(file))
  return { file, data: validate(siteSchema, data, relative(file)) }
}

/** Malformed YAML is a content mistake too, so it gets the same file-named message. */
function parseFile(text: string, file: string, name: string): { data: unknown; body: string } {
  try {
    if (path.extname(file) === '.md') {
      const { data, content } = matter(text)
      return { data, body: content }
    }
    return { data: parseYaml(text), body: '' }
  } catch (error) {
    throw new ContentError(`${name}: invalid YAML: ${error instanceof Error ? error.message.split('\n')[0] : error}`)
  }
}

async function renderSite(
  site: { file: string; data: z.output<typeof siteSchema> },
  base: string,
  images: ImageProcessor,
  relative: (file: string) => string,
): Promise<Site> {
  const { intro, portfolioPdf, ...data } = site.data
  return {
    ...data,
    // The CMS stores the PDF as a root-relative path (/files/x.pdf); re-root
    // it under the base so it works on a project-repo Pages URL too.
    portfolioPdf: portfolioPdf?.startsWith('/') ? base + portfolioPdf.slice(1) : portfolioPdf,
    introHtml: intro
      ? await renderMarkdown(intro, (ref) => images.process(ref, relative(site.file)))
      : undefined,
  }
}

function validate<S extends z.ZodType>(schema: S, data: unknown, file: string): z.output<S> {
  const result = schema.safeParse(data)
  if (result.success) return result.data
  const issues = result.error.issues.map((issue) =>
    issue.path.length > 0 ? `"${issue.path.join('.')}": ${issue.message}` : issue.message,
  )
  throw new ContentError(`${file}: ${issues.join('; ')}`)
}

/** The filename is the URL slug. The CMS already writes them lowercased and hyphenated. */
export function slugFor(file: string): string {
  return path
    .basename(file, path.extname(file))
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function assertUniqueSlugs(relative: (file: string) => string) {
  return <T extends { slug: string; file: string }>(items: T[]): T[] => {
    const seen = new Map<string, string>()
    for (const item of items) {
      const other = seen.get(item.slug)
      if (other) {
        throw new ContentError(
          `${relative(item.file)} and ${relative(other)} would both be at /${item.slug}; rename one`,
        )
      }
      seen.set(item.slug, item.file)
    }
    return items
  }
}

async function listFiles(dir: string, extensions: string[]): Promise<string[]> {
  if (!existsSync(dir)) return []
  const entries = await readdir(dir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && extensions.includes(path.extname(entry.name).toLowerCase()))
    .map((entry) => path.join(dir, entry.name))
}

async function pruneExcept(dir: string, keep: Set<string>): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true })
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && !keep.has(path.join(entry.parentPath, entry.name)))
      .map((entry) => rm(path.join(entry.parentPath, entry.name), { force: true })),
  )
}
