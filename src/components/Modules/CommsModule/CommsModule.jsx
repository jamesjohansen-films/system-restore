import { useState } from 'react'
import './CommsModule.css'

// ── Puzzle constants ───────────────────────────────────────────────────────────
const TOLERANCE = 5   // ±5 on each 0-100 slider before a channel "locks"

// 4 signal channels.  Each has a target waveform (freq + amp) and a digit it
// reveals once the player tunes both sliders to within TOLERANCE.
// The 4 revealed digits (in channel order) form CODE.
const CHANNELS = [
  { id: 'CH-1', color: '#c1121f', target: { freq: 30, amp: 70 }, digit: '7' },
  { id: 'CH-2', color: '#b0a800', target: { freq: 60, amp: 35 }, digit: '3' },
  { id: 'CH-3', color: '#1a6ecc', target: { freq: 75, amp: 80 }, digit: '9' },
  { id: 'CH-4', color: '#00a858', target: { freq: 20, amp: 55 }, digit: '4' },
]

const CODE = '7394'

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeWave(freq, amp, w = 200, h = 46) {
  const cycles    = 1 + (freq / 100) * 11
  const amplitude = (amp  / 100) * 18
  const steps     = 200
  const pts       = []
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * w
    const y = h / 2 - Math.sin((i / steps) * cycles * Math.PI * 2) * amplitude
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return pts.join(' ')
}

