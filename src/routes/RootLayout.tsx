import { Link, Outlet } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { siteQuery } from '@/lib/queries'
import { useTheme } from '@/hooks/useTheme'
import { Icon } from '@/components/Icon'
import styles from './RootLayout.module.scss'

const NAV = [
  { to: '/ramblings', label: 'Ramblings' },
  { to: '/raving', label: 'Raving' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/gallery', label: 'Gallery' },
] as const

export function RootLayout() {
  const { data: site } = useSuspenseQuery(siteQuery)
  const [theme, toggleTheme] = useTheme()

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skipLink}>
        Skip to content
      </a>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand}>
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={28} height={28} />
            <span>{site.name}</span>
          </Link>

          <nav className={styles.nav} aria-label="Main">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className={styles.navLink}>
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className={styles.themeToggle}
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          >
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
        </div>
      </header>

      <main id="main" className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>
            © {new Date().getFullYear()} {site.name}
          </p>
          {site.socials.length > 0 ? (
            <ul className={styles.socials}>
              {site.socials.map((social) => (
                <li key={social.url}>
                  <a href={social.url} target="_blank" rel="noopener noreferrer me">
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </footer>
    </div>
  )
}
