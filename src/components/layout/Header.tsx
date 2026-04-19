import { useState } from 'react';
import { Code2, LogOut, User, ChevronDown, Trophy, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  solvedCount: number;
  totalCount: number;
  onGoHome: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function Header({ solvedCount, totalCount, onGoHome, theme, onToggleTheme }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const progress = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  return (
    <header className="h-14 bg-[var(--bg-surface)] border-b border-[var(--border-color)] flex items-center px-4 gap-4 relative z-50 transition-colors">
      <button
        onClick={onGoHome}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
          <Code2 size={16} className="text-white" />
        </div>
        <span className="text-[var(--text-primary)] font-bold text-sm hidden sm:block">Go Репетитор</span>
      </button>

      <div className="flex-1" />

      <div className="hidden sm:flex items-center gap-3 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl px-4 py-2">
        <Trophy size={14} className="text-yellow-400" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-[var(--text-secondary)] leading-none">Прогресс</span>
          <span className="text-xs text-[var(--text-primary)] font-medium leading-none">
            {solvedCount} из {totalCount}
          </span>
        </div>
        <div className="w-20 h-1.5 bg-[var(--border-color)] rounded-full overflow-hidden ml-1">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] text-[var(--text-secondary)]">{progress}%</span>
      </div>

      <button
        onClick={onToggleTheme}
        className="flex items-center gap-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl px-3 py-2 hover:border-[var(--text-secondary)] transition-colors text-xs text-[var(--text-secondary)]"
        aria-label="Переключить тему"
        title={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
      >
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        <span className="hidden sm:block">{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
      </button>

      <div className="relative">
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="flex items-center gap-2 bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl px-3 py-2 hover:border-[var(--text-secondary)] transition-colors"
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-pink-500 to-pink-400 flex items-center justify-center">
            <User size={12} className="text-white" />
          </div>
          <span className="text-[var(--text-secondary)] text-xs max-w-[100px] truncate hidden sm:block">
            {user?.email?.split('@')[0]}
          </span>
          <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-color)]">
              <p className="text-[var(--text-primary)] text-sm font-medium truncate">{user?.email?.split('@')[0]}</p>
              <p className="text-[var(--text-muted)] text-xs truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => { signOut(); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/5 transition-colors text-sm"
            >
              <LogOut size={14} />
              Выйти
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
