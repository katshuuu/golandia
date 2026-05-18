import { ApiValidationError, parseApiErrorResponse } from './apiErrors'

export type UserProfileDto = {
  id: string
  display_name: string
  goal: string
  avatar_data_url: string
}

export type UserProgressDto = {
  completed_lessons: Record<string, boolean>
  final_project_done: boolean
}

export async function fetchUserProfile(userId: string): Promise<UserProfileDto | null> {
  const res = await fetch(`/api/users/${encodeURIComponent(userId)}/profile`)
  if (res.status === 404) return null
  if (!res.ok) await parseApiErrorResponse(res)
  return (await res.json()) as UserProfileDto
}

export async function saveUserProfile(
  userId: string,
  body: Pick<UserProfileDto, 'display_name' | 'goal' | 'avatar_data_url'>,
): Promise<UserProfileDto> {
  const res = await fetch(`/api/users/${encodeURIComponent(userId)}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) await parseApiErrorResponse(res)
  return (await res.json()) as UserProfileDto
}

export async function saveUserProgress(userId: string, progress: UserProgressDto): Promise<void> {
  const res = await fetch(`/api/users/${encodeURIComponent(userId)}/progress`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(progress),
  })
  if (!res.ok) await parseApiErrorResponse(res)
}

export { ApiValidationError }
