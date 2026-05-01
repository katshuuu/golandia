import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import type { CourseManifest } from "@/lib/types";
import { checkTask, runSandbox } from "@/lib/api";
import { useCelebrate } from "@/context/CelebrationContext";
import { collectNewGamificationEvents } from "@/lib/gamificationEvents";
import { loadProgress, markFinalDone } from "@/store/progress";
import { TutorChat } from "@/components/chat/TutorChat";

export function FinalProject() {
  const manifest = useOutletContext<CourseManifest>();
  const celebrate = useCelebrate();
  const fp = manifest.final_project;
  const [code, setCode] = useState(fp.starter_code);
  const [out, setOut] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function verify() {
    setMsg(null);
    const res = await runSandbox(code);
    const text = (res.stdout || "") + (res.stderr ? "\n" + res.stderr : "");
    setOut(text.trimEnd());
    const chk = await checkTask(res.stdout || "", code, fp.check);
    if (chk.ok) {
      if (loadProgress().finalProjectDone) return;
      setMsg("Бот-заготовка прошла проверку. Дальше — BotFather, токен в .env и деплой, но это уже вне песочницы.");
      const before = loadProgress();
      markFinalDone();
      const after = loadProgress();
      celebrate(collectNewGamificationEvents(before, after, manifest));
    } else {
      setMsg(chk.reason);
    }
  }

  return (
    <div className="shell shell--wide">
      <Link to="/course" style={{ fontSize: "0.92rem" }}>
        ← К курсу
      </Link>
      <h1 style={{ marginTop: "0.75rem", fontFamily: '"Raleway", Manrope, sans-serif' }}>{fp.title}</h1>
      <ul>
        {fp.goals.map((g) => (
          <li key={g}>{g}</li>
        ))}
      </ul>
      <div className="grid2" style={{ marginTop: "1rem" }}>
        <div className="card">
          <div className="tag">Стартовый код</div>
          <textarea className="editor" style={{ minHeight: "280px" }} value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} />
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button type="button" className="btn" onClick={async () => setOut((await runSandbox(code)).stdout || "")}>
              Запустить
            </button>
            <button type="button" className="btn btn-primary" onClick={verify}>
              Проверить мини-проект
            </button>
          </div>
          <pre className="out" style={{ marginTop: "0.5rem" }}>
            {out}
          </pre>
          {msg && <p style={{ color: "var(--accent)" }}>{msg}</p>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="card">
            <div className="tag">Подсказки (не спойлеры)</div>
            <ul style={{ color: "var(--muted)" }}>
              {fp.hints.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
          <TutorChat
            lessonId="final-telegram-bot"
            lessonTitle={fp.title}
            seeds={["Как спрятать токен?", "Что такое long polling простыми словами?", "Как разбить main на функции?"]}
          />
        </div>
      </div>
    </div>
  );
}
