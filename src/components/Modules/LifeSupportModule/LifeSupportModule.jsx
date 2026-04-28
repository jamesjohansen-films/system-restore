import { useState, useRef } from 'react'
import './LifeSupportModule.css'

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 1 — SPECTROGRAPH RECONSTRUCTION
// Player reconstructs VITAGEN-7's spectral signature from 7 fragments (5 correct + 2 decoys)
// ══════════════════════════════════════════════════════════════════════════════

const SLOTS = [
  { id: 's1', pos: 12, nm: '428', color: '#4477ee' },
  { id: 's2', pos: 29, nm: '524', color: '#00bb66' },
  { id: 's3', pos: 48, nm: '573', color: '#aacc00' },
  { id: 's4', pos: 66, nm: '648', color: '#ff4422' },
  { id: 's5', pos: 83, nm: '712', color: '#cc33aa' },
]

const FRAG_BANK = [
  { id: 'f1', nm: '428', color: '#4477ee', correctSlot: 's1' },
  { id: 'f2', nm: '524', color: '#00bb66', correctSlot: 's2' },
  { id: 'f3', nm: '573', color: '#aacc00', correctSlot: 's3' },
  { id: 'f4', nm: '648', color: '#ff4422', correctSlot: 's4' },
  { id: 'f5', nm: '712', color: '#cc33aa', correctSlot: 's5' },
  { id: 'f6', nm: '491', color: '#00cccc', correctSlot: null }, // decoy
  { id: 'f7', nm: '688', color: '#ee2255', correctSlot: null }, // decoy
]

