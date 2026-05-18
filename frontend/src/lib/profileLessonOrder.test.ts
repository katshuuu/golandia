import { describe, expect, it } from 'vitest'
import {
  flattenManifestLessonOrder,
  lessonResumePillText,
  parseModuleNumFromManifestId,
  pickNextIncompleteLesson,
} from './profileLessonOrder'
import type { CourseManifest } from './courseApi'
import { FINAL_COURSE_LESSON_ID } from './courseFinalLesson'

const manifest: CourseManifest = {
  title: 'Test',
  subtitle: '',
  intro_html: '',
  modules: [
    {
      id: 'm2_1',
      title: 'M2',
      description: '',
      lessons: [
        { id: 'l1', title: 'Урок 1: Первый' },
        { id: 'l2', title: 'Второй' },
      ],
    },
  ],
  final_project: { title: 'Итоговый проект' },
}

describe('parseModuleNumFromManifestId', () => {
  it('извлекает номер из m2_1', () => {
    expect(parseModuleNumFromManifestId('m2_1')).toBe(2)
  })

  it('возвращает 1 для неизвестного id', () => {
    expect(parseModuleNumFromManifestId('unknown')).toBe(1)
  })
})

describe('flattenManifestLessonOrder', () => {
  it('нумерует уроки и добавляет финал', () => {
    const ordered = flattenManifestLessonOrder(manifest)
    expect(ordered).toHaveLength(3)
    expect(ordered[0].index1).toBe(1)
    expect(ordered[0].moduleNum).toBe(2)
    expect(ordered[2].lesson.id).toBe(FINAL_COURSE_LESSON_ID)
    expect(ordered[2].moduleNum).toBe(6)
  })
})

describe('pickNextIncompleteLesson', () => {
  it('возвращает первый непройденный урок', () => {
    const ordered = flattenManifestLessonOrder(manifest)
    const next = pickNextIncompleteLesson(ordered, new Set(['l1']))
    expect(next?.lesson.id).toBe('l2')
  })

  it('возвращает null если всё пройдено', () => {
    const ordered = flattenManifestLessonOrder(manifest)
    const done = new Set(['l1', 'l2', FINAL_COURSE_LESSON_ID])
    expect(pickNextIncompleteLesson(ordered, done)).toBeNull()
  })
})

describe('lessonResumePillText', () => {
  it('убирает дублирующий префикс «Урок N:»', () => {
    expect(lessonResumePillText(3, 'Урок 3: Циклы')).toBe('Урок 3: Циклы')
    expect(lessonResumePillText(3, 'Циклы')).toBe('Урок 3: Циклы')
  })
})
