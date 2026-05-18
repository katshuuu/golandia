import { ExternalLink, MessageCirclePlus } from 'lucide-react'
import { TutorChatPanel } from '../TutorChatPanel'
import { ProfileChatLaunchForm } from '../../forms'
import { PROFILE_CHAT_LESSON_ID, PROFILE_CHAT_LESSON_TITLE } from '../../lib/profileChat'
import type { ProfileChatArchiveSession } from '../../lib/profileChatArchive'
import type { TutorChatMessage } from '../TutorChatPanel'

type ProfileChatSectionProps = {
  profileChatDraft: string
  chatDraftError?: string
  onDraftChange: (value: string) => void
  onOpenChat: (event: React.FormEvent) => void
  profileChatOpen: boolean
  profileChatPanelKey: number
  profileChatViewportFullscreen: boolean
  profileChatInitialMessages: TutorChatMessage[] | undefined
  profileChatSessions: ProfileChatArchiveSession[]
  activeProfileChatSessionId: string | null
  onNewChat: () => void
  onOpenFromArchive: (session: ProfileChatArchiveSession) => void
  onOpenFullscreen: () => void
  onCloseSnapshot: (messages: TutorChatMessage[]) => void
  onClose: () => void
}

export function ProfileChatSection({
  profileChatDraft,
  chatDraftError,
  onDraftChange,
  onOpenChat,
  profileChatOpen,
  profileChatPanelKey,
  profileChatViewportFullscreen,
  profileChatInitialMessages,
  profileChatSessions,
  activeProfileChatSessionId,
  onNewChat,
  onOpenFromArchive,
  onOpenFullscreen,
  onCloseSnapshot,
  onClose,
}: ProfileChatSectionProps) {
  return (
    <article className="student-profile__panel student-profile__panel--yellow student-profile__panel--chat">
      <aside className="student-profile__chat-sidebar" aria-label="Архив чатов с куратором">
        <p className="student-profile__chat-sidebar-title">Архив чатов</p>
        <button type="button" className="student-profile__chat-sidebar-new" onClick={onNewChat}>
          <MessageCirclePlus size={16} strokeWidth={2.2} aria-hidden />
          Новый чат
        </button>
        <div className="student-profile__chat-sidebar-list-wrap">
          {profileChatSessions.length === 0 ? (
            <p className="student-profile__chat-sidebar-empty">
              Пока нет сохранённых диалогов. После переписки с куратором она появится здесь — можно будет
              продолжить.
            </p>
          ) : (
            <ul className="student-profile__chat-sidebar-list">
              {profileChatSessions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={
                      'student-profile__chat-sidebar-item' +
                      (activeProfileChatSessionId === s.id && profileChatOpen
                        ? ' student-profile__chat-sidebar-item--active'
                        : '')
                    }
                    onClick={() => onOpenFromArchive(s)}
                  >
                    <span className="student-profile__chat-sidebar-item-title">{s.title}</span>
                    <span className="student-profile__chat-sidebar-item-meta">
                      {new Date(s.updatedAt).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
      <div className="student-profile__chat-main">
        <div className="student-profile__chat-body">
          {profileChatOpen ? (
            <TutorChatPanel
              key={profileChatPanelKey}
              dockVariant="inline"
              initialViewportFullscreen={profileChatViewportFullscreen}
              lessonId={PROFILE_CHAT_LESSON_ID}
              lessonTitle={PROFILE_CHAT_LESSON_TITLE}
              initialInput={profileChatDraft}
              initialMessages={profileChatInitialMessages}
              openingAssistantBubble="Привет! Открылась страница профиля — отвечу на вопросы по курсу и обучению."
              inputPlaceholder="Непонятен один момент..."
              onCloseSnapshot={onCloseSnapshot}
              onClose={onClose}
            />
          ) : (
            <>
              <button
                type="button"
                className="student-profile__chat-icon"
                onClick={onOpenFullscreen}
                aria-label="Открыть чат на весь экран"
              >
                <ExternalLink size={18} strokeWidth={2.2} aria-hidden />
              </button>
              <div className="student-profile__chat-stack">
                <div className="student-profile__chat-intro">
                  <h2 className="student-profile__chat-title">Есть вопросы? Задавай!</h2>
                  <p className="student-profile__chat-sub">Кусаться не буду, честно</p>
                </div>
                <ProfileChatLaunchForm
                  draft={profileChatDraft}
                  error={chatDraftError}
                  onDraftChange={onDraftChange}
                  onSubmit={onOpenChat}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  )
}
