import { RefObject } from 'react'
import { LinkWithRef } from '../LinkWithRef'
import { ProfileGoalForm } from '../../forms/ProfileGoalForm'
import { lessonResumePillText } from '../../lib/profileLessonOrder'
import type { OrderedLessonEntry } from '../../lib/profileLessonOrder'

type ProfileProgressSectionProps = {
  progressCardRef: RefObject<HTMLElement>
  progressPercent: number
  ring: { circumference: number; dashOffset: number }
  solvedCount: number
  totalCount: number
  resumeLesson: OrderedLessonEntry | null
  goal: string
  goalError?: string
  onGoalChange: (value: string) => void
  onGoalBlur: () => void
}

export function ProfileProgressSection({
  progressCardRef,
  progressPercent,
  ring,
  solvedCount,
  totalCount,
  resumeLesson,
  goal,
  goalError,
  onGoalChange,
  onGoalBlur,
}: ProfileProgressSectionProps) {
  return (
    <div className="student-profile__progress-col">
      <aside className="student-profile__progress-card" ref={progressCardRef} aria-label="Прогресс по курсу">
        <h2 className="student-profile__progress-title">Прогресс по курсу :</h2>
        <div className="student-profile__donut-wrap">
          <svg
            className="student-profile__donut-svg"
            viewBox="0 0 120 120"
            role="img"
            aria-label={
              totalCount ? `Пройдено ${progressPercent} процентов уроков` : 'Прогресс по урокам загружается'
            }
          >
            <circle className="student-profile__donut-track" cx="60" cy="60" r="52" fill="none" />
            <circle
              className="student-profile__donut-fill"
              cx="60"
              cy="60"
              r="52"
              fill="none"
              strokeDasharray={ring.circumference}
              strokeDashoffset={ring.dashOffset}
              transform="rotate(-90 60 60)"
            />
            <text
              className="student-profile__donut-label"
              x="60"
              y="60"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {totalCount ? `${progressPercent}%` : '—'}
            </text>
          </svg>
        </div>
        <p className="student-profile__lessons-count">{totalCount ? `${solvedCount}/${totalCount}` : '…'}</p>
        <p className="student-profile__lessons-caption">занятий пройдено</p>
        <ProfileGoalForm goal={goal} error={goalError} onChange={onGoalChange} onBlur={onGoalBlur} />
      </aside>

      <article className="student-profile__panel student-profile__panel--blue student-profile__panel--resume">
        <p className="student-profile__panel-lead">Продолжить прохождение курса:</p>
        <div className="student-profile__pill-row">
          {resumeLesson ? (
            <span className="student-profile__pill student-profile__pill--white">
              {lessonResumePillText(resumeLesson.index1, resumeLesson.lesson.title)}
            </span>
          ) : (
            <span className="student-profile__pill student-profile__pill--white">Урок …: загрузка курса</span>
          )}
        </div>
        <LinkWithRef
          to="/"
          state={
            resumeLesson
              ? {
                  profileResume: {
                    lessonId: resumeLesson.lesson.id,
                    moduleNum: resumeLesson.moduleNum,
                  },
                }
              : undefined
          }
          className="student-profile__lesson-link"
        >
          Перейти к уроку --&gt;
        </LinkWithRef>
      </article>
    </div>
  )
}