function isLocked(ch, sl) {
  return (
    Math.abs(sl.freq - ch.target.freq) <= TOLERANCE &&
    Math.abs(sl.amp  - ch.target.amp)  <= TOLERANCE
  )
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function CommsModule({ onSolve, onBack }) {
  const [sliders, setSliders] = useState(() =>
    CHANNELS.map(() => ({ freq: 50, amp: 50 }))
  )

  const [codeInput,   setCodeInput]   = useState('')
  const [codeError,   setCodeError]   = useState(false)
  const [solved,      setSolved]      = useState(false)
  const [showFragment,setShowFragment]= useState(false)

  // ── Handlers ──────────────────────────────────────────────────────────────
  function setSlider(chIdx, param, val) {
    setSliders(prev => {
      const next = [...prev]
      next[chIdx] = { ...next[chIdx], [param]: Number(val) }
      return next
    })
  }

  const lockedFlags = CHANNELS.map((ch, i) => isLocked(ch, sliders[i]))
  const allLocked   = lockedFlags.every(Boolean)

  function devSkip() {
    if (!allLocked) {
      setSliders(CHANNELS.map(ch => ({ freq: ch.target.freq, amp: ch.target.amp })))
    } else if (!solved) {
      setSolved(true)
      setTimeout(() => setShowFragment(true), 200)
    }
  }

  function handleCodeSubmit() {
    if (codeInput.trim() === CODE) {
      setSolved(true)
      setTimeout(() => setShowFragment(true), 800)
    } else {
      setCodeError(true)
      setCodeInput('')
      setTimeout(() => setCodeError(false), 1600)
    }
  }

  return (
    <div className="comms-module">
      {!solved && <button className="dev-skip-btn" onClick={devSkip}>⚡ DEV SKIP</button>}

      {/* ── Header ── */}
      <div className="comms-module__header">
        <button className="cm-back terminal-text" onClick={onBack}>← BACK</button>
        <span className="cm-title terminal-text">MODULE 02 — COMMUNICATIONS</span>
        <span className={`cm-status terminal-text ${solved ? 'cm-status--online' : ''}`}>
          {solved ? '✓ ONLINE' : '— OFFLINE'}
        </span>
      </div>

      <div className="cm-body">

        {/* ── LEFT: 4 signal channel cards ── */}
        <div className="cm-left">
          <div className="cm-section-label terminal-text terminal-text--dim">
            ◈ SIGNAL CHANNELS — MATCH TARGET WAVEFORM
          </div>
          <div className="cm-channels">
            {CHANNELS.map((ch, i) => {
              const sl     = sliders[i]
              const locked = lockedFlags[i]
              const tgtPts = makeWave(ch.target.freq, ch.target.amp)
              const curPts = makeWave(sl.freq, sl.amp)

              return (
                <div
                  key={ch.id}
                  className={`cm-channel-card ${locked ? 'cm-channel-card--locked' : ''}`}
                  style={locked ? { borderColor: `${ch.color}44` } : {}}
                >
                  <div className="cm-channel-header">
                    <span
                      className="cm-ch-tag terminal-text"
                      style={{ color: locked ? ch.color : undefined }}
                    >
                      {ch.id}
                    </span>
                    <span
                      className={`cm-ch-status terminal-text ${locked ? 'cm-ch-status--locked' : ''}`}
                      style={{ color: locked ? ch.color : undefined }}
                    >
                      {locked ? '✓ LOCKED' : '⋯ TUNING'}
                    </span>
                  </div>

                  <svg className="cm-waveform" viewBox="0 0 200 46" preserveAspectRatio="none">
                    <polyline
                      points={curPts}
                      fill="none" stroke={ch.color}
                      strokeWidth={1.4}
                      strokeOpacity={locked ? 1 : 0.9}
                    />
                    <polyline
                      points={tgtPts}
                      fill="none" stroke={ch.color}
                      strokeWidth={1.0}
                      strokeOpacity={locked ? 0.4 : 0.65}
                      strokeDasharray="5 3"
                    />
                  </svg>

                  {!locked && (
                    <div className="cm-sliders">
                      {(['freq', 'amp']).map(param => (
                        <div key={param} className="cm-slider-group">
                          <span className="cm-slider-label terminal-text terminal-text--dim">
                            {param === 'freq' ? 'FREQ' : 'AMP'}
                          </span>
                          <input
                            type="range" min={0} max={100}
                            value={sl[param]}
                            onChange={e => setSlider(i, param, e.target.value)}
                            className="cm-slider"
                            style={{ '--ch-color': ch.color }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT: Code panel ── */}
        <div className="cm-right">

          {/* Digit display — fills in as channels lock */}
          <div className="cm-panel">
            <span className="cm-panel__label terminal-text terminal-text--dim">
              RECOVERY CODE
            </span>
            <div className="cm-code-digits">
              {CHANNELS.map((ch, i) => (
                <span
                  key={ch.id}
                  className={`cm-code-digit terminal-text ${lockedFlags[i] ? 'cm-code-digit--revealed' : ''}`}
                  style={lockedFlags[i] ? { color: ch.color } : {}}
                >
                  {lockedFlags[i] ? ch.digit : '_'}
                </span>
              ))}
            </div>
          </div>

          {/* Code entry — shown once all channels locked */}
          {allLocked && !solved && (
            <div className="cm-decode-panel">
              <span className="cm-panel__label terminal-text terminal-text--dim">
                ENTER RECOVERY CODE
              </span>
              <div className="cm-decode-row">
                <span className="cm-decode-prompt terminal-text terminal-text--dim">&gt;</span>
                <input
                  className={`cm-decode-input terminal-text ${codeError ? 'cm-decode-input--error' : ''}`}
                  type="text"
                  value={codeInput}
                  onChange={e => { setCodeInput(e.target.value); setCodeError(false) }}
                  onKeyDown={e => e.key === 'Enter' && handleCodeSubmit()}
                  maxLength={4}
                  placeholder="_ _ _ _"
                  spellCheck={false}
                  autoComplete="off"
                  autoFocus
                />
              </div>
              {codeError && (
                <div className="cm-auth-gate__error terminal-text" style={{ fontSize: '0.64rem' }}>
                  ⚠ CODE REJECTED
                </div>
              )}
              <button className="cm-submit terminal-text" onClick={handleCodeSubmit}>
                TRANSMIT [ ENTER ]
              </button>
            </div>
          )}

          {/* Solved fragment */}
          {solved && (
            <div className="cm-solved">
              <p className="terminal-text cm-solved__headline">
                ✓ SIGNAL DECODED — COMMS RESTORED
              </p>
              {showFragment && (
                <div className="cm-fragment">
                  <p className="terminal-text cm-fragment__label">◈ MEMORY FRAGMENT 02 RECOVERED</p>
                  <div className="cm-fragment__row">
                    <span className="terminal-text terminal-text--dim">TIMESTAMP:&nbsp;</span>
                    <span className="terminal-text cm-fragment__value">2387.089 — 14:22:31</span>
                  </div>
                  <div className="cm-fragment__row">
                    <span className="terminal-text terminal-text--dim">LOG:&nbsp;</span>
                    <span className="terminal-text cm-fragment__value">AIRLOCK SEAL FAILURE — SECTOR 4</span>
                  </div>
                  <button className="cm-confirm terminal-text" onClick={() => onSolve(CODE)}>
                    INTEGRATE FRAGMENT → CONTINUE
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
