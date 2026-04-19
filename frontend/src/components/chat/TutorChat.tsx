import { useState } from "react";
import { chatTutor } from "@/lib/api";

export function TutorChat({ lessonId, lessonTitle, seeds }: { lessonId: string; lessonTitle: string; seeds: string[] }) {
  const [lines, setLines] = useState<{ role: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(text?: string) {
    const t = (text ?? input).trim();
    if (!t) return;
    setInput("");
    const next = [...lines, { role: "user" as const, text: t }];
    setLines(next);
    const recent = next.map((l) => `${l.role === "user" ? "Ученик" : "Репетитор"}: ${l.text}`).join("\n");
    setBusy(true);
    const res = await chatTutor({
      lesson_id: lessonId,
      lesson_title: lessonTitle,
      user_message: t,
      recent_transcript: recent,
    });
    setBusy(false);
    const reply = res.ok ? res.reply : `Ой: ${res.error || "сеть"}`;
    setLines((prev) => [...prev, { role: "bot", text: reply }]);
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
      <div>
        <div className="tag">LLM-репетитор (сократовский режим)</div>
        <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
          Он не выдаст готовый код за тебя — только вопросы и подсказки. Ниже — наводящие темы для разговора.
        </p>
      </div>
      <ul style={{ margin: 0, paddingLeft: "1.1rem", color: "var(--muted)", fontSize: "0.88rem" }}>
        {seeds.map((s) => (
          <li key={s}>
            <button type="button" className="btn btn-ghost" style={{ padding: 0, border: "none" }} onClick={() => send(s)}>
              {s}
            </button>
          </li>
        ))}
      </ul>
      <div className="chat">
        {lines.map((l, i) => (
          <div key={i} className={`bubble ${l.role === "user" ? "user" : "bot"}`}>
            {l.text}
          </div>
        ))}
        {busy && <div className="bubble bot">Думаю…</div>}
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          style={{
            flex: 1,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "#0a0e13",
            color: "var(--text)",
            padding: "0.55rem 0.75rem",
            fontFamily: "inherit",
          }}
          value={input}
          placeholder="Спроси своими словами…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => send()}>
          Отправить
        </button>
      </div>
    </div>
  );
}
