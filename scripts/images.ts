/**
 * Turns the full-size images under content/uploads into responsive WebP sets
 * in public/img.
 *
 * Output names carry a hash of the source bytes, and a manifest remembers each
 * hash's dimensions, placeholder and EXIF. An unchanged photo is therefore a
 * manifest lookup, not a decode: that's what keeps a rebuild of a few hundred
 * gallery photos to a second or two instead of minutes. CI caches public/img
 * for the same reason.
 */
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import exifr from 'exifr'
import type { Exif, ImageSet } from '../src/content/types.ts'
import { ContentError } from './errors.ts'

const WIDTHS = [480, 960, 1600, 2400]
/** The `src` fallback, for the rare browser that ignores srcset. */
const DEFAULT_WIDTH = 960
const MANIFEST = 'manifest.json'

/** Content refers to uploads by this URL prefix, which is what the CMS writes. */
export const UPLOADS_PREFIX = '/uploads/'

type ManifestEntry = {
  name: string
  widths: number[]
  width: number
  height: number
  placeholder: string
  exif?: Exif
}

type Manifest = Record<string, ManifestEntry>

export type ProcessedImage = ImageSet & { exif?: Exif }

export type ImageProcessor = {
  process(reference: string, from: string): Promise<ProcessedImage>
  /** Write the manifest and delete outputs that nothing referenced this run. */
  finish(): Promise<void>
}

export async function createImageProcessor(options: {
  uploadsDir: string
  outDir: string
  /** URL prefix the site is served under, e.g. "/" or "/personal-site/". */
  base: string
}): Promise<ImageProcessor> {
  const { uploadsDir, outDir, base } = options
  await mkdir(outDir, { recursive: true })

  const manifest = await readManifest(path.join(outDir, MANIFEST))
  const used: Manifest = {}
  const inFlight = new Map<string, Promise<ProcessedImage>>()
  const limit = createLimiter(3)

  async function processFile(file: string): Promise<ProcessedImage> {
    const source = await readFile(file)
    const hash = createHash('sha1').update(source).digest('hex').slice(0, 10)

    let entry = manifest[hash]
    if (!entry || !entry.widths.every((w) => existsSync(outputPath(entry!.name, w)))) {
      entry = await limit(() => encode(file, source, hash))
    }
    used[hash] = entry
    return toImageSet(entry)
  }

  async function encode(file: string, source: Buffer, hash: string): Promise<ManifestEntry> {
    const stem = path
      .basename(file, path.extname(file))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const name = `${stem || 'image'}-${hash}`

    // .rotate() with no argument applies the EXIF orientation, so phone
    // photos come out the right way up and the reported size matches.
    const metadata = await sharp(source).metadata()
    const { width, height } = metadata.autoOrient
    if (!width || !height) throw new ContentError(`${file}: not a readable image`)

    const widths = WIDTHS.filter((w) => w < width)
    widths.push(Math.min(width, WIDTHS.at(-1)!))

    await Promise.all(
      [...new Set(widths)].map((w) =>
        sharp(source)
          .rotate()
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(outputPath(name, w)),
      ),
    )

    const tiny = await sharp(source).rotate().resize({ width: 24 }).webp({ quality: 40 }).toBuffer()

    return {
      name,
      widths: [...new Set(widths)],
      width,
      height,
      placeholder: `data:image/webp;base64,${tiny.toString('base64')}`,
      exif: await readExif(source),
    }
  }

  function outputPath(name: string, width: number): string {
    return path.join(outDir, `${name}-${width}.webp`)
  }

  function toImageSet(entry: ManifestEntry): ProcessedImage {
    const url = (w: number) => `${base}img/${entry.name}-${w}.webp`
    const fallback = entry.widths.find((w) => w >= DEFAULT_WIDTH) ?? entry.widths.at(-1)!
    return {
      src: url(fallback),
      srcset: entry.widths.map((w) => `${url(w)} ${w}w`).join(', '),
      width: entry.width,
      height: entry.height,
      placeholder: entry.placeholder,
      ...(entry.exif ? { exif: entry.exif } : {}),
    }
  }

  return {
    process(reference, from) {
      if (!reference.startsWith(UPLOADS_PREFIX)) {
        throw new ContentError(
          `${from}: image "${reference}" must be an upload (a path starting with ${UPLOADS_PREFIX})`,
        )
      }
      const file = path.join(uploadsDir, ...reference.slice(UPLOADS_PREFIX.length).split('/'))
      if (!file.startsWith(uploadsDir + path.sep)) {
        throw new ContentError(`${from}: image "${reference}" points outside content/uploads`)
      }
      if (!existsSync(file)) {
        throw new ContentError(`${from}: image "${reference}" not found in content/uploads`)
      }

      let pending = inFlight.get(file)
      if (!pending) {
        pending = processFile(file)
        inFlight.set(file, pending)
      }
      return pending
    },

    async finish() {
      await writeFile(path.join(outDir, MANIFEST), JSON.stringify(used, null, 2))
      const keep = new Set([MANIFEST])
      for (const entry of Object.values(used)) {
        for (const w of entry.widths) keep.add(`${entry.name}-${w}.webp`)
      }
      const stale = (await readdir(outDir)).filter((file) => !keep.has(file))
      await Promise.all(stale.map((file) => rm(path.join(outDir, file), { force: true })))
    },
  }
}

