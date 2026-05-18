import type { CourseManifest } from './courseApi'
import { FINAL_COURSE_LESSON_ID } from './courseFinalLesson'

/** Карта урок → пройден ли (для POST /api/hero-level/compute). */
export function buildCompletedLessonsMap(manifest: CourseManifest, doneIds: Set<string>): Record<string, boolean> {
  const m: Record<string, boolean> = {}
  for (const mod of manifest.modules) {
    for (const lesson of mod.lessons) {
      m[lesson.id] = doneIds.has(lesson.id)
    }
  }
  if (manifest.final_project?.title) {
    m[FINAL_COURSE_LESSON_ID] = doneIds.has(FINAL_COURSE_LESSON_ID)
  }
  return m
}

export function countLessonsInManifest(manifest: CourseManifest): number {
  let n = manifest.modules.reduce((acc, mod) => acc + mod.lessons.length, 0)
  if (manifest.final_project?.title) n += 1
  return n
}
