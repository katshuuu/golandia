const KEY = "go-llm-tutor-progress-v1";

export type ProgressState = {
  completedLessons: Record<string, boolean>;
  finalProjectDone: boolean;
  streakDays: number;
  lastActiveDate: string | null;
  totalActiveDays: number;
  mainGoal: string;
  /** Уникальные дни захода на платформу (YYYY-MM-DD), для геймификации */
  visitDays: string[];
  /** Сколько заданий (уроков) сдано за день — ключ дата */
  tasksPerDay: Record<string, number>;
};

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function dayDiff(from: string, to: string) {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  return Math.floor((b - a) / (24 * 60 * 60 * 1000));
}

function defaults(): ProgressState {
  return {
    completedLessons: {},
    finalProjectDone: false,
    streakDays: 0,
    lastActiveDate: null,
    totalActiveDays: 0,
    mainGoal: "Хочу уверенно писать на Go и собрать своего бота.",
    visitDays: [],
    tasksPerDay: {},
  };
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const p = JSON.parse(raw) as ProgressState;
    const d = defaults();
    return {
      completedLessons: p.completedLessons ?? d.completedLessons,
      finalProjectDone: Boolean(p.finalProjectDone),
      streakDays: Number.isFinite(p.streakDays) ? Math.max(0, p.streakDays) : d.streakDays,
      lastActiveDate: typeof p.lastActiveDate === "string" ? p.lastActiveDate : d.lastActiveDate,
      totalActiveDays: Number.isFinite(p.totalActiveDays) ? Math.max(0, p.totalActiveDays) : d.totalActiveDays,
      mainGoal: typeof p.mainGoal === "string" && p.mainGoal.trim() ? p.mainGoal : d.mainGoal,
      visitDays: Array.isArray(p.visitDays) ? p.visitDays.filter((x) => typeof x === "string").sort() : d.visitDays,
      tasksPerDay:
        p.tasksPerDay && typeof p.tasksPerDay === "object" && !Array.isArray(p.tasksPerDay)
          ? (p.tasksPerDay as Record<string, number>)
          : d.tasksPerDay,
    };
  } catch {
    return defaults();
  }
}

export function saveProgress(p: ProgressState) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function updateMainGoal(goal: string) {
  const p = loadProgress();
  p.mainGoal = goal.trim() || defaults().mainGoal;
  saveProgress(p);
}

/** Засчитать визит на платформу (не чаще одного раза в календарный день). */
export function recordPlatformVisit() {
  const p = loadProgress();
  const today = todayStamp();
  if (!p.visitDays.includes(today)) {
    p.visitDays = [...p.visitDays, today].sort();
    saveProgress(p);
  }
}

/** Число уроков с засчитанным заданием. */
export function completedLessonCount(p: ProgressState): number {
  return Object.values(p.completedLessons).filter(Boolean).length;
}

/** Всего сданных заданий (уроки + финал по дням в tasksPerDay). */
export function totalSubmittedTasks(p: ProgressState): number {
  let n = 0;
  for (const v of Object.values(p.tasksPerDay)) n += Number(v) || 0;
  return n;
}

/**
 * Текущая серия подряд календарных дней с визитом на платформу.
 * Если сегодня ещё не заходили, считается от вчера (серия не оборвана до конца дня).
 * Даты в visitDays в том же формате, что и todayStamp() (UTC YYYY-MM-DD).
 */
export function consecutiveVisitStreak(p: ProgressState): number {
  const set = new Set(p.visitDays);
  if (set.size === 0) return 0;
  const today = todayStamp();
  const y = new Date();
  y.setUTCDate(y.getUTCDate() - 1);
  const yesterday = y.toISOString().slice(0, 10);

  let anchor = today;
  if (!set.has(today)) {
    if (!set.has(yesterday)) return 0;
    anchor = yesterday;
  }

  const [ay, am, ad] = anchor.split("-").map(Number);
  const d = new Date(Date.UTC(ay, am - 1, ad));
  let count = 0;
  for (let guard = 0; guard < 400; guard++) {
    const stamp = d.toISOString().slice(0, 10);
    if (!set.has(stamp)) break;
    count++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return count;
}

// Отмечает ежедневный вход. Если день пропущен, серия сбрасывается в 0.
export function touchDailyProgress(): ProgressState {
  const p = loadProgress();
  const today = todayStamp();
  if (!p.lastActiveDate) {
    p.streakDays = 1;
    p.totalActiveDays += 1;
    p.lastActiveDate = today;
    saveProgress(p);
    return p;
  }

  const diff = dayDiff(p.lastActiveDate, today);
  if (diff <= 0) return p;

  p.totalActiveDays += 1;
  if (diff === 1) {
    p.streakDays += 1;
  } else {
    p.streakDays = 0;
  }
  p.lastActiveDate = today;
  saveProgress(p);
  return p;
}

/** Урок считается пройденным только после успешной проверки задания в песочнице. */
export function isLessonTaskCompleted(lessonId: string): boolean {
  return Boolean(loadProgress().completedLessons[lessonId]);
}

export function markLessonDone(id: string) {
  const p = touchDailyProgress();
  p.completedLessons[id] = true;
  const today = todayStamp();
  p.tasksPerDay[today] = (p.tasksPerDay[today] ?? 0) + 1;
  saveProgress(p);
}

export function markFinalDone() {
  const p = touchDailyProgress();
  p.finalProjectDone = true;
  const today = todayStamp();
  p.tasksPerDay[today] = (p.tasksPerDay[today] ?? 0) + 1;
  saveProgress(p);
}
