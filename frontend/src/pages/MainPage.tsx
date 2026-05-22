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
import { useTutorChatArchive } from '../hooks/useTutorChatArchive'
import type { TutorCodeHighlight } from '../lib/tutorCodeHighlight'
import {
  resolveHighlightLinesInSource,
  searchTermsFromUserMessage,
  snippetsForTheoryPage,
} from '../lib/tutorCodeHighlight'
import type { TutorChatMessage } from '../components/TutorChatPanel'
import { LESSON_PROGRESS_EVENT, readLocalSandboxDoneLessonIds } from '../lib/lessonProgressLocal'
import { getOrCreateLocalUserSession } from '../lib/localUser'
import { ensureInitialDisplayName } from '../lib/profileLocal'

export function MainPage() {
  const { userId } = useMemo(() => getOrCreateLocalUserSession(), [])
  const [progressTick, setProgressTick] = useState(0)
  const [activeLessonTab, setActiveLessonTab] = useState<'theory' | 'task'>('theory')
  const [chatOpen, setChatOpen] = useState(false)
  const [lessonChatPanelKey, setLessonChatPanelKey] = useState(0)
  const [lessonChatSessionId, setLessonChatSessionId] = useState<string | null>(null)
  const [tutorHighlights, setTutorHighlights] = useState<TutorCodeHighlight[]>([])
  const [highlightSearchTerms, setHighlightSearchTerms] = useState<string[]>([])
  const [theoryMarkKey, setTheoryMarkKey] = useState(0)
  const [notification, setNotification] = useState<LessonNotification>(null)
  const chatArchive = useTutorChatArchive(userId)
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
    setTutorHighlights([])
    setHighlightSearchTerms([])
    setTheoryMarkKey((k) => k + 1)
    chatArchive.clearActiveSession()
    setLessonChatSessionId(null)
  }, [course.selectedLesson?.id])

  const sandboxHighlightLines = useMemo(
    () =>
      resolveHighlightLinesInSource(
        sandbox.editorCode,
        tutorHighlights,
        'user_code',
        highlightSearchTerms,
      ),
    [sandbox.editorCode, tutorHighlights, highlightSearchTerms],
  )
  const theoryDemoHighlightLines = useMemo(
    () =>
      resolveHighlightLinesInSource(
        course.selectedLesson?.demo_code ?? '',
        tutorHighlights,
        'theory_demo',
        highlightSearchTerms,
      ),
    [course.selectedLesson?.demo_code, tutorHighlights, highlightSearchTerms],
  )
  const theorySnippets = snippetsForTheoryPage(tutorHighlights)

  const handleTutorHighlights = useCallback(
    (highlights: TutorCodeHighlight[], userMessage?: string) => {
      setTutorHighlights(highlights)
      if (userMessage?.trim()) {
        setHighlightSearchTerms(searchTermsFromUserMessage(userMessage))
      }
      if (snippetsForTheoryPage(highlights).length > 0) {
        setTheoryMarkKey((k) => k + 1)
      }
      if (highlights.some((h) => h.target === 'user_code')) {
        setActiveLessonTab('task')
      } else if (highlights.some((h) => h.target === 'theory_demo' || h.target === 'theory_page')) {
        setActiveLessonTab('theory')
      }
    },
    [],
  )

  const handleLessonChatPersist = useCallback(
    (messages: TutorChatMessage[]) => {
      if (!course.selectedLessonId || !course.selectedLesson) return
      const id = chatArchive.persistSession(messages, {
        lessonId: course.selectedLessonId,
        lessonTitle: course.selectedLesson.title,
        sessionId: lessonChatSessionId,
      })
      if (id && !lessonChatSessionId) setLessonChatSessionId(id)
    },
    [chatArchive, course.selectedLesson, course.selectedLessonId, lessonChatSessionId],
  )

  const handleToggleChat = useCallback(() => {
    setChatOpen((wasOpen) => {
      if (!wasOpen) {
        const sid = chatArchive.beginSession(lessonChatSessionId)
        setLessonChatSessionId(sid)
        setLessonChatPanelKey((k) => k + 1)
      }
      return !wasOpen
    })
  }, [chatArchive, lessonChatSessionId])

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
          onToggleChat={handleToggleChat}
          sandboxHighlightLines={sandboxHighlightLines}
          theoryDemoHighlightLines={theoryDemoHighlightLines}
          theorySnippets={theorySnippets}
          theoryMarkKey={theoryMarkKey}
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
          key={lessonChatPanelKey}
          lessonId={course.selectedLessonId}
          lessonTitle={course.selectedLesson.title}
          userCode={sandbox.editorCode}
          codeOutput={sandbox.tutorCodeOutput}
          onCodeHighlights={handleTutorHighlights}
          onPersistMessages={handleLessonChatPersist}
          onCloseSnapshot={handleLessonChatPersist}
          onClose={() => {
            setChatOpen(false)
            chatArchive.clearActiveSession()
          }}
        />
      ) : null}
    </div>
  )
}
