import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(CustomEase)

export const PEEL_EASE = CustomEase.create(
  'peel',
  'M0,0 C0.06,0 0.20,0.32 0.28,0.52 0.38,0.74 0.50,0.90 0.64,0.97 0.75,1.03 0.84,1 1,1',
)

const COLS = 56
const ROWS = 14
const DPR_CAP = 2
const STRIP_LABEL = 'открой цитату дня'
const STRIP_LABEL_SHORT = 'цитата дня'
const STRIP_FONT = "'Dudu', 'Times New Roman', serif"

function stripLayout(W: number, H: number) {
  const scale = Math.min(W / 700, H / 240, 1.15)
  const minDim = Math.min(W, H)
  return {
    scale,
    label: W < 360 ? STRIP_LABEL_SHORT : STRIP_LABEL,
    maxLabelWidth: W * 0.9,
    labelFontMax: Math.max(15, Math.min(34, H * 0.2, W * 0.065)),
    labelFontMin: 15,
    labelY: H * 0.5,
    arrowX: W * 0.04,
    arrowY: H * 0.5,
    arrowR: Math.max(40, Math.min(52, minDim * 0.13)),
    jagBase: 8 * Math.max(0.5, scale),
    tearLineWidth: Math.max(1, 1.7 * scale),
    curlShadowW: 38 * Math.max(0.55, scale),
  }
}

function fitCanvasFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxPx: number,
  minPx: number,
) {
  for (let size = Math.round(maxPx); size >= minPx; size -= 1) {
    ctx.font = `bold ${size}px ${STRIP_FONT}`
    if (ctx.measureText(text).width <= maxWidth) return size
  }
  return minPx
}

export type MeshPoint = { x: number; y: number; ox: number; oy: number }
export type TearState = 'idle' | 'drag' | 'peeling' | 'done'

export type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  ay: number
  ax: number
  rot: number
  rv: number
  w: number
  h: number
  col: string
  life: number
  dc: number
  shape: 'fiber' | 'circle' | 'rect'
}

const PASTEL = [
  '#ffd6e0', '#ffb3c6', '#f4c2d8', '#e8c4e1', '#dbb8e8',
  '#c9e8f5', '#b8dff5', '#afe0e8', '#b5ead7', '#bef0e8',
  '#fff3c4', '#ffe8a1', '#ffdbb5', '#ffcba4', '#f8d5b0',
  '#d4f0d4', '#c5e8c5', '#c2e8d8', '#d0f0e4', '#b8e8cc',
  '#e4d4f8', '#d8c8f4', '#e0ceee', '#d5c0f0', '#c8b8e8',
  '#f8e8d0', '#f5e0c8', '#f0dcc4', '#f8f0d8', '#eeddc8',
]

export type TearEngine = {
  W: number
  H: number
  mesh: MeshPoint[][]
  scroll: number
  curlAmt: number
  stubProg: number
  state: TearState
  /** Скрыть текст и стрелку на ленте (сразу после нажатия) */
  hideStripChrome: boolean
  dragX0: number
  particles: Particle[]
  ptAlive: boolean
  tex: HTMLCanvasElement | null
  texOk: boolean
  dpr: number
}

export function createTearEngine(): TearEngine {
  return {
    W: 0,
    H: 0,
    mesh: [],
    scroll: 0,
    curlAmt: 0,
    stubProg: 0,
    state: 'idle',
    hideStripChrome: false,
    dragX0: 0,
    particles: [],
    ptAlive: false,
    tex: null,
    texOk: false,
    dpr: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, DPR_CAP),
  }
}

export function buildMesh(engine: TearEngine) {
  const { W, H } = engine
  engine.mesh = []
  for (let r = 0; r <= ROWS; r++) {
    engine.mesh[r] = []
    for (let c = 0; c <= COLS; c++) {
      const ox = (c / COLS) * W
      const oy = (r / ROWS) * H
      engine.mesh[r]![c] = { x: ox, y: oy, ox, oy }
    }
  }
}

