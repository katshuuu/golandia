import { useEffect, useState } from "react";
import { Link, useLocation, useOutletContext } from "react-router-dom";
import type { CourseManifest, HeroLevelResult } from "@/lib/types";
import { fetchHeroLevel } from "@/lib/api";
import { computeHeroLevelLocal, HERO_LEVEL_TITLES, NOVICE_TITLE } from "@/lib/heroLevel";
import { countTasksLastNDays, countVisitDaysLastNDays } from "@/lib/moduleRanks";
import { platformAchievementStatuses } from "@/lib/platformAchievements";
import {
  consecutiveVisitStreak,
  loadProgress,
  totalSubmittedTasks,
  completedLessonCount,
} from "@/store/progress";

/** Описание уровней: звание → условие (как в ТЗ). */
const HERO_LEVEL_RULES: Array<{ title: string; rule: string }> = [
  { title: "Маэстро", rule: "Закрыт модуль 1 (M1)." },
  { title: "Интеллектуал", rule: "Закрыты модули 1 и 2." },
  { title: "Профессор", rule: "Закрыты модули 1–3." },
  { title: "Чемпион", rule: "Закрыты модули 1–4." },
  { title: "Академик", rule: "Закрыты модули 1–5." },
  { title: "Легенда Go", rule: "Все 5 блоков курса и финал (модуль 6)." },
];

