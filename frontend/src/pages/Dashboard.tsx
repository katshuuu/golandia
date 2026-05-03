import { Link, useOutletContext } from "react-router-dom";
import type { CourseManifest } from "@/lib/types";
import { getCourseCompletionStats } from "@/lib/courseProgress";
import { loadProgress, subscribeProgressStore } from "@/store/progress";
import { computeHeroLevelLocal, NOVICE_TITLE } from "@/lib/heroLevel";
import { useSyncExternalStore } from "react";

export function Dashboard() {
  const manifest = useOutletContext<CourseManifest>();
  const p = useSyncExternalStore(subscribeProgressStore, () => loadProgress(), () => loadProgress());
  const stats = getCourseCompletionStats(manifest, p);
  const hero = computeHeroLevelLocal(manifest, p);
  const heroTitle = hero.level === 0 ? hero.novice_title : hero.level_title || NOVICE_TITLE;

  return (
    <div className="shell shell--wide">
      <header style={{ marginBottom: "1rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.65rem", fontFamily: '"Raleway", Manrope, sans-serif' }}>{manifest.title}</h1>
        <p style={{ color: "var(--muted)", maxWidth: "48rem", lineHeight: 1.55 }}>{manifest.subtitle}</p>
      </header>

      <div className="grid2" style={{ marginBottom: "1.25rem" }}>
        <div className="card">
          <div className="tag">Прогресс</div>
          <p style={{ margin: "0.5rem 0 0", fontSize: "1.05rem" }}>
            Уровень: <strong>{hero.level}</strong> — <strong>{heroTitle}</strong>
            {hero.level > 0 && hero.next_level_title ? (
              <span style={{ color: "var(--muted)", fontWeight: 500 }}>
                {" "}
                · далее: «{hero.next_level_title}» ({hero.progress_to_next_pct}% текущего модуля)
              </span>
            ) : null}
            {hero.level === 0 && hero.next_level_title ? (
              <span style={{ color: "var(--muted)", fontWeight: 500 }}>
                {" "}
                · открой «{hero.next_level_title}», пройдя все уроки модуля M1
              </span>
            ) : null}
          </p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "1.1rem" }}>
            Уроков с зачтённой автопроверкой: <strong>{stats.doneLessons}</strong> / {stats.totalLessons}
          </p>
          <p style={{ margin: "0.5rem 0 0", color: "var(--muted)", fontSize: "0.92rem" }}>
            «{NOVICE_TITLE}» — по умолчанию. Новый уровень героя открывается, когда в модуле выполнены все задания в
            редакторе. Точка прогресса: серая — не сдан, зелёная — автопроверка пройдена.
          </p>
        </div>
        <div className="card theory" dangerouslySetInnerHTML={{ __html: manifest.intro_html }} />
      </div>

      <div className="card course-outline">
        <div className="tag">Содержание курса</div>
        <p className="course-outline__intro">
          Точка слева: серая — задание ещё не сдано, зелёная — автопроверка пройдена.
        </p>
        <div className="course-outline__modules">
          {manifest.modules.map((mod) => (
            <section key={mod.id} className="course-outline__mod">
              <h2 className="course-outline__mod-title">{mod.title}</h2>
              <ul className="course-outline__lessons">
                {mod.lessons.map((lesson) => {
                  const done = Boolean(p.completedLessons[lesson.id]);
                  return (
                    <li key={lesson.id}>
                      <Link to={`/lesson/${lesson.id}`} className="course-outline__lesson-link">
                        <span
                          className={`app-lesson-pass-dot course-outline__dot${done ? " app-lesson-pass-dot--done" : ""}`}
                          title={
                            done ? "Задание выполнено (автопроверка)" : "Не сдано — выполни задание в песочнице"
                          }
                          aria-label={done ? "Пройдено" : "Не пройдено"}
                        />
                        <span className="course-outline__lesson-title">{lesson.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="tag">Финиш курса</div>
        <p style={{ margin: "0.45rem 0 0" }}>
          <Link to="/final">{manifest.final_project.title}</Link>
        </p>
      </div>
    </div>
  );
}
