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
// ─────────────────────────────────────────────────────────────────────────────
const SHIP_V = [
  [ 0.00,  0.00, -1.60], // 0 nose
  [-0.30,  0.00, -0.30], // 1 left-fuse front
  [ 0.30,  0.00, -0.30], // 2 right-fuse front
  [-0.30,  0.00,  0.80], // 3 left-fuse rear
  [ 0.30,  0.00,  0.80], // 4 right-fuse rear
  [-1.55,  0.06,  0.20], // 5 left-wing tip
  [ 1.55,  0.06,  0.20], // 6 right-wing tip
  [-0.40,  0.00,  1.35], // 7 left-engine
  [ 0.40,  0.00,  1.35], // 8 right-engine
  [ 0.00,  0.00,  1.10], // 9 tail fin base
  [ 0.00,  0.14, -1.00], // 10 cockpit front
  [-0.14,  0.10, -0.20], // 11 cockpit left
  [ 0.14,  0.10, -0.20], // 12 cockpit right
  [-0.14,  0.10,  0.50], // 13 cockpit rear-left
  [ 0.14,  0.10,  0.50], // 14 cockpit rear-right
]
const SHIP_E = [
  [0,1],[0,2],[1,2],[1,3],[2,4],[3,4],
  [1,5],[5,3],[2,6],[6,4],
  [3,7],[4,8],[7,8],[7,9],[8,9],
  [10,11],[10,12],[11,12],[11,13],[12,14],[13,14],
  [10,0],[13,3],[14,4],
]

function NavAnim() {
  const ref   = useRef(null)
  const stars = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let angle = 0, raf
    const PITCH = 0.20

    // Generate a static star field once
    stars.current = Array.from({ length: 48 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.0,
      a: 0.15 + Math.random() * 0.50,
    }))

    function project([x, y, z], W, H) {
      const cosA = Math.cos(angle), sinA = Math.sin(angle)
      const cosP = Math.cos(PITCH), sinP = Math.sin(PITCH)
      const rx  = x * cosA + z * sinA
      const rz0 = -x * sinA + z * cosA
      const ry  = y * cosP - rz0 * sinP
      const rz  = y * sinP + rz0 * cosP
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
