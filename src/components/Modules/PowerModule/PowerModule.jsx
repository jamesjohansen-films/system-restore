import { useState, useRef } from 'react'
import './PowerModule.css'

// ── Colour palette ─────────────────────────────────────────────────────────────
const COLOR_HEX = {
  R: '#c1121f', Y: '#b0a800', O: '#cc6400', G: '#00a858',
  B: '#1a4ecc', P: '#a010cc', M: '#cc1a88',
}
const ALL_KEYS = Object.keys(COLOR_HEX)
const DIRS = [[-1,0],[1,0],[0,-1],[0,1]]

// ── Three circuits of increasing difficulty ────────────────────────────────────
const CIRCUITS = [
  { id: 'ALPHA', G: 5, colorKeys: ['R', 'G', 'B'],           label: 'CIRCUIT ALPHA — PRIMARY FEED'       },
  { id: 'BETA',  G: 6, colorKeys: ['R', 'Y', 'G', 'B', 'P'], label: 'CIRCUIT BETA  — SECONDARY FEED'     },
  { id: 'GAMMA', G: 8, colorKeys: ALL_KEYS,                   label: 'CIRCUIT GAMMA — MAIN DISTRIBUTION'  },
]

const SCREWS_COUNT     = 4    // screws on the panel
const CLICKS_TO_REMOVE = 4   // clicks per screw to unthread it

// ── Pure helpers ───────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function growPath(occupied, G) {
  const free = []
  for (let r = 0; r < G; r++)
    for (let c = 0; c < G; c++)
      if (!occupied.has(`${r},${c}`)) free.push([r, c])
  if (free.length < 5) return null

  for (const [sr, sc] of shuffle(free).slice(0, 20)) {
    const path = [[sr, sc]]
    const vis  = new Set([`${sr},${sc}`])
    const tgt  = Math.max(4, 4 + Math.floor(Math.random() * (G - 2)))

    for (let s = 0; s < tgt - 1; s++) {
      const [r, c] = path[path.length - 1]
      const nexts = shuffle(
        DIRS.map(([dr, dc]) => [r + dr, c + dc])
          .filter(([nr, nc]) =>
            nr >= 0 && nr < G && nc >= 0 && nc < G &&
            !occupied.has(`${nr},${nc}`) && !vis.has(`${nr},${nc}`)
          )
      )
      if (!nexts.length) break
      path.push(nexts[0])
      vis.add(`${nexts[0][0]},${nexts[0][1]}`)
    }
    const [er, ec] = path[path.length - 1]
    if (path.length >= 4 && Math.abs(sr - er) + Math.abs(sc - ec) >= 2) return path
  }
  return null
}

function isConnected(obs, G) {
  let start = null
  outer: for (let r = 0; r < G; r++)
    for (let c = 0; c < G; c++)
      if (!obs.has(`${r},${c}`)) { start = [r, c]; break outer }
  if (!start) return false
  const visited = new Set([`${start[0]},${start[1]}`])
  const queue   = [start]
  while (queue.length) {
    const [r, c] = queue.shift()
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc
      const key = `${nr},${nc}`
      if (nr >= 0 && nr < G && nc >= 0 && nc < G && !obs.has(key) && !visited.has(key)) {
        visited.add(key); queue.push([nr, nc])
      }
    }
  }
  return visited.size === G * G - obs.size
}

function generatePuzzle({ G, colorKeys }) {
  const allCells = Array.from({ length: G * G }, (_, i) => [Math.floor(i / G), i % G])
  const interior = allCells.filter(([r, c]) => r > 0 && r < G - 1 && c > 0 && c < G - 1)

  for (let attempt = 0; attempt < 400; attempt++) {
    const numObs = G >= 8 ? 6 + Math.floor(Math.random() * 5)
                 : G >= 6 ? Math.floor(Math.random() * 3)
                 : 0
    const obs = numObs === 0
      ? new Set()
      : new Set(shuffle(interior).slice(0, numObs).map(([r, c]) => `${r},${c}`))

    if (obs.size > 0 && !isConnected(obs, G)) continue

    const occupied = new Set(obs)
    const endpoints = {}
    let ok = true
    for (const color of shuffle([...colorKeys])) {
      const path = growPath(occupied, G)
      if (!path) { ok = false; break }
      path.forEach(([r, c]) => occupied.add(`${r},${c}`))
      endpoints[color] = [path[0], path[path.length - 1]]
    }
    if (!ok) continue

    const obsTypes = {}
    obs.forEach(key => { obsTypes[key] = 'blocker' })
    return { endpoints, obs, obsTypes }
  }

  // Minimal fallback
  return {
    endpoints: Object.fromEntries(colorKeys.map((c, i) => [c, [[0, i % G], [G - 1, (i + 1) % G]]])),
    obs: new Set(), obsTypes: {},
  }
}