export function buildTex(engine: TearEngine) {
  const TW = 1024
  const TH = 512
  const tex = document.createElement('canvas')
  tex.width = TW
  tex.height = TH
  const t = tex.getContext('2d')
  if (!t) return

  const bg = t.createLinearGradient(0, 0, TW, TH)
  bg.addColorStop(0, '#f8f1eb')
  t.fillStyle = bg
  t.fillRect(0, 0, TW, TH)

  const folds: [number, number, number, number, number, number][] = [
    [0, 28, TW, 0.055, 1.2, -2.5], [0, 52, TW, 0.04, 0.8, 2], [0, 78, TW, 0.06, 1.5, -1.8],
    [0, 105, TW, 0.038, 0.7, 2.5], [0, 132, TW, 0.048, 1, -2], [0, 158, TW, 0.042, 0.9, 1.8],
    [0, 184, TW, 0.055, 1.3, -2.2], [0, 210, TW, 0.036, 0.7, 2], [0, 236, TW, 0.045, 1.1, -1.5],
    [0, 262, TW, 0.04, 0.8, 2.3], [0, 288, TW, 0.05, 1.2, -2], [0, 314, TW, 0.038, 0.9, 1.7],
    [0, 340, TW, 0.055, 1.4, -2.5], [0, 366, TW, 0.04, 0.8, 2], [0, 392, TW, 0.048, 1.1, -1.8],
    [0, 418, TW, 0.042, 0.9, 2.2], [0, 444, TW, 0.052, 1.3, -2], [0, 470, TW, 0.038, 0.7, 1.5],
    [0, 496, TW, 0.045, 1, -1.8],
  ]
  for (const [x0, y, x1, op, lw, dy] of folds) {
    t.beginPath()
    t.moveTo(x0, y)
    t.bezierCurveTo(x0 + (x1 - x0) * 0.28, y + dy * 0.7, x0 + (x1 - x0) * 0.65, y - dy * 0.5, x1, y + dy * 0.3)
    t.strokeStyle = `rgba(120,90,50,${op})`
    t.lineWidth = lw
    t.stroke()
  }

  const CELL = 26
  const GMAIN = 'rgba(250,250,250,0.55)'
  const GTHIN = 'rgba(250,244,238,0.55)'
  for (let y = CELL; y < TH; y += CELL) {
    const isMain = Math.round(y / CELL) % 5 === 0
    t.beginPath()
    for (let x = 0; x <= TW; x += 4) {
      const w = Math.sin(x * 0.018 + y * 0.011) * 0.55
      if (x === 0) t.moveTo(x, y + w)
      else t.lineTo(x, y + w)
    }
    t.strokeStyle = isMain ? GMAIN : GTHIN
    t.lineWidth = isMain ? 1.1 : 0.65
    t.stroke()
  }
  for (let x = CELL; x < TW; x += CELL) {
    const isMain = Math.round(x / CELL) % 5 === 0
    t.beginPath()
    for (let y = 0; y <= TH; y += 4) {
      const w = Math.sin(y * 0.020 + x * 0.013) * 0.55
      if (y === 0) t.moveTo(x + w, y)
      else t.lineTo(x + w, y)
    }
    t.strokeStyle = isMain ? GMAIN : GTHIN
    t.lineWidth = isMain ? 1.1 : 0.65
    t.stroke()
  }


  const diags: [number, number, number, number, number][] = [
    [80, 0, 54, TH, 0.038], [195, 0, 222, TH, 0.03], [340, 0, 315, TH, 0.04],
    [500, 0, 478, TH, 0.032], [680, 0, 705, TH, 0.035], [860, 0, 840, TH, 0.03], [970, 0, 958, TH, 0.028],
  ]
  for (const [ax, ay, bx, by, op] of diags) {
    t.beginPath()
    t.moveTo(ax, ay)
    t.lineTo(bx, by)
    t.strokeStyle = `rgba(110,80,42,${op})`
    t.lineWidth = 0.8
    t.stroke()
  }

  const vx = t.createRadialGradient(TW / 2, TH / 2, TH * 0.25, TW / 2, TH / 2, TW * 0.72)
  vx.addColorStop(0, 'rgba(0,0,0,0)')
  vx.addColorStop(1, 'rgba(60,36,12,0.16)')
  t.fillStyle = vx
  t.fillRect(0, 0, TW, TH)

  const hl = t.createLinearGradient(0, 0, 0, TH * 0.4)
  hl.addColorStop(0, 'rgba(255,252,238,0.26)')
  hl.addColorStop(1, 'rgba(255,252,238,0)')
  t.fillStyle = hl
  t.fillRect(0, 0, TW, TH * 0.4)

  for (let i = 0; i < 9000; i++) {
    const nx = Math.random() * TW
    const ny = Math.random() * TH
    t.globalAlpha = 0.018 + Math.random() * 0.032
    t.fillStyle =
      Math.random() > 0.5
        ? `rgba(255,248,228,${Math.random() * 0.7})`
        : `rgba(88,58,22,${Math.random() * 0.6})`
    t.beginPath()
    t.arc(nx, ny, 0.28 + Math.random() * 0.72, 0, Math.PI * 2)
    t.fill()
  }
  t.globalAlpha = 1
  engine.tex = tex
  engine.texOk = true
}

