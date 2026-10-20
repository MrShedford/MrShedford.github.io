/**
 * HTML the content pipeline rendered from Markdown. Trusted: it's the site
 * owner's own writing, built from their own repo (see scripts/markdown.ts).
 */
export function Prose({ html, className }: { html: string; className?: string | undefined }) {
  return (
    <div
      className={className ? `prose ${className}` : 'prose'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
