import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchLesson } from "@/lib/api";
import type { Lesson } from "@/lib/types";
import { CodePanel } from "@/components/lesson/CodePanel";
import { CodeWindow } from "@/components/lesson/CodeWindow";
import { isLessonTaskCompleted } from "@/store/progress";

export function LessonPage({ onProgress }: { onProgress: () => void }) {
  const { id } = useParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchLesson(id)
      .then(setLesson)
      .catch((e) => setErr(String(e.message || e)));
  }, [id]);

  if (err) {
    return (
      <div className="shell shell--wide">
        <p>{err}</p>
        <Link to="/course">Назад</Link>
      </div>
    );
  }
  if (!lesson) {
    return (
      <div className="shell shell--wide">
        <p>Грузим урок…</p>
      </div>
    );
  }

  const lessonDone = isLessonTaskCompleted(lesson.id);

  return (
    <div className="shell--wide lesson-layout">
      <div className="lesson-head">
        <Link to="/course" style={{ fontSize: "0.92rem" }}>
          ← К курсу
        </Link>
        <div className="lesson-head__title-row">
          <h1 style={{ margin: "0.4rem 0 0", fontSize: "1.35rem", fontFamily: '"Raleway", Manrope, sans-serif' }}>
            {lesson.title}
          </h1>
          {lessonDone ? (
            <span className="lesson-done-badge" title="Задание урока в песочнице выполнено">
              <span className="lesson-done-badge__check" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M8 12.5l2.5 2.5 5.5-6"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Пройдено
            </span>
          ) : null}
        </div>
        <p style={{ color: "var(--muted)", margin: "0.35rem 0 0", maxWidth: "52rem", fontSize: "0.95rem" }}>
          {lesson.summary}
        </p>
      </div>

      <div className="lesson-split">
        <div className="lesson-col lesson-col--theory">
          <div className="card theory" dangerouslySetInnerHTML={{ __html: lesson.theory_html }} />
          <div className="lesson-demo-wrap">
            <CodeWindow code={lesson.demo_code.trim()} lang="go" />
          </div>
        </div>

        <div className="lesson-col lesson-col--lab">
          <CodePanel lesson={lesson} onSolved={onProgress} />
        </div>
      </div>
    </div>
  );
}
