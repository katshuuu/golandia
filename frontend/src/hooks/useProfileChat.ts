import { FormEvent, useCallback, useState } from 'react'
import { validateChatDraft } from '../lib/validation'
import {
  readProfileChatSessions,
  upsertProfileChatSession,
  sessionTitleFromMessages,
  type ProfileChatArchiveSession,
} from '../lib/profileChatArchive'
import type { TutorChatMessage } from '../components/TutorChatPanel'

export function useProfileChat(userId: string) {
  const [profileChatDraft, setProfileChatDraft] = useState('')
  const [profileChatOpen, setProfileChatOpen] = useState(false)
  const [profileChatPanelKey, setProfileChatPanelKey] = useState(0)
  const [profileChatInitialMessages, setProfileChatInitialMessages] = useState<
    TutorChatMessage[] | undefined
  >(undefined)
  const [profileChatSessions, setProfileChatSessions] = useState<ProfileChatArchiveSession[]>(() =>
    readProfileChatSessions(userId),
  )
  const [activeProfileChatSessionId, setActiveProfileChatSessionId] = useState<string | null>(null)
  const [profileChatViewportFullscreen, setProfileChatViewportFullscreen] = useState(false)
  const [chatDraftError, setChatDraftError] = useState<string | undefined>()

  const openProfileChatAsNew = useCallback(() => {
    setActiveProfileChatSessionId(null)
    setProfileChatInitialMessages(undefined)
    setProfileChatViewportFullscreen(false)
    setProfileChatPanelKey((k) => k + 1)
    setProfileChatOpen(true)
  }, [])

  const openProfileChatFullscreen = useCallback(() => {
    setActiveProfileChatSessionId(null)
    setProfileChatInitialMessages(undefined)
    setProfileChatViewportFullscreen(true)
    setProfileChatPanelKey((k) => k + 1)
    setProfileChatOpen(true)
  }, [])

  const openProfileChatFromArchive = useCallback((session: ProfileChatArchiveSession) => {
    setActiveProfileChatSessionId(session.id)
    setProfileChatInitialMessages(session.messages.map((m) => ({ ...m })))
    setProfileChatViewportFullscreen(false)
    setProfileChatPanelKey((k) => k + 1)
    setProfileChatOpen(true)
  }, [])

  const handleOpenProfileChat = useCallback(
    (event: FormEvent) => {
      event.preventDefault()
      const check = validateChatDraft(profileChatDraft)
      if (!check.ok) {
        setChatDraftError(check.message)
        return
      }
      setChatDraftError(undefined)
      openProfileChatAsNew()
    },
    [openProfileChatAsNew, profileChatDraft],
  )

  const handleChatDraftChange = useCallback((value: string) => {
    setProfileChatDraft(value)
    if (chatDraftError) setChatDraftError(undefined)
  }, [chatDraftError])

  const handleProfileChatCloseSnapshot = useCallback(
    (messages: TutorChatMessage[]) => {
      const hasUser = messages.some((m) => m.role === 'user')
      if (!hasUser) return
      const id = activeProfileChatSessionId ?? crypto.randomUUID()
      upsertProfileChatSession(userId, {
        id,
        title: sessionTitleFromMessages(messages),
        updatedAt: Date.now(),
        messages: messages.map((m) => ({ ...m })),
      })
      setProfileChatSessions(readProfileChatSessions(userId))
    },
    [activeProfileChatSessionId, userId],
  )

  const handleProfileChatClosed = useCallback(() => {
    setProfileChatOpen(false)
    setActiveProfileChatSessionId(null)
    setProfileChatInitialMessages(undefined)
    setProfileChatViewportFullscreen(false)
  }, [])

  return {
    profileChatDraft,
    setProfileChatDraft: handleChatDraftChange,
    chatDraftError,
    profileChatOpen,
    profileChatPanelKey,
    profileChatInitialMessages,
    profileChatSessions,
    activeProfileChatSessionId,
    profileChatViewportFullscreen,
    openProfileChatAsNew,
    openProfileChatFullscreen,
    openProfileChatFromArchive,
    handleOpenProfileChat,
    handleProfileChatCloseSnapshot,
    handleProfileChatClosed,
  }
}
