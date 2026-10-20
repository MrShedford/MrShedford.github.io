import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import {
  galleryQuery,
  portfolioQuery,
  ramblingQuery,
  ramblingsQuery,
  ravingQuery,
  ravingsQuery,
  rethrowNotFound,
  siteQuery,
} from '@/lib/queries'
import { parseRavingSearch } from '@/lib/raving'
import { parsePortfolioSearch } from '@/lib/timeline'
import { parseGallerySearch } from '@/lib/gallery'
import { RootLayout } from '@/routes/RootLayout'
import { HomePage } from '@/routes/HomePage'
import { RamblingsPage } from '@/routes/RamblingsPage'
import { RamblingPage } from '@/routes/RamblingPage'
import { RavingPage } from '@/routes/RavingPage'
import { RavePage } from '@/routes/RavePage'
import { PortfolioPage } from '@/routes/PortfolioPage'
import { GalleryPage } from '@/routes/GalleryPage'
import { NotFoundPage } from '@/routes/NotFoundPage'
import { ErrorPage } from '@/routes/ErrorPage'
import { PendingPage } from '@/routes/PendingPage'

type RouterContext = { queryClient: QueryClient }

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  loader: ({ context }) => context.queryClient.ensureQueryData(siteQuery),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(ramblingsQuery),
      queryClient.ensureQueryData(ravingsQuery),
      queryClient.ensureQueryData(portfolioQuery),
      queryClient.ensureQueryData(galleryQuery),
    ]),
})

const ramblingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ramblings',
  component: RamblingsPage,
  loader: ({ context }) => context.queryClient.ensureQueryData(ramblingsQuery),
})

const ramblingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ramblings/$slug',
  component: RamblingPage,
  // The list too, for the previous/next links at the foot of the post.
  loader: ({ context: { queryClient }, params }) =>
    Promise.all([
      queryClient.ensureQueryData(ramblingQuery(params.slug)).catch(rethrowNotFound),
      queryClient.ensureQueryData(ramblingsQuery),
    ]),
})

const ravingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/raving',
  component: RavingPage,
  validateSearch: parseRavingSearch,
  loader: ({ context }) => context.queryClient.ensureQueryData(ravingsQuery),
})

const raveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/raving/$slug',
  component: RavePage,
  loader: ({ context: { queryClient }, params }) =>
    Promise.all([
      queryClient.ensureQueryData(ravingQuery(params.slug)).catch(rethrowNotFound),
      queryClient.ensureQueryData(ravingsQuery),
    ]),
})

const portfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/portfolio',
  component: PortfolioPage,
  validateSearch: parsePortfolioSearch,
  loader: ({ context }) => context.queryClient.ensureQueryData(portfolioQuery),
})

const galleryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/gallery',
  component: GalleryPage,
  validateSearch: parseGallerySearch,
  loader: ({ context }) => context.queryClient.ensureQueryData(galleryQuery),
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  ramblingsRoute,
  ramblingRoute,
  ravingRoute,
  raveRoute,
  portfolioRoute,
  galleryRoute,
])

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    basepath: import.meta.env.BASE_URL,
    // Hovering a link runs its loader, which warms the Query cache. Query
    // owns freshness, so the router shouldn't cache loader results itself.
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: PendingPage,
    defaultPendingMs: 300,
    defaultErrorComponent: ErrorPage,
    scrollRestoration: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
