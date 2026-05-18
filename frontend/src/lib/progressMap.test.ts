import { describe, expect, it } from 'vitest'
import { buildCompletedLessonsMap, countLessonsInManifest } from './progressMap'
import type { CourseManifest } from './courseApi'
import { FINAL_COURSE_LESSON_ID } from './courseFinalLesson'

const manifest: CourseManifest = {
  title: 'Test',
  subtitle: '',
  intro_html: '',
  modules: [
    {
      id: 'm1',
      title: 'M1',
      description: '',
      lessons: [
        { id: 'l1', title: 'L1' },
        { id: 'l2', title: 'L2' },
      ],
    },
  ],
  final_project: { title: 'Финал' },
}

describe('buildCompletedLessonsMap', () => {
  it('отмечает пройденные уроки', () => {
    const map = buildCompletedLessonsMap(manifest, new Set(['l1']))
    expect(map.l1).toBe(true)
    expect(map.l2).toBe(false)
    expect(map[FINAL_COURSE_LESSON_ID]).toBe(false)
  })

  it('включает финальный урок при наличии final_project', () => {
    const map = buildCompletedLessonsMap(manifest, new Set([FINAL_COURSE_LESSON_ID]))
    expect(map[FINAL_COURSE_LESSON_ID]).toBe(true)
  })
})

describe('countLessonsInManifest', () => {
  it('считает уроки модулей и финал', () => {
    expect(countLessonsInManifest(manifest)).toBe(3)
  })

  it('без финала считает только модули', () => {
    const { final_project: _, ...rest } = manifest
    expect(countLessonsInManifest(rest)).toBe(2)
  })
})
