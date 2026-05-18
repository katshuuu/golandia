import { describe, expect, it } from 'vitest'
import {
  validateAvatarDataUrl,
  validateAvatarFile,
  validateChatDraft,
  validateDisplayName,
  validateGoal,
} from './validation'

describe('validateDisplayName', () => {
  it('принимает корректное имя', () => {
    expect(validateDisplayName('Анна')).toEqual({ ok: true })
  })

  it('отклоняет пустое имя', () => {
    const r = validateDisplayName('   ')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toMatch(/минимум/)
  })

  it('отклоняет слишком длинное имя', () => {
    const r = validateDisplayName('x'.repeat(49))
    expect(r.ok).toBe(false)
  })

  it('отклоняет недопустимые символы', () => {
    const r = validateDisplayName('test@mail')
    expect(r.ok).toBe(false)
  })
})

describe('validateGoal', () => {
  it('принимает короткую цель', () => {
    expect(validateGoal('Изучить Go')).toEqual({ ok: true })
  })

  it('отклоняет слишком длинную цель', () => {
    expect(validateGoal('a'.repeat(501)).ok).toBe(false)
  })
})

describe('validateAvatarFile', () => {
  it('принимает image/jpeg', () => {
    const f = new File(['x'], 'a.jpg', { type: 'image/jpeg' })
    expect(validateAvatarFile(f).ok).toBe(true)
  })

  it('отклоняет не-изображение', () => {
    const f = new File(['x'], 'a.txt', { type: 'text/plain' })
    expect(validateAvatarFile(f).ok).toBe(false)
  })

  it('отклоняет файл больше 2 МБ', () => {
    const big = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' })
    const r = validateAvatarFile(big)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toMatch(/2 МБ/)
  })
})

describe('validateAvatarDataUrl', () => {
  it('принимает data:image', () => {
    expect(validateAvatarDataUrl('data:image/png;base64,abc').ok).toBe(true)
  })

  it('отклоняет не-data URL', () => {
    expect(validateAvatarDataUrl('https://x').ok).toBe(false)
  })
})

describe('validateChatDraft', () => {
  it('отклоняет пустой черновик', () => {
    expect(validateChatDraft('  ').ok).toBe(false)
  })

  it('принимает вопрос', () => {
    expect(validateChatDraft('Как работает defer?').ok).toBe(true)
  })
})
