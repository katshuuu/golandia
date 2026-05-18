import { useTheme } from '../../theme/ThemeProvider'

type MainPageSidebarProps = {
  moduleNumbers: readonly number[]
  selectedModule: number
  onSelectModule: (moduleNumber: number) => void
}

export function MainPageSidebar({ moduleNumbers, selectedModule, onSelectModule }: MainPageSidebarProps) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <aside className="mainpage-sidebar" aria-label="Навигация по модулям">
      <nav className="mainpage-modules">
        {moduleNumbers.map((moduleNumber) => (
          <button
            key={moduleNumber}
            type="button"
            className={`mainpage-module-card ${selectedModule === moduleNumber ? 'is-active' : ''}`}
            onClick={() => onSelectModule(moduleNumber)}
          >
            <span className="mainpage-module-number">{moduleNumber}</span>
            <span className="mainpage-module-text">модуль</span>
          </button>
        ))}
      </nav>
      <div className="mainpage-sidebar-controls">
        <button
          type="button"
          className={`mainpage-theme-toggle ${isDark ? 'is-dark' : 'is-light'}`}
          onClick={toggleTheme}
          role="switch"
          aria-checked={isDark}
          aria-label={isDark ? 'Переключить на светлую тему' : 'Переключить на темную тему'}
        >
          <span className="mainpage-theme-toggle-thumb" aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}
