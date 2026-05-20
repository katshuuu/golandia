import { BookOpen, CheckCircle2, ChevronRight, Code2, MessageSquare } from 'lucide-react'
import type { BackendLesson } from '../../lib/courseApi'
import { resolveTheoryHtmlAssets } from '../../lib/theoryHtmlAssets'
import { LessonTheoryDemoCode } from '../lesson/LessonTheoryDemoCode'
import { LessonSandboxForm } from '../../forms/LessonSandboxForm'

type MainPageLessonWorkspaceProps = {
  isLoadingLesson: boolean
  selectedLesson: BackendLesson | null
  activeLessonTab: 'theory' | 'task'
  onTabChange: (tab: 'theory' | 'task') => void
  lessonDone: boolean
  chatOpen: boolean
  onToggleChat: () => void
  editorCode: string
  onEditorChange: (value: string) => void
  runStdout: string
  runStderr: string
  sandboxBusy: boolean
  onRun: () => void
  onCheck: () => void
}

export function MainPageLessonWorkspace({
  isLoadingLesson,
  selectedLesson,
  activeLessonTab,
  onTabChange,
  lessonDone,
  chatOpen,
  onToggleChat,
  editorCode,
  onEditorChange,
  runStdout,
  runStderr,
  sandboxBusy,
  onRun,
  onCheck,
}: MainPageLessonWorkspaceProps) {
  return (
    <main className="mainpage-content">
      <section className="mainpage-workspace lesson-workspace-scope" aria-label="Рабочая область">
        {isLoadingLesson && <p className="mainpage-panel-note mainpage-panel-note--pad">Загрузка урока...</p>}
        {!isLoadingLesson && selectedLesson && (
          <article key={selectedLesson.id} className="lesson-chrome lesson-chrome--enter">
            <div className="lesson-chrome-toolbar">
              <div className="lesson-chrome-title-block">
                <span className="lesson-chrome-breadcrumb-muted">Урок</span>
                <ChevronRight size={14} className="lesson-chrome-chevron" aria-hidden />
                <span className="lesson-chrome-title-text">{selectedLesson.title}</span>
                {lessonDone && (
                  <span className="lesson-chrome-done-badge">
                    <CheckCircle2 size={10} aria-hidden /> Решено
                  </span>
                )}
              </div>
              <div className="lesson-chrome-tab-group">
                <button
                  type="button"
                  className={`lesson-chrome-tab ${activeLessonTab === 'theory' ? 'is-active' : ''}`}
                  onClick={() => onTabChange('theory')}
                >
                  <BookOpen size={13} aria-hidden /> Теория
                </button>
                <button
                  type="button"
                  className={`lesson-chrome-tab ${activeLessonTab === 'task' ? 'is-active' : ''}`}
                  onClick={() => onTabChange('task')}
                >
                  <Code2 size={13} aria-hidden /> Задание
                </button>
              </div>
              <button
                type="button"
                className={`lesson-chrome-ai-btn ${chatOpen ? 'is-on' : ''}`}
                onClick={onToggleChat}
              >
                <MessageSquare size={14} aria-hidden /> AI-помощник
              </button>
            </div>
            <div className="lesson-chrome-body">
              {activeLessonTab === 'theory' ? (
                <div key={`theory-${selectedLesson.id}`} className="lesson-theory-scroll lesson-theory-scroll--enter">
                  <div
                    className="lesson-theory-html"
                    dangerouslySetInnerHTML={{
                      __html: resolveTheoryHtmlAssets(selectedLesson.theory_html),
                    }}
                  />
                  <LessonTheoryDemoCode code={selectedLesson.demo_code ?? ''} lessonId={selectedLesson.id} />
                  {!selectedLesson.theory_html?.trim() && !selectedLesson.demo_code?.trim() ? (
                    <p className="lesson-theory-placeholder">Теория для этого урока пока пустая.</p>
                  ) : null}
                </div>
              ) : (
                <LessonSandboxForm
                  description={selectedLesson.task.description}
                  starterCode={selectedLesson.task.starter_code}
                  editorCode={editorCode}
                  onEditorChange={onEditorChange}
                  runStdout={runStdout}
                  runStderr={runStderr}
                  sandboxBusy={sandboxBusy}
                  lessonDone={lessonDone}
                  onRun={onRun}
                  onCheck={onCheck}
                />
              )}
            </div>
          </article>
        )}
      </section>
    </main>
  )
}
