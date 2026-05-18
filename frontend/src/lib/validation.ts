export type ValidationResult = { ok: true } | { ok: false; message: string }

const DISPLAY_NAME_MIN = 1
const DISPLAY_NAME_MAX = 48
const GOAL_MAX = 500
const CHAT_MESSAGE_MAX = 4000
const AVATAR_DATA_URL_MAX = 350_000

const DISPLAY_NAME_RE = /^[\p{L}\p{N}\s._-]+$/u

/** Валидация имени на карточке (ГОСТ 34.602-89, п. 3.2.4.3). */
export function validateDisplayName(value: string): ValidationResult {
  const trimmed = value.trim()
  if (trimmed.length < DISPLAY_NAME_MIN) {
    return { ok: false, message: 'Введите имя: минимум 1 символ.' }
  }
  if (trimmed.length > DISPLAY_NAME_MAX) {
    return { ok: false, message: `Имя не длиннее ${DISPLAY_NAME_MAX} символов.` }
  }
  if (!DISPLAY_NAME_RE.test(trimmed)) {
    return { ok: false, message: 'Имя: только буквы, цифры, пробел и символы . _ -' }
  }
  return { ok: true }
}

export function validateGoal(value: string): ValidationResult {
  if (value.trim().length > GOAL_MAX) {
    return { ok: false, message: `Цель обучения: не более ${GOAL_MAX} символов.` }
  }
  return { ok: true }
}

export function validateAvatarFile(file: File): ValidationResult {
  if (!file.type.startsWith('image/')) {
    return { ok: false, message: 'Загрузите файл изображения (JPEG, PNG, WebP).' }
  }
  if (file.size > 2 * 1024 * 1024) {
    return { ok: false, message: 'Размер аватара не более 2 МБ.' }
  }
  return { ok: true }
}

export function validateAvatarDataUrl(dataUrl: string): ValidationResult {
  if (!dataUrl) return { ok: true }
  if (!dataUrl.startsWith('data:image/')) {
    return { ok: false, message: 'Аватар: ожидается изображение в формате data URL.' }
  }
  if (dataUrl.length > AVATAR_DATA_URL_MAX) {
    return { ok: false, message: 'Аватар слишком большой после сжатия.' }
  }
  return { ok: true }
}

export function validateChatDraft(value: string): ValidationResult {
  const trimmed = value.trim()
  if (!trimmed) {
    return { ok: false, message: 'Введите вопрос для куратора.' }
  }
  if (trimmed.length > CHAT_MESSAGE_MAX) {
    return { ok: false, message: `Сообщение не длиннее ${CHAT_MESSAGE_MAX} символов.` }
  }
  return { ok: true }
}

/** Собирает карту field → message для отображения под полями. */
export function fieldErrorsToMap(fields: { field: string; message: string }[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const f of fields) {
    map[f.field] = f.message
  }
  return map
}
