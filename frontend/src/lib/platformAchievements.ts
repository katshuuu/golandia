import type { ProgressState } from "@/store/progress";
import {
  completedLessonCount,
  consecutiveVisitStreak,
  totalSubmittedTasks,
} from "@/store/progress";

export type PlatformAchievementDef = {
  id: string;
  title: string;
  /** Подпись под заголовком (условие). */
  requirement: string;
  icon: string;
};

export const PLATFORM_ACHIEVEMENTS: PlatformAchievementDef[] = [
  {
    id: "streak-2",
    title: "Пешеход",
    requirement: "Заходите на платформу 2 дня подряд.",
    icon: "🪜",
  },
  {
    id: "streak-7",
    title: "Бегун",
    requirement: "Заходите на платформу 7 дней подряд.",
    icon: "🏃",
  },
  {
    id: "streak-14",
    title: "Полумарафонец",
    requirement: "Заходите на платформу 14 дней подряд.",
    icon: "🏃‍♂️",
  },
  {
    id: "streak-30",
    title: "Марафонец",
    requirement: "Заходите на платформу 30 дней подряд.",
    icon: "🏅",
  },
  {
    id: "lessons-1",
    title: "Начало положено",
    requirement: "Пройдите свой первый урок.",
    icon: "📘",
  },
  {
    id: "lessons-5",
    title: "Преданный гофер",
    requirement: "Пройдите пять уроков.",
    icon: "🐹",
  },
  {
    id: "tasks-5",
    title: "Сотрудник недели",
    requirement: "Выполните пять заданий.",
    icon: "📋",
  },
  {
    id: "tasks-10",
    title: "Выпишите премию",
    requirement: "Выполните 10 заданий.",
    icon: "💰",
  },
  {
    id: "tasks-50",
    title: "Сотрудник года",
    requirement: "Выполните 50 заданий.",
    icon: "🏆",
  },
];

export function isPlatformAchievementUnlocked(id: string, p: ProgressState): boolean {
  const streak = consecutiveVisitStreak(p);
  const lessons = completedLessonCount(p);
  const tasks = totalSubmittedTasks(p);
  switch (id) {
    case "streak-2":
      return streak >= 2;
    case "streak-7":
      return streak >= 7;
    case "streak-14":
      return streak >= 14;
    case "streak-30":
      return streak >= 30;
    case "lessons-1":
      return lessons >= 1;
    case "lessons-5":
      return lessons >= 5;
    case "tasks-5":
      return tasks >= 5;
    case "tasks-10":
      return tasks >= 10;
    case "tasks-50":
      return tasks >= 50;
    default:
      return false;
  }
}

export function platformAchievementStatuses(p: ProgressState): Array<{
  def: PlatformAchievementDef;
  unlocked: boolean;
}> {
  return PLATFORM_ACHIEVEMENTS.map((def) => ({
    def,
    unlocked: isPlatformAchievementUnlocked(def.id, p),
  }));
}
