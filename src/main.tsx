import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { createAppRouter } from './router'
import './styles/main.scss'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Content only changes with a deploy, and every data URL carries the
      // build id, so anything fetched once is good for the whole visit.
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// `npm run dev` rebuilds content/ on save and fires this, so an edited post
// refreshes in place: no reload, scroll position kept.
if (import.meta.hot) {
  import.meta.hot.on('content:update', () => {
    void queryClient.invalidateQueries()
  })
}

const router = createAppRouter(queryClient)

const container = document.getElementById('root')
if (!container) throw new Error('Missing #root element.')

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
