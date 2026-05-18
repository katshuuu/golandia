export const DEFAULT_PROFILE_DISPLAY_NAME = 'Студент'

export function displayNameKey(userId: string) {
  return `kursovaya-profile-name-v1:${userId}`
}

export function goalKey(userId: string) {
  return `kursovaya-profile-goal-v1:${userId}`
}

export function avatarKey(userId: string) {
  return `kursovaya-profile-avatar-v1:${userId}`
}

export function readDisplayName(userId: string): string {
  try {
    return (localStorage.getItem(displayNameKey(userId)) || '').trim()
  } catch {
    return ''
  }
}

export function writeDisplayName(userId: string, name: string): void {
  try {
    localStorage.setItem(displayNameKey(userId), name.trim())
  } catch {
    /* ignore */
  }
}

/** Имя по умолчанию при первом входе, если пользователь ещё не задал своё. */
export function ensureInitialDisplayName(
  userId: string,
  fallback = DEFAULT_PROFILE_DISPLAY_NAME,
): string {
  const existing = readDisplayName(userId)
  if (existing) return existing
  const initial = fallback.trim() || DEFAULT_PROFILE_DISPLAY_NAME
  writeDisplayName(userId, initial)
  return initial
}

export function readGoal(userId: string): string {
  try {
    return (localStorage.getItem(goalKey(userId)) || '').trim()
  } catch {
    return ''
  }
}

export function writeGoal(userId: string, goal: string): void {
  try {
    localStorage.setItem(goalKey(userId), goal.trim())
  } catch {
    /* ignore */
  }
}

export function readAvatarDataUrl(userId: string): string {
  try {
    return localStorage.getItem(avatarKey(userId)) || ''
  } catch {
    return ''
  }
}

export function writeAvatarDataUrl(userId: string, dataUrl: string): void {
  try {
    if (dataUrl) localStorage.setItem(avatarKey(userId), dataUrl)
    else localStorage.removeItem(avatarKey(userId))
  } catch {
    /* ignore */
  }
}
