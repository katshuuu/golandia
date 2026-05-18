import { useEffect, useRef } from 'react'

type AchievementHeroViewerProps = {
  src: string
  alt?: string
  /** Максимальный наклон по горизонтали (rotateY), градусы */
  maxRotateY?: number
  /** Максимальный наклон по вертикали (rotateX), градусы */
  maxRotateX?: number
}

/**
 * Интерактивный «3D»-просмотр героя: PNG наклоняется за курсором (CSS perspective).
 * Для настоящего вращения mesh подключите .glb через React Three Fiber (см. комментарий в README курса).
 */
export function AchievementHeroViewer({
  src,
  alt = '',
  maxRotateY = 42,
  maxRotateX = 22,
}: AchievementHeroViewerProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stage = stageRef.current
    const inner = innerRef.current
    if (!stage || !inner) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reducedMotion.matches) return

    let raf = 0
    let targetRx = 0
    let targetRy = 0
    let currentRx = 0
    let currentRy = 0

    const apply = () => {
      currentRx += (targetRx - currentRx) * 0.1
      currentRy += (targetRy - currentRy) * 0.1
      inner.style.transform = `rotateX(${currentRx.toFixed(2)}deg) rotateY(${currentRy.toFixed(2)}deg)`
      raf = requestAnimationFrame(apply)
    }

    const setFromPointer = (clientX: number, clientY: number) => {
      const rect = stage.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      const nx = (clientX - rect.left) / rect.width - 0.5
      const ny = (clientY - rect.top) / rect.height - 0.5
      targetRy = nx * maxRotateY * 2
      targetRx = -ny * maxRotateX * 2
    }

    const onPointerMove = (event: PointerEvent) => {
      setFromPointer(event.clientX, event.clientY)
    }

    const onPointerLeave = () => {
      targetRx = 0
      targetRy = 0
    }

    raf = requestAnimationFrame(apply)
    stage.addEventListener('pointermove', onPointerMove)
    stage.addEventListener('pointerleave', onPointerLeave)

    const onMotionChange = () => {
      if (reducedMotion.matches) {
        targetRx = 0
        targetRy = 0
        currentRx = 0
        currentRy = 0
        inner.style.transform = ''
      }
    }
    reducedMotion.addEventListener('change', onMotionChange)

    return () => {
      stage.removeEventListener('pointermove', onPointerMove)
      stage.removeEventListener('pointerleave', onPointerLeave)
      reducedMotion.removeEventListener('change', onMotionChange)
      cancelAnimationFrame(raf)
    }
  }, [maxRotateX, maxRotateY])

  return (
    <div ref={stageRef} className="achievements-character-3d-stage" aria-hidden={alt === ''}>
      <div ref={innerRef} className="achievements-character-3d-inner">
        <img src={src} alt={alt} className="achievements-character-img" draggable={false} />
      </div>
    </div>
  )
}
