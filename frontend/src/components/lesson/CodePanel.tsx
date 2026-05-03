import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { CourseManifest, Lesson } from "@/lib/types";
import { checkTask, runSandbox } from "@/lib/api";
import { useCelebrate } from "@/context/CelebrationContext";
import { collectNewGamificationEvents } from "@/lib/gamificationEvents";
import { pickRandomPraise, praiseForLessonId } from "@/lib/praise";
import { isLessonTaskCompleted, loadProgress, markLessonDone } from "@/store/progress";

function TaskDoneRibbon() {
  return (
    <div className="task-done-ribbon" role="status">
      <span className="task-done-ribbon__icon" aria-hidden>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
          <path
            d="M8 12.5l2.5 2.5 5.5-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="task-done-ribbon__text">Задание выполнено — проверка пройдена</span>
    </div>
  );
}

function SandboxPraise({ text }: { text: string }) {
  return (
    <div className="sandbox-praise">
      <div className="sandbox-praise__kicker">Ты молодец</div>
      <p className="sandbox-praise__text">{text}</p>
    </div>
  );
}

export function CodePanel({
  lesson,
  onSolved,
  className,
  onDraftDirtyChange,
}: {
  lesson: Lesson;
  onSolved?: () => void;
  className?: string;
  /** Вызывается при изменении черновика относительно starter_code урока. */
  onDraftDirtyChange?: (dirty: boolean) => void;
}) {
  const [code, setCode] = useState(lesson.task.starter_code);
  const [out, setOut] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  /** Фраза сразу после успешной проверки (случайная); сбрасывается при смене урока. */
  const [freshPraise, setFreshPraise] = useState<string | null>(null);
  const manifest = useOutletContext<CourseManifest>();
  const celebrate = useCelebrate();

  const taskComplete = isLessonTaskCompleted(lesson.id);

  useEffect(() => {
    setFreshPraise(null);
    setCode(lesson.task.starter_code);
    setOut("");
    setMsg(null);
  }, [lesson.id]);

  useEffect(() => {
    const dirty = code !== lesson.task.starter_code;
    onDraftDirtyChange?.(dirty);
  }, [code, lesson.task.starter_code, lesson.id, onDraftDirtyChange]);

  async function run() {
    setMsg(null);
    const res = await runSandbox(code);
    const text = (res.stdout || "") + (res.stderr ? (res.stdout ? "\n" : "") + res.stderr : "");
    setOut(text.trimEnd());
    if (!res.ok) {
      setMsg("Компилятор/рантайм ругается — это нормально. Прочитай stderr и поправь.");
    }
  }

  async function verify() {
    setMsg(null);
    const res = await runSandbox(code);
    const text = (res.stdout || "") + (res.stderr ? "\n" + res.stderr : "");
    setOut(text.trimEnd());
    const chk = await checkTask(res.stdout || "", code, lesson.task.check);
    if (chk.ok) {
      if (loadProgress().completedLessons[lesson.id]) return;
      setFreshPraise(pickRandomPraise());
      setMsg(null);
      const before = loadProgress();
      markLessonDone(lesson.id);
      const after = loadProgress();
      celebrate(collectNewGamificationEvents(before, after, manifest));
      onSolved?.();
    } else {
      setMsg(`Почти: ${chk.reason}. Поправь код и попробуй снова.`);
    }
  }

  const praiseText = freshPraise ?? (taskComplete ? praiseForLessonId(lesson.id) : null);
  const taskDescription =
    String(lesson.task.description ?? "").trim() ||
    `Задание: отредактируй код ниже под тему урока «${lesson.title}» и нажми «Проверить задание».`;

  return (
    <div
      className={`card lab-code-panel${taskComplete ? " lab-code-panel--done" : ""}${className ? ` ${className}` : ""}`}
      style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
    >
      {taskComplete ? <TaskDoneRibbon /> : null}

      <div>
        <div className="tag">Песочница</div>
        <p style={{ margin: "0.35rem 0 0", color: "var(--muted)" }}>{taskDescription}</p>
      </div>
      <textarea className="editor" value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} />
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button type="button" className="btn" onClick={run}>
          Запустить
        </button>
        <button
          type="button"
          className={taskComplete ? "btn btn-ghost" : "btn btn-primary"}
          onClick={verify}
          disabled={taskComplete}
          title={taskComplete ? "Задание уже выполнено" : undefined}
        >
          {taskComplete ? "Задание принято ✓" : "Проверить задание"}
        </button>
      </div>
      <div>
        <div className="tag">Вывод</div>
        <pre className="out" style={{ marginTop: "0.35rem" }}>
          {out || "…тишина консоли…"}
        </pre>
      </div>
      {msg && (
        <p
          style={{
            margin: 0,
            color: "var(--warn)",
          }}
        >
          {msg}
        </p>
      )}
      {taskComplete && praiseText ? <SandboxPraise text={praiseText} /> : null}
    </div>
  );
}
