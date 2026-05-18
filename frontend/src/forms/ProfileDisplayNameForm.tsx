type ProfileDisplayNameFormProps = {
  displayName: string
  error?: string
  onChange: (value: string) => void
  onBlur: () => void
}

/** Форма имени на студенческой карточке. */
export function ProfileDisplayNameForm({ displayName, error, onChange, onBlur }: ProfileDisplayNameFormProps) {
  return (
    <form
      className="student-profile__id-name-form"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Имя на карточке"
    >
      <input
        type="text"
        className="student-profile__id-name-input"
        value={displayName}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="________"
        aria-label="Имя на карточке"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'profile-name-error' : undefined}
        maxLength={48}
      />
      {error ? (
        <p id="profile-name-error" className="student-profile__field-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
