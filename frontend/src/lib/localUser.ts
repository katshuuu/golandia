import { ensureInitialDisplayName } from './profileLocal'

const USER_ID_KEY = 'kursovaya-local-user-id-v1'

export type LocalUserSession = {
  userId: string
  isFirstVisit: boolean
}

export function getOrCreateLocalUserSession(): LocalUserSession {
  try {
    let id = localStorage.getItem(USER_ID_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(USER_ID_KEY, id)
      ensureInitialDisplayName(id)
      return { userId: id, isFirstVisit: true }
    }
    return { userId: id, isFirstVisit: false }
  } catch {
    return { userId: 'anonymous', isFirstVisit: false }
  }
}

export function getOrCreateLocalUserId(): string {
  return getOrCreateLocalUserSession().userId
}
