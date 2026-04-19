import { Link, useOutletContext } from "react-router-dom";
import type { CourseManifest } from "@/lib/types";
import { getCourseCompletionStats } from "@/lib/courseProgress";
import { loadProgress } from "@/store/progress";

export function Dashboard() {
  const manifest = useOutletContext<CourseManifest>();
  const p = loadProgress();
  const stats = getCourseCompletionStats(manifest, p);

  return (
    <div className="shell shell--wide">
      <header style={{ marginBottom: "1rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.65rem", fontFamily: '"Raleway", Manrope, sans-serif' }}>{manifest.title}</h1>
        <p style={{ color: "var(--muted)", maxWidth: "48rem", lineHeight: 1.55 }}>{manifest.subtitle}</p>
      </header>

      <div className="grid2" style={{ marginBottom: "1.25rem" }}>
        <div className="card">
          <div className="tag">Прогресс</div>
          <p style={{ margin: "0.5rem 0 0", fontSize: "1.1rem" }}>
            Заданий в песочнице выполнено: <strong>{stats.doneLessons}</strong> / {stats.totalLessons}
          </p>
          <p style={{ margin: "0.5rem 0 0", color: "var(--muted)", fontSize: "0.92rem" }}>
            Урок засчитывается только после успешной проверки кода. Модули — на панели слева.
          </p>
        </div>
        <div className="card theory" dangerouslySetInnerHTML={{ __html: manifest.intro_html }} />
      </div>

      <div className="card">
        <div className="tag">Финиш курса</div>
        <p style={{ margin: "0.45rem 0 0" }}>
          <Link to="/final">{manifest.final_project.title}</Link>
        </p>
        <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.92rem" }}>{manifest.final_project.summary}</p>
      </div>
    </div>
  );
}
