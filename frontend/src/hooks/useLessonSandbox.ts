import { useCallback, useEffect, useState } from 'react'
import type { BackendLesson } from '../lib/courseApi'
import { checkLesson, runSandbox } from '../lib/courseApi'
import { markLocalSandboxLessonDone } from '../lib/lessonProgressLocal'

function codeStorageKey(lessonId: string, uid: string) {
  return `go_tutor_code_${lessonId}_${uid}`
}

export type LessonNotification = { type: 'success' | 'error'; text: string } | null

export function useLessonSandbox(
  selectedLesson: BackendLesson | null,
  selectedLessonId: string | null,
  userId: string,
  onNotify: (notification: LessonNotification) => void,
) {
  const [editorCode, setEditorCode] = useState('')
  const [runStdout, setRunStdout] = useState('')
  const [runStderr, setRunStderr] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    if (!selectedLesson) return
    const key = codeStorageKey(selectedLesson.id, userId)
    const saved = localStorage.getItem(key)
    setEditorCode(saved ?? selectedLesson.task?.starter_code ?? '')
    setRunStdout('')
    setRunStderr('')
  }, [selectedLesson?.id, userId, selectedLesson])

  const handleEditorChange = useCallback(
    (val: string) => {
      setEditorCode(val)
      if (selectedLesson) localStorage.setItem(codeStorageKey(selectedLesson.id, userId), val)
    },
    [selectedLesson, userId],
  )

  const handleRunCode = useCallback(async () => {
    if (!editorCode.trim()) return
    setIsRunning(true)
    onNotify(null)
    try {
      const data = await runSandbox(editorCode)
      if (!data.ok || data.stderr) {
        setRunStderr(data.stderr || 'Ошибка запуска')
        setRunStdout(data.stdout ?? '')
      } else {
        setRunStderr('')
        setRunStdout(data.stdout || '(программа завершилась без вывода)')
      }
    } catch (error: unknown) {
      setRunStdout('')
      setRunStderr(error instanceof Error ? error.message : 'Не удалось подключиться к песочнице.')
    } finally {
      setIsRunning(false)
    }
  }, [editorCode, onNotify])

  const handleCheckTask = useCallback(async () => {
    if (!selectedLesson?.task?.check || !selectedLessonId) return
    setIsChecking(true)
    onNotify(null)
    try {
      const data = await runSandbox(editorCode)
      if (!data.ok || data.stderr) {
        setRunStderr(data.stderr || 'Ошибка запуска')
        setRunStdout(data.stdout ?? '')
        onNotify({ type: 'error', text: 'Код содержит ошибку. Почитай описание ошибки и попробуй ещё!' })
        return
      }
      const programOutput = (data.stdout || '').trim()
      setRunStderr('')
      setRunStdout(data.stdout || '(программа завершилась без вывода)')
      const result = await checkLesson(programOutput, editorCode, selectedLesson.task.check)
      if (result.ok) {
        markLocalSandboxLessonDone(selectedLessonId, userId)
        onNotify({ type: 'success', text: 'Задание выполнено, молодец🌟!' })
      } else {
        onNotify({
          type: 'error',
          text: `Вывод или код не прошли проверку: ${result.reason || 'попробуй ещё раз'}`,
        })
      }
    } catch (error: unknown) {
      onNotify({ type: 'error', text: error instanceof Error ? error.message : 'Ошибка при проверке.' })
    } finally {
      setIsChecking(false)
    }
  }, [editorCode, onNotify, selectedLesson, selectedLessonId, userId])

  const sandboxBusy = isRunning || isChecking
  const tutorCodeOutput = runStderr.trim() ? runStderr : runStdout

  return {
    editorCode,
    runStdout,
    runStderr,
    sandboxBusy,
    tutorCodeOutput,
    handleEditorChange,
    handleRunCode,
    handleCheckTask,
  }
}
