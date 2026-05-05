import { useEffect, useRef } from 'react'
import './StatusPanel.css'

// ─────────────────────────────────────────────────────────────────────────────
// Power Grid — bouncing EQ-style bar graph
// ─────────────────────────────────────────────────────────────────────────────
function PowerAnim() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const N = 14
    const bars = Array.from({ length: N }, () => ({
      h:       0.15 + Math.random() * 0.65,
      target:  0.15 + Math.random() * 0.65,
      speed:   0.022 + Math.random() * 0.038,
      peak:    0,
      pTimer:  0,
    }))
    let raf

    function draw() {
      const W = canvas.offsetWidth, H = canvas.offsetHeight
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H }
      ctx.clearRect(0, 0, W, H)

      // Faint grid lines
      ctx.strokeStyle = 'rgba(0,160,0,0.06)'
      ctx.lineWidth = 0.5
      for (let y = H * 0.2; y < H; y += H * 0.2) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }

      const bw = W / N
      bars.forEach((bar, i) => {
        bar.h += (bar.target - bar.h) * bar.speed
        if (Math.abs(bar.target - bar.h) < 0.02)
          bar.target = 0.06 + Math.random() * 0.90

        // Peak tracker
        if (bar.h > bar.peak) { bar.peak = bar.h; bar.pTimer = 55 }
        else if (bar.pTimer > 0) bar.pTimer--
        else bar.peak = Math.max(bar.h, bar.peak - 0.003)

        const bh = bar.h * H * 0.88
        const x  = i * bw + 1
        const w  = bw - 2

        const grad = ctx.createLinearGradient(0, H - bh, 0, H)
        grad.addColorStop(0, bar.h > 0.78
          ? 'rgba(255,200,30,0.92)'
          : 'rgba(90,210,90,0.92)')
        grad.addColorStop(0.45, 'rgba(40,160,40,0.72)')
        grad.addColorStop(1,    'rgba(15,70,15,0.38)')
        ctx.fillStyle = grad
        ctx.fillRect(x, H - bh, w, bh)

        // Peak indicator dot
        if (bar.peak > 0.04) {
          const py = H - bar.peak * H * 0.88 - 2
          ctx.fillStyle = 'rgba(190,255,190,0.82)'
          ctx.fillRect(x, py, w, 2)
        }
      })

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} className="sp-anim-canvas" />
}

