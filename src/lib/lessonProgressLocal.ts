/**
 * Локальный учёт сданных уроков (автопроверка в песочнице), если в Supabase нет task по lesson_id.
 * Хранится на пользователя отдельно.
 */
export const LESSON_PROGRESS_EVENT = 'golandia-lesson-progress';

const legacyKeyGlobal = 'go-tutor-lesson-sandbox-done-v1';

function keyFor(userId: string): string {
  return `go-tutor-lesson-sandbox-done-by-user-v1:${userId}`;
}

function readRaw(storageKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function persist(userId: string, ids: Set<string>): void {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify([...ids]));
  } catch {
    /* quota */
  }
}

/** Одноразовый перенос старого ключа без суффикса пользователя */
function migrateLegacyIfNeeded(userId: string): Set<string> {
  const scoped = readRaw(keyFor(userId));
  if (scoped.size > 0) return scoped;
  const legacy = readRaw(legacyKeyGlobal);
  if (legacy.size === 0) return new Set();
  persist(userId, legacy);
  try {
    localStorage.removeItem(legacyKeyGlobal);
  } catch {
    /* ignore */
  }
  return legacy;
}

export function readLocalSandboxDoneLessonIds(userId: string): Set<string> {
  if (!userId) return new Set();
  return migrateLegacyIfNeeded(userId);
}

export function markLocalSandboxLessonDone(lessonId: string, userId: string): void {
  if (!userId) return;
  const s = migrateLegacyIfNeeded(userId);
  if (s.has(lessonId)) {
    window.dispatchEvent(new Event(LESSON_PROGRESS_EVENT));
    return;
  }
  s.add(lessonId);
  persist(userId, s);
  window.dispatchEvent(new Event(LESSON_PROGRESS_EVENT));
}

export function isLessonDoneForSidebar(
  lessonId: string,
  taskIds: string[],
  solvedTaskIds: Set<string>,
  localSandboxDone: Set<string>,
): boolean {
  if (taskIds.length > 0) {
    return taskIds.every((id) => solvedTaskIds.has(id));
  }
  return localSandboxDone.has(lessonId);
}
