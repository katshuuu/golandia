export type ArchivedChatMessage = { role: 'user' | 'assistant'; content: string }

export type ProfileChatArchiveSession = {
  id: string
  title: string
  updatedAt: number
  lessonId?: string
  lessonTitle?: string
  messages: ArchivedChatMessage[]
}

function archiveStorageKey(userId: string) {
  return `kursovaya-profile-chat-sessions-v1:${userId}`
}

const MAX_SESSIONS = 40

function isMessage(x: unknown): x is ArchivedChatMessage {
  if (!x || typeof x !== 'object') return false
  const m = x as Record<string, unknown>
  return (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
}

function isValidSession(x: unknown): x is ProfileChatArchiveSession {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.title !== 'string' || typeof o.updatedAt !== 'number') return false
  if (o.lessonId != null && typeof o.lessonId !== 'string') return false
  if (o.lessonTitle != null && typeof o.lessonTitle !== 'string') return false
  if (!Array.isArray(o.messages)) return false
  return o.messages.every(isMessage)
}

/** Список прошлых чатов с профиля (новые сверху). */
export function readProfileChatSessions(userId: string): ProfileChatArchiveSession[] {
  try {
    const raw = localStorage.getItem(archiveStorageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(isValidSession)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_SESSIONS)
  } catch {
    return []
  }
}

function writeProfileChatSessions(userId: string, sessions: ProfileChatArchiveSession[]): void {
  try {
    localStorage.setItem(archiveStorageKey(userId), JSON.stringify(sessions.slice(0, MAX_SESSIONS)))
  } catch {
    /* ignore quota */
  }
}

/** Добавить или обновить сессию (по id). */
export function upsertProfileChatSession(userId: string, session: ProfileChatArchiveSession): void {
  const all = readProfileChatSessions(userId)
  const without = all.filter((s) => s.id !== session.id)
  const next = [session, ...without].sort((a, b) => b.updatedAt - a.updatedAt)
  writeProfileChatSessions(userId, next)
}

export function sessionTitleFromMessages(messages: ArchivedChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user')
  if (firstUser?.content?.trim()) {
    const t = firstUser.content.trim().replace(/\s+/g, ' ')
    return t.length > 44 ? `${t.slice(0, 42)}…` : t
  }
  return 'Диалог с куратором'
}
