import { ChangeEvent, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import idCardImage from '../assets/images/Group 14-2.png'
import { ProfileDisplayNameForm } from './ProfileDisplayNameForm'

type ProfileAvatarFormProps = {
  avatarUrl: string
  avatarSaving: boolean
  memberShort: string
  displayName: string
  displayNameError?: string
  avatarError?: string
  onDisplayNameChange: (value: string) => void
  onDisplayNameBlur: () => void
  onPickFile: (event: ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
}

/** Форма аватара на студенческой карточке. */
export function ProfileAvatarForm({
  avatarUrl,
  avatarSaving,
  memberShort,
  displayName,
  displayNameError,
  avatarError,
  onDisplayNameChange,
  onDisplayNameBlur,
  onPickFile,
  onRemove,
}: ProfileAvatarFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="student-profile__id-card">
      <div className="student-profile__id-card-surface">
        <img src={idCardImage} alt="" className="student-profile__id-card-img" width={1173} height={856} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="student-profile__file-input"
          onChange={onPickFile}
          aria-label="Загрузить фото на карточку"
        />
        <div className="student-profile__avatar-zone">
          <div className="student-profile__avatar-slot">
            {avatarUrl ? <img src={avatarUrl} alt="" className="student-profile__avatar-img" /> : null}
          </div>
          {avatarSaving ? (
            <div className="student-profile__avatar-saving" aria-live="polite">
              <Loader2 size={22} className="app-icon-spin" aria-hidden />
            </div>
          ) : (
            <div className="student-profile__avatar-hover">
              {!avatarUrl ? (
                <button
                  type="button"
                  className="student-profile__avatar-action"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Добавить фото
                </button>
              ) : (
                <div className="student-profile__avatar-actions">
                  <button
                    type="button"
                    className="student-profile__avatar-action"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Обновить фото
                  </button>
                  <button
                    type="button"
                    className="student-profile__avatar-action student-profile__avatar-action--danger"
                    onClick={onRemove}
                  >
                    Удалить фото
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {avatarError ? (
          <p className="student-profile__field-error student-profile__avatar-error" role="alert">
            {avatarError}
          </p>
        ) : null}
        <ProfileDisplayNameForm
          displayName={displayName}
          error={displayNameError}
          onChange={onDisplayNameChange}
          onBlur={onDisplayNameBlur}
        />
        <span className="student-profile__id-member-text">{memberShort}</span>
      </div>
    </div>
  )
}
