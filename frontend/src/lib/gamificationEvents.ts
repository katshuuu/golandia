import type { CourseManifest } from "@/lib/types";
import type { ProgressState } from "@/store/progress";
import { computeHeroLevelLocal, HERO_LEVEL_TITLES } from "@/lib/heroLevel";
import {
  isPlatformAchievementUnlocked,
  PLATFORM_ACHIEVEMENTS,
  type PlatformAchievementDef,
} from "@/lib/platformAchievements";

export type GamificationEvent =
  | { type: "hero_level"; level: number; title: string }
  | { type: "achievement"; achievement: PlatformAchievementDef };

/**
 * Награды, которые только что стали доступны (сравнение состояния до и после сохранения прогресса).
 */
export function collectNewGamificationEvents(
  prev: ProgressState,
  next: ProgressState,
  manifest: CourseManifest,
): GamificationEvent[] {
  const out: GamificationEvent[] = [];

  const hBefore = computeHeroLevelLocal(manifest, prev).level;
  const hAfter = computeHeroLevelLocal(manifest, next).level;
  for (let L = hBefore + 1; L <= hAfter; L++) {
    const title = HERO_LEVEL_TITLES[L - 1];
    if (title) out.push({ type: "hero_level", level: L, title });
  }

  for (const def of PLATFORM_ACHIEVEMENTS) {
    if (!isPlatformAchievementUnlocked(def.id, prev) && isPlatformAchievementUnlocked(def.id, next)) {
      out.push({ type: "achievement", achievement: def });
    }
  }

  return out;
}
