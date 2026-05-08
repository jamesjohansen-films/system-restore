import { useState, useEffect } from 'react'
import './NavModule.css'
import TerminalSelect from '../../TerminalSelect/TerminalSelect'

// ── Map constants ─────────────────────────────────────────────────────────────
const MAP_W = 320
const MAP_H = 252
const CELL  = 36

// ── Phase A: Coarse triangulation ─────────────────────────────────────────────
const SHIP_A = [188, 148]

const PULSARS_A = [
  { id: 'PSR-0531+21', period: '0.0331', pos: [ 50,  66], beacon: false },
  { id: 'PSR-0833-45', period: '0.0893', pos: [222,  50], beacon: true  },
  { id: 'PSR-1913+16', period: '0.0590', pos: [270, 184], beacon: true  },
  { id: 'PSR-0329+54', period: '0.7145', pos: [ 26, 214], beacon: false },
  { id: 'PSR-1642-03', period: '0.3882', pos: [148, 244], beacon: true  },
  { id: 'PSR-0437-47', period: '0.0057', pos: [106,  30], beacon: false },
]

const SIGNALS_A = [
  { id: 'SIGNAL-A', period: '0.0893', answer: 'PSR-0833-45', color: '#c1121f' },
  { id: 'SIGNAL-B', period: '0.0590', answer: 'PSR-1913+16', color: '#b0a800' },
  { id: 'SIGNAL-C', period: '0.3882', answer: 'PSR-1642-03', color: '#1a6ecc' },
]

// ── Phase B: Fine triangulation (zoomed region) ───────────────────────────────
const SHIP_B = [162, 132]

const PULSARS_B = [
  { id: 'PSR-ARC-001', period: '0.0044', pos: [ 55,  75], beacon: true  },
  { id: 'PSR-ARC-002', period: '0.1234', pos: [244,  58], beacon: false },
  { id: 'PSR-ARC-003', period: '0.0789', pos: [198, 194], beacon: true  },
  { id: 'PSR-ARC-004', period: '0.3210', pos: [ 38, 182], beacon: false },
  { id: 'PSR-ARC-005', period: '0.0561', pos: [138,  28], beacon: true  },
  { id: 'PSR-ARC-006', period: '0.8765', pos: [282, 136], beacon: false },
]

const SIGNALS_B = [
  { id: 'SIGNAL-X', period: '0.0044', answer: 'PSR-ARC-001', color: '#c1121f' },
  { id: 'SIGNAL-Y', period: '0.0789', answer: 'PSR-ARC-003', color: '#b0a800' },
  { id: 'SIGNAL-Z', period: '0.0561', answer: 'PSR-ARC-005', color: '#1a6ecc' },
]

// ── Phase C: Attitude alignment dials ────────────────────────────────────────
const DIALS = [
  { id: 'PITCH', target: 47,  color: '#c1121f' },
  { id: 'YAW',   target: 213, color: '#b0a800' },
  { id: 'ROLL',  target: 328, color: '#1a6ecc' },
]
const DIAL_TOL  = 5

