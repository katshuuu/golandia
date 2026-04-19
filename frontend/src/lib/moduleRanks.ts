import type { CourseManifest } from "@/lib/types";
import type { ProgressState } from "@/store/progress";
import { manifestModulesByIds, SIDEBAR_MODULES } from "@/lib/sidebarModules";

/**
 * Звания по модулям (в духе карточек ЛК СМИТАП: акцент #ffa552, «шаги» обучения).
 * Ключ = пункт сайдбара m1…m6.
 */
export const MODULE_RANKS: Array<{
  sidebarKey: string;
  label: string;
  /** Подзаголовок в стиле подписи к курсу на платформе */
  blurb: string;
}> = [
  {
    sidebarKey: "m1",
    label: "Маэстро",
    blurb: "Первый модуль закрыт — ты задаёшь темп всему туру.",
  },
  {
    sidebarKey: "m2",
    label: "Интеллектуал",
    blurb: "Основы в кармане: думаешь кодом и не путаешься в синтаксисе.",
  },
  {
    sidebarKey: "m3",
    label: "Профессор",
    blurb: "Абстракции и интерфейсы — ты объясняешь машине, что делать.",
  },
  {
    sidebarKey: "m4",
    label: "Чемпион",
    blurb: "Обобщения покорены — ты собираешь конструкции как конструктор.",
  },
  {
    sidebarKey: "m5",
    label: "Академик",
    blurb: "Горутины и каналы — параллельный мир Go тебе подчиняется.",
  },
  {
    sidebarKey: "m6",
    label: "Легенда Go",
    blurb: "Финальный босс повержен — язык Go признал тебя своим героем.",
  },
];

export function isSidebarModuleComplete(
  sidebarKey: string,
  manifest: CourseManifest,
  p: ProgressState,
): boolean {
  const def = SIDEBAR_MODULES.find((s) => s.key === sidebarKey);
  if (!def) return false;
  if (def.kind === "final") return p.finalProjectDone;
  const blocks = manifestModulesByIds(manifest, def.manifestModuleIds);
  for (const mod of blocks) {
    for (const l of mod.lessons) {
      if (!p.completedLessons[l.id]) return false;
    }
  }
  return true;
}

export function countTasksLastNDays(p: ProgressState, n: number): number {
  const today = new Date();
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const stamp = d.toISOString().slice(0, 10);
    sum += p.tasksPerDay[stamp] ?? 0;
  }
  return sum;
}

export function countVisitDaysLastNDays(p: ProgressState, n: number): number {
  const want = new Set<string>();
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    want.add(d.toISOString().slice(0, 10));
  }
  return p.visitDays.filter((d) => want.has(d)).length;
}
