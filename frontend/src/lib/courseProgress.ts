import type { CourseManifest } from "@/lib/types";
import type { ProgressState } from "@/store/progress";

export function getCourseCompletionStats(manifest: CourseManifest, p: ProgressState) {
  const lessonIds = manifest.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const totalLessons = lessonIds.length;
  const doneLessons = lessonIds.filter((id) => p.completedLessons[id]).length;
  const totalUnits = totalLessons + 1;
  const doneUnits = doneLessons + (p.finalProjectDone ? 1 : 0);
  const percent = totalUnits === 0 ? 0 : Math.round((doneUnits / totalUnits) * 100);
  return {
    totalLessons,
    doneLessons,
    totalUnits,
    doneUnits,
    percent,
    finalDone: p.finalProjectDone,
  };
}
