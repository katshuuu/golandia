import { CheckCircle2, Loader2, Terminal, XCircle } from 'lucide-react'
import './OutputPanel.css'

type OutputPanelProps = {
  output: string
  error: string
  running: boolean
  solved: boolean
  emptyHint?: string
}

export function OutputPanel({
  output,
  error,
  running,
  solved,
  emptyHint = 'Нажми «Запустить» чтобы выполнить код',
}: OutputPanelProps) {
  return (
    <div className="lesson-output-panel">
      <div className="lesson-output-toolbar">
        <Terminal size={13} className="lesson-output-icon" aria-hidden />
        <span className="lesson-output-label">вывод программы</span>
        {running && <Loader2 size={12} className="lesson-output-spinner" aria-hidden />}
        {!running && solved && (
          <div className="lesson-output-status lesson-output-status--ok">
            <CheckCircle2 size={12} />
            <span>Решено!</span>
          </div>
        )}
        {!running && error && !solved && (
          <div className="lesson-output-status lesson-output-status--err">
            <XCircle size={12} />
            <span>Ошибка</span>
          </div>
        )}
      </div>

      <div className="lesson-output-body">
        {running && (
          <div className="lesson-output-running">
            <Loader2 size={14} className="lesson-output-spinner" aria-hidden />
            <span>Компилируем и запускаем...</span>
          </div>
        )}

        {!running && !output && !error && (
          <p className="lesson-output-hint">{emptyHint}</p>
        )}

        {!running && error && (
          <pre className="lesson-output-pre lesson-output-pre--error">{error}</pre>
        )}

        {!running && output && (
          <pre className={`lesson-output-pre ${solved ? 'lesson-output-pre--ok' : 'lesson-output-pre--out'}`}>
            {output}
          </pre>
        )}
      </div>
    </div>
  )
}