// ─────────────────────────────────────────────────────────────────────────────
// Communications — scrolling composite RF waveform
// ─────────────────────────────────────────────────────────────────────────────
function CommsAnim() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let t = 0, raf

    function draw() {
      const W = canvas.offsetWidth, H = canvas.offsetHeight
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H }
      ctx.clearRect(0, 0, W, H)

      // Faint scan grid
      ctx.lineWidth = 0.5
      ctx.strokeStyle = 'rgba(193,18,31,0.07)'
      for (let y = H * 0.2; y < H; y += H * 0.2) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }
      for (let x = W * 0.25; x < W; x += W * 0.25) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }

      const waves = [
        { freq: 0.036, amp: 0.26, spd: 1.10, alpha: 0.80, lw: 1.6 },
        { freq: 0.086, amp: 0.11, spd: 2.20, alpha: 0.38, lw: 0.9 },
        { freq: 0.016, amp: 0.28, spd: 0.45, alpha: 0.20, lw: 2.2 },
        { freq: 0.055, amp: 0.08, spd: 3.00, alpha: 0.22, lw: 0.7 },
      ]

      waves.forEach(({ freq, amp, spd, alpha, lw }) => {
        ctx.beginPath()
        ctx.strokeStyle = `rgba(220,40,50,${alpha})`
        ctx.lineWidth = lw
        for (let x = 0; x <= W; x++) {
          const y = H / 2
            + Math.sin((x * freq + t * spd) * Math.PI * 2) * amp * H
            + Math.sin((x * freq * 2.4 + t * spd * 1.7) * Math.PI * 2) * amp * 0.28 * H
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
      })

      t += 0.006
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} className="sp-anim-canvas" />
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation — 3D rotating wireframe spacecraft
// Fuselage has real cross-section height (T = top, B = bottom).
// Two-axis tumble: yaw + pitch at irrational ratio → never repeats.
// ─────────────────────────────────────────────────────────────────────────────
const _T = 0.22, _B = -0.16, _W = 0.22   // fuselage cross-section constants
const SHIP_V = [
  [ 0.00,  0.00, -1.60],   //  0  nose tip
  [-_W,    _T,   -0.30],   //  1  left-top-front
  [ _W,    _T,   -0.30],   //  2  right-top-front
  [-_W,    _B,   -0.30],   //  3  left-bot-front
  [ _W,    _B,   -0.30],   //  4  right-bot-front
  [-_W,    _T,    0.80],   //  5  left-top-rear
  [ _W,    _T,    0.80],   //  6  right-top-rear
  [-_W,    _B,    0.80],   //  7  left-bot-rear
  [ _W,    _B,    0.80],   //  8  right-bot-rear
  [-1.55,  0.04,  0.22],   //  9  left-wing tip
  [ 1.55,  0.04,  0.22],   // 10  right-wing tip
  [-0.38,  _B,    1.35],   // 11  left-engine
  [ 0.38,  _B,    1.35],   // 12  right-engine
  [ 0.00,  _T+0.22, 0.80], // 13  tail-fin top
  [ 0.00,  _T+0.06,-0.80], // 14  cockpit canopy
]
const SHIP_E = [
  // Nose → front cross-section
  [0,1],[0,2],[0,3],[0,4],
  // Front ring
  [1,2],[3,4],[1,3],[2,4],
  // Longitudinal rails
  [1,5],[2,6],[3,7],[4,8],
  // Rear ring
  [5,6],[7,8],[5,7],[6,8],
  // Wings (delta triangle each side)
  [1,9],[5,9],[3,9],
  [2,10],[6,10],[4,10],
  // Engine pods (bottom rear)
  [7,11],[8,12],[11,12],
  // Tail fin
  [13,5],[13,6],
  // Cockpit canopy
  [0,14],[14,1],[14,2],
]

function NavAnim() {
  const ref   = useRef(null)
  const stars = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let angle = 0, raf

    // Static star field
    stars.current = Array.from({ length: 48 }, () => ({
      x: Math.random(), y: Math.random(),
      r: 0.4 + Math.random() * 1.0,
      a: 0.15 + Math.random() * 0.50,
    }))

    function project([x, y, z], W, H) {
      // Two-axis tumble: yaw + pitch at irrational ratio (never repeats)
      const yaw   = angle
      const pitch = angle * 0.4142
      // Yaw around Y axis
      const cy = Math.cos(yaw),   sy = Math.sin(yaw)
      const rx  =  x * cy + z * sy
      const rz0 = -x * sy + z * cy
      // Pitch around X axis
      const cp = Math.cos(pitch), sp = Math.sin(pitch)
      const ry  =  y * cp - rz0 * sp
      const rz  =  y * sp + rz0 * cp
      const FOV = 4.6
      const pz  = rz + FOV
      const sc  = Math.min(W, H) * 0.275
      return [W / 2 + (rx / pz) * sc, H / 2 + (ry / pz) * sc, rz]
    }

    function draw() {
      const W = canvas.offsetWidth, H = canvas.offsetHeight
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H }
      ctx.clearRect(0, 0, W, H)

      // Star field
      stars.current.forEach(s => {
        ctx.fillStyle = `rgba(160,200,255,${s.a})`
        ctx.beginPath()
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
        ctx.fill()
      })

      // Wireframe edges
      ctx.lineWidth = 1.0
      SHIP_E.forEach(([a, b]) => {
        const pa = project(SHIP_V[a], W, H)
        const pb = project(SHIP_V[b], W, H)
        const depth = (pa[2] + pb[2]) * 0.5
        const alpha = Math.max(0.12, Math.min(0.92, 0.30 + 0.62 * (1 - depth / 2.8)))
        ctx.strokeStyle = `rgba(40,170,255,${alpha.toFixed(2)})`
        ctx.beginPath()
        ctx.moveTo(pa[0], pa[1])
        ctx.lineTo(pb[0], pb[1])
        ctx.stroke()
      })

      // Glowing nose dot
      const nose = project(SHIP_V[0], W, H)
      ctx.shadowColor = 'rgba(100,220,255,0.9)'
      ctx.shadowBlur  = 7
      ctx.fillStyle   = 'rgba(160,235,255,0.95)'
      ctx.beginPath()
      ctx.arc(nose[0], nose[1], 2.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      angle += 0.013
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} className="sp-anim-canvas" />
}