function deform(engine: TearEngine) {
  const { W, H, mesh, scroll, curlAmt } = engine
  const frontX = W * scroll
  const rollW = W * 0.16
  const CY = H / 2
  for (let r = 0; r <= ROWS; r++) {
    for (let c = 0; c <= COLS; c++) {
      const p = mesh[r]![c]!
      const { ox, oy } = p
      const phase = (ox - frontX) / rollW
      if (phase >= 1) {
        p.x = ox
        p.y = oy
        continue
      }
      const t = Math.max(0, Math.min(1, 1 - phase))
      const wt = t * curlAmt
      const ease = 0.5 - 0.5 * Math.cos(t * Math.PI)
      const xShift = ease * rollW * 1.05 * curlAmt
      const rowT = (oy - CY) / (H / 2)
      const compress = Math.sin(ease * Math.PI) * wt * 0.18
      const yPin = rowT * (H / 2) * (1 - compress)
      const rip1 = Math.sin(t * Math.PI * 2.8 + curlAmt * 7) * wt * 2.8
      const rip2 = Math.sin(t * Math.PI * 5.5 - curlAmt * 4) * wt * 0.85
      p.x = ox + xShift
      p.y = CY + yPin + rip1 + rip2
    }
  }
}

export function drawStrip(ctx: CanvasRenderingContext2D, engine: TearEngine) {
  const { W, H, tex, texOk, mesh, scroll, curlAmt } = engine
  if (!W || !H) return

  const dpr = engine.dpr
  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, W, H)
  deform(engine)

  const frontX = W * scroll
  const rollW = W * 0.16
  const layout = stripLayout(W, H)

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tl = mesh[r]![c]!
      const tr = mesh[r]![c + 1]!
      const bl = mesh[r + 1]![c]!
      const br = mesh[r + 1]![c + 1]!
      const ox = (tl.ox + tr.ox) / 2
      if (ox < frontX - rollW * 0.6) continue
      const phase = (ox - frontX) / rollW
      const curlDepth = Math.max(0, Math.min(1, 1 - phase)) * curlAmt
      const diffuse = 1 - curlDepth * 0.65
      const foldDist = Math.abs(phase)
      const spec = foldDist < 0.18 ? Math.pow(1 - foldDist / 0.18, 2) * curlAmt * 0.55 : 0
      const ao = curlDepth > 0.55 ? (curlDepth - 0.55) * 0.5 : 0

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(tl.x, tl.y)
      ctx.lineTo(tr.x, tr.y)
      ctx.lineTo(br.x, br.y)
      ctx.lineTo(bl.x, bl.y)
      ctx.closePath()

      if (texOk && tex) {
        ctx.clip()
        const su = (c / COLS) * tex.width
        const sv = (r / ROWS) * tex.height
        const sw = tex.width / COLS
        const sh = tex.height / ROWS
        const dw = Math.max(1, Math.abs(tr.x - tl.x) + 0.5)
        const dh = Math.max(1, Math.abs(bl.y - tl.y) + 0.5)
        ctx.drawImage(tex, su, sv, sw, sh, tl.x, tl.y, dw, dh)
        const dark = Math.min(1, (1 - diffuse) + ao)
        if (dark > 0.01) {
          ctx.fillStyle = curlDepth > 0.35 ? `rgba(42,14,2,${dark * 0.92})` : `rgba(0,0,0,${dark * 0.26})`
          ctx.fillRect(tl.x, tl.y, dw, dh)
        }
        if (spec > 0.01) {
          ctx.fillStyle = `rgba(255,252,235,${spec * 0.7})`
          ctx.fillRect(tl.x, tl.y, dw, dh)
        }
      } else {
        ctx.fillStyle = `hsl(38,40%,${Math.round(diffuse * 74)}%)`
        ctx.fill()
      }
      ctx.restore()
    }
  }

  if (scroll < 0.99) {
    const ci = Math.round((frontX / W) * COLS)
    const col = Math.max(1, Math.min(COLS - 1, ci))
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(mesh[0]![col]!.x, mesh[0]![col]!.y)
    for (let row = 1; row <= ROWS; row++) {
      const p = mesh[row]![col]!
      const pp = mesh[row - 1]![col]!
      const jag =
        (Math.sin(row * 2.9 + 1.1) * 0.5 + 0.5) * layout.jagBase * (0.65 + curlAmt * 0.55) +
        (Math.sin(row * 7.3 + 3.1) * 0.5 + 0.5) * 2.5 * curlAmt * layout.scale
      const mid = (pp.y + p.y) / 2
      ctx.quadraticCurveTo(pp.x + jag * 0.4, pp.y, (pp.x + p.x) / 2 + jag * 0.7, mid)
    }
    ctx.strokeStyle = `rgba(120,85,32,${0.68 + curlAmt * 0.22})`
    ctx.lineWidth = layout.tearLineWidth
    ctx.stroke()

    if (scroll > 0.02 && curlAmt > 0.05) {
      const ex = mesh[ROWS >> 1]![col]!.x
      const shW = curlAmt * layout.curlShadowW
      const sg = ctx.createLinearGradient(ex, 0, Math.min(W, ex + shW), 0)
      sg.addColorStop(0, `rgba(28,10,1,${curlAmt * 0.42})`)
      sg.addColorStop(0.45, `rgba(28,10,1,${curlAmt * 0.14})`)
      sg.addColorStop(1, 'rgba(28,10,1,0)')
      ctx.fillStyle = sg
      ctx.fillRect(ex, 0, Math.min(W - ex, shW), H)
    }
    ctx.restore()
  }

  const tAlpha = engine.hideStripChrome ? 0 : Math.max(0, 1 - scroll * 2.8)
  if (tAlpha > 0.005) {
    ctx.save()
    ctx.globalAlpha = tAlpha
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(91, 51, 35, 1)'
    const labelSize = fitCanvasFont(
      ctx,
      layout.label,
      layout.maxLabelWidth,
      layout.labelFontMax,
      layout.labelFontMin,
    )
    ctx.font = `bold ${labelSize}px ${STRIP_FONT}`
    ctx.fillText(layout.label, W / 2, layout.labelY)
    ctx.restore()
  }

  if (tAlpha > 0.01) {
    const tx = layout.arrowX
    const ty = layout.arrowY
    const cr = layout.arrowR
    const s = cr * 1.08
    const shadowBlur = Math.max(4, 8 * layout.scale)
    ctx.save()
    ctx.globalAlpha = tAlpha
    ctx.beginPath()
    ctx.arc(tx, ty, cr, 0, Math.PI * 2)
    const cg = ctx.createRadialGradient(tx - cr * 0.3, ty - cr * 0.3, 2, tx, ty, cr)
    cg.addColorStop(0, '#e8f4ff')
    cg.addColorStop(1, '#F9FCFF')
    ctx.fillStyle = cg
    ctx.shadowColor = 'rgba(0,0,0,0)'
    ctx.shadowBlur = shadowBlur
    ctx.shadowOffsetY = Math.max(2, 3 * layout.scale)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
    ctx.strokeStyle = 'rgba(80,130,180,0.35)'
    ctx.lineWidth = Math.max(1, 1.5 * layout.scale)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(tx - s / 2 + 4 * layout.scale, ty - s / 2)
    ctx.lineTo(tx - s / 2 + 4 * layout.scale, ty + s / 2)
    ctx.lineTo(tx + s / 2, ty)
    ctx.closePath()
    const tg = ctx.createLinearGradient(tx - s / 2, ty - s / 2, tx + s / 2, ty + s / 2)
    tg.addColorStop(0, '#4a7fa8')
    tg.addColorStop(1, '#2d5a7a')
    ctx.fillStyle = tg
    ctx.fill()
    ctx.restore()
  }

  ctx.restore()
}

