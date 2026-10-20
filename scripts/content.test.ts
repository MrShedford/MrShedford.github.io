import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { after, before, describe, test } from 'node:test'
import sharp from 'sharp'
import { buildContent, ContentError, slugFor } from './content.ts'

const SITE = `name: Test Person\ntagline: Testing things\nportfolioPdf: /files/cv.pdf\n`

/** A throwaway project root with the given files under content/. */
async function fixture(files: Record<string, string | Buffer>): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'personal-site-test-'))
  await Promise.all(
    Object.entries({ 'site.yml': SITE, ...files }).map(async ([name, body]) => {
      const file = path.join(root, 'content', ...name.split('/'))
      await mkdir(path.dirname(file), { recursive: true })
      await writeFile(file, body)
    }),
  )
  return root
}

async function readJson<T>(root: string, file: string): Promise<T> {
  return JSON.parse(await readFile(path.join(root, 'public', 'data', file), 'utf8')) as T
}

const roots: string[] = []
after(() => Promise.all(roots.map((root) => rm(root, { recursive: true, force: true }))))

async function build(files: Record<string, string | Buffer>, options: { includeDrafts?: boolean; base?: string } = {}) {
  const root = await fixture(files)
  roots.push(root)
  const result = await buildContent({ root, base: options.base ?? '/', includeDrafts: options.includeDrafts ?? false })
  return { root, result }
}

describe('ramblings', () => {
  const files = {
    'ramblings/older.md': `---\ntitle: Older\ndate: 2024-01-01\n---\nHello`,
    'ramblings/newer.md': `---\ntitle: Newer\ndate: 2025-06-01\ntags: [a, b]\n---\n## Heading\n\nBody text`,
    'ramblings/secret.md': `---\ntitle: Draft\ndate: 2026-01-01\ndraft: true\n---\nWIP`,
  }

  test('lists newest first, without bodies, and leaves drafts out', async () => {
    const { root, result } = await build(files)
    const list = await readJson<Array<Record<string, unknown>>>(root, 'ramblings.json')
    assert.deepEqual(list.map((post) => post.slug), ['newer', 'older'])
    assert.equal(list[0]!.html, undefined)
    assert.deepEqual(list[0]!.tags, ['a', 'b'])
    assert.equal(result.counts.ramblings, 2)
  })

  test('writes a detail file per post with rendered HTML', async () => {
    const { root } = await build(files)
    const post = await readJson<{ html: string; readingMinutes: number }>(root, 'ramblings/newer.json')
    assert.match(post.html, /<h2[^>]*>Heading<\/h2>/)
    assert.equal(post.readingMinutes, 1)
  })

  test('includes drafts when asked (dev)', async () => {
    const { root } = await build(files, { includeDrafts: true })
    const list = await readJson<Array<{ slug: string }>>(root, 'ramblings.json')
    assert.deepEqual(list.map((post) => post.slug), ['secret', 'newer', 'older'])
  })
})

describe('validation', () => {
  test('names the file and field for bad frontmatter, all problems at once', async () => {
    await assert.rejects(
      build({
        'raving/too-good.md': `---\ntitle: X\ndate: 2025-01-01\ncategory: music\nsubject: Y\nrating: 11\n---\n`,
        'raving/wrong-category.md': `---\ntitle: X\ndate: 2025-01-01\ncategory: books\nsubject: Y\nrating: 5\n---\n`,
      }),
      (error: unknown) => {
        assert.ok(error instanceof ContentError)
        assert.match(error.message, /2 problems/)
        assert.match(error.message, /content\/raving\/too-good\.md: "rating"/)
        assert.match(error.message, /content\/raving\/wrong-category\.md: "category"/)
        return true
      },
    )
  })

  test('reports malformed YAML as a content problem', async () => {
    await assert.rejects(
      build({ 'gallery/broken.yml': `title: [unclosed\nimage: x` }),
      (error: unknown) =>
        error instanceof ContentError && /content\/gallery\/broken\.yml: invalid YAML/.test(error.message),
    )
  })

  test('rejects a date that is not a date', async () => {
    await assert.rejects(
      build({ 'ramblings/x.md': `---\ntitle: X\ndate: someday\n---\n` }),
      /"date": "someday" is not a date/,
    )
  })

  test('treats empty optional fields from the CMS as absent', async () => {
    const { root } = await build({
      'ramblings/x.md': `---\ntitle: X\ndate: 2025-01-01\nsummary: ''\ncover: ''\ntags:\n---\n`,
    })
    const [post] = await readJson<Array<Record<string, unknown>>>(root, 'ramblings.json')
    assert.equal(post!.summary, undefined)
    assert.equal(post!.cover, undefined)
    assert.deepEqual(post!.tags, [])
  })

  test('reports a missing image', async () => {
    await assert.rejects(
      build({ 'ramblings/x.md': `---\ntitle: X\ndate: 2025-01-01\ncover: /uploads/nope.jpg\n---\n` }),
      /"\/uploads\/nope\.jpg" not found/,
    )
  })

  test('refuses image paths that escape content/uploads', async () => {
    await assert.rejects(
      build({ 'ramblings/x.md': `---\ntitle: X\ndate: 2025-01-01\ncover: /uploads/../site.yml\n---\n` }),
      /outside content\/uploads/,
    )
  })
})

