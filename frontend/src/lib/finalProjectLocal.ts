const key = (userId: string) => `kursovaya-final-project-done-v1:${userId}`

export function readFinalProjectDone(userId: string): boolean {
  if (!userId || userId === 'anonymous') return false
  try {
    return localStorage.getItem(key(userId)) === '1'
  } catch {
    return false
  }
}

export function setFinalProjectDone(userId: string, done: boolean): void {
  if (!userId || userId === 'anonymous') return
  try {
    if (done) localStorage.setItem(key(userId), '1')
    else localStorage.removeItem(key(userId))
  } catch {
    /* ignore */
  }
}
