import type { CourseManifest, HeroLevelResult } from "@/lib/types";
import type { ProgressState } from "@/store/progress";
import { manifestModulesByIds, SIDEBAR_MODULES } from "@/lib/sidebarModules";

/** Шесть уровней героя — совпадают с бэкендом `hero.LevelTitles`. */
export const HERO_LEVEL_TITLES = [
  "Маэстро",
  "Интеллектуал",
  "Профессор",
  "Чемпион",
  "Академик",
  "Легенда Go",
] as const;

/** Уровень по умолчанию до завершения первого модуля целиком. */
export const NOVICE_TITLE = "Стажёр";
export const FORMULA_VERSION = "v1";

function lessonIdsForSidebarKey(key: string, manifest: CourseManifest): string[] {
  const def = SIDEBAR_MODULES.find((s) => s.key === key);
  if (!def || def.kind === "final") return [];
  const blocks = manifestModulesByIds(manifest, def.manifestModuleIds);
  return blocks.flatMap((m) => m.lessons.map((l) => l.id));
}

function sidebarComplete(
  sidebarKey: string,
  manifest: CourseManifest,
  p: ProgressState,
): boolean {
  const def = SIDEBAR_MODULES.find((s) => s.key === sidebarKey);
  if (!def) return false;
  if (def.kind === "final") return p.finalProjectDone;
  const ids = lessonIdsForSidebarKey(sidebarKey, manifest);
  return ids.length > 0 && ids.every((id) => p.completedLessons[id]);
}

/** Локальный расчёт (та же логика, что на бэкенде) — если API недоступен. */
export function computeHeroLevelLocal(manifest: CourseManifest, p: ProgressState): HeroLevelResult {
  let n = 0;
  for (const sm of SIDEBAR_MODULES) {
    if (!sidebarComplete(sm.key, manifest, p)) break;
    n++;
  }

  const lessonsPassed = Object.values(p.completedLessons).filter(Boolean).length;
  let progressToNextPct = 100;

  for (const sm of SIDEBAR_MODULES) {
    if (sidebarComplete(sm.key, manifest, p)) continue;
    if (sm.kind === "final") {
      progressToNextPct = p.finalProjectDone ? 100 : 0;
      break;
    }
    const ids = lessonIdsForSidebarKey(sm.key, manifest);
    if (ids.length === 0) {
      progressToNextPct = 0;
      break;
    }
    const done = ids.filter((id) => p.completedLessons[id]).length;
    progressToNextPct = Math.floor((done * 100) / ids.length);
    break;
  }

  const bossDefeated = n >= 6;
  const out: HeroLevelResult = {
    level: n,
    level_title: n === 0 ? "" : HERO_LEVEL_TITLES[n - 1] ?? "",
    lessons_passed: lessonsPassed,
    tasks_passed: lessonsPassed,
    max_level: 6,
    next_level_title: n < 6 ? HERO_LEVEL_TITLES[n] ?? "" : "",
    progress_to_next_pct: progressToNextPct,
    boss_golang_defeated: bossDefeated,
    formula_version: FORMULA_VERSION,
    novice_title: NOVICE_TITLE,
  };

  if (n === 0 && !out.next_level_title) {
    out.next_level_title = HERO_LEVEL_TITLES[0] ?? "";
  }
  return out;
}