// ─────────────────────────────────────────────────────────────────────────────
// Life Support — scrolling ECG heart monitor
// ─────────────────────────────────────────────────────────────────────────────
const ECG = [
  0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50,
  0.48, 0.44, 0.42, 0.44, 0.48, 0.50,          // P wave
  0.50, 0.50,
  0.53, 0.08, 0.76, 0.50,                       // QRS complex
  0.50, 0.47, 0.43, 0.44, 0.47, 0.50,           // T wave
  0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50,
]

function LifeSupportAnim() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let offset = 0, raf

    function draw() {
      const W = canvas.offsetWidth, H = canvas.offsetHeight
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H }
      ctx.clearRect(0, 0, W, H)

      // Grid
      ctx.lineWidth = 0.5
      ctx.strokeStyle = 'rgba(0,200,90,0.08)'
      for (let y = H * 0.2; y < H; y += H * 0.2) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }
      for (let x = 0; x <= W; x += 16) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }

      // ECG trace
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(0,230,100,0.92)'
      ctx.lineWidth   = 1.6
      ctx.shadowColor = 'rgba(0,255,110,0.50)'
      ctx.shadowBlur  = 5
      for (let x = 0; x <= W; x++) {
        const idx = Math.floor((x + offset) % ECG.length)
        const y   = ECG[idx] * H * 0.76 + H * 0.12
        x === 0 ? ctx.moveTo(0, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()
      ctx.shadowBlur = 0

      // Sweeping erase head — dark gradient wipe ahead of the new data
      const headX = (W - (offset % W) + W) % W
      const wipe  = ctx.createLinearGradient(
        Math.max(0, headX - 24), 0, headX + 2, 0
      )
      wipe.addColorStop(0, 'rgba(0,0,0,0)')
      wipe.addColorStop(1, 'rgba(0,5,2,0.85)')
      ctx.fillStyle = wipe
      ctx.fillRect(Math.max(0, headX - 24), 0, 26, H)

      offset += 0.75
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} className="sp-anim-canvas" />
}

// ─────────────────────────────────────────────────────────────────────────────
// Route module ID → animation
// ─────────────────────────────────────────────────────────────────────────────
function ModuleAnim({ id }) {
  if (id === 'power')       return <PowerAnim />
  if (id === 'comms')       return <CommsAnim />
  if (id === 'navigation')  return <NavAnim />
  if (id === 'lifesupport') return <LifeSupportAnim />
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusPanel
// ─────────────────────────────────────────────────────────────────────────────
function StatusPanel({ module, stage }) {
  const isRestored = module?.restored
  const hasError   = !isRestored && stage >= 2

  return (
    <div className={`panel status-panel
      ${hasError   ? 'status-panel--error'  : ''}
      ${isRestored ? 'status-panel--online' : ''}`}>
      <div className="status-panel__screen">

        {isRestored ? (
          <>
            <div className="status-panel__anim">
              <ModuleAnim id={module.id} />
            </div>
            <div className="status-panel__overlay">
              <span className="status-panel__label">{module.label}</span>
              <span className="status-panel__value terminal-text">{module.value}</span>
            </div>
          </>
        ) : hasError ? (
          <div className="status-panel__content">
            <span className="status-panel__error">OFFLINE</span>
          </div>
        ) : (
          <div className="status-panel__content">
            <span className="status-panel__blank">——</span>
          </div>
        )}

      </div>
    </div>
  )
}

export default StatusPanel
