import { useMemo, useState } from "react";
import { loadProgress, touchDailyProgress, updateMainGoal } from "@/store/progress";

function gopherStage(streakDays: number) {
  if (streakDays <= 0) {
    return {
      emoji: "🍼",
      title: "Малыш Gopher в чепчике",
      text: "Серия сброшена. Ничего страшного: сегодня новый старт.",
      nextAt: 1,
    };
  }
  if (streakDays < 7) {
    return {
      emoji: "🧢",
      title: "Gopher-новичок",
      text: "Ты уже на тропе. Еще чуть-чуть — и первая большая остановка.",
      nextAt: 7,
    };
  }
  if (streakDays < 14) {
    return {
      emoji: "🎒",
      title: "Gopher-скаут",
      text: "Уже держишь ритм. Навык становится привычкой.",
      nextAt: 14,
    };
  }
  if (streakDays < 21) {
    return {
      emoji: "🗺️",
      title: "Gopher-путешественник",
      text: "Ты прошел большой кусок пути и реально растешь в коде.",
      nextAt: 21,
    };
  }
  if (streakDays < 30) {
    return {
      emoji: "🧭",
      title: "Gopher-исследователь",
      text: "Ты почти у взрослого уровня. Не сбавляй темп.",
      nextAt: 30,
    };
  }
  return {
    emoji: "🏆",
    title: "Gopher-подросток разработчик",
    text: "30+ дней подряд. Это уже дисциплина настоящего инженера.",
    nextAt: null as number | null,
  };
}

export function MotivationPanel({ compact = false }: { compact?: boolean }) {
  const [progress, setProgress] = useState(() => touchDailyProgress());
  const [draft, setDraft] = useState(progress.mainGoal);
  const stage = useMemo(() => gopherStage(progress.streakDays), [progress.streakDays]);
  const distance = progress.streakDays;
  const nextDistance = stage.nextAt ?? progress.streakDays;
  const pct = stage.nextAt ? Math.min(100, Math.round((progress.streakDays / stage.nextAt) * 100)) : 100;

  function saveGoal() {
    updateMainGoal(draft);
    setProgress(loadProgress());
  }

  return (
    <div className="card">
      <div className="tag">Мотивация и прогресс</div>
      <h3 style={{ margin: "0.5rem 0 0.4rem" }}>
        {stage.emoji} {stage.title}
      </h3>
      <p style={{ margin: "0 0 0.5rem", color: "var(--muted)" }}>{stage.text}</p>

      <p style={{ margin: "0.15rem 0" }}>
        <strong>Серия дней:</strong> {progress.streakDays}
      </p>
      <p style={{ margin: "0.15rem 0" }}>
        <strong>Путь Gopher:</strong> {distance} км по карте Go-похода
      </p>
      {!compact && (
        <p style={{ margin: "0.15rem 0", color: "var(--muted)" }}>
          Всего активных дней на платформе: {progress.totalActiveDays}
        </p>
      )}

      <div style={{ marginTop: "0.55rem", marginBottom: "0.35rem", fontSize: "0.85rem", color: "var(--muted)" }}>
        До следующего этапа: {stage.nextAt ? `${nextDistance - progress.streakDays} дн.` : "максимальный этап"}
      </div>
      <div style={{ height: "10px", borderRadius: "999px", background: "#0d1320", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #2dd4bf, #22d3ee)" }} />
      </div>

      <div style={{ marginTop: "0.85rem" }}>
        <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "0.35rem" }}>Зачем я этим занимаюсь?</div>
        <textarea
          className="editor"
          style={{ minHeight: compact ? "90px" : "110px" }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
        />
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-primary" onClick={saveGoal}>
            Сохранить цель
          </button>
          <button type="button" className="btn" onClick={() => setDraft("Хочу уверенно писать на Go и собрать своего бота.")}>
            Поставить цель по умолчанию
          </button>
        </div>
      </div>
    </div>
  );
}