function shuffled(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 2 — EXPERIMENT LOG
// SIGMA-4 shows readings spiking into red zone
// ══════════════════════════════════════════════════════════════════════════════

const EXPERIMENTS = [
  { id: 'ALPHA-1', readings: [12, 14, 13, 15, 13, 14, 12], anomalous: false },
  { id: 'BETA-2',  readings: [20, 19, 21, 20, 22, 20, 21], anomalous: false },
  { id: 'GAMMA-3', readings: [8,  9,  8,  10, 9,  8,  9 ], anomalous: false },
  { id: 'SIGMA-4', readings: [11, 14, 29, 52, 84, 91, 88], anomalous: true  },
  { id: 'DELTA-5', readings: [17, 16, 18, 17, 16, 18, 17], anomalous: false },
]
const RED_THRESHOLD = 40

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 3 — DNA STRAND MUTATION
// SAMPLE-3 has G→C at position 2 (0-indexed)
// ══════════════════════════════════════════════════════════════════════════════

const BASE_COLORS = { A: '#4477ee', T: '#ff4422', G: '#00bb66', C: '#cc33aa' }
const REF_STRAND  = ['A','T','G','C','A','G','T','C','A','T']

const DNA_SAMPLES = [
  { id: 'strand-1', label: 'SAMPLE-1', bases: ['A','T','G','C','A','G','T','C','A','T'], mutated: false },
  { id: 'strand-2', label: 'SAMPLE-2', bases: ['A','T','G','C','A','G','T','C','A','T'], mutated: false },
  { id: 'strand-3', label: 'SAMPLE-3', bases: ['A','T','C','C','A','G','T','C','A','T'], mutated: true  },
  { id: 'strand-4', label: 'SAMPLE-4', bases: ['A','T','G','C','A','G','T','C','A','T'], mutated: false },
]

const ANSWER_CODE = 'LAB-07'

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function LifeSupportModule({ onSolve, onBack }) {
  // ── Global phase ───────────────────────────────────────────────────────────
  const [phase, setPhase] = useState(1)

  // ── Phase 1 ────────────────────────────────────────────────────────────────
  const [frags]      = useState(() => shuffled(FRAG_BANK))
  const [placements, setPlacements] = useState({})      // slotId → fragId
  const [selected,   setSelected]   = useState(null)    // fragId in "hand"
  const [p1Error,    setP1Error]    = useState(false)
  const dragRef                     = useRef(null)       // { fragId, fromSlot }

  const placedSet     = new Set(Object.values(placements))
  const bankFrags     = frags.filter(f => !placedSet.has(f.id) && f.id !== selected)
  const allFilled     = SLOTS.every(s => placements[s.id])

  function pickUpFrag(fragId, fromSlotId = null) {
    if (fromSlotId) {
      setPlacements(prev => { const n = { ...prev }; delete n[fromSlotId]; return n })
    }
    setSelected(prev => (prev === fragId && !fromSlotId) ? null : fragId)
  }

  function handleSlotClick(slotId) {
    if (selected) {
      setPlacements(prev => {
        const n = { ...prev }
        Object.keys(n).forEach(k => { if (n[k] === selected) delete n[k] })
        n[slotId] = selected
        return n
      })
      setSelected(null)
    } else if (placements[slotId]) {
      pickUpFrag(placements[slotId], slotId)
    }
  }

  function onDragStart(e, fragId, fromSlot = null) {
    dragRef.current = { fragId, fromSlot }
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }

  function onDropSlot(e, slotId) {
    e.preventDefault()
    if (!dragRef.current) return
    const { fragId, fromSlot } = dragRef.current
    setPlacements(prev => {
      const n = { ...prev }
      if (fromSlot) delete n[fromSlot]
      Object.keys(n).forEach(k => { if (n[k] === fragId) delete n[k] })
      n[slotId] = fragId
      return n
    })
    dragRef.current = null
    setSelected(null)
  }

  function onDropBank(e) {
    e.preventDefault()
    if (!dragRef.current) return
    const { fragId, fromSlot } = dragRef.current
    if (fromSlot) {
      setPlacements(prev => { const n = { ...prev }; if (n[fromSlot] === fragId) delete n[fromSlot]; return n })
    }
    dragRef.current = null
  }

  function submitPhase1() {
    const correct = SLOTS.every(s => {
      const f = FRAG_BANK.find(x => x.id === placements[s.id])
      return f && f.correctSlot === s.id
    })
    if (correct) {
      setPhase(2)
    } else {
      setP1Error(true)
      setTimeout(() => setP1Error(false), 1600)
    }
  }

  // ── Phase 2 ────────────────────────────────────────────────────────────────
  const [selectedExp, setSelectedExp] = useState(null)
  const [p2Error,     setP2Error]     = useState(false)

  function submitPhase2() {
    const exp = EXPERIMENTS.find(e => e.id === selectedExp)
    if (exp?.anomalous) {
      setPhase(3)
    } else {
      setP2Error(true)
      setSelectedExp(null)
      setTimeout(() => setP2Error(false), 1600)
    }
  }

  // ── Phase 3 ────────────────────────────────────────────────────────────────
  const [selectedStrand,  setSelectedStrand]  = useState(null)
  const [strandConfirmed, setStrandConfirmed] = useState(false)
  const [p3Error,         setP3Error]         = useState(false)
  const [solved,          setSolved]          = useState(false)
  const [showFrag,        setShowFrag]        = useState(false)

  function confirmStrand() {
    const s = DNA_SAMPLES.find(x => x.id === selectedStrand)
    if (s?.mutated) {
      setStrandConfirmed(true)
    } else {
      setP3Error(true)
      setSelectedStrand(null)
      setTimeout(() => setP3Error(false), 1600)
    }
  }

  function confirmCause(expId) {
    if (expId === 'SIGMA-4') {
      setSolved(true)
      setTimeout(() => setShowFrag(true), 800)
    } else {
      setP3Error(true)
      setTimeout(() => setP3Error(false), 1600)
    }
  }

  // ── Dev skip ───────────────────────────────────────────────────────────────
  function devSkip() {
    if (phase === 1)                          setPhase(2)
    else if (phase === 2)                     setPhase(3)
    else if (phase === 3 && !strandConfirmed) { setSelectedStrand('strand-3'); setStrandConfirmed(true) }
    else if (phase === 3 && !solved)          { setSolved(true); setTimeout(() => setShowFrag(true), 300) }
  }

  const statusLabel = solved           ? '✓ ANALYSIS COMPLETE' :
                      phase === 3      ? 'DNA ANALYSIS'         :
                      phase === 2      ? 'EXPERIMENT LOG'       :
                                         'SPECTROGRAPH RECON'

  return (
    <div className="ls-module">
      {!solved && <button className="dev-skip-btn" onClick={devSkip}>⚡ DEV</button>}

      {/* ── Header ── */}
      <div className="ls-header">
        <button className="pm-back terminal-text" onClick={onBack}>← BACK</button>
        <span className="pm-title terminal-text">MODULE 04 — LIFE SUPPORT</span>
        <span className={`ls-status terminal-text ${solved ? 'ls-status--restored' : ''}`}>
          {statusLabel}
        </span>
      </div>

      {/* ── Phase indicator ── */}
      {!solved && (
        <div className="ls-phase-bar">
          {[1, 2, 3].map(p => (
            <div key={p} className={`ls-phase-pip terminal-text ${phase >= p ? 'ls-phase-pip--done' : ''} ${phase === p ? 'ls-phase-pip--active' : ''}`}>
              {p}
            </div>
          ))}
          <span className="terminal-text terminal-text--dim ls-phase-label">
            {phase === 1 ? '— COMPOUND IDENTIFICATION' : phase === 2 ? '— EXPERIMENT LOG' : '— DNA ANALYSIS'}
          </span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PHASE 1 — SPECTROGRAPH
         ══════════════════════════════════════════════════════════════════════ */}
      {phase === 1 && (
        <div className="ls-body">
          <div className="ls-section-label terminal-text">
            // COMPOUND SPECTROGRAPH — RECONSTRUCT VITAGEN-7 SIGNATURE
          </div>
          <div className="ls-section-sub terminal-text terminal-text--dim">
            DRAG OR CLICK-SELECT FRAGMENTS — PLACE IN MATCHING REFERENCE SLOTS
          </div>

          {/* Reference spectrum bar */}
          <div className="ls-spectrum-wrap">
            <svg className="ls-spectrum-svg" viewBox="0 0 300 42" preserveAspectRatio="none">
              <defs>
                <linearGradient id="specGrad" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%"   stopColor="#180050" />
                  <stop offset="14%"  stopColor="#1133bb" />
                  <stop offset="30%"  stopColor="#0077bb" />
                  <stop offset="47%"  stopColor="#008844" />
                  <stop offset="57%"  stopColor="#88aa00" />
                  <stop offset="68%"  stopColor="#cc5500" />
                  <stop offset="84%"  stopColor="#aa0000" />
                  <stop offset="100%" stopColor="#330011" />
                </linearGradient>
              </defs>
              <rect x="0" y="6" width="300" height="22" fill="url(#specGrad)" opacity="0.35" />
              {SLOTS.map(s => (
                <g key={s.id}>
                  <line x1={s.pos * 3} y1="2" x2={s.pos * 3} y2="30"
                    stroke={s.color} strokeWidth="2.5" opacity="0.9" />
                  <text x={s.pos * 3} y="40" textAnchor="middle"
                    fontSize="6" fill={s.color} opacity="0.75" fontFamily="monospace">
                    {s.nm}nm
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Slot targets */}
          <div className="ls-slots">
            {SLOTS.map((s, i) => {
              const pf = placements[s.id] ? FRAG_BANK.find(f => f.id === placements[s.id]) : null
              const isTarget = !!selected
              return (
                <div
                  key={s.id}
                  className={`ls-slot ${pf ? 'ls-slot--filled' : ''} ${isTarget && !pf ? 'ls-slot--target' : ''}`}
                  onClick={() => handleSlotClick(s.id)}
                  onDragOver={onDragOver}
                  onDrop={e => onDropSlot(e, s.id)}
                >
                  {pf ? (
                    <div
                      className="ls-frag-placed terminal-text"
                      style={{ color: pf.color, borderColor: pf.color + '66' }}
                      draggable
                      onDragStart={e => { e.stopPropagation(); onDragStart(e, pf.id, s.id) }}
                      onClick={e => { e.stopPropagation(); pickUpFrag(pf.id, s.id) }}
                    >
                      {pf.nm}nm
                    </div>
                  ) : (
                    <span className="ls-slot-num terminal-text terminal-text--dim">{i + 1}</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Fragment bank */}
          <div className="ls-bank" onDragOver={onDragOver} onDrop={onDropBank}>
            <div className="ls-bank-label terminal-text terminal-text--dim">
              FRAGMENT BANK — {bankFrags.length + (selected ? 1 : 0)} UNPLACED
            </div>
            <div className="ls-frag-grid">
              {selected && (() => {
                const f = FRAG_BANK.find(x => x.id === selected)
                return (
                  <div
                    key={f.id}
                    className="ls-frag ls-frag--selected"
                    style={{ color: f.color, borderColor: f.color }}
                    draggable
                    onDragStart={e => onDragStart(e, f.id)}
                    onClick={() => setSelected(null)}
                  >
                    {f.nm}nm
                  </div>
                )
              })()}
              {bankFrags.map(f => (
                <div
                  key={f.id}
                  className="ls-frag"
                  style={{ color: f.color, borderColor: f.color + '66' }}
                  draggable
                  onDragStart={e => onDragStart(e, f.id)}
                  onClick={() => pickUpFrag(f.id)}
                >
                  {f.nm}nm
                </div>
              ))}
            </div>
          </div>

          {p1Error && (
            <div className="ls-error terminal-text">⚠ FRAGMENT MISMATCH — CHECK WAVELENGTH POSITIONS</div>
          )}

          <button
            className={`ls-submit terminal-text ${allFilled ? 'ls-submit--ready' : ''} ${p1Error ? 'ls-submit--error' : ''}`}
            disabled={!allFilled}
            onClick={submitPhase1}
          >
            [ CONFIRM COMPOUND RECONSTRUCTION ]
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PHASE 2 — EXPERIMENT LOG
         ══════════════════════════════════════════════════════════════════════ */}
      {phase === 2 && (
        <div className="ls-body">
          <div className="ls-section-label terminal-text">
            // EXPERIMENT LOG — VITAGEN-7 SYNTHESIS TRIALS
          </div>
          <div className="ls-section-sub terminal-text terminal-text--dim">
            REVIEW 5 TRIAL BATCHES — SELECT THE EXPERIMENT WITH ANOMALOUS READINGS
          </div>

          <div className="ls-exp-grid">
            {EXPERIMENTS.map(exp => (
              <div
                key={exp.id}
                className={`ls-exp-card ${selectedExp === exp.id ? 'ls-exp-card--selected' : ''}`}
                onClick={() => setSelectedExp(exp.id)}
              >
                <div className="ls-exp-id terminal-text">{exp.id}</div>
                <svg className="ls-exp-chart" viewBox="0 0 72 34" preserveAspectRatio="none">
                  {/* Red zone ceiling */}
                  <rect x="0" y="0" width="72"
                    height={34 * (1 - RED_THRESHOLD / 100)}
                    fill="rgba(193,18,31,0.07)"
                  />
                  <line
                    x1="0" y1={34 * (1 - RED_THRESHOLD / 100)}
                    x2="72" y2={34 * (1 - RED_THRESHOLD / 100)}
                    stroke="#c1121f" strokeWidth="0.6" strokeDasharray="3,2" opacity="0.5"
                  />
                  {/* Bars */}
                  {exp.readings.map((r, i) => {
                    const h = (r / 100) * 32
                    return (
                      <rect
                        key={i}
                        x={2 + i * 10} y={32 - h}
                        width={7} height={h}
                        fill={r >= RED_THRESHOLD ? '#c1121f' : '#2a4a2a'}
                        opacity="0.9"
                      />
                    )
                  })}
                </svg>
              </div>
            ))}
          </div>

          {p2Error && (
            <div className="ls-error terminal-text">⚠ READINGS WITHIN NORMAL RANGE — REANALYSE</div>
          )}

          <button
            className={`ls-submit terminal-text ${selectedExp ? 'ls-submit--ready' : ''} ${p2Error ? 'ls-submit--error' : ''}`}
            disabled={!selectedExp}
            onClick={submitPhase2}
          >
            [ FLAG EXPERIMENT AS ANOMALOUS ]
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PHASE 3 — DNA STRAND MUTATION
         ══════════════════════════════════════════════════════════════════════ */}
      {phase === 3 && (
        <div className="ls-body">
          <div className="ls-section-label terminal-text">
            // DNA STRAND ANALYSIS — VITAGEN-7 SYNTHESIS BATCH
          </div>
          <div className="ls-section-sub terminal-text terminal-text--dim">
            {!strandConfirmed
              ? 'COMPARE SAMPLES TO REFERENCE STRAND — LOCATE THE MUTATION'
              : 'MUTATION CONFIRMED — SELECT EXPERIMENT RESPONSIBLE'}
          </div>

          {/* Reference strand */}
          <div className="ls-dna-row ls-dna-row--ref">
            <span className="ls-dna-label terminal-text terminal-text--dim">REF</span>
            <div className="ls-dna-bases">
              {REF_STRAND.map((b, i) => (
                <div
                  key={i}
                  className="ls-base"
                  style={{
                    background: BASE_COLORS[b] + '22',
                    borderColor: BASE_COLORS[b] + '77',
                    color: BASE_COLORS[b],
                  }}
                >
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="ls-dna-divider" />

          {/* Sample strands */}
          <div className="ls-dna-samples">
            {DNA_SAMPLES.map(sample => (
              <div
                key={sample.id}
                className={`ls-dna-row ${!strandConfirmed ? 'ls-dna-row--clickable' : ''} ${selectedStrand === sample.id ? 'ls-dna-row--selected' : ''}`}
                onClick={() => !strandConfirmed && setSelectedStrand(sample.id)}
              >
                <span className="ls-dna-label terminal-text">{sample.label}</span>
                <div className="ls-dna-bases">
                  {sample.bases.map((b, i) => {
                    const mut = b !== REF_STRAND[i]
                    return (
                      <div
                        key={i}
                        className={`ls-base ${mut ? 'ls-base--mutated' : ''}`}
                        style={{
                          background: mut ? 'rgba(193,18,31,0.18)' : BASE_COLORS[b] + '18',
                          borderColor: mut ? '#c1121f'              : BASE_COLORS[b] + '55',
                          color:       mut ? '#c1121f'              : BASE_COLORS[b] + 'bb',
                        }}
                      >
                        {b}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Confirm mutation button */}
          {!strandConfirmed && (
            <>
              {p3Error && (
                <div className="ls-error terminal-text">⚠ STRAND MATCHES REFERENCE — CONTINUE ANALYSIS</div>
              )}
              <button
                className={`ls-submit terminal-text ${selectedStrand ? 'ls-submit--ready' : ''} ${p3Error ? 'ls-submit--error' : ''}`}
                disabled={!selectedStrand}
                onClick={confirmStrand}
              >
                [ CONFIRM MUTATION ]
              </button>
            </>
          )}

          {/* Cause selection */}
          {strandConfirmed && !solved && (
            <div className="ls-cause-section">
              <div className="ls-section-label terminal-text">SELECT RESPONSIBLE EXPERIMENT:</div>
              <div className="ls-cause-btns">
                {EXPERIMENTS.map(exp => (
                  <button
                    key={exp.id}
                    className="ls-cause-btn terminal-text"
                    onClick={() => confirmCause(exp.id)}
                  >
                    {exp.id}
                  </button>
                ))}
              </div>
              {p3Error && (
                <div className="ls-error terminal-text">⚠ NO CAUSAL LINK DETECTED — RECHECK EXPERIMENT LOG</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SOLVED
         ══════════════════════════════════════════════════════════════════════ */}
      {solved && (
        <div className="ls-body">
          <p className="terminal-text ls-solved__headline">✓ CONTAMINATION SOURCE IDENTIFIED</p>
          {showFrag && (
            <div className="ls-fragment">
              <p className="terminal-text ls-fragment__label">◈ MEMORY FRAGMENT 04 RECOVERED</p>
              <div className="ls-fragment__row">
                <span className="terminal-text terminal-text--dim">COMPOUND:&nbsp;</span>
                <span className="terminal-text ls-fragment__value">VITAGEN-7 (MUTATED)</span>
              </div>
              <div className="ls-fragment__row">
                <span className="terminal-text terminal-text--dim">MUTATION CAUSE:&nbsp;</span>
                <span className="terminal-text ls-fragment__value">EXPERIMENT SIGMA-4</span>
              </div>
              <div className="ls-fragment__row">
                <span className="terminal-text terminal-text--dim">ORIGIN LAB:&nbsp;</span>
                <span className="terminal-text ls-fragment__value">{ANSWER_CODE}</span>
              </div>
              <button className="ls-confirm terminal-text" onClick={() => onSolve?.(ANSWER_CODE)}>
                INTEGRATE FRAGMENT → CONTINUE
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
