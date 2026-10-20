/**
 * `npm run content`: run the content pipeline on its own, e.g. to check a
 * batch of new posts for frontmatter mistakes without starting Vite.
 */
import { fileURLToPath } from 'node:url'
import { buildContent, ContentError } from './content.ts'

const root = fileURLToPath(new URL('..', import.meta.url))

try {
  const started = performance.now()
  const { counts } = await buildContent({
    root,
    base: process.env.SITE_BASE ?? '/',
    includeDrafts: process.argv.includes('--drafts'),
  })
  const summary = Object.entries(counts)
    .map(([name, count]) => `${count} ${name}`)
    .join(', ')
  console.log(`Content built in ${Math.round(performance.now() - started)}ms: ${summary}`)
} catch (error) {
  if (!(error instanceof ContentError)) throw error
  console.error(error.message)
  process.exitCode = 1
}
