import { useState } from 'react'
import './LifeSupportModule.css'

// ── Crew vitals ───────────────────────────────────────────────────────────────
// Each crew member's O2 level over time (minutes since incident start).
// The line drops and flatlines — player ranks them 1st (earliest) to 4th (latest).
const CREW = [
  {
    id: 'CHEN',
    color: '#c1121f',
    points: [[0,94],[12,93],[15,78],[17,45],[18,15],[20,0],[60,0]],
    rank: 1,
  },
  {
    id: 'VASQUEZ',
    color: '#00a858',
    points: [[0,95],[18,94],[21,82],[23,55],[24,20],[26,0],[60,0]],
    rank: 2,
  },
  {
    id: 'KOWALSKI',
    color: '#b0a800',
    points: [[0,96],[22,95],[26,88],[29,65],[31,30],[33,0],[60,0]],
    rank: 3,
  },
  {
    id: 'HAYES',
    color: '#1a6ecc',
    points: [[0,95],[35,93],[40,85],[43,60],[46,25],[48,0],[60,0]],
    rank: 4,
  },
]

// ── Compartment access log ────────────────────────────────────────────────────
// All 4 crew visited LAB-07. No other compartment was accessed by all 4.
const LOG_ENTRIES = [
  { time: '14:22', crew: 'CHEN',     comp: 'LAB-07' },
  { time: '14:35', crew: 'VASQUEZ',  comp: 'REC-01' },
  { time: '14:55', crew: 'KOWALSKI', comp: 'LAB-07' },
  { time: '15:10', crew: 'HAYES',    comp: 'LAB-07' },
  { time: '15:20', crew: 'CHEN',     comp: 'MED-02' },
  { time: '15:41', crew: 'VASQUEZ',  comp: 'LAB-07' },
  { time: '15:44', crew: 'HAYES',    comp: 'ENG-03' },
  { time: '15:48', crew: 'KOWALSKI', comp: 'MED-02' },
  { time: '16:02', crew: 'CHEN',     comp: 'ENG-03' },
  { time: '16:15', crew: 'VASQUEZ',  comp: 'MED-02' },
  { time: '16:22', crew: 'KOWALSKI', comp: 'REC-01' },
  { time: '16:28', crew: 'HAYES',    comp: 'REC-01' },
]

const ANSWER_COMPARTMENT = 'LAB-07'

