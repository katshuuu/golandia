/** Локальный учёт сданных уроков (успешная автопроверка в песочнице). */
export const LESSON_PROGRESS_EVENT = 'kursovaya-lesson-progress'

const legacyKeyGlobal = 'kursovaya-lesson-sandbox-done-v1'

function keyFor(userId: string): string {
  return `kursovaya-lesson-sandbox-done-by-user-v1:${userId}`
}

function readRaw(storageKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return new Set()
    return new Set(arr.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

function persist(userId: string, ids: Set<string>): void {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify([...ids]))
  } catch {
    /* quota */
  }
}

function migrateLegacyIfNeeded(userId: string): Set<string> {
  const scoped = readRaw(keyFor(userId))
  if (scoped.size > 0) return scoped
  const legacy = readRaw(legacyKeyGlobal)
  if (legacy.size === 0) return new Set()
  persist(userId, legacy)
  try {
    localStorage.removeItem(legacyKeyGlobal)
  } catch {
    /* ignore */
  }
  return legacy
}

export function readLocalSandboxDoneLessonIds(userId: string): Set<string> {
  if (!userId || userId === 'anonymous') return new Set()
  return migrateLegacyIfNeeded(userId)
}

export function markLocalSandboxLessonDone(lessonId: string, userId: string): void {
  if (!userId || userId === 'anonymous') return
  const s = migrateLegacyIfNeeded(userId)
  if (s.has(lessonId)) {
    window.dispatchEvent(new Event(LESSON_PROGRESS_EVENT))
    return
  }
  s.add(lessonId)
  persist(userId, s)
  window.dispatchEvent(new Event(LESSON_PROGRESS_EVENT))
}