function buildEpMap(eps) {
  const map = {}
  Object.entries(eps).forEach(([col, [[r1,c1],[r2,c2]]]) => {
    map[`${r1},${c1}`] = col; map[`${r2},${c2}`] = col
  })
  return map
}

function pathHas(path, r, c) { return path.some(([pr, pc]) => pr === r && pc === c) }
function pathIdx(path, r, c) { return path.findIndex(([pr, pc]) => pr === r && pc === c) }

function isComplete(path, eps, color) {
  if (!path || path.length < 2) return false
  const [[r1,c1],[r2,c2]] = eps[color]
  const s = path[0], e = path[path.length - 1]
  return (s[0]===r1&&s[1]===c1&&e[0]===r2&&e[1]===c2) ||
         (s[0]===r2&&s[1]===c2&&e[0]===r1&&e[1]===c1)
}

function checkWin(ps, eps, colorKeys) {
  return colorKeys.every(c => isComplete(ps[c], eps, c))
}

function getOccupant(r, c, ps) {
  for (const [col, path] of Object.entries(ps))
    if (pathHas(path, r, c)) return col
  return null
}

// ── Screw SVG (Phillips head) ──────────────────────────────────────────────────
function Screw({ turns, onClick, removed }) {
  return (
    <g
      className={`pm-screw ${removed ? 'pm-screw--removed' : ''}`}
      onClick={onClick}
      style={{ cursor: removed ? 'default' : 'pointer' }}
    >
      <circle r={10} className="pm-screw__body" />
      {/* Cross slot */}
      <g style={{ transform: `rotate(${turns * 90}deg)`, transition: 'transform 0.18s ease' }}>
        <rect x={-1.5} y={-7} width={3} height={14} className="pm-screw__slot" />
        <rect x={-7} y={-1.5} width={14} height={3} className="pm-screw__slot" />
      </g>
    </g>
  )
}

