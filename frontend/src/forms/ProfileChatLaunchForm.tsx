import { FormEvent } from 'react'
import { Send } from 'lucide-react'

type ProfileChatLaunchFormProps = {
  draft: string
  error?: string
  onDraftChange: (value: string) => void
  onSubmit: (event: FormEvent) => void
}

/** Форма черновика вопроса перед открытием чата с куратором. */
export function ProfileChatLaunchForm({ draft, error, onDraftChange, onSubmit }: ProfileChatLaunchFormProps) {
  return (
    <form className="student-profile__chat-form" onSubmit={onSubmit} aria-label="Вопрос куратору">
      <input
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        placeholder="Непонятен один момент..."
        className="student-profile__chat-input"
        aria-label="Вопрос преподавателю"
        maxLength={4000}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'profile-chat-draft-error' : undefined}
      />
      {error ? (
        <p id="profile-chat-draft-error" className="student-profile__field-error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="student-profile__chat-send" aria-label="Открыть чат и отправить">
        <Send size={18} strokeWidth={2.2} />
      </button>
    </form>
  )
}
