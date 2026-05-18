import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { fetchManifest, type CourseManifest } from '../lib/courseApi'
import { countLessonsInManifest } from '../lib/progressMap'
import { LESSON_PROGRESS_EVENT, readLocalSandboxDoneLessonIds } from '../lib/lessonProgressLocal'
import {
  flattenManifestLessonOrder,
  pickNextIncompleteLesson,
  type OrderedLessonEntry,
} from '../lib/profileLessonOrder'
import {
  readAvatarDataUrl,
  readGoal,
  ensureInitialDisplayName,
  writeAvatarDataUrl,
  writeDisplayName,
  writeGoal,
} from '../lib/profileLocal'
import { fileToAvatarJpegDataUrl } from '../lib/resizeAvatar'
import { ApiValidationError, fetchUserProfile, saveUserProfile } from '../lib/userApi'
import {
  fieldErrorsToMap,
  validateAvatarDataUrl,
  validateAvatarFile,
  validateDisplayName,
  validateGoal,
} from '../lib/validation'

export function progressRingDash(percent: number, radius = 52) {
  const c = 2 * Math.PI * radius
  const p = Math.min(100, Math.max(0, percent))
  const filled = (p / 100) * c
  return { circumference: c, dashOffset: c - filled }
}

export function useProfilePage(userId: string) {
  const [displayName, setDisplayName] = useState('')
  const [goal, setGoal] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [solvedCount, setSolvedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [manifest, setManifest] = useState<CourseManifest | null>(null)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [nameError, setNameError] = useState<string | undefined>()
  const [goalError, setGoalError] = useState<string | undefined>()
  const [avatarError, setAvatarError] = useState<string | undefined>()
  const [saveNotice, setSaveNotice] = useState<string | undefined>()

  useEffect(() => {
    setDisplayName(ensureInitialDisplayName(userId))
    setGoal(readGoal(userId))
    setAvatarUrl(readAvatarDataUrl(userId))
    setSolvedCount(readLocalSandboxDoneLessonIds(userId).size)
    fetchManifest()
      .then((m) => {
        setManifest(m)
        setTotalCount(countLessonsInManifest(m))
      })
      .catch(() => {})
    fetchUserProfile(userId)
      .then((p) => {
        if (!p) return
        if (p.display_name?.trim()) setDisplayName(p.display_name.trim())
        if (p.goal != null) setGoal(p.goal)
        if (p.avatar_data_url) setAvatarUrl(p.avatar_data_url)
      })
      .catch(() => {})
  }, [userId])

  useEffect(() => {
    const sync = () => setSolvedCount(readLocalSandboxDoneLessonIds(userId).size)
    window.addEventListener(LESSON_PROGRESS_EVENT, sync)
    return () => window.removeEventListener(LESSON_PROGRESS_EVENT, sync)
  }, [userId])

  const doneIds = useMemo(() => readLocalSandboxDoneLessonIds(userId), [userId, solvedCount])

  const orderedLessons = useMemo(
    () => (manifest ? flattenManifestLessonOrder(manifest) : []),
    [manifest],
  )

  const resumeLesson = useMemo((): OrderedLessonEntry | null => {
    if (!orderedLessons.length) return null
    return pickNextIncompleteLesson(orderedLessons, doneIds) ?? orderedLessons[orderedLessons.length - 1] ?? null
  }, [orderedLessons, doneIds])

  const progressPercent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0
  const ring = progressRingDash(progressPercent)
  const greetingLine =
    displayName.trim().length > 0 ? `ПРИВЕТ, ${displayName.trim().toUpperCase()}!` : 'ПРИВЕТ, СТУДЕНТ!'
  const memberShort = userId.length > 14 ? `${userId.slice(0, 12)}…` : userId

  const syncProfileToServer = useCallback(
    async (name: string, goalValue: string, avatar: string) => {
      try {
        await saveUserProfile(userId, {
          display_name: name,
          goal: goalValue,
          avatar_data_url: avatar,
        })
        setSaveNotice(undefined)
      } catch (err) {
        if (err instanceof ApiValidationError) {
          const map = fieldErrorsToMap(err.fields)
          setNameError(map.display_name)
          setGoalError(map.goal)
          setAvatarError(map.avatar_data_url)
          setSaveNotice(err.message)
          return
        }
        setSaveNotice(err instanceof Error ? err.message : 'Не удалось сохранить профиль')
      }
    },
    [userId],
  )

  const persistDisplayName = useCallback(() => {
    const r = validateDisplayName(displayName)
    if (!r.ok) {
      setNameError(r.message)
      return
    }
    setNameError(undefined)
    const trimmed = displayName.trim()
    setDisplayName(trimmed)
    writeDisplayName(userId, trimmed)
    void syncProfileToServer(trimmed, goal.trim(), avatarUrl)
  }, [userId, displayName, goal, avatarUrl, syncProfileToServer])

  const persistGoal = useCallback(() => {
    const r = validateGoal(goal)
    if (!r.ok) {
      setGoalError(r.message)
      return
    }
    setGoalError(undefined)
    const trimmed = goal.trim()
    setGoal(trimmed)
    writeGoal(userId, trimmed)
    void syncProfileToServer(displayName.trim(), trimmed, avatarUrl)
  }, [userId, displayName, goal, avatarUrl, syncProfileToServer])

  const handleAvatarPick = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return
      const fileCheck = validateAvatarFile(file)
      if (!fileCheck.ok) {
        setAvatarError(fileCheck.message)
        return
      }
      setAvatarSaving(true)
      setAvatarError(undefined)
      try {
        const dataUrl = await fileToAvatarJpegDataUrl(file)
        const urlCheck = validateAvatarDataUrl(dataUrl)
        if (!urlCheck.ok) {
          setAvatarError(urlCheck.message)
          return
        }
        writeAvatarDataUrl(userId, dataUrl)
        setAvatarUrl(dataUrl)
        await syncProfileToServer(displayName.trim(), goal.trim(), dataUrl)
      } catch {
        setAvatarError('Не удалось обработать изображение.')
      } finally {
        setAvatarSaving(false)
      }
    },
    [userId, displayName, goal, syncProfileToServer],
  )

  const handleRemoveAvatar = useCallback(async () => {
    setAvatarSaving(true)
    setAvatarError(undefined)
    try {
      writeAvatarDataUrl(userId, '')
      setAvatarUrl('')
      await syncProfileToServer(displayName.trim(), goal.trim(), '')
    } finally {
      setAvatarSaving(false)
    }
  }, [userId, displayName, goal, syncProfileToServer])

  const handleDisplayNameChange = useCallback((value: string) => {
    setDisplayName(value)
    if (nameError) setNameError(undefined)
  }, [nameError])

  const handleGoalChange = useCallback((value: string) => {
    setGoal(value)
    if (goalError) setGoalError(undefined)
  }, [goalError])

  return {
    displayName,
    goal,
    setDisplayName: handleDisplayNameChange,
    setGoal: handleGoalChange,
    avatarUrl,
    avatarSaving,
    nameError,
    goalError,
    avatarError,
    saveNotice,
    solvedCount,
    totalCount,
    progressPercent,
    ring,
    greetingLine,
    memberShort,
    resumeLesson,
    persistDisplayName,
    persistGoal,
    handleAvatarPick,
    handleRemoveAvatar,
  }
}
