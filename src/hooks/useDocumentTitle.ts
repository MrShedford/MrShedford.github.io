import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { siteQuery } from '@/lib/queries'

/** "Page · Site Name", or just the site name for the home page. */
export function useDocumentTitle(title?: string, description?: string): void {
  const { data: site } = useQuery(siteQuery)
  const siteName = site?.name

  useEffect(() => {
    document.title = [title, siteName].filter(Boolean).join(' · ')
  }, [title, siteName])

  useEffect(() => {
    const content = description ?? site?.tagline
    if (!content) return
    document.querySelector('meta[name="description"]')?.setAttribute('content', content)
  }, [description, site?.tagline])
}
