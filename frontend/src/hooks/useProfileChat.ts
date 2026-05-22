import { FormEvent, useCallback, useState } from 'react'
import { validateChatDraft } from '../lib/validation'
import { PROFILE_CHAT_LESSON_ID, PROFILE_CHAT_LESSON_TITLE } from '../lib/profileChat'
import type { ProfileChatArchiveSession } from '../lib/profileChatArchive'
import type { TutorChatMessage } from '../components/TutorChatPanel'
import { useTutorChatArchive } from './useTutorChatArchive'

export function useProfileChat(userId: string) {
  const archive = useTutorChatArchive(userId)
  const [profileChatDraft, setProfileChatDraft] = useState('')
  const [profileChatOpen, setProfileChatOpen] = useState(false)
  const [profileChatPanelKey, setProfileChatPanelKey] = useState(0)
  const [profileChatInitialMessages, setProfileChatInitialMessages] = useState<
    TutorChatMessage[] | undefined
  >(undefined)
  const [activeProfileChatSessionId, setActiveProfileChatSessionId] = useState<string | null>(null)
  const [profileChatViewportFullscreen, setProfileChatViewportFullscreen] = useState(false)
  const [chatDraftError, setChatDraftError] = useState<string | undefined>()

  const openProfileChatAsNew = useCallback(() => {
    setActiveProfileChatSessionId(archive.beginSession(null))
    setProfileChatInitialMessages(undefined)
    setProfileChatViewportFullscreen(false)
    setProfileChatPanelKey((k) => k + 1)
    setProfileChatOpen(true)
  }, [archive])

  const openProfileChatFullscreen = useCallback(() => {
    setActiveProfileChatSessionId(archive.beginSession(null))
    setProfileChatInitialMessages(undefined)
    setProfileChatViewportFullscreen(true)
    setProfileChatPanelKey((k) => k + 1)
    setProfileChatOpen(true)
  }, [archive])

  const openProfileChatFromArchive = useCallback(
    (session: ProfileChatArchiveSession) => {
      setActiveProfileChatSessionId(archive.beginSession(session.id))
      setProfileChatInitialMessages(session.messages.map((m) => ({ ...m })))
      setProfileChatViewportFullscreen(false)
      setProfileChatPanelKey((k) => k + 1)
      setProfileChatOpen(true)
    },
    [archive],
  )

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

  const handleChatDraftChange = useCallback(
    (value: string) => {
      setProfileChatDraft(value)
      if (chatDraftError) setChatDraftError(undefined)
    },
    [chatDraftError],
  )

  const persistProfileMessages = useCallback(
    (messages: TutorChatMessage[]) => {
      const id = archive.persistSession(messages, {
        lessonId: PROFILE_CHAT_LESSON_ID,
        lessonTitle: PROFILE_CHAT_LESSON_TITLE,
        sessionId: activeProfileChatSessionId,
      })
      if (id && !activeProfileChatSessionId) {
        setActiveProfileChatSessionId(id)
      }
    },
    [activeProfileChatSessionId, archive],
  )

  const handleProfileChatCloseSnapshot = useCallback(
    (messages: TutorChatMessage[]) => {
      persistProfileMessages(messages)
    },
    [persistProfileMessages],
  )

  const handleProfileChatClosed = useCallback(() => {
    setProfileChatOpen(false)
    archive.clearActiveSession()
    setActiveProfileChatSessionId(null)
    setProfileChatInitialMessages(undefined)
    setProfileChatViewportFullscreen(false)
  }, [archive])

  return {
    profileChatDraft,
    setProfileChatDraft: handleChatDraftChange,
    chatDraftError,
    profileChatOpen,
    profileChatPanelKey,
    profileChatInitialMessages,
    profileChatSessions: archive.sessions,
    activeProfileChatSessionId,
    profileChatViewportFullscreen,
    openProfileChatAsNew,
    openProfileChatFullscreen,
    openProfileChatFromArchive,
    handleOpenProfileChat,
    handleProfileChatCloseSnapshot,
    handleProfileChatClosed,
    persistProfileMessages,
  }
}
