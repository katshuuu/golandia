import { CheckCircle2, CheckSquare, Play } from 'lucide-react'
import { CodeEditor } from '../components/lesson/CodeEditor'
import { OutputPanel } from '../components/lesson/OutputPanel'

type LessonSandboxFormProps = {
  description: string
  starterCode: string
  editorCode: string
  highlightLines?: number[]
  onEditorChange: (value: string) => void
  runStdout: string
  runStderr: string
  sandboxBusy: boolean
  lessonDone: boolean
  onRun: () => void
  onCheck: () => void
}

/** Форма практики урока: редактор кода, запуск и автопроверка. */
export function LessonSandboxForm({
  description,
  starterCode,
  editorCode,
  highlightLines = [],
  onEditorChange,
  runStdout,
  runStderr,
  sandboxBusy,
  lessonDone,
  onRun,
  onCheck,
}: LessonSandboxFormProps) {
  return (
    <form
      className="lesson-practice-column"
      onSubmit={(e) => {
        e.preventDefault()
        onCheck()
      }}
      aria-label="Форма задания урока"
    >
      <div className="lesson-task-header">
        <div className="lesson-task-header-icon">
          <CheckSquare size={13} />
        </div>
        <div className="lesson-task-header-body">
          <p className="lesson-task-description">{description}</p>
        </div>
      </div>
      <div className="lesson-editor-stack">
        <div className="lesson-editor-grow">
          <CodeEditor
            value={editorCode}
            onChange={onEditorChange}
            starterCode={starterCode}
            highlightLines={highlightLines}
          />
        </div>
        <div className="lesson-run-bar">
          <button
            type="button"
            className="lesson-run-bar-btn lesson-run-bar-btn--run"
            onClick={onRun}
            disabled={sandboxBusy}
          >
            <Play size={12} aria-hidden /> Запустить
          </button>
          <button type="submit" className="lesson-run-bar-btn lesson-run-bar-btn--check" disabled={sandboxBusy}>
            <CheckSquare size={12} aria-hidden /> Проверить
          </button>
          {lessonDone ? (
            <div className="lesson-run-done-hint">
              <CheckCircle2 size={13} aria-hidden /> Задание решено!
            </div>
          ) : null}
        </div>
        <div className="lesson-output-fixed">
          <OutputPanel output={runStdout} error={runStderr} running={sandboxBusy} solved={lessonDone} />
        </div>
      </div>
    </form>
  )
}