export function drawStub(ctx: CanvasRenderingContext2D, engine: TearEngine, prog: number) {
  const dpr = engine.dpr
  const sw = ctx.canvas.width / dpr
  const sh = ctx.canvas.height / dpr
  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, sw, sh)
  if (prog <= 0.01) {
    ctx.restore()
    return
  }

  const bob = engine.state === 'done' ? Math.sin(Date.now() / 820) * 1.4 : 0
  const cx = sw * 0.42
  const cy = sh / 2 + bob
  const rx = Math.min(sw * 0.42, (8 + 14 * prog) * Math.min(1, prog * 1.6))
  const ry = sh * 0.44 * Math.min(1, prog * 1.4)

  ctx.save()
  ctx.globalAlpha = prog * 0.45
  const shG = ctx.createRadialGradient(cx + 3, cy + ry * 0.74, 1, cx + 2, cy + ry * 0.58, rx * 2.3)
  shG.addColorStop(0, 'rgba(35,14,2,0.56)')
  shG.addColorStop(1, 'rgba(35,14,2,0)')
  ctx.fillStyle = shG
  ctx.beginPath()
  ctx.ellipse(cx + 2, cy + ry * 0.78, rx * 1.45, rx * 0.44, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  const RINGS = 10
  for (let i = RINGS; i >= 0; i--) {
    const lr = i / RINGS
    const erx = rx * (0.2 + 0.8 * lr)
    const ery = ry * (0.2 + 0.8 * lr)
    const lBase = 70 - i * 2.5
    const lg = ctx.createLinearGradient(-erx, -ery, -erx, ery)
    lg.addColorStop(0, i === RINGS ? '#f2ead8' : `hsl(36,38%,${lBase + 12}%)`)
    lg.addColorStop(0.25, `hsl(36,40%,${lBase + 8}%)`)
    lg.addColorStop(0.65, `hsl(35,36%,${lBase}%)`)
    lg.addColorStop(1, `hsl(34,34%,${lBase - 16}%)`)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.globalAlpha = prog
    ctx.beginPath()
    ctx.ellipse(0, 0, erx, ery, 0, 0, Math.PI * 2)
    ctx.fillStyle = lg
    ctx.fill()
    if (i < RINGS) {
      ctx.strokeStyle = `rgba(108,70,24,${0.06 + (1 - lr) * 0.1})`
      ctx.lineWidth = 0.5
      ctx.stroke()
    }
    ctx.restore()
  }

  ctx.save()
  ctx.translate(cx, cy)
  ctx.globalAlpha = prog * 0.65
  const hl = ctx.createRadialGradient(-rx * 0.3, -ry * 0.35, 1, -rx * 0.1, -ry * 0.18, rx * 0.75)
  hl.addColorStop(0, 'rgba(255,252,238,0.60)')
  hl.addColorStop(1, 'rgba(255,252,238,0)')
  ctx.beginPath()
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
  ctx.fillStyle = hl
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.translate(cx, cy)
  ctx.globalAlpha = prog * 0.78
  ctx.beginPath()
  let fp = true
  for (let y = -ry; y <= ry; y += 2) {
    const ex = -Math.sqrt(Math.max(0, 1 - (y / ry) ** 2)) * rx
    const jag = Math.sin(y * 0.4 + 1.2) * 2.8 + Math.sin(y * 0.92 + 2.6) * 1.1
    if (fp) {
      ctx.moveTo(ex - jag, y)
      fp = false
    } else ctx.lineTo(ex - jag, y)
  }
  ctx.strokeStyle = 'rgba(110,78,24,0.55)'
  ctx.lineWidth = 1.2
  ctx.stroke()
  ctx.restore()
  ctx.restore()
}

