import './QuoteTearStrip.css'

import gsap from 'gsap'
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  createTearEngine,
  drawStrip,
  PEEL_EASE,
  resizeEngine,
  spawnParticles,
  tickParticles,
  type TearEngine,
} from './quoteTear/engine'

export type QuoteTearStripProps = {
  getQuote: () => string
  className?: string
}

export function QuoteTearStrip({ getQuote, className }: QuoteTearStripProps) {
  const engineRef = useRef<TearEngine>(createTearEngine())
  const rootRef = useRef<HTMLDivElement>(null)
  const deformCanvasRef = useRef<HTMLCanvasElement>(null)
  const particleCanvasRef = useRef<HTMLCanvasElement>(null)
  const stripOuterRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLParagraphElement>(null)
  const rafRef = useRef(0)
  const dragCancelTweenRef = useRef<gsap.core.Tween | null>(null)
  /** Одна цитата на попытку отрыва — getQuote() в профиле случайный */
  const sessionQuoteRef = useRef<string | null>(null)

  const [revealedQuote, setRevealedQuote] = useState('')
  const [revealVisible, setRevealVisible] = useState(false)

  const lockSessionQuote = useCallback(() => {
    if (!sessionQuoteRef.current) sessionQuoteRef.current = getQuote()
    return sessionQuoteRef.current
  }, [getQuote])

  const clearSessionQuote = useCallback(() => {
    sessionQuoteRef.current = null
    setRevealedQuote('')
    setRevealVisible(false)
  }, [])

  const showQuoteUnderStrip = useCallback(() => {
    setRevealedQuote(lockSessionQuote())
    setRevealVisible(true)
  }, [lockSessionQuote])

  const finishPeel = useCallback(() => {
    const deformCvs = deformCanvasRef.current
    const outer = stripOuterRef.current
    const hint = hintRef.current
    if (!deformCvs) return

    dragCancelTweenRef.current?.kill()
    dragCancelTweenRef.current = null

    deformCvs.style.opacity = '0'
    deformCvs.style.pointerEvents = 'none'
    if (outer) {
      outer.style.pointerEvents = 'none'
      outer.style.visibility = 'hidden'
    }
    engineRef.current.state = 'done'
    if (hint) hint.style.opacity = '0'
    if (sessionQuoteRef.current) setRevealedQuote(sessionQuoteRef.current)
    setRevealVisible(true)
  }, [])

  const triggerPeel = useCallback(() => {
    const engine = engineRef.current
    if (engine.state === 'peeling' || engine.state === 'done') return

    const deformCvs = deformCanvasRef.current
    const hint = hintRef.current
    if (!deformCvs) return

    dragCancelTweenRef.current?.kill()
    dragCancelTweenRef.current = null

    showQuoteUnderStrip()
    engine.state = 'peeling'
    engine.hideStripChrome = true
    engine.stubProg = 0
    if (hint) hint.style.opacity = '0'

    const rect = deformCvs.getBoundingClientRect()
    spawnParticles(engine, rect)

    const prx = { scroll: engine.scroll, curl: engine.curlAmt }
    gsap
      .timeline()
      .to(prx, {
        scroll: 0.18,
        curl: 0.52,
        duration: 0.26,
        ease: 'power2.in',
        onUpdate: () => {
          engine.scroll = prx.scroll
          engine.curlAmt = prx.curl
        },
      })
      .to(prx, {
        scroll: 0.84,
        curl: 0.96,
        duration: 0.7,
        ease: 'power1.inOut',
        onUpdate: () => {
          engine.scroll = prx.scroll
          engine.curlAmt = prx.curl
        },
      })
      .to(prx, {
        scroll: 1,
        curl: 0.9,
        duration: 0.28,
        ease: 'power3.out',
        onUpdate: () => {
          engine.scroll = prx.scroll
          engine.curlAmt = prx.curl
        },
      })
      .to(prx, {
        curl: 0.82,
        duration: 0.58,
        ease: PEEL_EASE,
        onUpdate: () => {
          engine.curlAmt = prx.curl
        },
      })
      .then(finishPeel)

    gsap.to(deformCvs, { y: 4, yoyo: true, repeat: 6, duration: 0.055, ease: 'none', delay: 0.24 })
  }, [finishPeel, showQuoteUnderStrip])

  const doResize = useCallback(() => {
    const deformCvs = deformCanvasRef.current
    const particleCvs = particleCanvasRef.current
    if (!deformCvs || !particleCvs) return
    resizeEngine(engineRef.current, deformCvs, particleCvs)
  }, [])

  useEffect(() => {
    const loop = () => {
      const engine = engineRef.current
      const deformCvs = deformCanvasRef.current
      const particleCvs = particleCanvasRef.current
      const dCtx = deformCvs?.getContext('2d')
      const pCtx = particleCvs?.getContext('2d')

      if (dCtx && engine.state !== 'done') drawStrip(dCtx, engine)
      if (pCtx && engine.ptAlive) tickParticles(pCtx, engine)

      rafRef.current = requestAnimationFrame(loop)
    }

    requestAnimationFrame(() => {
      doResize()
      rafRef.current = requestAnimationFrame(loop)
    })

    const ro = new ResizeObserver(() => doResize())
    if (rootRef.current) ro.observe(rootRef.current)
    window.addEventListener('resize', doResize)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      window.removeEventListener('resize', doResize)
    }
  }, [doResize])

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current
    if (engine.state !== 'idle') return
    engine.state = 'drag'
    engine.hideStripChrome = true
    engine.dragX0 = e.clientX
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current
    if (engine.state !== 'drag') return
    const dx = engine.dragX0 - e.clientX
    const pull = Math.max(0, Math.min(1, dx / 90))
    engine.scroll = pull * 0.3
    engine.curlAmt = engine.scroll * 0.92
    engine.stubProg = 0
    if (engine.scroll > 0.02) showQuoteUnderStrip()
  }

  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current
    if (engine.state !== 'drag') return

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }

    if (engine.scroll > 0.22) {
      triggerPeel()
      return
    }

    engine.state = 'idle'
    const s0 = engine.scroll
    const c0 = engine.curlAmt
    const prx = { t: 0 }
    dragCancelTweenRef.current?.kill()
    dragCancelTweenRef.current = gsap.to(prx, {
      t: 1,
      duration: 0.72,
      ease: 'elastic.out(1.1,0.40)',
      onUpdate: () => {
        if (engineRef.current.state !== 'idle') return
        engine.scroll = s0 * (1 - prx.t)
        engine.curlAmt = c0 * (1 - prx.t)
        engine.stubProg = 0
      },
      onComplete: () => {
        dragCancelTweenRef.current = null
        if (engineRef.current.state !== 'idle') return
        engine.scroll = 0
        engine.curlAmt = 0
        engine.stubProg = 0
        engine.hideStripChrome = false
        clearSessionQuote()
      },
    })
  }

  const onCanvasClick = () => {
    const engine = engineRef.current
    if (engine.state === 'idle' || engine.state === 'drag') triggerPeel()
  }

  const rootClass = [
    'quote-strip-scene',
    revealVisible ? 'quote-strip-scene--revealed' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass} ref={rootRef}>
      <div
        className={`quote-strip-reveal${revealVisible ? ' quote-strip-reveal--visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        <blockquote className="quote-strip-reveal__text">{revealedQuote || ' '}</blockquote>
      </div>

      <canvas className="quote-strip-particle-canvas" ref={particleCanvasRef} aria-hidden />

      <div className="quote-strip-outer" ref={stripOuterRef}>
        <canvas
          ref={deformCanvasRef}
          className="quote-strip-canvas"
          tabIndex={0}
          role="button"
          aria-label="Оторвать ленту: потяните влево или нажмите"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={onCanvasClick}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
              ev.preventDefault()
              if (engineRef.current.state === 'idle') {
                engineRef.current.hideStripChrome = true
                triggerPeel()
              }
            }
          }}
        />
      </div>

      <p className="quote-strip-hint" ref={hintRef}>
        нажми на стрелочку
      </p>
    </div>
  )
}
