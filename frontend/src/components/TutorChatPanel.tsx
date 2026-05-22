import { useEffect, useRef, useState } from 'react'
import { Bot, Loader2, Maximize2, Minimize2, Send, User, X } from 'lucide-react'
import './TutorChatPanel.css'
import { tutorChat, tutorHighlightsFromResponse } from '../lib/courseApi'
import type { TutorCodeHighlight } from '../lib/tutorCodeHighlight'
import { TutorChatMessageContent } from './TutorChatMessageContent'

export type TutorChatMessage = { role: 'user' | 'assistant'; content: string }

type TutorChatPanelProps = {
  lessonId: string
  lessonTitle: string
  userCode?: string
  codeOutput?: string
  onClose: () => void
  /** Снимок переписки при закрытии (для архива на странице профиля). */
  onCloseSnapshot?: (messages: TutorChatMessage[]) => void
  /** Сохранить переписку после каждого ответа (архив). */
  onPersistMessages?: (messages: TutorChatMessage[]) => void
  /** Подсветка строк кода на странице урока. */
  onCodeHighlights?: (highlights: TutorCodeHighlight[], userMessage?: string) => void
  /** Заполнить поле при открытии (например, черновик с профиля). */
  initialInput?: string
  /** Восстановить тред из архива (имеет приоритет над openingAssistantBubble). */
  initialMessages?: TutorChatMessage[]
  inputPlaceholder?: string
  openingAssistantBubble?: string
  dockVariant?: 'corner' | 'inline'
  initialViewportFullscreen?: boolean
}

export function TutorChatPanel({
  lessonId,
  lessonTitle,
  userCode = '',
  codeOutput = '',
  onClose,
  onCloseSnapshot,
  onPersistMessages,
  onCodeHighlights,
  initialInput,
  initialMessages,
  inputPlaceholder,
  openingAssistantBubble,
  dockVariant = 'corner',
  initialViewportFullscreen = false,
}: TutorChatPanelProps) {
  const [messages, setMessages] = useState<TutorChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages.map((m) => ({ role: m.role, content: m.content })))
    } else {
      const bubble = openingAssistantBubble?.trim()
      setMessages(bubble ? [{ role: 'assistant', content: bubble }] : [])
    }
    setInput(initialInput?.trim() ?? '')
    setSending(false)
    setFullscreen(initialViewportFullscreen)
  }, [lessonId, openingAssistantBubble, initialInput, initialMessages, initialViewportFullscreen])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  function notifyPersist(next: TutorChatMessage[]) {
    onPersistMessages?.(next)
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return

    const prior = messages
    const userMsg: TutorChatMessage = { role: 'user', content: text }
    const historyForApi = prior.slice(-8).map((m) => ({ role: m.role, content: m.content }))
    const withUser = [...prior, userMsg]
    setMessages(withUser)
    notifyPersist(withUser)
    setInput('')
    setSending(true)

    try {
      const data = await tutorChat({
        message: text,
        lessonTitle,
        lesson_id: lessonId,
        userCode: userCode?.trim() ? userCode : undefined,
        codeOutput: codeOutput?.trim() ? codeOutput : undefined,
        history: historyForApi,
      })
      const replyText =
        data.ok === false || data.reply == null || data.reply === ''
          ? data.error && data.error.trim() !== ''
            ? `Не получилось: ${data.error}`
            : 'Не получилось получить ответ. Проверь OPENAI_API_KEY на сервере.'
          : String(data.reply)
      const highlights = tutorHighlightsFromResponse(data)
      if (highlights.length > 0) {
        onCodeHighlights?.(highlights, text)
      }
      const withReply: TutorChatMessage[] = [...withUser, { role: 'assistant', content: replyText }]
      setMessages(withReply)
      notifyPersist(withReply)
    } catch (e: unknown) {
      const withErr: TutorChatMessage[] = [
        ...withUser,
        { role: 'assistant', content: e instanceof Error ? e.message : 'Ошибка сети' },
      ]
      setMessages(withErr)
      notifyPersist(withErr)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  function closePanel() {
    onCloseSnapshot?.(messages)
    onPersistMessages?.(messages)
    onClose()
  }

  const dockClass =
    'tutor-chat-dock' +
    (dockVariant === 'inline' ? ' tutor-chat-dock--inline' : '') +
    (fullscreen ? ' tutor-chat-dock--fullscreen' : '')

  return (
    <div
      className={dockClass}
      role="dialog"
      aria-label="Чат с AI-помощником"
      aria-modal={fullscreen ? 'true' : undefined}
    >
      <div className="tutor-chat-inner">
        <div className="tutor-chat-topbar">
          <div className="tutor-chat-avatar-bot">
            <Bot size={20} aria-hidden />
          </div>
          <div className="tutor-chat-headings">
            <p className="tutor-chat-name">Геннадий Нейронович</p>
            <p className="tutor-chat-tagline">Всегда готов помочь</p>
          </div>
          <div className="tutor-chat-top-actions">
            <span className="tutor-chat-online" aria-hidden />
            <button
              type="button"
              className="tutor-chat-icon-btn"
              onClick={() => setFullscreen((v) => !v)}
              aria-label={fullscreen ? 'Свернуть окно чата' : 'Развернуть чат на весь экран'}
            >
              {fullscreen ? <Minimize2 size={20} strokeWidth={2} /> : <Maximize2 size={20} strokeWidth={2} />}
            </button>
            <button type="button" className="tutor-chat-icon-btn" onClick={closePanel} aria-label="Закрыть чат">
              <X size={20} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="tutor-chat-thread">
          {messages.length === 0 && !sending && (
            <div className="tutor-chat-empty">
              <Bot size={40} aria-hidden />
              <p>Спроси про урок, код или ошибку компиляции — помогу подсказками.</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={`${msg.role}-${index}`}
              className={`tutor-chat-row tutor-chat-row--${msg.role === 'user' ? 'user' : 'assistant'}`}
            >
              <div
                className={`tutor-chat-bubble-icon ${msg.role === 'user' ? 'tutor-chat-bubble-icon--user' : 'tutor-chat-bubble-icon--bot'}`}
              >
                {msg.role === 'user' ? <User size={15} aria-hidden /> : <Bot size={15} aria-hidden />}
              </div>
              <div
                className={`tutor-chat-bubble-msg ${msg.role === 'user' ? 'tutor-chat-bubble-msg--user' : 'tutor-chat-bubble-msg--assistant'}`}
              >
                <TutorChatMessageContent content={msg.content} role={msg.role} />
              </div>
            </div>
          ))}

          {sending && (
            <div className="tutor-chat-row tutor-chat-row--assistant">
              <div className="tutor-chat-bubble-icon tutor-chat-bubble-icon--bot">
                <Bot size={15} aria-hidden />
              </div>
              <div className="tutor-chat-typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="tutor-chat-composer-wrap">
          <div className="tutor-chat-composer">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={inputPlaceholder ?? 'Задай вопрос...'}
              rows={2}
              className="tutor-chat-composer-input"
              style={{ scrollbarWidth: 'none' }}
            />
            <button
              type="button"
              className="tutor-chat-send-btn"
              onClick={() => void handleSend()}
              disabled={!input.trim() || sending}
              aria-label="Отправить"
            >
              {sending ? (
                <Loader2 size={18} className="tutor-chat-send-spinner" aria-hidden />
              ) : (
                <Send size={18} aria-hidden />
              )}
            </button>
          </div>
          <p className="tutor-chat-composer-hint">Enter — отправить · Shift+Enter — перенос строки</p>
        </div>
      </div>
    </div>
  )
}
