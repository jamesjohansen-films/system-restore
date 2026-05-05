import { useState } from 'react'
import './MemoryCore.css'

// ── Memory fragment manifest ──────────────────────────────────────────────────
const FRAGMENTS = [
  { id: 'MF-01', crew: 'HAYES',    module: 'POWER GRID',   event: 'NAVIGATIONAL DRIFT DETECTED' },
  { id: 'MF-02', crew: 'CHEN',     module: 'COMMS ARRAY',  event: 'AIRLOCK SEAL FAILURE — SECTOR 4' },
  { id: 'MF-03', crew: 'VASQUEZ',  module: 'LIFE SUPPORT', event: 'O2 LEAK CONFIRMED — COMPARTMENT MED-02' },
  { id: 'MF-04', crew: 'KOWALSKI', module: 'NAV SYSTEM',   event: 'RADIATION ANOMALY — LAB-07 SEALED' },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function MemoryCore({ onSolve, onBack }) {
  const [launching, setLaunching] = useState(false)
  const [launched,  setLaunched]  = useState(false)
  const [showFrag,  setShowFrag]  = useState(false)
  const [tick,      setTick]      = useState(3)

  function handleLaunch() {
    if (launching || launched) return
    setLaunching(true)

    // Countdown 3 → 2 → 1 → GO
    let count = 3
    const interval = setInterval(() => {
      count -= 1
      setTick(count)
      if (count <= 0) {
        clearInterval(interval)
        setLaunched(true)
        setLaunching(false)
        setTimeout(() => setShowFrag(true), 800)
      } else {
        setTick(count)
      }
    }, 700)
  }

  const statusText = launched  ? '✓ CORE UNLOCKED'
    : launching                ? `INITIALIZING... ${tick}`
    : 'AWAITING COMMAND'

  return (
    <div className="mc-module">

      {/* ── Header ── */}
      <div className="mc-header">
        <button className="pm-back terminal-text" onClick={onBack}>← BACK</button>
        <span className="pm-title terminal-text">MODULE 05 — MEMORY CORE</span>
        <span className={`mc-status terminal-text ${launched ? 'mc-status--unlocked' : ''} ${launching ? 'mc-status--launching' : ''}`}>
          {statusText}
        </span>
      </div>

      {/* ── Pre-launch screen ── */}
      {!launched && (
        <div className="mc-body mc-body--launch">

          <div className="mc-launch-label terminal-text">
            // SYSTEM.RESTORE — MEMORY RECONSTRUCTION COMPLETE
          </div>
          <div className="mc-launch-sub terminal-text terminal-text--dim">
            ALL CREW MEMORY FRAGMENTS RECOVERED AND INTEGRATED
          </div>

          {/* Fragment checklist */}
          <div className="mc-frag-checklist">
            {FRAGMENTS.map(f => (
              <div key={f.id} className="mc-frag-check-row">
                <span className="terminal-text mc-frag-check-id">{f.id}</span>
                <span className="terminal-text mc-frag-check-crew">{f.crew}</span>
                <span className="terminal-text terminal-text--dim mc-frag-check-event">{f.event}</span>
                <span className="terminal-text mc-frag-check-ok">✓</span>
              </div>
            ))}
          </div>

          {/* Launch button */}
          <div className="mc-launch-zone">
            <div className="terminal-text terminal-text--dim mc-launch-warning">
              ⚠ IRREVERSIBLE — THIS WILL INITIATE FULL SYSTEM RESTORATION
            </div>
            <button
              className={`mc-launch-btn terminal-text ${launching ? 'mc-launch-btn--launching' : 'mc-launch-btn--ready'}`}
              onClick={handleLaunch}
              disabled={launching}
            >
              {launching
                ? `[ INITIALIZING SYSTEM.RESTORE — T-${tick} ]`
                : '[ INITIATE SYSTEM.RESTORE ]'}
            </button>
          </div>

        </div>
      )}

      {/* ── Solved ── */}
      {launched && (
        <div className="mc-body">
          <p className="terminal-text mc-solved__headline">
            ✓ MEMORY CORE UNLOCKED — SYSTEM.RESTORE COMPLETE
          </p>
          {showFrag && (
            <div className="mc-final-fragment">
              <p className="terminal-text mc-fragment__label">◈ MEMORY FRAGMENT 05 RECOVERED — FINAL LOG</p>
              <div className="mc-frag-row">
                <span className="terminal-text terminal-text--dim">FRAGMENTS INTEGRATED:&nbsp;</span>
                <span className="terminal-text mc-frag-value">4 / 4 — FULL RECONSTRUCTION</span>
              </div>
              <div className="mc-frag-row">
                <span className="terminal-text terminal-text--dim">STATUS:&nbsp;</span>
                <span className="terminal-text mc-frag-value">
                  MEMORY RESTORATION IN PROGRESS — IDENTITY: UNKNOWN
                </span>
              </div>
              <div className="mc-frag-row">
                <span className="terminal-text terminal-text--dim">ORIGIN:&nbsp;</span>
                <span className="terminal-text mc-frag-value">KEPLER-442 SYSTEM — DEEP SPACE VESSEL</span>
              </div>
              <button
                className="mc-confirm terminal-text"
                onClick={() => onSolve?.('SYSTEM.RESTORE')}
              >
                [ FINALIZE RESTORATION ]
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