function ruDays(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} день`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return `${n} дня`;
  return `${n} дней`;
}

function activeDaysWithTasksLastWeek(p: ReturnType<typeof loadProgress>): number {
  let c = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const stamp = d.toISOString().slice(0, 10);
    if ((p.tasksPerDay[stamp] ?? 0) > 0) c++;
  }
  return c;
}

export function AchievementsPage() {
  const manifest = useOutletContext<CourseManifest>();
  const location = useLocation();
  const p = loadProgress();
  const [hero, setHero] = useState<HeroLevelResult | null>(null);

  useEffect(() => {
    const pr = loadProgress();
    let cancelled = false;
    fetchHeroLevel({
      completed_lessons: pr.completedLessons,
      final_project_done: pr.finalProjectDone,
    })
      .then((h) => {
        if (!cancelled) setHero(h);
      })
      .catch(() => {
        if (!cancelled) setHero(computeHeroLevelLocal(manifest, pr));
      });
    return () => {
      cancelled = true;
    };
  }, [manifest, location.pathname]);

  const visitsTotal = p.visitDays.length;
  const visitsWeek = countVisitDaysLastNDays(p, 7);
  const tasksWeek = countTasksLastNDays(p, 7);
  const activeWeek = activeDaysWithTasksLastWeek(p);
  const regularityPct = Math.round((activeWeek / 7) * 100);
  const visitStreak = consecutiveVisitStreak(p);
  const lessonsDone = completedLessonCount(p);
  const tasksTotal = totalSubmittedTasks(p);
  const badgeRows = platformAchievementStatuses(p);

  const displayHero = hero ?? computeHeroLevelLocal(manifest, p);
  const currentTitle =
    displayHero.level === 0 ? displayHero.novice_title : displayHero.level_title || NOVICE_TITLE;

  return (
    <div className="shell shell--wide achievements-page">
      <p className="achievements-page__back">
        <Link to="/course" className="achievements-page__back-link">
          Вернуться назад
        </Link>
      </p>
      <h1 className="achievements-page__title">Мои достижения</h1>

      <div className="achievements-top">
        <div className="achievements-layout__main">
          <section className="ach-motivation" aria-label="Мотивация">
            <div className="ach-motivation__art" aria-hidden>
              <span className="ach-motivation__book">📖</span>
            </div>
            <div className="ach-motivation__body">
              <p className="ach-motivation__text">Думай о том, что важно для тебя.</p>
              <Link to="/course" className="ach-motivation__more">
                Хочу ещё &gt;
              </Link>
            </div>
          </section>

          <section className="ach-levels-panel">
            <div className="ach-levels-panel__waves" aria-hidden />
            <div className="ach-levels-panel__inner">
              <h2 className="ach-levels-panel__title">Мои уровни</h2>
              <p className="ach-levels-panel__intro">
                Уровень показывает, как далеко ты продвинулся по курсу: чем больше модулей закрыто подряд с начала, тем выше
                звание. Каждый урок с засчитанным заданием в песочнице приближает к следующему рубежу. Формула на сервере:{" "}
                {displayHero.formula_version}.
              </p>

              <div className="ach-hero-summary">
                <div className="ach-hero-summary__row">
                  <span className="tag">
                    Сейчас: уровень {displayHero.level} / {displayHero.max_level}
                  </span>
                  <strong className="ach-hero-summary__name">{currentTitle}</strong>
                </div>
                <p className="ach-hero-summary__meta">
                  Уроков с зачтёнными заданиями: <strong>{displayHero.lessons_passed}</strong> · Заданий:{" "}
                  <strong>{displayHero.tasks_passed}</strong>
                </p>
                {!displayHero.boss_golang_defeated && displayHero.next_level_title ? (
                  <p className="ach-hero-summary__next">
                    До «<strong>{displayHero.next_level_title}</strong>»: прогресс по текущему модулю —{" "}
                    <strong>{displayHero.progress_to_next_pct}%</strong>
                  </p>
                ) : (
                  <p className="ach-hero-summary__next ach-hero-summary__next--win">
                    <strong>Босс Go повержен.</strong> Ты на «{HERO_LEVEL_TITLES[5]}».
                  </p>
                )}
                <div className="ach-hero-summary__xp">
                  <div className="ach-hero-summary__xp-bar">
                    <div className="ach-hero-summary__xp-fill" style={{ width: `${displayHero.progress_to_next_pct}%` }} />
                  </div>
                </div>
              </div>

              <ol className="ach-levels-list">
                {HERO_LEVEL_RULES.map((row, i) => {
                  const unlocked = displayHero.level >= i + 1;
                  return (
                    <li key={row.title} className={`ach-levels-list__item${unlocked ? " ach-levels-list__item--done" : ""}`}>
                      <span className="ach-levels-list__num">{i + 1}</span>
                      <div className="ach-levels-list__text">
                        <span className="ach-levels-list__name">{row.title}</span>
                        <span className="ach-levels-list__rule">{row.rule}</span>
                      </div>
                      {unlocked ? <span className="ach-levels-list__ok">✓</span> : <span className="ach-levels-list__dot" />}
                    </li>
                  );
                })}
              </ol>

              <div className="ach-levels-panel__boss">
                <span className="ach-levels-panel__boss-ico" aria-hidden>
                  🐹
                </span>
                <div>
                  <div className="ach-levels-panel__boss-title">Финальный босс — язык Go</div>
                  <p className="ach-levels-panel__boss-desc">
                    Победи его, закрыв все модули и финальный проект. Тогда звание «Легенда Go» — твоё.
                  </p>
                </div>
                {displayHero.boss_golang_defeated ? (
                  <span className="ach-levels-panel__boss-tag ach-levels-panel__boss-tag--win">Победа</span>
                ) : (
                  <span className="ach-levels-panel__boss-tag">В бою</span>
                )}
              </div>

              <div className="ach-levels-panel__cta">
                <Link to="/course" className="btn-ach-courses">
                  МОИ КУРСЫ
                </Link>
              </div>
            </div>
          </section>

          <section className="ach-activity-compact card">
            <h3 className="ach-activity-compact__title">Активность</h3>
            <div className="ach-activity-compact__grid">
              <span>
                <strong>{visitStreak}</strong> дн. серия визитов
              </span>
              <span>
                <strong>{visitsTotal}</strong> дн. на платформе
              </span>
              <span>
                <strong>{visitsWeek}</strong>/7 с визитом
              </span>
              <span>
                <strong>{lessonsDone}</strong> уроков
              </span>
              <span>
                <strong>{tasksTotal}</strong> заданий всего
              </span>
              <span>
                <strong>{tasksWeek}</strong> зад. / 7 дн.
              </span>
              <span>
                <strong>{regularityPct}%</strong> регулярн.
              </span>
            </div>
          </section>
        </div>

        <aside className="achievements-layout__aside" aria-label="Достижения и серия визитов">
          <div className="ach-streak-card">
            <div className="ach-streak-card__icon" aria-hidden>
              💜
            </div>
            <div className="ach-streak-card__body">
              <div className="ach-streak-card__title">На связи</div>
              <p className="ach-streak-card__value">{ruDays(visitStreak)} подряд</p>
              <p className="ach-streak-card__hint">Заходи каждый день — растёт серия и открываются значки.</p>
            </div>
          </div>

          <section className="ach-aside-ach" id="achievements-badges" aria-labelledby="ach-aside-ach-heading">
            <div className="ach-aside-head">
              <h2 id="ach-aside-ach-heading" className="ach-aside-head__title">
                Достижения
              </h2>
              <Link to="/course" className="ach-aside-head__all">
                СМОТРЕТЬ ВСЕ
              </Link>
            </div>
            <ul className="ach-aside-ach-list">
              {badgeRows.map(({ def, unlocked }) => (
                <li key={def.id}>
                  <div
                    className={`ach-badge-card ach-badge-card--sidebar${
                      unlocked ? " ach-badge-card--unlocked" : " ach-badge-card--locked"
                    }`}
                  >
                    <div className="ach-badge-card__icon-wrap" aria-hidden>
                      {unlocked ? (
                        <span className="ach-badge-card__emoji">{def.icon}</span>
                      ) : (
                        <span className="ach-badge-card__lock" title="Закрыто">
                          🔒
                        </span>
                      )}
                    </div>
                    <div className="ach-badge-card__body">
                      <div className="ach-badge-card__title">{def.title}</div>
                      <p className="ach-badge-card__desc">{def.requirement}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <p className="profile-back ach-page-back">
        <Link to="/course">← К курсу</Link>
        {" · "}
        <Link to="/profile">Личный кабинет</Link>
      </p>
    </div>
  );
}