export function spawnParticles(engine: TearEngine, deformRect: DOMRect) {
  const spawnY = deformRect.bottom
  const spawnX0 = deformRect.left
  const spawnW = deformRect.width
  const H = deformRect.height

  const push = (p: Particle) => engine.particles.push(p)

  for (let i = 0; i < 220; i++) {
    const angle = -Math.PI * (0.12 + Math.random() * 0.76)
    const speed = 4 + Math.random() * 18
    push({
      x: spawnX0 + Math.random() * spawnW,
      y: spawnY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      ay: 0.18 + Math.random() * 0.22,
      ax: (Math.random() - 0.5) * 0.12,
      rot: Math.random() * Math.PI * 2,
      rv: (Math.random() - 0.5) * 0.38,
      w: 6 + Math.random() * 18,
      h: 2.5 + Math.random() * 9,
      col: PASTEL[Math.floor(Math.random() * PASTEL.length)]!,
      life: 0.85 + Math.random() * 0.7,
      dc: 0.003 + Math.random() * 0.007,
      shape: Math.random() < 0.35 ? 'fiber' : Math.random() < 0.55 ? 'rect' : 'circle',
    })
  }

  for (let i = 0; i < 80; i++) {
    const dir = Math.random() < 0.5 ? -1 : 1
    const angle = dir * (0.05 + Math.random() * 0.35)
    const speed = 6 + Math.random() * 14
    push({
      x:
        spawnX0 +
        (dir < 0 ? spawnW * 0.6 + Math.random() * spawnW * 0.4 : Math.random() * spawnW * 0.4),
      y: spawnY - Math.random() * H * 0.6,
      vx: Math.cos(angle) * speed * dir,
      vy: Math.sin(angle) * speed - 3,
      ay: 0.12 + Math.random() * 0.18,
      ax: dir * 0.04,
      rot: Math.random() * Math.PI * 2,
      rv: (Math.random() - 0.5) * 0.28,
      w: 8 + Math.random() * 22,
      h: 2 + Math.random() * 7,
      col: PASTEL[Math.floor(Math.random() * PASTEL.length)]!,
      life: 0.8 + Math.random() * 0.9,
      dc: 0.002 + Math.random() * 0.006,
      shape: Math.random() < 0.4 ? 'rect' : 'fiber',
    })
  }

  for (let i = 0; i < 80; i++) {
    const angle = Math.PI * (0.15 + Math.random() * 0.7)
    const speed = 2 + Math.random() * 8
    push({
      x: spawnX0 + Math.random() * spawnW,
      y: spawnY,
      vx: (Math.random() - 0.5) * 10,
      vy: Math.sin(angle) * speed + 1,
      ay: 0.28 + Math.random() * 0.3,
      ax: (Math.random() - 0.5) * 0.08,
      rot: Math.random() * Math.PI * 2,
      rv: (Math.random() - 0.5) * 0.5,
      w: 5 + Math.random() * 16,
      h: 2 + Math.random() * 8,
      col: PASTEL[Math.floor(Math.random() * PASTEL.length)]!,
      life: 0.7 + Math.random() * 0.8,
      dc: 0.0025 + Math.random() * 0.008,
      shape: Math.random() < 0.5 ? 'rect' : 'circle',
    })
  }

  for (let i = 0; i < 30; i++) {
    push({
      x: spawnX0 + Math.random() * spawnW,
      y: spawnY,
      vx: (Math.random() - 0.5) * 6,
      vy: -3 - Math.random() * 7,
      ay: 0.06 + Math.random() * 0.08,
      ax: (Math.random() - 0.5) * 0.1,
      rot: Math.random() * Math.PI * 2,
      rv: (Math.random() - 0.5) * 0.14,
      w: 16 + Math.random() * 28,
      h: 4 + Math.random() * 12,
      col: PASTEL[Math.floor(Math.random() * PASTEL.length)]!,
      life: 0.9 + Math.random() * 0.6,
      dc: 0.0015 + Math.random() * 0.004,
      shape: 'rect',
    })
  }

  engine.ptAlive = true
}

