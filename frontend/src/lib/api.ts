import type { CourseManifest, HeroLevelResult, Lesson } from "./types";

function sanitizeText(input: string): string {
  return input
    .replace(/A Tour of Go/gi, "")
    .replace(/Tour of Go/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function sanitizeHtml(input: string): string {
  return sanitizeText(
    input
      .replace(
        /<p>\s*<strong>\s*Оригинальная тема в A Tour of Go:\s*<\/strong>[\s\S]*?<\/p>/gi,
        ""
      )
      .replace(/<p>\s*Оригинальная тема в A Tour of Go:[\s\S]*?<\/p>/gi, "")
  );
}

function sanitizeManifest(manifest: CourseManifest): CourseManifest {
  return {
    ...manifest,
    title: sanitizeText(manifest.title),
    subtitle: sanitizeText(manifest.subtitle),
    intro_html: sanitizeHtml(manifest.intro_html),
    final_project: {
      ...manifest.final_project,
      title: sanitizeText(manifest.final_project.title),
      goals: manifest.final_project.goals.map(sanitizeText),
      hints: manifest.final_project.hints.map(sanitizeText),
    },
    modules: manifest.modules.map((module) => ({
      ...module,
      title: sanitizeText(module.title),
      description: sanitizeText(module.description),
      mini_project: {
        ...module.mini_project,
        title: sanitizeText(module.mini_project.title),
        why_it_matters: sanitizeText(module.mini_project.why_it_matters),
        scenario: sanitizeText(module.mini_project.scenario),
        steps: module.mini_project.steps.map(sanitizeText),
        deliverable: sanitizeText(module.mini_project.deliverable),
      },
      lessons: module.lessons.map((lessonRef) => ({
        ...lessonRef,
        title: sanitizeText(lessonRef.title),
      })),
    })),
  };
}

function sanitizeLesson(lesson: Lesson): Lesson {
  return {
    ...lesson,
    title: sanitizeText(lesson.title),
    theory_html: sanitizeHtml(lesson.theory_html),
    task: {
      ...lesson.task,
      description: sanitizeText(lesson.task.description),
    },
  };
}

export async function fetchManifest(): Promise<CourseManifest> {
  const r = await fetch("/api/course");
  if (!r.ok) throw new Error("Не удалось загрузить курс");
  const data = (await r.json()) as CourseManifest;
  return sanitizeManifest(data);
}

export async function fetchLesson(id: string): Promise<Lesson> {
  const r = await fetch(`/api/lessons/${encodeURIComponent(id)}`);
  if (!r.ok) throw new Error("Урок не найден");
  const data = (await r.json()) as Lesson;
  return sanitizeLesson(data);
}

export async function runSandbox(code: string): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  const r = await fetch("/api/sandbox/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  return r.json();
}

export async function checkTask(stdout: string, code: string, check: Lesson["task"]["check"]) {
  const r = await fetch("/api/lessons/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stdout, code, check }),
  });
  return r.json() as Promise<{ ok: boolean; reason: string }>;
}

export async function fetchHeroLevel(payload: {
  completed_lessons: Record<string, boolean>;
  final_project_done: boolean;
}): Promise<HeroLevelResult> {
  const r = await fetch("/api/hero-level/compute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      completed_lessons: payload.completed_lessons,
      final_project_done: payload.final_project_done,
    }),
  });
  if (!r.ok) throw new Error("hero-level");
  return r.json() as Promise<HeroLevelResult>;
}

export async function chatTutor(payload: {
  lesson_id: string;
  lesson_title: string;
  user_message: string;
  recent_transcript: string;
}): Promise<{ ok: boolean; reply: string; error?: string }> {
  const r = await fetch("/api/chat/tutor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.json();
}
