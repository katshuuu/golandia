import { Link } from "react-router-dom";

export function CourseIntro({ html }: { html: string }) {
  return (
    <div className="shell">
      <header style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ margin: 0, fontSize: "2rem" }}>Ты зашёл не в химию — в Go</h1>
        <p style={{ color: "var(--muted)", maxWidth: "52rem", lineHeight: 1.55 }}>
          Здесь мемы, песочница и репетитор, который задаёт вопросы вместо списывания. Сначала — вводный теплый-up, потом модули как уровни в
          игре.
        </p>
      </header>
      <div className="card theory" dangerouslySetInnerHTML={{ __html: html }} />
      <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Link to="/course" className="btn btn-primary">
          Поехали на карту курса
        </Link>
        <Link to="/final" className="btn">
          Сразу к финальному боту
        </Link>
      </div>
    </div>
  );
}