export function tickParticles(ctx: CanvasRenderingContext2D, engine: TearEngine) {
  const dpr = engine.dpr
  const pw = ctx.canvas.width / dpr
  const ph = ctx.canvas.height / dpr
  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, pw, ph)

  engine.particles = engine.particles.filter((p) => p.life > 0 && p.y < ph + 60)
  if (!engine.particles.length) engine.ptAlive = false

  for (const p of engine.particles) {
    p.x += p.vx
    p.vy += p.ay
    p.y += p.vy
    p.vx += p.ax
    p.vx *= 0.992
    p.vy *= 0.996
    p.rot += p.rv
    p.life -= p.dc

    ctx.save()
    ctx.globalAlpha = Math.pow(Math.max(0, p.life), 1.2) * 0.92
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rot)

    if (p.shape === 'fiber') {
      ctx.strokeStyle = p.col
      ctx.lineWidth = 1.6
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-p.w / 2, 0)
      ctx.bezierCurveTo(-p.w / 4, -p.h, p.w / 4, p.h, p.w / 2, 0)
      ctx.stroke()
    } else if (p.shape === 'circle') {
      ctx.fillStyle = p.col
      ctx.beginPath()
      ctx.arc(0, 0, p.w / 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.28)'
      ctx.beginPath()
      ctx.arc(-p.w * 0.12, -p.h * 0.12, p.w / 5.5, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillStyle = p.col
      ctx.beginPath()
      ctx.moveTo(-p.w / 2 + Math.random() * 1.5, -p.h / 2)
      ctx.lineTo(p.w / 2, -p.h / 2 + Math.random() * 1.5)
      ctx.lineTo(p.w / 2 + Math.random() * 1.5, p.h / 2)
      ctx.lineTo(-p.w / 2, p.h / 2 + Math.random() * 1.5)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.06)'
      ctx.lineWidth = 0.5
      ctx.stroke()
    }
    ctx.restore()
  }
  ctx.restore()
}

export function resizeEngine(
  engine: TearEngine,
  deformCvs: HTMLCanvasElement,
  particleCvs: HTMLCanvasElement,
) {
  const r = deformCvs.getBoundingClientRect()
  engine.W = r.width
  engine.H = r.height
  engine.dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP)
  deformCvs.width = Math.round(engine.W * engine.dpr)
  deformCvs.height = Math.round(engine.H * engine.dpr)
  particleCvs.width = Math.round(window.innerWidth * engine.dpr)
  particleCvs.height = Math.round(window.innerHeight * engine.dpr)
  buildMesh(engine)
  buildTex(engine)
}

export function resetEngineState(engine: TearEngine) {
  engine.state = 'idle'
  engine.hideStripChrome = false
  engine.scroll = 0
  engine.curlAmt = 0
  engine.stubProg = 0
  engine.particles = []
  engine.ptAlive = false
}
