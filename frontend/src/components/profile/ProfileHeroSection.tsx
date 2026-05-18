import { ProfileAvatarForm } from '../../forms'

type ProfileHeroSectionProps = {
  greetingLine: string
  displayName: string
  displayNameError?: string
  avatarError?: string
  onDisplayNameChange: (value: string) => void
  onDisplayNameBlur: () => void
  avatarUrl: string
  avatarSaving: boolean
  memberShort: string
  onAvatarPick: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveAvatar: () => void
  onProgressHintClick: () => void
}

export function ProfileHeroSection({
  greetingLine,
  displayName,
  displayNameError,
  avatarError,
  onDisplayNameChange,
  onDisplayNameBlur,
  avatarUrl,
  avatarSaving,
  memberShort,
  onAvatarPick,
  onRemoveAvatar,
  onProgressHintClick,
}: ProfileHeroSectionProps) {
  return (
    <div className="student-profile__id-col">
      <div className="student-profile__id-greeting-stack">
        <button type="button" className="student-profile__hello-pill" onClick={onProgressHintClick}>
          Покажем прогресс сегодня?
        </button>
        <h1 className="student-profile__hello">{greetingLine}</h1>
      </div>
      <ProfileAvatarForm
        avatarUrl={avatarUrl}
        avatarSaving={avatarSaving}
        memberShort={memberShort}
        displayName={displayName}
        displayNameError={displayNameError}
        avatarError={avatarError}
        onDisplayNameChange={onDisplayNameChange}
        onDisplayNameBlur={onDisplayNameBlur}
        onPickFile={onAvatarPick}
        onRemove={onRemoveAvatar}
      />
    </div>
  )
}
