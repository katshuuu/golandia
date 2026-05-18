import { NavLink, useLocation } from 'react-router-dom'
import brandLogo from '../assets/branding/logo.svg'
import './AppSiteHeader.css'

type AppSiteHeaderProps = {
  className?: string
  /** Ссылка «вернуться к обучению» под логотипом (по умолчанию на /profile и /achievements) */
  showBackToLearning?: boolean
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `app-site-header__link${isActive ? ' is-active' : ''}`
}

/** Единая верхняя панель: логотип + «Профиль» + «Мои достижения». */
export function AppSiteHeader({ className, showBackToLearning }: AppSiteHeaderProps) {
  const { pathname } = useLocation()
  const backLink =
    showBackToLearning ?? (pathname === '/profile' || pathname === '/achievements')

  const rootClass = [
    'app-site-header',
    backLink ? 'app-site-header--with-back' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <header className={rootClass}>
      <div className="app-site-header__inner">
        <div className="app-site-header__brand">
          <NavLink to="/" className="app-site-header__logo-link" aria-label="На главную — Golandia">
            <img src={brandLogo} alt="GOландia" className="brand-logo" />
          </NavLink>
          {backLink ? (
            <NavLink to="/" className="app-site-header__back-link" aria-label="Вернуться к обучению">
              вернуться к обучению
            </NavLink>
          ) : null}
        </div>
        <nav className="app-site-header__nav" aria-label="Разделы приложения">
          <NavLink to="/profile" className={navLinkClass}>
            Профиль
          </NavLink>
          <NavLink to="/achievements" className={navLinkClass}>
            Мои достижения
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
