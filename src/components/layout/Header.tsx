import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import brandLogo from '../../../8c8693f6-d925-4da1-9848-66491718ece0/images/10_118.svg';
import userAvatar from '../../../8c8693f6-d925-4da1-9848-66491718ece0/images/23_263.svg';

interface HeaderProps {
  solvedCount: number;
  totalCount: number;
  onGoHome: () => void;
  onOpenProfile: () => void;
  onOpenAchievements: () => void;
}

export default function Header({ solvedCount, totalCount, onGoHome, onOpenProfile, onOpenAchievements }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const userName = user?.email?.split('@')[0] || 'Иван';

  return (
    <header className="top-header relative z-50">
      <button
        onClick={onGoHome}
        className="logo-container hover:opacity-80 transition-opacity"
        aria-label="На главную"
      >
        <img src={brandLogo} alt="Brand Logo" className="brand-logo" />
      </button>

      <div className="header-actions">
        <button
          className="btn-achievements"
          title={`Выполнено ${solvedCount} из ${totalCount}`}
          type="button"
          onClick={onOpenAchievements}
        >
          мои достижения
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="user-profile"
            type="button"
          >
            <div className="avatar-wrapper">
              <img src={userAvatar} alt="User Avatar" className="user-avatar" />
            </div>
            <span
              className="user-name"
              onClick={(event) => {
                event.stopPropagation();
                onOpenProfile();
                setMenuOpen(false);
              }}
            >
              {userName}
            </span>
          </button>

          {menuOpen && (
            <div className="user-menu">
              <button
                onClick={() => {
                  onOpenProfile();
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2"
                type="button"
              >
                Профиль
              </button>
              <button
                onClick={() => { signOut(); setMenuOpen(false); }}
                className="flex items-center gap-2"
                type="button"
              >
                <LogOut size={14} />
                Выйти
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
