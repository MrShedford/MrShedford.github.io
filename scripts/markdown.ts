/**
 * Markdown -> HTML, with local images swapped for responsive <img> tags.
 *
 * No sanitising: every word of content is written by the site owner and
 * committed to their own repo, and raw HTML in a post (an embed, say) is a
 * feature here.
 */
import { Marked, marked, type Tokens } from 'marked'
import type { ImageSet } from '../src/content/types.ts'
import { UPLOADS_PREFIX } from './images.ts'

export type ResolveImage = (reference: string) => Promise<ImageSet>

const BODY_IMAGE_SIZES = '(min-width: 760px) 720px, 100vw'

export async function renderMarkdown(markdown: string, resolveImage: ResolveImage): Promise<string> {
  const tokens = marked.lexer(markdown, { gfm: true })

  // Images first, all at once, because the renderer below is synchronous.
  const references = new Set<string>()
  marked.walkTokens(tokens, (token) => {
    if (token.type === 'image' && token.href.startsWith(UPLOADS_PREFIX)) references.add(token.href)
  })
  const images = new Map(
    await Promise.all(
      [...references].map(async (ref) => [ref, await resolveImage(ref)] as const),
    ),
  )

  const renderer = new Marked({
    gfm: true,
    renderer: {
      image({ href, title, text }: Tokens.Image) {
        const image = images.get(href)
        const img = image
          ? imgTag(image, text, BODY_IMAGE_SIZES)
          : `<img src="${escape(href)}" alt="${escape(text)}" loading="lazy" decoding="async">`
        return title
          ? `<figure>${img}<figcaption>${escape(title)}</figcaption></figure>`
          : img
      },
      link({ href, title, tokens: inner }: Tokens.Link) {
        const text = this.parser.parseInline(inner)
        const external = /^https?:\/\//.test(href)
        return `<a href="${escape(href)}"${title ? ` title="${escape(title)}"` : ''}${
          external ? ' target="_blank" rel="noopener noreferrer"' : ''
        }>${text}</a>`
      },
    },
  })

  return renderer.parser(tokens)
}

export function imgTag(image: ImageSet, alt: string, sizes: string): string {
  return (
    `<img src="${escape(image.src)}" srcset="${escape(image.srcset)}" sizes="${sizes}"` +
    ` width="${image.width}" height="${image.height}" alt="${escape(alt)}"` +
    ` loading="lazy" decoding="async"` +
    ` style="background-image:url(${image.placeholder});background-size:cover">`
  )
}

/** ~220 words a minute, never less than one. */
export function readingMinutes(markdown: string): number {
  const words = markdown.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

function escape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}
