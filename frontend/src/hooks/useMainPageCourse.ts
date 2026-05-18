import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  type BackendLesson,
  type CourseModule,
  fetchLesson,
  fetchManifest,
  type LessonRef,
} from '../lib/courseApi'
import { FINAL_COURSE_LESSON_ID } from '../lib/courseFinalLesson'
import { type ProfileLocationState } from '../lib/profileResumeNavigation'

const MODULE_NUMBERS = [1, 2, 3, 4, 5, 6] as const

export function useMainPageCourse() {
  const location = useLocation()
  const navigate = useNavigate()

  const [selectedModule, setSelectedModule] = useState(1)
  const [isLessonsPanelVisible, setIsLessonsPanelVisible] = useState(false)
  const [manifestModules, setManifestModules] = useState<CourseModule[]>([])
  const [finalProjectTitle, setFinalProjectTitle] = useState<string | null>(null)
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<BackendLesson | null>(null)
  const [isLoadingManifest, setIsLoadingManifest] = useState(true)
  const [isLoadingLesson, setIsLoadingLesson] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoadingManifest(true)
    setLoadError(null)
    fetchManifest()
      .then((manifest) => {
        if (cancelled) return
        setManifestModules(manifest.modules)
        setFinalProjectTitle(manifest.final_project?.title?.trim() ? manifest.final_project.title : null)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setLoadError(error instanceof Error ? error.message : 'Не удалось загрузить курс')
      })
      .finally(() => {
        if (!cancelled) setIsLoadingManifest(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const manifestSections = useMemo(() => {
    return manifestModules.filter((module) => {
      const match = module.id.match(/^m(\d+)(?:_|$)/)
      if (!match) return false
      return Number.parseInt(match[1], 10) === selectedModule
    })
  }, [manifestModules, selectedModule])

  const headerTitle = useMemo(() => {
    if (selectedModule === 6 && finalProjectTitle) return finalProjectTitle
    if (manifestSections.length === 0) return `Модуль ${selectedModule}`
    return manifestSections[0].title
  }, [manifestSections, selectedModule, finalProjectTitle])

  const manifestPanelLessons = useMemo((): LessonRef[] => {
    const seen = new Set<string>()
    const out: LessonRef[] = []
    for (const sec of manifestSections) {
      for (const l of sec.lessons) {
        if (!seen.has(l.id)) {
          seen.add(l.id)
          out.push(l)
        }
      }
    }
    if (selectedModule === 6 && finalProjectTitle) {
      out.push({ id: FINAL_COURSE_LESSON_ID, title: finalProjectTitle })
    }
    return out
  }, [manifestSections, selectedModule, finalProjectTitle])

  useEffect(() => {
    if (!selectedLessonId) {
      setSelectedLesson(null)
      return
    }
    let cancelled = false
    setIsLoadingLesson(true)
    setLoadError(null)
    fetchLesson(selectedLessonId)
      .then((lesson) => {
        if (!cancelled) setSelectedLesson(lesson)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setSelectedLesson(null)
        setLoadError(error instanceof Error ? error.message : 'Не удалось загрузить урок')
      })
      .finally(() => {
        if (!cancelled) setIsLoadingLesson(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedLessonId])

  useEffect(() => {
    if (isLoadingManifest || manifestModules.length === 0) return
    const resume = (location.state as ProfileLocationState | null)?.profileResume
    if (resume?.lessonId) {
      const mod = Number(resume.moduleNum)
      if (mod >= 1 && mod <= 6) setSelectedModule(mod)
      setSelectedLessonId(resume.lessonId)
      setIsLessonsPanelVisible(true)
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
      return
    }
    setSelectedLessonId((current) => {
      if (current !== null) return current
      const firstLesson = manifestModules.flatMap((m) => m.lessons)[0]
      return firstLesson ? firstLesson.id : null
    })
  }, [isLoadingManifest, manifestModules, location.key, location.state, location.pathname, location.search, navigate])

  function selectModule(moduleNumber: number) {
    if (selectedModule === moduleNumber) {
      setIsLessonsPanelVisible((open) => !open)
      return
    }
    setSelectedModule(moduleNumber)
    setIsLessonsPanelVisible(true)
  }

  function selectLesson(lessonId: string) {
    setSelectedLessonId(lessonId)
    setIsLessonsPanelVisible(false)
  }

  return {
    moduleNumbers: MODULE_NUMBERS,
    selectedModule,
    isLessonsPanelVisible,
    setIsLessonsPanelVisible,
    selectedLessonId,
    selectedLesson,
    isLoadingManifest,
    isLoadingLesson,
    loadError,
    headerTitle,
    manifestPanelLessons,
    selectModule,
    selectLesson,
  }
}
