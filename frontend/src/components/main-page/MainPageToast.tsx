import { CheckCircle2, X } from 'lucide-react'
import type { LessonNotification } from '../../hooks/useLessonSandbox'

type MainPageToastProps = {
  notification: NonNullable<LessonNotification>
  onDismiss: () => void
}

export function MainPageToast({ notification, onDismiss }: MainPageToastProps) {
  return (
    <div
      className={`mainpage-lesson-toast ${notification.type === 'success' ? 'mainpage-lesson-toast--ok' : 'mainpage-lesson-toast--err'}`}
      role="status"
    >
      {notification.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
      <span>{notification.text}</span>
      <button
        type="button"
        className="mainpage-lesson-toast-dismiss"
        onClick={onDismiss}
        aria-label="Закрыть"
      >
        <X size={14} />
      </button>
    </div>
  )
}