describe('raving', () => {
  test('keeps category and rating, sorted newest first', async () => {
    const { root } = await build({
      'raving/a.md': `---\ntitle: A\ndate: 2025-01-01\ncategory: tv\nsubject: Show\nrating: 7\n---\n`,
      'raving/b.md': `---\ntitle: B\ndate: 2025-03-01\ncategory: video-games\nsubject: Game\nrating: 10\nyear: 2020\n---\n`,
    })
    const list = await readJson<Array<{ slug: string; category: string; rating: number; year?: number }>>(
      root,
      'raving.json',
    )
    assert.deepEqual(
      list.map(({ slug, category, rating }) => [slug, category, rating]),
      [
        ['b', 'video-games', 10],
        ['a', 'tv', 7],
      ],
    )
    assert.equal(list[0]!.year, 2020)
  })
})

describe('images', () => {
  let photo: Buffer
  before(async () => {
    photo = await sharp({
      create: { width: 1200, height: 800, channels: 3, background: '#c0603f' },
    })
      .jpeg()
      .toBuffer()
  })

  test('produces responsive WebP sizes under the base path, never upscaled', async () => {
    const { root } = await build(
      {
        'uploads/gallery/Big Photo.jpg': photo,
        'gallery/one.yml': `image: /uploads/gallery/Big Photo.jpg\ntitle: One\ndate: 2025-01-01\n`,
      },
      { base: '/my-site/' },
    )
    const [entry] = await readJson<Array<{ id: string; image: Record<string, unknown> }>>(root, 'gallery.json')
    assert.equal(entry!.id, 'one')
    assert.equal(entry!.image.width, 1200)
    assert.equal(entry!.image.height, 800)
    assert.match(String(entry!.image.src), /^\/my-site\/img\/big-photo-[0-9a-f]{10}-960\.webp$/)
    const widths = [...String(entry!.image.srcset).matchAll(/ (\d+)w/g)].map((m) => Number(m[1]))
    assert.deepEqual(widths, [480, 960, 1200])
    assert.match(String(entry!.image.placeholder), /^data:image\/webp;base64,/)
  })

  test('rewrites Markdown images to responsive <img> tags', async () => {
    const { root } = await build({
      'uploads/pic.jpg': photo,
      'ramblings/x.md': `---\ntitle: X\ndate: 2025-01-01\n---\n![Alt text](/uploads/pic.jpg "A caption")`,
    })
    const post = await readJson<{ html: string }>(root, 'ramblings/x.json')
    assert.match(post.html, /<figure><img src="\/img\/pic-[0-9a-f]{10}-960\.webp" srcset="[^"]+"/)
    assert.match(post.html, /alt="Alt text"/)
    assert.match(post.html, /<figcaption>A caption<\/figcaption>/)
  })

  test('reuses unchanged images and prunes ones no longer used', async () => {
    const { root } = await build({
      'uploads/pic.jpg': photo,
      'ramblings/x.md': `---\ntitle: X\ndate: 2025-01-01\ncover: /uploads/pic.jpg\n---\n`,
    })
    const imgDir = path.join(root, 'public', 'img')
    const [post] = await readJson<Array<{ cover: { src: string } }>>(root, 'ramblings.json')
    const file = path.join(imgDir, path.basename(post!.cover.src))
    const firstBuild = (await stat(file)).mtimeMs

    await buildContent({ root, base: '/', includeDrafts: false })
    assert.equal((await stat(file)).mtimeMs, firstBuild, 'second build should not re-encode')

    await rm(path.join(root, 'content', 'ramblings', 'x.md'))
    await buildContent({ root, base: '/', includeDrafts: false })
    await assert.rejects(stat(file), 'unused image should be pruned')
  })
})

describe('site', () => {
  test('re-roots the PDF path under the base', async () => {
    const { root } = await build({}, { base: '/my-site/' })
    const site = await readJson<{ portfolioPdf: string }>(root, 'site.json')
    assert.equal(site.portfolioPdf, '/my-site/files/cv.pdf')
  })
})

test('slugFor turns filenames into URL-safe slugs', () => {
  assert.equal(slugFor('/x/My Great Post.md'), 'my-great-post')
  assert.equal(slugFor('/x/Café Review!.md'), 'cafe-review')
  assert.equal(slugFor('/x/already-fine.md'), 'already-fine')
})

test('two files with the same slug are rejected', async () => {
  await assert.rejects(
    build({
      'ramblings/Hello World.md': `---\ntitle: A\ndate: 2025-01-01\n---\n`,
      'ramblings/hello-world.md': `---\ntitle: B\ndate: 2025-01-01\n---\n`,
    }),
    /would both be at \/hello-world/,
  )
})