async function readManifest(file: string): Promise<Manifest> {
  try {
    return JSON.parse(await readFile(file, 'utf8')) as Manifest
  } catch {
    // Missing or corrupt: start over. Worst case is re-encoding everything.
    return {}
  }
}

async function readExif(source: Buffer): Promise<Exif | undefined> {
  let raw: Record<string, unknown> | undefined
  try {
    raw = await exifr.parse(source, {
      pick: [
        'Make',
        'Model',
        'LensModel',
        'FocalLength',
        'FNumber',
        'ExposureTime',
        'ISO',
        'DateTimeOriginal',
      ],
    })
  } catch {
    return undefined
  }
  if (!raw) return undefined

  const exif: Exif = {}
  const make = typeof raw.Make === 'string' ? raw.Make.trim() : ''
  const model = typeof raw.Model === 'string' ? raw.Model.trim() : ''
  // Most cameras already put the brand in the model ("Canon EOS R6").
  const camera = model.toLowerCase().startsWith(make.toLowerCase()) ? model : `${make} ${model}`
  if (camera.trim()) exif.camera = camera.trim()
  if (typeof raw.LensModel === 'string' && raw.LensModel.trim()) exif.lens = raw.LensModel.trim()
  if (typeof raw.FocalLength === 'number') exif.focalLength = `${Math.round(raw.FocalLength)}mm`
  if (typeof raw.FNumber === 'number') exif.aperture = `ƒ/${raw.FNumber}`
  if (typeof raw.ExposureTime === 'number') {
    exif.shutter =
      raw.ExposureTime >= 1 ? `${raw.ExposureTime}s` : `1/${Math.round(1 / raw.ExposureTime)}s`
  }
  if (typeof raw.ISO === 'number') exif.iso = raw.ISO
  if (raw.DateTimeOriginal instanceof Date) {
    exif.takenAt = raw.DateTimeOriginal.toISOString().slice(0, 10)
  }
  return Object.keys(exif).length > 0 ? exif : undefined
}

/** Caps concurrent encodes. sharp is already multithreaded per image. */
function createLimiter(max: number) {
  let active = 0
  const queue: Array<() => void> = []
  return async function limit<T>(task: () => Promise<T>): Promise<T> {
    if (active >= max) await new Promise<void>((resolve) => queue.push(resolve))
    active++
    try {
      return await task()
    } finally {
      active--
      queue.shift()?.()
    }
  }
}
