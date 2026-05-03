import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useManifest } from "@/context/ManifestContext";
import { logout, type AuthUser } from "@/store/auth";
import { useCelebrate } from "@/context/CelebrationContext";
import { collectNewGamificationEvents } from "@/lib/gamificationEvents";
import { loadProgress, recordPlatformVisit, subscribeProgressStore } from "@/store/progress";
import { manifestModulesByIds, SIDEBAR_MODULES, sidebarKeyForLessonModuleId } from "@/lib/sidebarModules";
import { fetchLesson } from "@/lib/api";
import { reloadApplication } from "@/lib/appLifecycle";

const THEME_KEY = "go-tutor-theme";

function readTheme(): "light" | "dark" {
  const t = localStorage.getItem(THEME_KEY);
  if (t === "light" || t === "dark") return t;
  return "dark";
}

export function AppShell({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const manifest = useManifest();
  const celebrate = useCelebrate();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerKey, setDrawerKey] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(readTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const before = loadProgress();
    recordPlatformVisit();
    const after = loadProgress();
    celebrate(collectNewGamificationEvents(before, after, manifest));
  }, [manifest, celebrate]);

  const [resolvedLessonModule, setResolvedLessonModule] = useState<string | null>(null);

  useEffect(() => {
    const m = /^\/lesson\/([^/]+)/.exec(location.pathname);
    if (!m) {
      setResolvedLessonModule(null);
      return;
    }
    let cancelled = false;
    fetchLesson(m[1])
      .then((l) => {
        if (!cancelled) setResolvedLessonModule(l.module_id);
      })
      .catch(() => {
        if (!cancelled) setResolvedLessonModule(null);
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const highlightedKey = useMemo(() => {
    if (location.pathname.startsWith("/final")) return "m6";
    if (resolvedLessonModule) return sidebarKeyForLessonModuleId(resolvedLessonModule) ?? null;
    return null;
  }, [location.pathname, resolvedLessonModule]);

  function toggleDrawer(key: string) {
    setDrawerKey((k) => (k === key ? null : key));
  }

  function closeDrawer() {
    setDrawerKey(null);
  }

  const progress = useSyncExternalStore(
    subscribeProgressStore,
    () => loadProgress(),
    () => loadProgress(),
  );

  return (
    <div className="app-root">
      <aside className="app-rail" aria-label="Модули курса">
        {SIDEBAR_MODULES.map((sm) => {
          const isHi = sm.key === highlightedKey;
          const isOpen = drawerKey === sm.key;
          if (sm.kind === "final") {
            return (
              <button
                key={sm.key}
                type="button"
                className={`app-rail-btn${isHi ? " app-rail-btn--active" : ""}${isOpen ? " app-rail-btn--open" : ""}`}
                onClick={() => {
                  closeDrawer();
                  navigate("/final");
                }}
                title={sm.label}
              >
                <span className="app-rail-btn__short">M6</span>
                <span className="app-rail-btn__text">{sm.label}</span>
              </button>
            );
          }
          return (
            <button
              key={sm.key}
              type="button"
              className={`app-rail-btn${isHi ? " app-rail-btn--active" : ""}${isOpen ? " app-rail-btn--open" : ""}`}
              onClick={() => toggleDrawer(sm.key)}
              title={sm.label}
            >
              <span className="app-rail-btn__short">M{sm.key.replace("m", "")}</span>
              <span className="app-rail-btn__text">{sm.label}</span>
            </button>
          );
        })}
      </aside>

      {drawerKey && drawerKey !== "m6" ? (
        <aside className="app-lesson-drawer" aria-label="Уроки модуля">
          <div className="app-lesson-drawer__head">
            <span>{SIDEBAR_MODULES.find((s) => s.key === drawerKey)?.label}</span>
            <button type="button" className="app-icon-btn" onClick={closeDrawer} aria-label="Закрыть">
              ×
            </button>
          </div>
          <div className="app-lesson-drawer__scroll">
            {(() => {
              const def = SIDEBAR_MODULES.find((s) => s.key === drawerKey);
              if (!def || def.kind !== "course") return null;
              const blocks = manifestModulesByIds(manifest, def.manifestModuleIds);
              return blocks.map((mod) => (
                <div key={mod.id} className="app-lesson-block">
                  {blocks.length > 1 ? <div className="app-lesson-block__title">{mod.title}</div> : null}
                  <ul className="app-lesson-list">
                    {mod.lessons.map((lesson) => (
                      <li key={lesson.id}>
                        <NavLink
                          to={`/lesson/${lesson.id}`}
                          className={({ isActive }) =>
                            `app-lesson-link${isActive ? " app-lesson-link--active" : ""}`
                          }
                          onClick={closeDrawer}
                        >
                          <span
                            className={`app-lesson-pass-dot${progress.completedLessons[lesson.id] ? " app-lesson-pass-dot--done" : ""}`}
                            title={
                              progress.completedLessons[lesson.id]
                                ? "Задание выполнено (автопроверка)"
                                : "Урок не сдан: выполни задание и нажми «Проверить задание»"
                            }
                            aria-label={
                              progress.completedLessons[lesson.id] ? "Пройдено" : "Не пройдено"
                            }
                          />
                          <span className="app-lesson-link__label">{lesson.title}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ));
            })()}
          </div>
        </aside>
      ) : null}

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar__left">
            <Link to="/course" className="app-brand">
              Go-репетитор
            </Link>
          </div>
          <div className="app-topbar__right">
            <Link
              to="/achievements"
              className={`btn btn-ghost app-achievements-btn${location.pathname === "/achievements" ? " app-achievements-btn--active" : ""}`}
              title="Мои достижения"
            >
              Мои достижения
            </Link>
            <button
              type="button"
              className="btn btn-ghost app-theme-btn"
              onClick={() => reloadApplication()}
              title="Полная перезагрузка страницы. Вход и прогресс сохраняются в этом браузере."
              aria-label="Перезагрузить приложение"
            >
              ⟳
            </button>
            <button
              type="button"
              className="btn btn-ghost app-theme-btn"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <Link
              to="/profile"
              className={`app-user app-user--link${location.pathname === "/profile" ? " app-user--link--active" : ""}`}
              title="Личный кабинет"
            >
              {user.name || user.email}
            </Link>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                logout();
                onLogout();
              }}
            >
              Выйти
            </button>
          </div>
        </header>
        <main className="app-content">
          <Outlet context={manifest} />
        </main>
      </div>
    </div>
  );
}
