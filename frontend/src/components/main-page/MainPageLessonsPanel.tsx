import { RefObject } from 'react'
import type { LessonRef } from '../../lib/courseApi'

type MainPageLessonsPanelProps = {
  panelRef: RefObject<HTMLElement>
  selectedModule: number
  isOpen: boolean
  headerTitle: string
  isLoadingManifest: boolean
  loadError: string | null
  lessons: LessonRef[]
  selectedLessonId: string | null
  doneLessonIds: Set<string>
  onSelectLesson: (lessonId: string) => void
}

export function MainPageLessonsPanel({
  panelRef,
  selectedModule,
  isOpen,
  headerTitle,
  isLoadingManifest,
  loadError,
  lessons,
  selectedLessonId,
  doneLessonIds,
  onSelectLesson,
}: MainPageLessonsPanelProps) {
  return (
    <aside
      ref={panelRef}
      className={`mainpage-lessons-panel ${isOpen ? 'is-open' : ''}`}
      aria-label={`Уроки модуля ${selectedModule}`}
      aria-hidden={!isOpen}
    >
      <div className="mainpage-lessons-panel-header">
        <h1 className="mainpage-lessons-title">{headerTitle}</h1>
      </div>
      <div className="mainpage-lessons-panel-body">
        {isLoadingManifest && <p className="mainpage-panel-note">Загрузка модулей...</p>}
        {loadError && <p className="mainpage-panel-error">{loadError}</p>}
        {!isLoadingManifest && lessons.length === 0 && (
          <section className="mainpage-lesson-section">
            <h2 className="mainpage-lesson-section-title">Раздел пока не заполнен</h2>
          </section>
        )}
        {lessons.length > 0 ? (
          <ol className="mainpage-lessons-list mainpage-lessons-list--flat" aria-label="Уроки модуля">
            {lessons.map((lesson) => (
              <li key={lesson.id} className="mainpage-lesson-item">
                <button
                  type="button"
                  className={`mainpage-lesson-link ${lesson.id === selectedLessonId ? 'is-active' : ''} ${doneLessonIds.has(lesson.id) ? 'is-done' : ''}`}
                  onClick={() => onSelectLesson(lesson.id)}
                  aria-current={lesson.id === selectedLessonId ? 'true' : undefined}
                  aria-label={`${lesson.title}${doneLessonIds.has(lesson.id) ? ', задание проверено' : ', задание ещё не пройдено по автопроверке'}`}
                >
                  <span
                    className={`mainpage-lesson-pass-dot ${doneLessonIds.has(lesson.id) ? 'mainpage-lesson-pass-dot--done' : ''}`}
                    aria-hidden
                  />
                  <span className="mainpage-lesson-title-text">{lesson.title}</span>
                </button>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </aside>
  )
}
