import { useState } from 'react'
import './MemoryCore.css'

// ── Memory fragments ──────────────────────────────────────────────────────────
// Shown scrambled — player sorts them in chronological order (by timestamp).
// Each fragment in sorted order contributes one letter to the master code NOVA.
//
// Sorted order (by timestamp): HAYES → CHEN → VASQUEZ → KOWALSKI
// Letters:                       N       O       V          A
// Master code: NOVA

const FRAGMENTS = [
  {
    id: 'MF-03',
    crew: 'VASQUEZ',
    timestamp: '2387.089 — 16:03:22',
    sortKey: 3,  // 3rd chronologically
    event: 'LIFE SUPPORT ANOMALY — O2 LEAK CONFIRMED',
    compartment: 'MED-02',
    letter: 'V',
    letterClue: 'SYSTEM VECTOR',   // the "V" appears highlighted in this label
  },
  {
    id: 'MF-01',
    crew: 'HAYES',
    timestamp: '2387.089 — 09:15:42',
    sortKey: 1,  // 1st chronologically
    event: 'NAVIGATIONAL DRIFT DETECTED — COURSE DEVIATION',
    compartment: 'BRIDGE',
    letter: 'N',
    letterClue: 'NODE REFERENCE',
  },
  {
    id: 'MF-04',
    crew: 'KOWALSKI',
    timestamp: '2387.089 — 17:45:31',
    sortKey: 4,  // 4th chronologically
    event: 'ANOMALOUS RADIATION — COMPARTMENT SEALED',
    compartment: 'LAB-07',
    letter: 'A',
    letterClue: 'ACCESS TERMINATED',
  },
  {
    id: 'MF-02',
    crew: 'CHEN',
    timestamp: '2387.089 — 14:22:31',
    sortKey: 2,  // 2nd chronologically
    event: 'AIRLOCK SEAL FAILURE — SECTOR 4',
    compartment: 'ENG-03',
    letter: 'O',
    letterClue: 'ORIGIN UNKNOWN',
  },
]

// ── Master code ───────────────────────────────────────────────────────────────
// First letter of each fragment's letterClue, read in chronological order:
// N(ODE) + O(RIGIN) + V(ECTOR) + A(CCESS) = NOVA
const MASTER_CODE = 'NOVA'

