import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ProfileDisplayNameForm } from './ProfileDisplayNameForm'

describe('ProfileDisplayNameForm', () => {
  afterEach(() => cleanup())

  it('отображает значение и вызывает onChange', () => {
    const onChange = vi.fn()
    render(
      <ProfileDisplayNameForm
        displayName="Анна"
        onChange={onChange}
        onBlur={() => {}}
      />,
    )
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('Анна')
    fireEvent.change(input, { target: { value: 'Борис' } })
    expect(onChange).toHaveBeenCalledWith('Борис')
  })

  it('показывает ошибку с role=alert', () => {
    render(
      <ProfileDisplayNameForm
        displayName=""
        error="Введите имя: минимум 1 символ."
        onChange={() => {}}
        onBlur={() => {}}
      />,
    )
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Введите имя')
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('вызывает onBlur при потере фокуса', () => {
    const onBlur = vi.fn()
    render(
      <ProfileDisplayNameForm
        displayName="Test"
        onChange={() => {}}
        onBlur={onBlur}
      />,
    )
    fireEvent.blur(screen.getByRole('textbox'))
    expect(onBlur).toHaveBeenCalled()
  })
})
