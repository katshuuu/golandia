import { useCallback, useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { runSandbox } from '../../lib/courseApi'
import { CodeEditor } from './CodeEditor'
import { OutputPanel } from './OutputPanel'

type LessonTheoryDemoCodeProps = {
  code: string
  lessonId: string
  highlightLines?: number[]
}

export function LessonTheoryDemoCode({ code, lessonId, highlightLines = [] }: LessonTheoryDemoCodeProps) {
  const starter = code.trim()
  const [demoCode, setDemoCode] = useState(starter)
  const [runStdout, setRunStdout] = useState('')
  const [runStderr, setRunStderr] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    setDemoCode(starter)
    setRunStdout('')
    setRunStderr('')
  }, [lessonId, starter])

  const handleRun = useCallback(async () => {
    if (!demoCode.trim()) return
    setIsRunning(true)
    try {
      const data = await runSandbox(demoCode)
      if (!data.ok || data.stderr) {
        setRunStderr(data.stderr || 'Ошибка запуска')
        setRunStdout(data.stdout ?? '')
      } else {
        setRunStderr('')
        setRunStdout(data.stdout || '(программа завершилась без вывода)')
      }
    } catch (error: unknown) {
      setRunStdout('')
      setRunStderr(error instanceof Error ? error.message : 'Не удалось подключиться к песочнице.')
    } finally {
      setIsRunning(false)
    }
  }, [demoCode])

  if (!starter) return null

  return (
    <section className="lesson-theory-demo" aria-label="Демонстрационный код">
      <div className="lesson-theory-demo-editor">
        <CodeEditor
          value={demoCode}
          onChange={setDemoCode}
          starterCode={starter}
          highlightLines={highlightLines}
        />
      </div>

      <div className="lesson-run-bar lesson-theory-demo-run-bar">
        <button
          type="button"
          className="lesson-run-bar-btn lesson-run-bar-btn--run"
          onClick={() => void handleRun()}
          disabled={isRunning}
        >
          <Play size={12} aria-hidden />
          Запустить программу
        </button>
      </div>

      <div className="lesson-theory-demo-output">
        <OutputPanel
          output={runStdout}
          error={runStderr}
          running={isRunning}
          solved={false}
          emptyHint="Нажми «Запустить программу», чтобы выполнить код"
        />
      </div>
    </section>
  )
}
