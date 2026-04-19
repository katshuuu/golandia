import type { CourseManifest, CourseModule } from "@/lib/types";

/** Шесть пунктов боковой панели: пять блоков курса + финальный проект. */
export const SIDEBAR_MODULES: Array<{
  key: string;
  label: string;
  /** id модулей из манифеста; пусто для служебного пункта */
  manifestModuleIds: string[];
  kind: "course" | "final";
}> = [
  { key: "m1", label: "Модуль 1", manifestModuleIds: ["m1"], kind: "course" },
  { key: "m2", label: "Модуль 2", manifestModuleIds: ["m2_1", "m2_2", "m2_3"], kind: "course" },
  { key: "m3", label: "Модуль 3", manifestModuleIds: ["m3"], kind: "course" },
  { key: "m4", label: "Модуль 4", manifestModuleIds: ["m4"], kind: "course" },
  { key: "m5", label: "Модуль 5", manifestModuleIds: ["m5"], kind: "course" },
  { key: "m6", label: "Модуль 6", manifestModuleIds: [], kind: "final" },
];

export function manifestModulesByIds(manifest: CourseManifest, ids: string[]): CourseModule[] {
  const map = new Map(manifest.modules.map((m) => [m.id, m]));
  return ids.map((id) => map.get(id)).filter(Boolean) as CourseModule[];
}

/** Какой пункт сайдбара подсвечивать для module_id урока. */
export function sidebarKeyForLessonModuleId(moduleId: string): string | undefined {
  if (moduleId === "m1") return "m1";
  if (moduleId === "m2_1" || moduleId === "m2_2" || moduleId === "m2_3") return "m2";
  if (moduleId === "m3") return "m3";
  if (moduleId === "m4") return "m4";
  if (moduleId === "m5") return "m5";
  return undefined;
}