// ── Helper ────────────────────────────────────────────────────────────────────
function vitalPoints(pts, w=110, h=36) {
  return pts.map(([t, o2]) => {
    const x = (t / 60) * w
    const y = ((100 - o2) / 100) * (h - 4) + 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function LifeSupportModule({ onSolve, onBack }) {
  // Vitals phase
  const [rankings,    setRankings]    = useState(Object.fromEntries(CREW.map(c => [c.id, ''])))
  const [rankError,   setRankError]   = useState(false)
  const [rankSolved,  setRankSolved]  = useState(false)

  // Compartment phase
  const [compInput,  setCompInput]  = useState('')
  const [compError,  setCompError]  = useState(false)
  const [solved,     setSolved]     = useState(false)
  const [showFrag,   setShowFrag]   = useState(false)

  function setRank(crewId, val) {
    if (rankSolved) return
    setRankings(prev => ({ ...prev, [crewId]: val }))
  }

  function handleRankSubmit() {
    if (rankSolved) return
    // All selected?
    if (CREW.some(c => rankings[c.id] === '')) return
    // No duplicates?
    const vals = CREW.map(c => rankings[c.id])
    if (new Set(vals).size !== vals.length) {
      setRankError(true)
      setTimeout(() => setRankError(false), 1600)
      return
    }
    // Correct?
    const correct = CREW.every(c => rankings[c.id] === String(c.rank))
    if (!correct) {
      setRankError(true)
      setTimeout(() => setRankError(false), 1600)
      return
    }
    setRankSolved(true)
  }

  function handleCompSubmit() {
    const val = compInput.trim().toUpperCase()
    if (val === ANSWER_COMPARTMENT) {
      setSolved(true)
      setTimeout(() => setShowFrag(true), 1400)
    } else {
      setCompError(true)
      setCompInput('')
      setTimeout(() => setCompError(false), 1600)
    }
  }

  function devSkip() {
    if (!rankSolved)    setRankSolved(true)
    else if (!solved) { setSolved(true); setTimeout(() => setShowFrag(true), 200) }
  }

  const allRanked  = CREW.every(c => rankings[c.id] !== '')
  const rankValues = CREW.map(c => rankings[c.id])
  const noDupes    = new Set(rankValues).size === rankValues.length

  return (
    <div className="ls-module">
      {!solved && <button className="dev-skip-btn" onClick={devSkip}>⚡ DEV SKIP</button>}

      {/* ── Header ── */}
      <div className="ls-header">
        <button className="pm-back terminal-text" onClick={onBack}>← BACK</button>
        <span className="pm-title terminal-text">MODULE 04 — LIFE SUPPORT</span>
        <span className={`ls-status terminal-text ${solved ? 'ls-status--restored' : ''}`}>
          {solved ? '✓ LOG RESTORED' : rankSolved ? 'COMPARTMENT QUERY' : 'VITAL SIGNS ACTIVE'}
        </span>
      </div>

      {/* ── Vitals phase ── */}
      {!rankSolved && (
        <div className="ls-body">
          <div className="ls-section-label terminal-text">
            // CREW VITAL SIGNS — O₂ SATURATION — T+00:00 TO T+60:00
          </div>
          <div className="ls-section-sub terminal-text terminal-text--dim">
            IDENTIFY DEATH SEQUENCE — RANK EACH CREW MEMBER 1ST (FIRST) TO 4TH (LAST)
          </div>

          <div className="ls-vitals-grid">
            {CREW.map(c => (
              <div key={c.id} className="ls-vital-card">
                <div className="ls-vital-name terminal-text" style={{ color: c.color }}>
                  {c.id}
                </div>
                <svg className="ls-vital-svg" viewBox="0 0 110 36" preserveAspectRatio="none">
                  {/* Y-axis reference lines */}
                  <line x1={0} y1={2}  x2={110} y2={2}  stroke="#0e1020" strokeWidth={0.5}/>
                  <line x1={0} y1={20} x2={110} y2={20} stroke="#0e1020" strokeWidth={0.5}/>
                  <line x1={0} y1={34} x2={110} y2={34} stroke="#0e1020" strokeWidth={0.5}/>
                  {/* O2 trace */}
                  <polyline
                    points={vitalPoints(c.points)}
                    fill="none"
                    stroke={c.color}
                    strokeWidth={1.0}
                    strokeOpacity={0.85}
                  />
                </svg>
                {/* Axis labels */}
                <div className="ls-vital-axis terminal-text terminal-text--dim">
                  <span>T+00</span>
                  <span>O₂%</span>
                  <span>T+60</span>
                </div>
                {/* Rank selector */}
                <select
                  className="ls-rank-select terminal-text"
                  value={rankings[c.id]}
                  onChange={e => setRank(c.id, e.target.value)}
                  style={rankings[c.id] ? { borderColor: c.color, color: c.color } : {}}
                >
                  <option value="">— RANK —</option>
                  <option value="1">1ST — FIRST</option>
                  <option value="2">2ND</option>
                  <option value="3">3RD</option>
                  <option value="4">4TH — LAST</option>
                </select>
              </div>
            ))}
          </div>

          {rankError && (
            <div className="ls-error terminal-text">
              ⚠ SEQUENCE INCORRECT — RE-ANALYSE VITAL SIGNS
            </div>
          )}

          <button
            className={`ls-submit terminal-text ${allRanked && noDupes ? 'ls-submit--ready' : ''} ${rankError ? 'ls-submit--error' : ''}`}
            disabled={!allRanked || !noDupes}
            onClick={handleRankSubmit}
          >
            [ SUBMIT DEATH SEQUENCE ]
          </button>
        </div>
      )}

      {/* ── Compartment phase ── */}
      {rankSolved && !solved && (
        <div className="ls-body">
          <div className="ls-section-label terminal-text">
            // COMPARTMENT ACCESS LOG — PRE-INCIDENT WINDOW
          </div>
          <div className="ls-section-sub terminal-text terminal-text--dim">
            IDENTIFY COMPARTMENT ACCESSED BY ALL 4 CREW IN FINAL HOUR
          </div>

          <div className="ls-log-wrap">
            <table className="ls-log-table">
              <thead>
                <tr>
                  <th className="terminal-text">TIME</th>
                  <th className="terminal-text">CREW</th>
                  <th className="terminal-text">COMPARTMENT</th>
                </tr>
              </thead>
              <tbody>
                {LOG_ENTRIES.map((e, i) => (
                  <tr key={i}>
                    <td className="terminal-text">{e.time}</td>
                    <td className="terminal-text" style={{ color: CREW.find(c=>c.id===e.crew)?.color }}>
                      {e.crew}
                    </td>
                    <td className="terminal-text">{e.comp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ls-comp-entry">
            <div className="ls-section-label terminal-text">
              ENTER COMPROMISED COMPARTMENT CODE:
            </div>
            <div className="ls-comp-row">
              <span className="terminal-text terminal-text--dim">&gt;&nbsp;</span>
              <input
                className={`ls-comp-input terminal-text ${compError ? 'ls-comp-input--error' : ''}`}
                type="text"
                value={compInput}
                onChange={e => { setCompInput(e.target.value.toUpperCase()); setCompError(false) }}
                onKeyDown={e => e.key === 'Enter' && handleCompSubmit()}
                placeholder="XXX-00"
                spellCheck={false}
                autoComplete="off"
                autoFocus
                maxLength={8}
              />
              <button className="ls-auth-submit terminal-text" onClick={handleCompSubmit}>
                CONFIRM [ ENTER ]
              </button>
            </div>
            {compError && (
              <div className="ls-auth-gate__error terminal-text">
                ⚠ COMPARTMENT CODE NOT FOUND IN SHARED LOGS
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Solved ── */}
      {solved && (
        <div className="ls-body">
          <p className="terminal-text ls-solved__headline">
            ✓ INCIDENT LOG RECONSTRUCTED
          </p>
          {showFrag && (
            <div className="ls-fragment">
              <p className="terminal-text ls-fragment__label">◈ MEMORY FRAGMENT 04 RECOVERED</p>
              <div className="ls-fragment__row">
                <span className="terminal-text terminal-text--dim">DEATH SEQUENCE:&nbsp;</span>
                <span className="terminal-text ls-fragment__value">
                  CHEN → VASQUEZ → KOWALSKI → HAYES
                </span>
              </div>
              <div className="ls-fragment__row">
                <span className="terminal-text terminal-text--dim">INCIDENT ORIGIN:&nbsp;</span>
                <span className="terminal-text ls-fragment__value">{ANSWER_COMPARTMENT}</span>
              </div>
              <button
                className="ls-confirm terminal-text"
                onClick={() => onSolve?.(ANSWER_COMPARTMENT)}
              >
                INTEGRATE FRAGMENT → CONTINUE
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
