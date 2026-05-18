import type { CourseManifest, LessonRef } from './courseApi'
import { FINAL_COURSE_LESSON_ID } from './courseFinalLesson'

export function parseModuleNumFromManifestId(moduleId: string): number {
  const m = moduleId.match(/^m(\d+)/)
  return m ? Number.parseInt(m[1], 10) : 1
}

export type OrderedLessonEntry = {
  lesson: LessonRef
  moduleNum: number
  /** Порядковый номер урока по курсу, с 1 */
  index1: number
}

export function flattenManifestLessonOrder(manifest: CourseManifest): OrderedLessonEntry[] {
  const out: OrderedLessonEntry[] = []
  let index1 = 0
  for (const mod of manifest.modules) {
    const moduleNum = parseModuleNumFromManifestId(mod.id)
    for (const lesson of mod.lessons) {
      index1 += 1
      out.push({ lesson, moduleNum, index1 })
    }
  }
  const fp = manifest.final_project?.title?.trim()
  if (fp) {
    index1 += 1
    out.push({
      lesson: { id: FINAL_COURSE_LESSON_ID, title: fp },
      moduleNum: 6,
      index1,
    })
  }
  return out
}

export function pickNextIncompleteLesson(
  ordered: OrderedLessonEntry[],
  doneIds: Set<string>,
): OrderedLessonEntry | null {
  return ordered.find((e) => !doneIds.has(e.lesson.id)) ?? null
}

/** Одна подпись «Урок N: …» — в JSON title часто уже с префиксом «Урок 1:». */
export function lessonResumePillText(index1: number, title: string): string {
  const body = title.replace(/^Урок\s*\d+\s*:\s*/iu, '').trim()
  return `Урок ${index1}: ${body || title.trim()}`
}
