import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '../components/MainPage.css'
import { AppSiteHeader } from '../components/AppSiteHeader'
import { TutorChatPanel } from '../components/TutorChatPanel'
import {
  MainPageLessonWorkspace,
  MainPageLessonsPanel,
  MainPageSidebar,
  MainPageToast,
} from '../components/main-page'
import { useLessonSandbox, type LessonNotification } from '../hooks/useLessonSandbox'
import { useMainPageCourse } from '../hooks/useMainPageCourse'
import { LESSON_PROGRESS_EVENT, readLocalSandboxDoneLessonIds } from '../lib/lessonProgressLocal'
import { getOrCreateLocalUserSession } from '../lib/localUser'
import { ensureInitialDisplayName } from '../lib/profileLocal'

export function MainPage() {
  const { userId } = useMemo(() => getOrCreateLocalUserSession(), [])
  const [progressTick, setProgressTick] = useState(0)
  const [activeLessonTab, setActiveLessonTab] = useState<'theory' | 'task'>('theory')
  const [chatOpen, setChatOpen] = useState(false)
  const [notification, setNotification] = useState<LessonNotification>(null)
  const lessonsPanelRef = useRef<HTMLElement | null>(null)

  const course = useMainPageCourse()
  const showNotification = useCallback((next: LessonNotification) => {
    setNotification(next)
    if (next) setTimeout(() => setNotification(null), 4000)
  }, [])

  const sandbox = useLessonSandbox(
    course.selectedLesson,
    course.selectedLessonId,
    userId,
    showNotification,
  )

  const doneLessonIds = useMemo(() => readLocalSandboxDoneLessonIds(userId), [userId, progressTick])
  const lessonDone = !!(course.selectedLessonId && doneLessonIds.has(course.selectedLessonId))

  useEffect(() => {
    ensureInitialDisplayName(userId)
  }, [userId])

  useEffect(() => {
    const bump = () => setProgressTick((n) => n + 1)
    window.addEventListener(LESSON_PROGRESS_EVENT, bump)
    return () => window.removeEventListener(LESSON_PROGRESS_EVENT, bump)
  }, [])

  useEffect(() => {
    setActiveLessonTab('theory')
    setChatOpen(false)
  }, [course.selectedLesson?.id])

  useEffect(() => {
    if (!course.isLessonsPanelVisible) return
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (lessonsPanelRef.current?.contains(target)) return
      if (target.closest('.mainpage-module-card')) return
      course.setIsLessonsPanelVisible(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [course.isLessonsPanelVisible, course])

  return (
    <div className="mainpage-page">
      {notification && <MainPageToast notification={notification} onDismiss={() => setNotification(null)} />}

      <AppSiteHeader className="mainpage-header" />

      <div className="mainpage-layout">
        <MainPageSidebar
          moduleNumbers={course.moduleNumbers}
          selectedModule={course.selectedModule}
          onSelectModule={course.selectModule}
        />
        <MainPageLessonsPanel
          panelRef={lessonsPanelRef}
          selectedModule={course.selectedModule}
          isOpen={course.isLessonsPanelVisible}
          headerTitle={course.headerTitle}
          isLoadingManifest={course.isLoadingManifest}
          loadError={course.loadError}
          lessons={course.manifestPanelLessons}
          selectedLessonId={course.selectedLessonId}
          doneLessonIds={doneLessonIds}
          onSelectLesson={course.selectLesson}
        />
        <MainPageLessonWorkspace
          isLoadingLesson={course.isLoadingLesson}
          selectedLesson={course.selectedLesson}
          activeLessonTab={activeLessonTab}
          onTabChange={setActiveLessonTab}
          lessonDone={lessonDone}
          chatOpen={chatOpen}
          onToggleChat={() => setChatOpen((o) => !o)}
          editorCode={sandbox.editorCode}
          onEditorChange={sandbox.handleEditorChange}
          runStdout={sandbox.runStdout}
          runStderr={sandbox.runStderr}
          sandboxBusy={sandbox.sandboxBusy}
          onRun={() => void sandbox.handleRunCode()}
          onCheck={() => void sandbox.handleCheckTask()}
        />
      </div>

      {chatOpen && course.selectedLessonId && course.selectedLesson ? (
        <TutorChatPanel
          lessonId={course.selectedLessonId}
          lessonTitle={course.selectedLesson.title}
          userCode={sandbox.editorCode}
          codeOutput={sandbox.tutorCodeOutput}
          onClose={() => setChatOpen(false)}
        />
      ) : null}
    </div>
  )
}
