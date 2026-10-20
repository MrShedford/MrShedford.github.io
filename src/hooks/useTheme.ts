import { useCallback, useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set<() => void>()

/**
 * The effective theme: an explicit choice (data-theme on <html>, restored
 * from localStorage by the inline script in index.html) or else the OS
 * setting. CSS keys off the same attribute, so this only has to report it.
 */
function current(): Theme {
  const chosen = document.documentElement.dataset.theme
  if (chosen === 'light' || chosen === 'dark') return chosen
  return media.matches ? 'dark' : 'light'
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  media.addEventListener('change', listener)
  return () => {
    listeners.delete(listener)
    media.removeEventListener('change', listener)
  }
}

export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(subscribe, current)

  const toggle = useCallback(() => {
    const next: Theme = current() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private mode or blocked storage: the choice just won't outlive the tab.
    }
    for (const listener of listeners) listener()
  }, [])

  return [theme, toggle]
}