// ── Background stars ──────────────────────────────────────────────────────────
const BG_STARS = [
  [16,20],[38,52],[66,14],[92,78],[126,34],[144,90],[182,24],
  [198,70],[212,112],[242,44],[262,130],[288,80],[306,18],
  [20,110],[46,142],[74,166],[110,198],[132,138],[172,184],
  [204,152],[228,198],[266,162],[292,206],[314,168],
  [42,232],[80,246],[116,232],[196,238],[244,250],[290,242],
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function dist([x1,y1],[x2,y2]) {
  return Math.sqrt((x2-x1)**2 + (y2-y1)**2)
}

function gridRef([x,y]) {
  const col = String.fromCharCode(65 + Math.min(7, Math.floor(x / CELL)))
  const row  = Math.min(7, Math.floor(y / CELL) + 1)
  return `${col}-${row}`
}

function makeWaveform(period, w=120, h=20) {
  const p = parseFloat(period)
  const cycles = Math.max(2, Math.min(14,
    Math.round(2 + Math.log(0.75/p) / Math.log(0.75/0.005) * 12)
  ))
  const steps = cycles * 16
  const pts = []
  for (let i=0; i<=steps; i++) {
    const x = (i/steps) * w
    const y = h/2 + Math.sin((i/steps)*cycles*Math.PI*2) * (h/2-3)
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return pts.join(' ')
}

function dialDiff(val, tgt) {
  const d = Math.abs(val - tgt)
  return Math.min(d, 360 - d)
}

// ── TriSection — reusable triangulation panel ─────────────────────────────────
function TriSection({ pulsars, signals, ship, scanLabel, onComplete }) {
  const [selections,    setSelections]    = useState(Object.fromEntries(signals.map(s=>[s.id,''])))
  const [triangulating, setTriangulating] = useState(false)
  const [showCircles,   setShowCircles]   = useState(false)
  const [showShip,      setShowShip]      = useState(false)
  const [solved,        setSolved]        = useState(false)
  const [wrong,         setWrong]         = useState(false)

  const allSelected = signals.every(s => selections[s.id] !== '')

  function handleTriangulate() {
    if (triangulating || solved) return
    const correct = signals.every(s => selections[s.id] === s.answer)
    if (!correct) {
      setWrong(true)
      setTimeout(() => setWrong(false), 1400)
      return
    }
    setTriangulating(true)
    setTimeout(() => setShowCircles(true), 200)
    setTimeout(() => setShowShip(true),    2600)
    setTimeout(() => { setSolved(true); setTimeout(onComplete, 1400) }, 4000)
  }

  function select(sigId, pulsarId) {
    if (solved || triangulating) return
    setSelections(prev => ({ ...prev, [sigId]: pulsarId }))
  }

  return (
    <div className="nav-body">

      {/* ── Top row: Star Map (left) + Catalog (right) ── */}
      <div className="nav-top-row">

        {/* Star map */}
        <div className="nav-map-wrap">
          <div className="nav-scan-label terminal-text terminal-text--dim">{scanLabel}</div>

          <svg className="nav-map" viewBox={`0 0 ${MAP_W} ${MAP_H}`} preserveAspectRatio="xMidYMid meet">
            <rect x={0} y={0} width={MAP_W} height={MAP_H} fill="#05070f" />

            {/* Grid lines */}
            {Array.from({length:9}, (_,i) => (
              <line key={`vg${i}`} x1={i*CELL} y1={0} x2={i*CELL} y2={MAP_H} className="nav-grid-line"/>
            ))}
            {Array.from({length:8}, (_,i) => (
              <line key={`hg${i}`} x1={0} y1={i*CELL} x2={MAP_W} y2={i*CELL} className="nav-grid-line"/>
            ))}

            {/* Grid labels */}
            {['A','B','C','D','E','F','G','H'].map((l,i) => (
              <text key={l} x={i*CELL+3} y={11} className="nav-grid-label">{l}</text>
            ))}
            {[1,2,3,4,5,6,7].map((n,i) => (
              <text key={n} x={3} y={i*CELL+26} className="nav-grid-label">{n}</text>
            ))}

            {/* Background stars */}
            {BG_STARS.map(([x,y],i) => (
              <circle key={i} cx={x} cy={y} r={0.7} className="nav-bg-star"/>
            ))}

            {/* Range circles */}
            {showCircles && signals.map((sig,i) => {
              const p = pulsars.find(p => p.id === selections[sig.id])
              if (!p) return null
              const r    = dist(p.pos, ship)
              const circ = 2*Math.PI*r
              return (
                <circle key={sig.id}
                  cx={p.pos[0]} cy={p.pos[1]} r={r}
                  fill="none" stroke={sig.color}
                  strokeWidth={0.8} strokeOpacity={0.55}
                  style={{
                    strokeDasharray: circ,
                    strokeDashoffset: circ,
                    animation: `nav-draw-circle 1.4s cubic-bezier(0.4,0,0.2,1) ${i*0.55}s forwards`,
                  }}
                />
              )
            })}

            {/* Pulsars */}
            {pulsars.map(p => {
              const matched = signals.find(s => selections[s.id] === p.id)
              const dotColor = matched ? matched.color : '#3a4e7a'
              return (
                <g key={p.id}>
                  {matched && (
                    <circle cx={p.pos[0]} cy={p.pos[1]} r={9}
                      fill={matched.color} fillOpacity={0.08}/>
                  )}
                  <circle cx={p.pos[0]} cy={p.pos[1]}
                    r={matched ? 3.5 : 2} fill={dotColor}
                    className={`nav-pulsar ${matched ? 'nav-pulsar--active' : ''}`}
                  />
                  <text x={p.pos[0]+5} y={p.pos[1]+4}
                    className="nav-pulsar-label"
                    fill={matched ? matched.color : '#3a4e7a'}>
                    {p.id}
                  </text>
                </g>
              )
            })}

            {/* Ship crosshair */}
            {showShip && (
              <g className="nav-ship">
                <circle cx={ship[0]} cy={ship[1]} r={14}
                  fill="none" stroke="#00ff88" strokeWidth={0.6} strokeOpacity={0.3}
                  className="nav-ship-ring"/>
                <line x1={ship[0]-9} y1={ship[1]} x2={ship[0]+9} y2={ship[1]}
                  stroke="#00ff88" strokeWidth={0.8}/>
                <line x1={ship[0]} y1={ship[1]-9} x2={ship[0]} y2={ship[1]+9}
                  stroke="#00ff88" strokeWidth={0.8}/>
                <circle cx={ship[0]} cy={ship[1]} r={1.8} fill="#00ff88" className="nav-ship-dot"/>
                <text x={ship[0]+12} y={ship[1]-5} className="nav-ship-label">
                  YOU ARE HERE
                </text>
              </g>
            )}
          </svg>

          {/* Result below map */}
          {solved && (
            <div className="nav-result">
              <div className="nav-result-coord terminal-text">
                POSITION CONFIRMED: {gridRef(ship)}
              </div>
              <div className="nav-result-sub terminal-text">
                {scanLabel.includes('COARSE')
                  ? 'COARSE FIX ACQUIRED — NARROWING TO FINE RESOLUTION...'
                  : 'PRECISE FIX ACQUIRED — ATTITUDE ALIGNMENT REQUIRED'}
              </div>
            </div>
          )}
        </div>

        {/* Pulsar reference catalog */}
        <div className="nav-catalog-side">
          <div className="nav-catalog">
            <div className="nav-section-label terminal-text">// PULSAR REFERENCE CATALOG</div>
            <table className="nav-table">
              <thead>
                <tr>
                  <th className="terminal-text">DESIGNATOR</th>
                  <th className="terminal-text">PERIOD (s)</th>
                  <th className="terminal-text">GRID</th>
                </tr>
              </thead>
              <tbody>
                {pulsars.map(p => {
                  const matched = signals.find(s => selections[s.id] === p.id)
                  return (
                    <tr key={p.id} style={matched ? { color: matched.color } : {}}>
                      <td className="terminal-text">{p.id}</td>
                      <td className="terminal-text">{p.period}</td>
                      <td className="terminal-text">{gridRef(p.pos)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>{/* end nav-top-row */}

      {/* ── Bottom bar: intercepted signals (horizontal) + button ── */}
      <div className="nav-signals-bar">
        <div className="nav-section-label terminal-text">// INTERCEPTED SIGNALS</div>
        <div className="nav-signals-row">
          {signals.map(sig => (
            <div key={sig.id} className="nav-signal">
              <div className="nav-signal-top">
                <span className="nav-signal-id terminal-text" style={{ color: sig.color }}>{sig.id}</span>
                <span className="nav-signal-period terminal-text">T = {sig.period}s</span>
              </div>
              <svg className="nav-waveform" viewBox="0 0 120 20" preserveAspectRatio="none">
                <polyline points={makeWaveform(sig.period)} fill="none"
                  stroke={sig.color} strokeWidth={0.9} strokeOpacity={0.75}/>
              </svg>
              <TerminalSelect
                value={selections[sig.id]}
                onChange={val => select(sig.id, val)}
                placeholder="— IDENTIFY SOURCE —"
                disabled={solved || triangulating}
                accentColor={sig.color}
                options={pulsars.map(p => ({ value: p.id, label: p.id }))}
              />
            </div>
          ))}
        </div>

        {/* Triangulate button */}
        {!solved && (
          <button
            className={`nav-btn terminal-text
              ${allSelected && !triangulating ? 'nav-btn--ready' : ''}
              ${wrong ? 'nav-btn--wrong' : ''}
              ${triangulating ? 'nav-btn--working' : ''}
            `}
            disabled={!allSelected || triangulating}
            onClick={handleTriangulate}
          >
            {triangulating ? 'TRIANGULATING...'
             : wrong ? '⚠ SIGNAL MISMATCH DETECTED'
             : '[ TRIANGULATE POSITION ]'}
          </button>
        )}
      </div>

    </div>
  )
}

// ── 3-D ship geometry ─────────────────────────────────────────────────────────
const SHIP_V = [
  [ 0.00,  0.12,  1.40], // 0: nose
  [-1.40, -0.10, -0.70], // 1: port wingtip
  [ 1.40, -0.10, -0.70], // 2: starboard wingtip
  [-0.22,  0.00, -0.40], // 3: port hull mid
  [ 0.22,  0.00, -0.40], // 4: starboard hull mid
  [-0.10,  0.00, -1.00], // 5: port tail
  [ 0.10,  0.00, -1.00], // 6: starboard tail
  [ 0.00,  0.70, -0.30], // 7: dorsal fin tip
  [ 0.00,  0.08, -0.70], // 8: dorsal fin root
]
const SHIP_E = [
  [0,1],[0,2],   // nose → wingtips
  [1,3],[2,4],   // wingtips → hull
  [3,4],         // hull crossbar
  [3,5],[4,6],   // hull → tail
  [5,6],         // tail bar
  [0,7],[8,7],   // dorsal fin
  [0,8],         // nose → fin root (keel)
]
// Camera pre-rotation gives a 3/4 top-left perspective
const CAM_PITCH = 18
const CAM_YAW   = -28

function applyRot(pts, pitchDeg, yawDeg, rollDeg) {
  const rad = d => d * Math.PI / 180
  const p = rad(pitchDeg), y = rad(yawDeg), r = rad(rollDeg)
  // Yaw (around Y)
  let res = pts.map(([x,yv,z]) => [
    x*Math.cos(y)+z*Math.sin(y), yv, -x*Math.sin(y)+z*Math.cos(y),
  ])
  // Pitch (around X)
  res = res.map(([x,yv,z]) => [
    x, yv*Math.cos(p)-z*Math.sin(p), yv*Math.sin(p)+z*Math.cos(p),
  ])
  // Roll (around Z)
  res = res.map(([x,yv,z]) => [
    x*Math.cos(r)-yv*Math.sin(r), x*Math.sin(r)+yv*Math.cos(r), z,
  ])
  return res
}

function proj3D(pts, cx=80, cy=80, scale=42) {
  return pts.map(([x,y,z]) => {
    const s = 5 / (5 + z + 2.5)
    return [cx + x*s*scale, cy - y*s*scale]
  })
}

function shipLines(pitchDeg, yawDeg, rollDeg) {
  let pts = applyRot(SHIP_V, pitchDeg, yawDeg, rollDeg)
  pts = applyRot(pts, CAM_PITCH, CAM_YAW, 0)
  const projected = proj3D(pts)
  return SHIP_E.map(([a,b]) => [projected[a], projected[b]])
}

// ── Ship3D — SVG wireframe for one orientation ────────────────────────────────
function Ship3D({ pitchDeg, yawDeg, rollDeg, color, opacity=1, dashed=false }) {
  const lines = shipLines(pitchDeg, yawDeg, rollDeg)
  return (
    <>
      {lines.map(([[x1,y1],[x2,y2]], i) => (
        <line key={i}
          x1={x1.toFixed(1)} y1={y1.toFixed(1)}
          x2={x2.toFixed(1)} y2={y2.toFixed(1)}
          stroke={color}
          strokeWidth={dashed ? 0.7 : 1.4}
          strokeOpacity={opacity}
          strokeDasharray={dashed ? '3 3' : undefined}
        />
      ))}
    </>
  )
}

// ── ShipAlignment3D — 3D vessel orientation puzzle ────────────────────────────
function ShipAlignment3D({ onComplete }) {
  const [values, setValues] = useState([0, 0, 0])
  const [sealed, setSealed] = useState(false)

  const lockedFlags = DIALS.map((d, i) => dialDiff(values[i], d.target) <= DIAL_TOL)
  const allLocked   = lockedFlags.every(Boolean)

  useEffect(() => {
    if (allLocked && !sealed) {
      setSealed(true)
      setTimeout(onComplete, 1800)
    }
  }, [allLocked]) // eslint-disable-line

  function setAxis(i, val) {
    if (lockedFlags[i]) return
    setValues(prev => {
      const next = [...prev]
      next[i] = Number(val)
      return next
    })
  }

  const stars3D = [
    [12,14],[28,42],[52,18],[74,54],[88,28],[112,14],[134,48],
    [148,22],[122,68],[96,82],[72,92],[50,78],[24,62],[144,78],
    [14,88],[38,104],[60,114],[84,122],[102,102],[130,118],[154,96],
    [8,130],[32,148],[68,136],[116,142],[146,130],
  ]

  return (
    <div className="nav-align-wrap">
      <div className="nav-section-label terminal-text">
        // VESSEL ATTITUDE ALIGNMENT — 3D ORIENTATION CONTROL
      </div>
      <div className="nav-align-hint terminal-text terminal-text--dim">
        TARGET HEADING: PITCH 047° — YAW 213° — ROLL 328° — ALIGN VESSEL TO MATCH GHOST SILHOUETTE
      </div>

      <div className="nav-align-body">

        {/* ── 3D orientation viewer ── */}
        <div className="nav-3d-viewer-wrap">
          <div className="nav-3d-label terminal-text terminal-text--dim">◈ ORIENTATION VIEWER</div>
          <svg className="nav-3d-svg" viewBox="0 0 160 160">
            <rect x={0} y={0} width={160} height={160} fill="#03050e" rx={3}/>
            <rect x={0} y={0} width={160} height={160} fill="none" stroke="#0d1528" strokeWidth={1} rx={3}/>
            {/* Starfield */}
            {stars3D.map(([x,y],i) => (
              <circle key={i} cx={x} cy={y} r={0.5} fill="#4a5a8a" fillOpacity={0.5}/>
            ))}
            {/* Center cross */}
            <line x1={77} y1={80} x2={83} y2={80} stroke="#0d1e30" strokeWidth={0.6}/>
            <line x1={80} y1={77} x2={80} y2={83} stroke="#0d1e30" strokeWidth={0.6}/>
            {/* Ghost ship — target orientation */}
            <Ship3D
              pitchDeg={DIALS[0].target}
              yawDeg={DIALS[1].target}
              rollDeg={DIALS[2].target}
              color="#1e3a5a"
              opacity={0.75}
              dashed={true}
            />
            {/* Current ship */}
            <Ship3D
              pitchDeg={values[0]}
              yawDeg={values[1]}
              rollDeg={values[2]}
              color={allLocked ? '#00ff88' : '#5a9aff'}
              opacity={allLocked ? 1 : 0.9}
              dashed={false}
            />
            {/* Legend */}
            <text x={4} y={9} fontFamily="VT323, monospace" fontSize={7} fill="#1e3a5a">--- TARGET</text>
            <text x={4} y={18} fontFamily="VT323, monospace" fontSize={7} fill={allLocked ? '#00ff88' : '#3a5a8a'}>— CURRENT</text>
          </svg>
          {allLocked && (
            <div className="nav-3d-locked terminal-text">✓ ORIENTATION MATCHED</div>
          )}
        </div>

        {/* ── Axis controls ── */}
        <div className="nav-axis-controls">
          {DIALS.map((d, i) => {
            const val      = values[i]
            const locked   = lockedFlags[i]
            const diff     = dialDiff(val, d.target)
            const progress = Math.max(0, 1 - diff / 90)

            return (
              <div
                key={d.id}
                className={`nav-axis-card ${locked ? 'nav-axis-card--locked' : ''}`}
                style={locked ? { borderColor: `${d.color}44` } : {}}
              >
                <span
                  className="nav-axis-id terminal-text"
                  style={{ color: locked ? d.color : '#2a3a5a' }}
                >
                  {d.id}{locked ? ' ✓ LOCKED' : ''}
                </span>
                <div className="nav-axis-slider-row">
                  <span
                    className="nav-axis-val terminal-text"
                    style={{ color: locked ? d.color : undefined }}
                  >
                    {String(val).padStart(3, '0')}°
                  </span>
                  <div className="nav-axis-bar-wrap">
                    <div
                      className="nav-axis-bar"
                      style={{
                        width: `${progress * 100}%`,
                        background: d.color,
                        opacity: locked ? 1 : 0.75,
                      }}
                    />
                  </div>
                </div>
                <input
                  type="range"
                  className="nav-axis-slider"
                  min={0}
                  max={359}
                  step={1}
                  value={val}
                  disabled={locked}
                  onChange={e => setAxis(i, e.target.value)}
                  style={{ '--ax-color': d.color }}
                />
              </div>
            )
          })}
        </div>

      </div>

      {allLocked && (
        <div className="nav-dials-confirm terminal-text">
          ✓ ATTITUDE LOCKED — COURSE COMPUTED — STANDING BY...
        </div>
      )}
    </div>
  )
}

// ── Main NavModule ────────────────────────────────────────────────────────────
export default function NavModule({ onSolve, onBack }) {
  // 'tri1' | 'tri2' | 'dials' | 'done'
  const [phase,         setPhase]         = useState('tri1')
  const [transitioning, setTransitioning] = useState(false)
  const [transMsg,      setTransMsg]      = useState('')

  function transition(msg, toPhase, delay=1400) {
    setTransMsg(msg)
    setTransitioning(true)
    setTimeout(() => { setPhase(toPhase); setTransitioning(false) }, delay)
  }

  function handleTriASolve() {
    transition('COARSE FIX ACQUIRED — INITIATING FINE CALIBRATION...', 'tri2', 1600)
  }

  function handleTriBSolve() {
    transition('POSITION CONFIRMED — ATTITUDE REALIGNMENT REQUIRED...', 'dials', 1600)
  }

  function devSkip() {
    if (transitioning) return
    if      (phase === 'tri1')  handleTriASolve()
    else if (phase === 'tri2')  handleTriBSolve()
    else if (phase === 'dials') handleDialsSolve()
  }

  function handleDialsSolve() {
    setTransMsg('ATTITUDE LOCKED — COURSE SET — RETURNING TO SUBSYSTEMS...')
    setTransitioning(true)
    setTimeout(() => onSolve?.(gridRef(SHIP_B)), 1800)
  }

  // Status text for header
  const status =
    transitioning    ? transMsg.slice(0, 32) + '...' :
    phase === 'tri1' ? 'COARSE SCAN ACTIVE'           :
    phase === 'tri2' ? 'FINE CALIBRATION'              :
    phase === 'dials' ? 'ATTITUDE ALIGNMENT'           :
    '✓ POSITION LOCKED'

  const statusLocked = phase === 'done'

  return (
    <div className="nav-module">
      {!transitioning && <button className="dev-skip-btn" onClick={devSkip}>⚡ DEV SKIP</button>}

      {/* ── Header ── */}
      <div className="nav-header">
        <button className="pm-back terminal-text" onClick={onBack}>← BACK</button>
        <span className="pm-title terminal-text">MODULE 03 — NAVIGATION</span>
        <span className={`nav-status terminal-text ${statusLocked ? 'nav-status--locked' : ''}`}>
          {status}
        </span>
      </div>

      {/* ── Transition message ── */}
      {transitioning && (
        <div className="nav-transition">
          <div className="nav-transition__msg terminal-text">{transMsg}</div>
        </div>
      )}

      {/* ── Phase A: Coarse triangulation ── */}
      {!transitioning && phase === 'tri1' && (
        <TriSection
          key="triA"
          pulsars={PULSARS_A}
          signals={SIGNALS_A}
          ship={SHIP_A}
          scanLabel="// SECTOR SCAN — COARSE RESOLUTION — 300 PARSEC RANGE"
          onComplete={handleTriASolve}
        />
      )}

      {/* ── Phase B: Fine triangulation ── */}
      {!transitioning && phase === 'tri2' && (
        <TriSection
          key="triB"
          pulsars={PULSARS_B}
          signals={SIGNALS_B}
          ship={SHIP_B}
          scanLabel="// SECTOR SCAN — FINE RESOLUTION — 60 PARSEC RANGE"
          onComplete={handleTriBSolve}
        />
      )}

      {/* ── Phase C: 3D attitude alignment ── */}
      {!transitioning && phase === 'dials' && (
        <ShipAlignment3D onComplete={handleDialsSolve} />
      )}

      {/* ── Crew log ── */}
      <div className="crew-log-strip" style={{flexShrink: 0, paddingTop: '5px', marginTop: '4px'}}>
        <div className="crew-log-entry">
          <div className="crew-log-meta">
            <span className="terminal-text crew-log-who">◈ LOG — VASQUEZ</span>
            <span className="terminal-text crew-log-day">MISSION DAY 22</span>
          </div>
          <p className="terminal-text crew-log-text">Small course deviation. Not instrument error. We are being pulled toward coordinates that are not in our mission plan. Kepler-442b.</p>
        </div>
        {(phase === 'tri2' || phase === 'dials' || transitioning) && (
          <div className="crew-log-entry">
            <div className="crew-log-meta">
              <span className="terminal-text crew-log-who">◈ LOG — VASQUEZ</span>
              <span className="terminal-text crew-log-day">DAY 22 — LATER</span>
            </div>
            <p className="terminal-text crew-log-text">The deviation started the exact same day as the power spike in LAB-07. That is not a coincidence. I have not told the others yet.</p>
          </div>
        )}
        {phase === 'dials' && (
          <div className="crew-log-entry crew-log-entry--prometheus">
            <div className="crew-log-meta">
              <span className="terminal-text crew-log-who crew-log-who--prometheus">◈ LOG — VASQUEZ</span>
              <span className="terminal-text crew-log-day crew-log-day--prometheus">MISSION DAY 23</span>
            </div>
            <p className="terminal-text crew-log-text crew-log-text--prometheus">Hayes confronted the Prometheus team today. It did not go well. I have locked the nav archives. Someone needs to know where we were going.</p>
          </div>
        )}
      </div>

    </div>
  )
}
