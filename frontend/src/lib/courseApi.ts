export type LessonRef = {
  id: string
  title: string
}

export type TaskCheck = {
  type: 'output' | 'contains' | 'regex' | 'forbidden' | string
  expected?: string
  contains?: string[]
  pattern?: string
  forbidden_substr?: string[]
}

export type CourseModule = {
  id: string
  title: string
  description: string
  lessons: LessonRef[]
}

export type FinalMiniProjectInManifest = {
  title: string
  goals?: string[]
  starter_code?: string
  check?: TaskCheck
}

export type CourseManifest = {
  title: string
  subtitle: string
  intro_html: string
  modules: CourseModule[]
  final_project?: FinalMiniProjectInManifest
}

export type BackendLessonTask = {
  description: string
  starter_code: string
  check: TaskCheck
}

export type BackendLesson = {
  id: string
  title: string
  theory_html: string
  demo_code: string
  task: BackendLessonTask
  module_id: string
  order: number
}

export type SandboxRunResult = {
  ok: boolean
  stdout: string
  stderr: string
}

export type CheckResult = {
  ok: boolean
  reason: string
}

async function fetchJson<T>(path: string, label: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`${label}: ${response.status} ${response.statusText}`)
  }
  return (await response.json()) as T
}

export async function fetchManifest(): Promise<CourseManifest> {
  return fetchJson<CourseManifest>('/api/course', 'Ошибка загрузки манифеста')
}

export async function fetchLesson(id: string): Promise<BackendLesson> {
  return fetchJson<BackendLesson>(`/api/lessons/${encodeURIComponent(id)}`, `Ошибка загрузки урока ${id}`)
}

export async function runSandbox(code: string): Promise<SandboxRunResult> {
  const response = await fetch('/api/sandbox/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  if (!response.ok) {
    throw new Error(`Ошибка песочницы: ${response.status} ${response.statusText}`)
  }
  return (await response.json()) as SandboxRunResult
}

export async function checkLesson(stdout: string, code: string, check: TaskCheck): Promise<CheckResult> {
  const response = await fetch('/api/lessons/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stdout, code, check }),
  })
  if (!response.ok) {
    throw new Error(`Ошибка проверки: ${response.status} ${response.statusText}`)
  }
  return (await response.json()) as CheckResult
}

export type HeroLevelResult = {
  level: number
  level_title: string
  lessons_passed: number
  tasks_passed: number
  max_level: number
  next_level_title: string
  progress_to_next_pct: number
  boss_golang_defeated: boolean
  formula_version: string
  novice_title: string
}

export async function computeHeroLevel(
  completedLessons: Record<string, boolean>,
  finalProjectDone: boolean,
): Promise<HeroLevelResult> {
  const response = await fetch('/api/hero-level/compute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      completed_lessons: completedLessons,
      final_project_done: finalProjectDone,
    }),
  })
  if (!response.ok) {
    throw new Error(`Ошибка расчёта уровня: ${response.status} ${response.statusText}`)
  }
  return (await response.json()) as HeroLevelResult
}

export type TutorChatResponse = {
  ok?: boolean
  reply?: string
  error?: string
}

export async function tutorChat(payload: {
  message: string
  lessonTitle: string
  lesson_id: string
  userCode?: string
  codeOutput?: string
  history: Array<{ role: string; content: string }>
}): Promise<TutorChatResponse> {
  const response = await fetch('/api/chat/tutor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = (await response.json()) as TutorChatResponse
  return data
}
