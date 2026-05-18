type ProfileGoalFormProps = {
  goal: string
  error?: string
  onChange: (value: string) => void
  onBlur: () => void
}

/** Цель обучения на профиле студента. */
export function ProfileGoalForm({ goal, error, onChange, onBlur }: ProfileGoalFormProps) {
  return (
    <form
      className="student-profile__goal-form"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Цель обучения"
    >
      <label className="student-profile__goal-copy" htmlFor="profile-goal-input">
        Цель обучения
      </label>
      <textarea
        id="profile-goal-input"
        className="student-profile__goal-input"
        value={goal}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="Например: сдать экзамен по Go и написать свой проект"
        rows={3}
        maxLength={500}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'profile-goal-error' : undefined}
      />
      {error ? (
        <p id="profile-goal-error" className="student-profile__field-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
