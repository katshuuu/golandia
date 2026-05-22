import { useCallback, useRef, useState } from 'react'
import {
  readProfileChatSessions,
  upsertProfileChatSession,
  sessionTitleFromMessages,
  type ProfileChatArchiveSession,
} from '../lib/profileChatArchive'
import type { TutorChatMessage } from '../components/TutorChatPanel'

export function useTutorChatArchive(userId: string) {
  const [sessions, setSessions] = useState<ProfileChatArchiveSession[]>(() =>
    readProfileChatSessions(userId),
  )
  const activeSessionIdRef = useRef<string | null>(null)

  const beginSession = useCallback((existingId?: string | null) => {
    const id = existingId ?? crypto.randomUUID()
    activeSessionIdRef.current = id
    return id
  }, [])

  const clearActiveSession = useCallback(() => {
    activeSessionIdRef.current = null
  }, [])

  const persistSession = useCallback(
    (
      messages: TutorChatMessage[],
      meta: { lessonId: string; lessonTitle: string; sessionId?: string | null },
    ) => {
      const hasUser = messages.some((m) => m.role === 'user')
      if (!hasUser) return

      const id = meta.sessionId ?? activeSessionIdRef.current ?? crypto.randomUUID()
      activeSessionIdRef.current = id

      upsertProfileChatSession(userId, {
        id,
        title: sessionTitleFromMessages(messages),
        updatedAt: Date.now(),
        lessonId: meta.lessonId,
        lessonTitle: meta.lessonTitle,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      })
      setSessions(readProfileChatSessions(userId))
      return id
    },
    [userId],
  )

  const refreshSessions = useCallback(() => {
    setSessions(readProfileChatSessions(userId))
  }, [userId])

  return {
    sessions,
    beginSession,
    clearActiveSession,
    persistSession,
    refreshSessions,
    getActiveSessionId: () => activeSessionIdRef.current,
  }
}