// ── Component ─────────────────────────────────────────────────────────────────
export default function MemoryCore({ onSolve, onBack }) {
  // Sort phase — player assigns position 1-4 to each fragment
  const [positions, setPositions] = useState(Object.fromEntries(FRAGMENTS.map(f => [f.id, ''])))
  const [sortError, setSortError] = useState(false)
  const [sortSolved, setSortSolved] = useState(false)

  // Code entry
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState(false)
  const [solved,    setSolved]    = useState(false)
  const [showFrag,  setShowFrag]  = useState(false)

  function setPos(fragId, val) {
    if (sortSolved) return
    setPositions(prev => ({ ...prev, [fragId]: val }))
  }

  function handleSortSubmit() {
    if (sortSolved) return
    if (FRAGMENTS.some(f => positions[f.id] === '')) return
    // No duplicates
    const vals = FRAGMENTS.map(f => positions[f.id])
    if (new Set(vals).size !== vals.length) {
      setSortError(true)
      setTimeout(() => setSortError(false), 1600)
      return
    }
    // Correct order?
    const correct = FRAGMENTS.every(f => positions[f.id] === String(f.sortKey))
    if (!correct) {
      setSortError(true)
      setTimeout(() => setSortError(false), 1600)
      return
    }
    setSortSolved(true)
  }

  function handleCodeSubmit() {
    if (codeInput.trim().toUpperCase() === MASTER_CODE) {
      setSolved(true)
      setTimeout(() => setShowFrag(true), 1400)
    } else {
      setCodeError(true)
      setCodeInput('')
      setTimeout(() => setCodeError(false), 1600)
    }
  }

  // Sorted fragments (when sortSolved) for display
  const sortedFragments = sortSolved
    ? [...FRAGMENTS].sort((a, b) => a.sortKey - b.sortKey)
    : []

  function devSkip() {
    if (!sortSolved)    setSortSolved(true)
    else if (!solved) { setSolved(true); setTimeout(() => setShowFrag(true), 200) }
  }

  const allPositioned = FRAGMENTS.every(f => positions[f.id] !== '')
  const noPosDupes    = new Set(FRAGMENTS.map(f => positions[f.id])).size === FRAGMENTS.length

  return (
    <div className="mc-module">
      {!solved && <button className="dev-skip-btn" onClick={devSkip}>⚡ DEV SKIP</button>}

      {/* ── Header ── */}
      <div className="mc-header">
        <button className="pm-back terminal-text" onClick={onBack}>← BACK</button>
        <span className="pm-title terminal-text">MODULE 05 — MEMORY CORE</span>
        <span className={`mc-status terminal-text ${solved ? 'mc-status--unlocked' : ''}`}>
          {solved ? '✓ CORE UNLOCKED' : sortSolved ? 'DECRYPTING...' : 'FRAGMENTS LOADED'}
        </span>
      </div>

      {/* ── Sort phase ── */}
      {!sortSolved && (
        <div className="mc-body">
          <div className="mc-section-label terminal-text">
            // MEMORY FRAGMENTS — RECOVERED — CHRONOLOGICAL ORDER CORRUPTED
          </div>
          <div className="mc-section-sub terminal-text terminal-text--dim">
            ARRANGE FRAGMENTS IN CHRONOLOGICAL ORDER — ASSIGN POSITION 1 (EARLIEST) TO 4 (LATEST)
          </div>

          <div className="mc-fragments">
            {FRAGMENTS.map(f => (
              <div key={f.id} className="mc-fragment-card">
                <div className="mc-frag-header">
                  <span className="mc-frag-id terminal-text">{f.id}</span>
                  <span className="mc-frag-crew terminal-text">{f.crew}</span>
                </div>
                <div className="mc-frag-timestamp terminal-text terminal-text--dim">
                  {f.timestamp}
                </div>
                <div className="mc-frag-event terminal-text">
                  {f.event}
                </div>
                <div className="mc-frag-comp terminal-text terminal-text--dim">
                  COMPARTMENT: {f.compartment}
                </div>
                <select
                  className="mc-pos-select terminal-text"
                  value={positions[f.id]}
                  onChange={e => setPos(f.id, e.target.value)}
                  style={positions[f.id] ? { borderColor: '#2a4a7a', color: '#4a6a9a' } : {}}
                >
                  <option value="">— POSITION —</option>
                  <option value="1">1 — EARLIEST</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4 — LATEST</option>
                </select>
              </div>
            ))}
          </div>

          {sortError && (
            <div className="mc-error terminal-text">
              ⚠ SEQUENCE INCORRECT — RE-EXAMINE TIMESTAMPS
            </div>
          )}

          <button
            className={`mc-btn terminal-text ${allPositioned && noPosDupes ? 'mc-btn--ready' : ''} ${sortError ? 'mc-btn--error' : ''}`}
            disabled={!allPositioned || !noPosDupes}
            onClick={handleSortSubmit}
          >
            [ RECONSTRUCT SEQUENCE ]
          </button>
        </div>
      )}

      {/* ── Code extraction phase ── */}
      {sortSolved && !solved && (
        <div className="mc-body">
          <div className="mc-section-label terminal-text">
            // SEQUENCE RESTORED — EXTRACT MASTER ACCESS CODE
          </div>
          <div className="mc-section-sub terminal-text terminal-text--dim">
            READ HIGHLIGHTED KEYWORD FROM EACH FRAGMENT IN ORDER — FIRST LETTER ONLY
          </div>

          <div className="mc-sorted-frags">
            {sortedFragments.map((f, i) => (
              <div key={f.id} className="mc-sorted-card">
                <span className="mc-sorted-num terminal-text">{i+1}</span>
                <div className="mc-sorted-info">
                  <div className="mc-sorted-ts terminal-text terminal-text--dim">{f.timestamp}</div>
                  <div className="mc-sorted-crew terminal-text">{f.crew}</div>
                  <div className="mc-sorted-clue terminal-text">
                    <span className="mc-clue-highlight terminal-text">{f.letter}</span>
                    {f.letterClue.slice(1)}
                  </div>
                </div>
                <span className="mc-sorted-letter terminal-text">{f.letter}</span>
              </div>
            ))}
          </div>

          <div className="mc-decode-area">
            <div className="mc-code-display">
              {sortedFragments.map(f => (
                <span key={f.id} className="mc-code-char terminal-text">{f.letter}</span>
              ))}
            </div>

            <div className="mc-code-entry">
              <div className="mc-section-label terminal-text">ENTER MASTER ACCESS CODE:</div>
              <div className="mc-entry-row">
                <span className="terminal-text terminal-text--dim">&gt;&nbsp;</span>
                <input
                  className={`mc-code-input terminal-text ${codeError ? 'mc-code-input--error' : ''}`}
                  type="text"
                  value={codeInput}
                  onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeError(false) }}
                  onKeyDown={e => e.key === 'Enter' && handleCodeSubmit()}
                  maxLength={8}
                  placeholder="_ _ _ _"
                  spellCheck={false}
                  autoComplete="off"
                  autoFocus
                />
                <button className="mc-auth-submit terminal-text" onClick={handleCodeSubmit}>
                  SUBMIT [ ENTER ]
                </button>
              </div>
              {codeError && (
                <div className="mc-auth-gate__error terminal-text">
                  ⚠ CODE REJECTED — CHECK SEQUENCE
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Solved ── */}
      {solved && (
        <div className="mc-body">
          <p className="terminal-text mc-solved__headline">
            ✓ MEMORY CORE UNLOCKED — SYSTEM.RESTORE COMPLETE
          </p>
          {showFrag && (
            <div className="mc-final-fragment">
              <p className="terminal-text mc-fragment__label">◈ MEMORY FRAGMENT 05 RECOVERED — FINAL LOG</p>
              <div className="mc-frag-row">
                <span className="terminal-text terminal-text--dim">MASTER CODE:&nbsp;</span>
                <span className="terminal-text mc-frag-value">{MASTER_CODE}</span>
              </div>
              <div className="mc-frag-row">
                <span className="terminal-text terminal-text--dim">STATUS:&nbsp;</span>
                <span className="terminal-text mc-frag-value">
                  FULL MEMORY RESTORATION IN PROGRESS — IDENTITY: UNKNOWN
                </span>
              </div>
              <div className="mc-frag-row">
                <span className="terminal-text terminal-text--dim">ORIGIN:&nbsp;</span>
                <span className="terminal-text mc-frag-value">KEPLER-442 SYSTEM — DEEP SPACE VESSEL</span>
              </div>
              <button
                className="mc-confirm terminal-text"
                onClick={() => onSolve?.(MASTER_CODE)}
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
