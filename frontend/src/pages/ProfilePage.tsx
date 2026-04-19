import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import type { CourseManifest } from "@/lib/types";
import { getCurrentUser } from "@/store/auth";
import { loadProgress, updateMainGoal } from "@/store/progress";
import { getCourseCompletionStats } from "@/lib/courseProgress";
import { computeHeroLevelLocal, NOVICE_TITLE } from "@/lib/heroLevel";
import { isSidebarModuleComplete, MODULE_RANKS } from "@/lib/moduleRanks";

export function ProfilePage() {
  const manifest = useOutletContext<CourseManifest>();
  const user = getCurrentUser();
  const [goal, setGoal] = useState(() => loadProgress().mainGoal);

  useEffect(() => {
    setGoal(loadProgress().mainGoal);
  }, []);

  const p = loadProgress();
  const stats = getCourseCompletionStats(manifest, p);
  const hero = computeHeroLevelLocal(manifest, p);
  const heroTitle = hero.level === 0 ? hero.novice_title : hero.level_title || NOVICE_TITLE;

  const moduleRows = manifest.modules.map((m) => {
    const ids = m.lessons.map((l) => l.id);
    const done = ids.filter((id) => p.completedLessons[id]).length;
    return { id: m.id, title: m.title, done, total: ids.length };
  });

  function saveGoal() {
    updateMainGoal(goal);
    setGoal(loadProgress().mainGoal);
  }

  if (!user) {
    return (
      <div className="shell shell--wide">
        <p>Сессия недоступна.</p>
        <Link to="/auth">Войти</Link>
      </div>
    );
  }

  return (
    <div className="shell shell--wide profile-page">
      <header className="profile-page__head">
        <h1 className="profile-page__title">Личный кабинет</h1>
        <p className="profile-page__meta">
          <strong>{user.name}</strong>
          <span className="profile-page__email">{user.email}</span>
        </p>
        <p className="profile-page__hero-line">
          Уровень героя: <strong>{hero.level}</strong> — <strong>{heroTitle}</strong>
          {hero.boss_golang_defeated ? <span className="profile-page__hero-boss"> · босс Go повержен</span> : null}
        </p>
      </header>

      <section className="card profile-goal">
        <h2 className="profile-section-title">Цель в освоении Go</h2>
        <p className="profile-section-hint">Сформулируйте, зачем вам язык — так проще не бросить.</p>
        <textarea
          className="profile-goal__input"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          rows={4}
          spellCheck
        />
        <div className="profile-goal__actions">
          <button type="button" className="btn btn-primary" onClick={saveGoal}>
            Сохранить цель
          </button>
        </div>
      </section>

      <section className="card profile-ranks">
        <div className="profile-ranks__head">
          <h2 className="profile-section-title">Звания</h2>
          <Link to="/achievements" className="profile-ranks__link">
            Все достижения →
          </Link>
        </div>
        <p className="profile-section-hint" style={{ marginTop: 0 }}>
          Открываются после полного прохождения модуля (все задания в песочнице). Стиль как у карточек курса в ЛК школы.
        </p>
        <ul className="profile-ranks__chips">
          {MODULE_RANKS.map((rank) => {
            const unlocked = isSidebarModuleComplete(rank.sidebarKey, manifest, p);
            return (
              <li key={rank.sidebarKey}>
                <span className={`profile-rank-chip${unlocked ? " profile-rank-chip--on" : " profile-rank-chip--off"}`}>
                  <span className="profile-rank-chip__mod">М{rank.sidebarKey.replace("m", "")}</span>
                  {rank.label}
                  {unlocked ? <span className="profile-rank-chip__tick">✓</span> : null}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card profile-progress">
        <h2 className="profile-section-title">Прогресс по курсу</h2>
        <div className="profile-progress__hero">
          <span className="profile-progress__percent">{stats.percent}%</span>
          <span className="profile-progress__caption">освоение материала</span>
        </div>
        <div className="profile-progress-bar" aria-hidden>
          <div className="profile-progress-bar__fill" style={{ width: `${stats.percent}%` }} />
        </div>
        <p className="profile-progress__note">
          В зачёт идут только уроки, по которым задание в песочнице успешно прошло автопроверку.
        </p>
        <ul className="profile-progress__summary">
          <li>
            Уроки с выполненным заданием: <strong>{stats.doneLessons}</strong> из {stats.totalLessons}
          </li>
          <li>
            Финальный проект: {stats.finalDone ? <strong>сдан</strong> : <span>не сдан</span>}
          </li>
          {p.streakDays > 0 ? (
            <li>
              Серия занятий: <strong>{p.streakDays}</strong> {p.streakDays === 1 ? "день" : "дней"} подряд
            </li>
          ) : null}
          {p.totalActiveDays > 0 ? (
            <li>
              Дней в курсе: <strong>{p.totalActiveDays}</strong>
            </li>
          ) : null}
        </ul>
      </section>

      <section className="card profile-modules">
        <h2 className="profile-section-title">По модулям</h2>
        <ul className="profile-modules__list">
          {moduleRows.map((row) => (
            <li key={row.id} className="profile-modules__row">
              <span className="profile-modules__name">{row.title}</span>
              <span className="profile-modules__count">
                {row.done}/{row.total}
              </span>
              <span className="profile-modules__mini">
                <span
                  className="profile-modules__mini-fill"
                  style={{
                    width: row.total === 0 ? "0%" : `${Math.round((row.done / row.total) * 100)}%`,
                  }}
                />
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="profile-back">
        <Link to="/course">← К курсу</Link>
        {" · "}
        <Link to="/achievements">Мои достижения</Link>
      </p>
    </div>
  );
}
