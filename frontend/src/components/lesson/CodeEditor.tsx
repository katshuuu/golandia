import { useEffect, useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import './CodeEditor.css'

type CodeEditorProps = {
  value: string
  onChange: (val: string) => void
  starterCode: string
  /** Номера строк (с 1) для подсветки репетитором. */
  highlightLines?: number[]
}

export function CodeEditor({ value, onChange, starterCode, highlightLines = [] }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const [lineCount, setLineCount] = useState(1)
  const [scrollTop, setScrollTop] = useState(0)

  useEffect(() => {
    setLineCount(Math.max(1, value.split('\n').length))
  }, [value])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const ta = textareaRef.current!
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const val = ta.value

    if (e.key === 'Tab') {
      e.preventDefault()
      const newVal = val.substring(0, start) + '    ' + val.substring(end)
      onChange(newVal)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4
      })
    }

    if (e.key === 'Enter') {
      const lineStart = val.lastIndexOf('\n', start - 1) + 1
      const currentLine = val.substring(lineStart, start)
      const indent = currentLine.match(/^(\s*)/)?.[1] || ''
      const trimmed = currentLine.trim()
      const extraIndent = trimmed.endsWith('{') ? '    ' : ''
      e.preventDefault()
      const newVal = val.substring(0, start) + '\n' + indent + extraIndent + val.substring(end)
      onChange(newVal)
      const newPos = start + 1 + indent.length + extraIndent.length
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = newPos
      })
    }
  }

  function syncScroll() {
    const ta = textareaRef.current
    if (!ta) return
    const top = ta.scrollTop
    setScrollTop(top)
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = top
    }
  }

  function handleReset() {
    onChange(starterCode)
  }

  const highlightSet = new Set(highlightLines.filter((n) => n >= 1 && n <= lineCount))

  return (
    <div className={`lesson-code-editor${highlightSet.size ? ' lesson-code-editor--tutor-highlight' : ''}`}>
      <div className="lesson-code-editor-toolbar">
        <div className="lesson-code-editor-toolbar-start">
          <div className="lesson-code-window-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <span className="lesson-code-filename">main.go</span>
        </div>
        <button
          type="button"
          className="lesson-code-reset"
          onClick={handleReset}
          title="Сбросить код"
        >
          <RotateCcw size={11} aria-hidden />
          Сбросить
        </button>
      </div>

      <div className="lesson-code-editor-main">
        <div ref={lineNumbersRef} className="lesson-code-line-numbers" aria-hidden>
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i + 1}
              className={highlightSet.has(i + 1) ? 'lesson-code-line-num--highlight' : undefined}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div className="lesson-code-editor-pane">
          <div className="lesson-code-editor-canvas" aria-hidden>
            <div
              className="lesson-code-editor-canvas-inner"
              style={{ transform: `translateY(-${scrollTop}px)` }}
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div
                  key={i + 1}
                  className={
                    'lesson-code-highlight-band' +
                    (highlightSet.has(i + 1) ? ' lesson-code-highlight-band--on' : '')
                  }
                />
              ))}
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            spellCheck={false}
            className="lesson-code-textarea"
          />
        </div>
      </div>
    </div>
  )
}
