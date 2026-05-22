import { useCallback, useMemo, useRef } from 'react'
import { AppSiteHeader } from '../components/AppSiteHeader'
import { QuoteTearStrip } from '../components/QuoteTearStrip'
import { ProfileChatSection, ProfileHeroSection, ProfileProgressSection } from '../components/profile'
import { useProfileChat } from '../hooks/useProfileChat'
import { useProfilePage } from '../hooks/useProfilePage'
import { getOrCreateLocalUserId } from '../lib/localUser'
import './AppPages.css'
import './styles/index.css'

const QUOTES = [
  'Код не спорит — он либо работает, либо учит.',
  'Один шаг ближе к цели — уже прогресс.',
  'Ошибка — это просто обратная связь от компьютера.',
  'Учиться можно медленно, главное — не останавливаться.',
  'Сегодняшняя практика — завтрашняя уверенность.',
]

export function ProfilePage() {
  const userId = useMemo(() => getOrCreateLocalUserId(), [])
  const progressCardRef = useRef<HTMLElement | null>(null)
  const profile = useProfilePage(userId)
  const chat = useProfileChat(userId)
  const getQuote = useCallback(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], [])

  const handleProgressHintClick = useCallback(() => {
    progressCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  return (
    <div className="app-page app-page--full app-page--profile-scrapbook">
      <AppSiteHeader />

      <section className="student-profile" aria-label="Профиль студента">
        <div className="student-profile__max golia-stagger-children">
          <div className="student-profile__hero golia-stagger-children">
            <div className="student-profile__top golia-stagger-children">
              <ProfileHeroSection
                greetingLine={profile.greetingLine}
                displayName={profile.displayName}
                displayNameError={profile.nameError}
                avatarError={profile.avatarError}
                onDisplayNameChange={profile.setDisplayName}
                onDisplayNameBlur={profile.persistDisplayName}
                avatarUrl={profile.avatarUrl}
                avatarSaving={profile.avatarSaving}
                memberShort={profile.memberShort}
                onAvatarPick={profile.handleAvatarPick}
                onRemoveAvatar={() => void profile.handleRemoveAvatar()}
                onProgressHintClick={handleProgressHintClick}
              />
              <ProfileProgressSection
                progressCardRef={progressCardRef}
                progressPercent={profile.progressPercent}
                ring={profile.ring}
                solvedCount={profile.solvedCount}
                totalCount={profile.totalCount}
                resumeLesson={profile.resumeLesson}
              />
              {profile.saveNotice ? (
                <p className="student-profile__save-notice" role="status">
                  {profile.saveNotice}
                </p>
              ) : null}
            </div>
            <div className="student-profile__banner-wrap">
              <QuoteTearStrip getQuote={getQuote} />
            </div>
          </div>

          <div className="student-profile__bottom">
            <ProfileChatSection
              profileChatDraft={chat.profileChatDraft}
              onDraftChange={chat.setProfileChatDraft}
              chatDraftError={chat.chatDraftError}
              onOpenChat={chat.handleOpenProfileChat}
              profileChatOpen={chat.profileChatOpen}
              profileChatPanelKey={chat.profileChatPanelKey}
              profileChatViewportFullscreen={chat.profileChatViewportFullscreen}
              profileChatInitialMessages={chat.profileChatInitialMessages}
              profileChatSessions={chat.profileChatSessions}
              activeProfileChatSessionId={chat.activeProfileChatSessionId}
              onNewChat={chat.openProfileChatAsNew}
              onOpenFromArchive={chat.openProfileChatFromArchive}
              onOpenFullscreen={chat.openProfileChatFullscreen}
              onCloseSnapshot={chat.handleProfileChatCloseSnapshot}
              onPersistMessages={chat.persistProfileMessages}
              onClose={chat.handleProfileChatClosed}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