// ── Flow puzzle renderer (shared across all 3 circuits) ────────────────────────
function FlowPuzzle({ puzzle, G, colorKeys, onCircuitSolve, circuitLabel, hideLabel = false }) {
  const { endpoints, obs, obsTypes } = puzzle
  const epMap   = buildEpMap(endpoints)
  const [paths, setPaths] = useState({})
  const [solved, setSolved] = useState(false)
  const drawing = useRef(null)
  const psRef   = useRef({})
  const gridRef = useRef(null)

  function epColor(r, c) { return epMap[`${r},${c}`] || null }
  function isEP(r, c)    { return !!epMap[`${r},${c}`] }
  function isObs(r, c)   { return obs.has(`${r},${c}`) }

  function commit(newPs) {
    psRef.current = newPs
    setPaths({ ...newPs })
    if (checkWin(newPs, endpoints, colorKeys)) {
      drawing.current = null
      setSolved(true)
      const sig = Object.values(newPs).reduce((n, p) => n + (p?.length ?? 0), 0)
      setTimeout(() => onCircuitSolve(sig), 1200)
    }
  }

  function getCell(clientX, clientY) {
    if (!gridRef.current) return null
    const rect = gridRef.current.getBoundingClientRect()
    const col  = Math.floor((clientX - rect.left) / rect.width  * G)
    const row  = Math.floor((clientY - rect.top)  / rect.height * G)
    if (row < 0 || row >= G || col < 0 || col >= G) return null
    return [row, col]
  }

  function onPointerDown(e) {
    if (solved) return
    const cell = getCell(e.clientX, e.clientY)
    if (!cell) return
    const [r, c] = cell
    if (isObs(r, c)) return
    e.currentTarget.setPointerCapture(e.pointerId)

    const col = epColor(r, c) || getOccupant(r, c, psRef.current)
    if (!col) return

    const ep  = endpoints[col]
    const ep0 = ep[0], ep1 = ep[1]

    if (getOccupant(r, c, psRef.current) && !isEP(r, c)) {
      const existingPath = psRef.current[col] || []
      const idx = pathIdx(existingPath, r, c)
      const truncated = existingPath.slice(0, idx + 1)
      const newPs = { ...psRef.current, [col]: truncated }
      drawing.current = { color: col, path: truncated }
      commit(newPs)
    } else {
      const startPath = isEP(r, c)
        ? [[r, c]]
        : (psRef.current[col] || [])
      drawing.current = { color: col, path: [[r, c]] }
      const newPs = { ...psRef.current, [col]: [[r, c]] }
      commit(newPs)
    }
  }

  function onPointerMove(e) {
    if (!drawing.current || solved) return
    const cell = getCell(e.clientX, e.clientY)
    if (!cell) return
    const [r, c] = cell
    if (isObs(r, c)) return

    const { color, path } = drawing.current
    const last = path[path.length - 1]
    if (last[0] === r && last[1] === c) return

    const dist = Math.abs(r - last[0]) + Math.abs(c - last[1])
    if (dist !== 1) return

    const occupant = getOccupant(r, c, psRef.current)
    if (occupant && occupant !== color) {
      if (isEP(r, c)) return
      const cleared = { ...psRef.current, [occupant]: [] }
      psRef.current = cleared
    }

    const backIdx = path.findIndex(([pr, pc]) => pr === r && pc === c)
    const newPath = backIdx >= 0 ? path.slice(0, backIdx + 1) : [...path, [r, c]]
    drawing.current = { color, path: newPath }
    commit({ ...psRef.current, [color]: newPath })

    // Stop dragging the moment this color's path reaches its endpoint
    if (isComplete(newPath, endpoints, color)) {
      drawing.current = null
    }
  }

  function onPointerUp() { drawing.current = null }

  const completedCount = colorKeys.filter(c => isComplete(paths[c], endpoints, c)).length

  // Build path polylines
  const svgPaths = colorKeys.map(col => {
    const path = paths[col]
    if (!path || path.length < 2) return null
    const hex = COLOR_HEX[col]
    return { col, path, hex }
  }).filter(Boolean)

  return (
    <div className="pm-circuit">
      {!hideLabel && <div className="pm-circuit__label terminal-text">{circuitLabel}</div>}
      <span className={`pm-counter terminal-text ${completedCount === colorKeys.length ? 'pm-counter--clear' : ''}`}>
        ROUTED: {completedCount} / {colorKeys.length}
      </span>

      <div className="pm-arena">
        <div
          ref={gridRef}
          className="pm-grid"
          style={{ gridTemplateColumns: `repeat(${G}, 1fr)`, gridTemplateRows: `repeat(${G}, 1fr)` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {Array.from({ length: G * G }, (_, i) => {
            const r = Math.floor(i / G), c = i % G
            const ep  = epColor(r, c)
            const ob  = isObs(r, c)
            const obt = ob ? obsTypes[`${r},${c}`] : null
            return (
              <div
                key={i}
                className={`pm-cell ${ob ? `pm-cell--${obt}` : ''}`}
                data-ep={ep || undefined}
              >
                {ep && (
                  <div
                    className="pm-dot"
                    style={{ background: COLOR_HEX[ep], boxShadow: `0 0 8px ${COLOR_HEX[ep]}88` }}
                  />
                )}
                {obt === 'blocker' && <div className="pm-blocker" />}
              </div>
            )
          })}

          {/* SVG overlay */}
          <svg className="pm-svg-overlay" viewBox={`0 0 ${G} ${G}`} preserveAspectRatio="none">
            {svgPaths.map(({ col, path, hex }) => {
              const pts = path.map(([r, c]) => `${c + 0.5},${r + 0.5}`).join(' ')
              return (
                <g key={col}>
                  {path.map(([r, c]) => (
                    <rect key={`${r},${c}`} x={c} y={r} width={1} height={1}
                      fill={hex} fillOpacity={0.18} />
                  ))}
                  <polyline points={pts} fill="none" stroke={hex}
                    strokeWidth={0.32} strokeLinecap="round" strokeLinejoin="round"
                    opacity={0.9} />
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {solved && (
        <div className="pm-circuit__done terminal-text">✓ {CIRCUITS.find(c=>c.label===circuitLabel)?.id ?? ''} RESTORED</div>
      )}
    </div>
  )
}

// ── Main PowerModule ───────────────────────────────────────────────────────────
export default function PowerModule({ onSolve, onBack }) {
  // Generate all 3 puzzles once
  const [allPuzzles] = useState(() => CIRCUITS.map(c => generatePuzzle(c)))

  // Screws: array of click counts (0..CLICKS_TO_REMOVE)
  const [screws, setScrews] = useState(Array(SCREWS_COUNT).fill(0))
  const [panelOpen, setPanelOpen] = useState(false)

  // Circuit progression
  const [circuitIdx, setCircuitIdx] = useState(0)   // 0,1,2
  const [sigs, setSigs] = useState([0, 0, 0])
  const [allDone, setAllDone] = useState(false)
  const [showFragment, setShowFragment] = useState(false)

  function clickScrew(i) {
    if (panelOpen) return
    setScrews(prev => {
      const next = [...prev]
      if (next[i] < CLICKS_TO_REMOVE) next[i]++
      const done = next.every(n => n >= CLICKS_TO_REMOVE)
      if (done) setTimeout(() => setPanelOpen(true), 300)
      return next
    })
  }

  function handleCircuitSolve(idx, sig) {
    setSigs(prev => { const n=[...prev]; n[idx]=sig; return n })
    if (idx < CIRCUITS.length - 1) {
      setTimeout(() => setCircuitIdx(idx + 1), 800)
    } else {
      setTimeout(() => {
        setAllDone(true)
        setTimeout(() => setShowFragment(true), 800)
      }, 800)
    }
  }

  const totalSig = sigs.reduce((a, b) => a + b, 0)

  function devSkip() {
    if (!panelOpen)  setPanelOpen(true)
    else if (!allDone) handleCircuitSolve(circuitIdx, 100)
  }

  // ── Screw panel ──
  if (!panelOpen) {
    const screwPositions = [
      { cx: 40,  cy: 40  },
      { cx: 260, cy: 40  },
      { cx: 40,  cy: 220 },
      { cx: 260, cy: 220 },
    ]
    return (
      <div className="power-module">
        <div className="power-module__header">
          <button className="pm-back terminal-text" onClick={onBack}>← BACK</button>
          <span className="pm-title terminal-text">MODULE 01 — POWER GRID</span>
          <span className="pm-counter terminal-text">
            SCREWS REMOVED: {screws.filter(n => n >= CLICKS_TO_REMOVE).length} / {SCREWS_COUNT}
          </span>
        </div>

        <button className="dev-skip-btn" onClick={devSkip}>⚡ DEV SKIP</button>

        {/* No log during screws — full width panel */}
        <div className="pm-panel-wrap">
          <svg className="pm-panel-svg" viewBox="0 0 300 260">
            {/* Panel body */}
            <rect x={10} y={10} width={280} height={240} rx={4}
              fill="#0a0a0a" stroke="#1e1e1e" strokeWidth={2} />
            {/* Warning stripes */}
            <rect x={10} y={10} width={280} height={16} fill="#111" />
            <rect x={10} y={234} width={280} height={16} fill="#111" />
            {/* Label */}
            <text x={150} y={140} textAnchor="middle"
              className="pm-panel-text">POWER DISTRIBUTION PANEL</text>
            <text x={150} y={158} textAnchor="middle"
              className="pm-panel-subtext">ACCESS RESTRICTED — REMOVE PANEL COVER TO PROCEED</text>
            {/* Decorative lines */}
            <line x1={60} y1={125} x2={100} y2={125} stroke="#1e1e1e" strokeWidth={1}/>
            <line x1={200} y1={125} x2={240} y2={125} stroke="#1e1e1e" strokeWidth={1}/>

            {/* Screws */}
            {screwPositions.map((pos, i) => (
              <g key={i} transform={`translate(${pos.cx},${pos.cy})`}>
                <Screw
                  turns={screws[i]}
                  removed={screws[i] >= CLICKS_TO_REMOVE}
                  onClick={() => clickScrew(i)}
                />
              </g>
            ))}
          </svg>
          <p className="pm-hint terminal-text terminal-text--dim">
            CLICK EACH SCREW TO UNTHREAD — REMOVE ALL {SCREWS_COUNT} SCREWS TO ACCESS PANEL
          </p>
        </div>
      </div>
    )
  }

  // ── Circuit puzzles ──
  if (!allDone) {
    const circuit = CIRCUITS[circuitIdx]
    return (
      <div className="power-module">
        <div className="power-module__header">
          <button className="pm-back terminal-text" onClick={onBack}>← BACK</button>
          <span className="pm-title terminal-text">MODULE 01 — POWER GRID</span>
          <span className="pm-counter terminal-text">
            CIRCUIT: {circuitIdx + 1} / {CIRCUITS.length}
          </span>
        </div>
        <button className="dev-skip-btn" onClick={devSkip}>⚡ DEV SKIP</button>

        {/* Label + hint sit above the log/grid row so the log starts below them */}
        <div className="pm-circuit-header">
          <p className="pm-hint terminal-text terminal-text--dim">
            CONNECT MATCHING CONDUIT NODES — AVOID BLOCKERS
          </p>
          <div className="pm-circuit__label terminal-text">{circuit.label}</div>
        </div>

        <div className="pm-content">
          {/* ── Left: single log entry — replaces as circuits progress ── */}
          <div className="pm-log-col">
            {circuitIdx === 0 ? (
              <div className="crew-log-entry">
                <div className="crew-log-meta">
                  <span className="terminal-text crew-log-who">◈ LOG — HAYES</span>
                  <span className="terminal-text crew-log-day">MISSION DAY 01</span>
                </div>
                <p className="terminal-text crew-log-text">All systems nominal. The Prometheus research team has taken over LAB-07 ahead of schedule. Kowalski says it is routine calibration.</p>
              </div>
            ) : (
              <div className="crew-log-entry">
                <div className="crew-log-meta">
                  <span className="terminal-text crew-log-who">◈ LOG — HAYES</span>
                  <span className="terminal-text crew-log-day">MISSION DAY 14</span>
                </div>
                <p className="terminal-text crew-log-text">Power draw from LAB-07 spiked overnight. 340% above mission spec. Filed a report. Prometheus HQ replied: "Do not escalate." I am escalating anyway.</p>
              </div>
            )}
          </div>

          {/* ── Right: circuit puzzle (label already rendered above) ── */}
          <div className="pm-puzzle-col">
            <FlowPuzzle
              key={circuitIdx}
              puzzle={allPuzzles[circuitIdx]}
              G={circuit.G}
              colorKeys={circuit.colorKeys}
              circuitLabel={circuit.label}
              hideLabel={true}
              onCircuitSolve={sig => handleCircuitSolve(circuitIdx, sig)}
            />
          </div>
        </div>
      </div>
    )
  }

  // ── All circuits solved — show signature ──
  return (
    <div className="power-module">
      <div className="power-module__header">
        <button className="pm-back terminal-text" onClick={onBack}>← BACK</button>
        <span className="pm-title terminal-text">MODULE 01 — POWER GRID</span>
      </div>
      <div className="pm-content">
        {/* ── Left: final log entry — Prometheus intercept replaces Hayes ── */}
        <div className="pm-log-col">
          <div className="crew-log-entry crew-log-entry--prometheus">
            <div className="crew-log-meta">
              <span className="terminal-text crew-log-who crew-log-who--prometheus">◈ PROMETHEUS INTERNAL — RECOVERED</span>
              <span className="terminal-text crew-log-day crew-log-day--prometheus">DAY 14</span>
            </div>
            <p className="terminal-text crew-log-text crew-log-text--prometheus">Crew inquiry re: LAB-07 to be suppressed. Officer Hayes flagged for monitoring. Prometheus-7 protocol: active.</p>
          </div>
        </div>

        {/* ── Right: solved state ── */}
        <div className="pm-puzzle-col">
          <div className="pm-solved">
            <p className="terminal-text pm-solved__headline">
              ✓ POWER GRID RESTORED — ALL CIRCUITS ONLINE
            </p>
            {showFragment && (
              <div className="pm-fragment">
                <p className="terminal-text pm-fragment__label">◈ MEMORY FRAGMENT 01 RECOVERED</p>
                <div className="pm-fragment__data">
                  <span className="terminal-text">TIMESTAMP:&nbsp;</span>
                  <span className="terminal-text pm-fragment__value">2387.089 — 14:22:07</span>
                </div>
                <div className="pm-fragment__data">
                  <span className="terminal-text">EVENT:&nbsp;</span>
                  <span className="terminal-text pm-fragment__value">POWER LOSS — ORIGIN UNKNOWN — ALL SECTORS</span>
                </div>
                <div className="pm-fragment__data">
                  <span className="terminal-text">STATUS:&nbsp;</span>
                  <span className="terminal-text pm-fragment__value">ONLINE</span>
                </div>
                <button className="pm-confirm terminal-text" onClick={() => onSolve('ONLINE')}>
                  INTEGRATE FRAGMENT → CONTINUE
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
