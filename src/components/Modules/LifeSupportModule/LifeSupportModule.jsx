import { useState, useRef } from 'react'
import './LifeSupportModule.css'

// ── Constants ──────────────────────────────────────────────────────────────────
const NUM_COLS = 6
const MAX_VAL  = 5

// Channel x-positions in the shared 200-unit viewBox
// Used by BOTH SpecStrip and FragStrip so bars align at the same horizontal positions
const CHAN_X = [22, 54, 86, 118, 150, 182]

// ── Puzzle data ────────────────────────────────────────────────────────────────
// Math verified: summing correct bars equals target exactly.
// r1-a + r1-b = [2,4,1,3,0,2] ✓
// r2-a+b+c+d  = [3,1,4,0,2,3] ✓  (d is subtractive)
// r3-a…f      = [2,3,1,4,2,3] ✓  (d,f subtractive)
const ROUND_DATA = [
  {
    id: 1, label: 'COMPOUND IDENTIFICATION',
    target:     [2, 4, 1, 3, 0, 2],
    slotsCount: 2,
    fragments: [
      { id:'r1-a', bars:[ 1, 2, 1, 2, 0, 1] },  // ✓ correct
      { id:'r1-b', bars:[ 1, 2, 0, 1, 0, 1] },  // ✓ correct
      { id:'r1-c', bars:[ 2, 2, 1, 2, 0, 1] },
      { id:'r1-d', bars:[ 1, 3, 0, 1, 0, 1] },
      { id:'r1-e', bars:[ 1, 2, 0, 2, 0, 2] },
      { id:'r1-f', bars:[ 0, 1, 1, 1, 0, 1] },
      { id:'r1-g', bars:[-1, 1, 0, 0, 0, 0] },
      { id:'r1-h', bars:[ 2, 3, 1, 2, 0, 1] },
      { id:'r1-i', bars:[ 1, 1, 1, 2, 0, 1] },
      { id:'r1-j', bars:[ 1, 2, 1, 1, 0, 0] },
    ],
  },
  {
    id: 2, label: 'CATALYST TRACE',
    target:     [3, 1, 4, 0, 2, 3],
    slotsCount: 4,
    fragments: [
      { id:'r2-a', bars:[ 2, 0, 2, 0, 1, 2] },  // ✓
      { id:'r2-b', bars:[ 1, 0, 1, 0, 1, 1] },  // ✓
      { id:'r2-c', bars:[ 1, 1, 2, 0, 1, 1] },  // ✓
      { id:'r2-d', bars:[-1, 0,-1, 0,-1,-1] },  // ✓ subtractive
      { id:'r2-e', bars:[ 2, 0, 3, 0, 1, 2] },
      { id:'r2-f', bars:[ 1, 1, 1, 0, 1, 1] },
      { id:'r2-g', bars:[-1, 0,-2, 0,-1,-1] },
      { id:'r2-h', bars:[ 2, 1, 2, 0, 1, 2] },
      { id:'r2-i', bars:[ 1, 0, 1, 0, 0, 1] },
      { id:'r2-j', bars:[-2, 0,-1, 0,-1,-2] },
    ],
  },
  {
    id: 3, label: 'MUTATION MARKER',
    target:     [2, 3, 1, 4, 2, 3],
    slotsCount: 6,
    fragments: [
      { id:'r3-a', bars:[ 1, 1, 1, 2, 1, 1] },  // ✓
      { id:'r3-b', bars:[ 1, 1, 0, 1, 1, 1] },  // ✓
      { id:'r3-c', bars:[ 2, 1, 1, 2, 1, 2] },  // ✓
      { id:'r3-d', bars:[-1, 1, 0, 0, 0, 0] },  // ✓ subtractive
      { id:'r3-e', bars:[ 0, 0, 0, 1, 0, 1] },  // ✓
      { id:'r3-f', bars:[-1,-1,-1,-2,-1,-2] },  // ✓ subtractive
      { id:'r3-g', bars:[ 2, 1, 1, 2, 1, 1] },
      { id:'r3-h', bars:[-1,-1, 0,-1, 0,-1] },
      { id:'r3-i', bars:[ 1, 2, 1, 2, 1, 2] },
      { id:'r3-j', bars:[ 0, 1, 0, 1, 1, 1] },
    ],
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function computeResult(placements, frags) {
  const result = Array(NUM_COLS).fill(0)
  placements.forEach(id => {
    if (!id) return
    const f = frags.find(x => x.id === id)
    if (f) f.bars.forEach((v, i) => { result[i] += v })
  })
  return result
}

// ── Spectral line strip ────────────────────────────────────────────────────────
// Single combined strip: result overlaid on target reference.
//   result[i] === target[i] > 0  →  white  (match)
//   result[i] ≠ target[i] && result[i] ≠ 0  →  red   (wrong / bad combo)
//   target[i] > 0 && result[i] === 0  →  very dim white  (target not yet covered)
//   both 0  →  nothing (black section in rainbow)
function SpecStrip({ target, result }) {
  const vw = 200, vh = 50
  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} width="100%" height="100%" preserveAspectRatio="none">
      {CHAN_X.map((x, i) => {
        const matched = result[i] !== 0 && result[i] === target[i]
        const wrong   = result[i] !== 0 && result[i] !== target[i]
        const pending = target[i] > 0   && result[i] === 0

        if (matched) return <rect key={i} x={x-4} y={0} width={8} height={vh} fill="white"/>
        if (wrong)   return <rect key={i} x={x-4} y={0} width={8} height={vh} fill="#c1121f"/>
        if (pending) return <rect key={i} x={x-4} y={0} width={8} height={vh} fill="rgba(255,255,255,0.12)"/>
        return null
      })}
    </svg>
  )
}

// ── Fragment mini strip ────────────────────────────────────────────────────────
// Uses the SAME 200-unit viewBox and CHAN_X positions as SpecStrip so bars
// align directly when both containers share the same rendered width.
// Additive    : narrow white bar
// Subtractive : hollow red outline + diagonal slash
function FragStrip({ bars }) {
  const vw = 200, vh = 38
  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} width="100%" height="100%" preserveAspectRatio="none">
      {bars.map((v, i) => {
        if (v === 0) return null
        const x = CHAN_X[i]
        if (v < 0) {
          const rx = x - 4, ry = 2, rw = 8, rh = vh - 4
          return (
            <g key={i}>
              <rect x={rx} y={ry} width={rw} height={rh}
                fill="none" stroke="#c1121f" strokeWidth="1.2"/>
              <line x1={rx} y1={ry + rh} x2={rx + rw} y2={ry}
                stroke="#c1121f" strokeWidth="1.2"/>
            </g>
          )
        }
        return <rect key={i} x={x - 4} y={0} width={8} height={vh} fill="white"/>
      })}
    </svg>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function LifeSupportModule({ onSolve, onBack }) {
  const [rounds]  = useState(() =>
    ROUND_DATA.map(r => ({ ...r, fragments: shuffle([...r.fragments]) }))
  )
  const [roundIdx,    setRoundIdx]    = useState(0)
  const [placements,  setPlacements]  = useState(Array(ROUND_DATA[0].slotsCount).fill(null))
  const [selected,    setSelected]    = useState(null)
  const [error,       setError]       = useState(false)
  const [roundWin,    setRoundWin]    = useState(false)
  const [solved,      setSolved]      = useState(false)
  const [showFrag,    setShowFrag]    = useState(false)
  const dragRef = useRef(null)

  const round    = rounds[roundIdx]
  const placedSet = new Set(placements.filter(Boolean))
  const bankFrags = round.fragments.filter(f => !placedSet.has(f.id) && f.id !== selected)
  const result    = computeResult(placements, round.fragments)
  const allFilled = placements.every(p => p !== null)
  const isMatch   = allFilled && result.every((v, i) => v === round.target[i])

  // ── Click: select from bank ──────────────────────────────────────────────
  function clickFrag(fragId) {
    setSelected(prev => prev === fragId ? null : fragId)
  }

  // ── Click: slot ─────────────────────────────────────────────────────────
  function clickSlot(slotIdx) {
    if (selected) {
      setPlacements(prev => {
        const n = [...prev]
        const from = n.indexOf(selected)
        if (from !== -1) n[from] = null
        n[slotIdx] = selected
        return n
      })
      setSelected(null)
    } else if (placements[slotIdx]) {
      setSelected(placements[slotIdx])
      setPlacements(prev => { const n = [...prev]; n[slotIdx] = null; return n })
    }
  }

  // ── Drag ─────────────────────────────────────────────────────────────────
  function onDragStart(e, fragId, slotIdx = null) {
    dragRef.current = { fragId, slotIdx }
    e.dataTransfer.effectAllowed = 'move'
  }
  function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }
  function onDropSlot(e, targetIdx) {
    e.preventDefault()
    if (!dragRef.current) return
    const { fragId, slotIdx: src } = dragRef.current
    setPlacements(prev => {
      const n = [...prev]
      if (src !== null) n[src] = null
      n[targetIdx] = fragId
      return n
    })
    setSelected(null); dragRef.current = null
  }
  function onDropBank(e) {
    e.preventDefault()
    if (!dragRef.current) return
    const { fragId, slotIdx: src } = dragRef.current
    if (src !== null) {
      setPlacements(prev => { const n = [...prev]; n[src] = null; return n })
    }
    setSelected(null); dragRef.current = null
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  function handleSubmit() {
    if (!allFilled) return
    if (isMatch) {
      setRoundWin(true)
      setTimeout(() => {
        setRoundWin(false)
        const next = roundIdx + 1
        if (next < ROUND_DATA.length) {
          setRoundIdx(next)
          setPlacements(Array(ROUND_DATA[next].slotsCount).fill(null))
          setSelected(null); setError(false)
        } else {
          setSolved(true)
          setTimeout(() => setShowFrag(true), 800)
        }
      }, 1400)
    } else {
      setError(true)
      setTimeout(() => setError(false), 1600)
    }
  }

  // ── Dev skip ─────────────────────────────────────────────────────────────
  function devSkip() {
    if (solved || roundWin) return
    const next = roundIdx + 1
    if (next < ROUND_DATA.length) {
      setRoundIdx(next)
      setPlacements(Array(ROUND_DATA[next].slotsCount).fill(null))
      setSelected(null); setError(false)
    } else {
      setSolved(true)
      setTimeout(() => setShowFrag(true), 300)
    }
  }

  const statusText = solved ? '✓ ANALYSIS COMPLETE'
    : roundWin ? '✓ PATTERN MATCHED'
    : `SCAN ${roundIdx + 1} / 3`

  return (
    <div className="ls-module">
      {!solved && <button className="dev-skip-btn" onClick={devSkip}>⚡ DEV</button>}

      {/* Header */}
      <div className="ls-header">
        <button className="pm-back terminal-text" onClick={onBack}>← BACK</button>
        <span className="pm-title terminal-text">MODULE 04 — LIFE SUPPORT</span>
        <span className={`ls-status terminal-text ${solved ? 'ls-status--restored' : roundWin ? 'ls-status--matched' : ''}`}>
          {statusText}
        </span>
      </div>

      {/* Round pips */}
      {!solved && (
        <div className="ls-round-bar">
          {ROUND_DATA.map((r, i) => (
            <div key={r.id} className={`ls-round-pip terminal-text
              ${i < roundIdx ? 'ls-round-pip--done' : ''}
              ${i === roundIdx ? 'ls-round-pip--active' : ''}`}>
              {i < roundIdx ? '✓' : i + 1}
            </div>
          ))}
          <span className="terminal-text terminal-text--dim ls-round-label">
            — {round.label}
          </span>
          <span className="terminal-text terminal-text--dim ls-round-req">
            {round.slotsCount} FRAGS
          </span>
        </div>
      )}

      {/* ── Active puzzle ── */}
      {!solved && !roundWin && (
        <div className="ls-body">

          {/* Single spectrum strip: result overlaid on target */}
          <div className="ls-spec-label terminal-text terminal-text--dim">// SPECTRAL ANALYSIS</div>
          <div className="ls-spec-wrap">
            <SpecStrip target={round.target} result={result}/>
          </div>

          {/* Slots — full-width rows so bars align with the strip above */}
          <div className="ls-section-label terminal-text">
            ACTIVE SLOTS — {placements.filter(Boolean).length}/{round.slotsCount} PLACED:
          </div>
          <div className="ls-slots">
            {placements.map((fragId, si) => {
              const f = fragId ? round.fragments.find(x => x.id === fragId) : null
              return (
                <div key={si}
                  className={`ls-slot ls-slot--row ${f ? 'ls-slot--filled' : ''} ${selected && !f ? 'ls-slot--target' : ''}`}
                  onClick={() => clickSlot(si)}
                  onDragOver={onDragOver}
                  onDrop={e => onDropSlot(e, si)}
                >
                  <span className="ls-slot-num terminal-text terminal-text--dim">{si + 1}</span>
                  {f
                    ? <div className="ls-slot-frag"
                        draggable
                        onDragStart={e => { e.stopPropagation(); onDragStart(e, f.id, si) }}
                        onClick={e => { e.stopPropagation(); clickSlot(si) }}>
                        <FragStrip bars={f.bars}/>
                        {f.bars.some(v => v < 0) && <span className="ls-frag-tag">SUB</span>}
                      </div>
                    : null
                  }
                </div>
              )
            })}
          </div>

          {/* Bank */}
          <div className="ls-bank-header terminal-text terminal-text--dim">
            FRAGMENT BANK — {bankFrags.length + (selected ? 1 : 0)} AVAILABLE:
          </div>
          <div className="ls-bank" onDragOver={onDragOver} onDrop={onDropBank}>
            {/* Selected frag shown in bank highlighted */}
            {selected && (() => {
              const f = round.fragments.find(x => x.id === selected)
              return (
                <div key={f.id} className="ls-frag ls-frag--selected"
                  draggable
                  onDragStart={e => onDragStart(e, f.id)}
                  onClick={() => setSelected(null)}>
                  <FragStrip bars={f.bars}/>
                  {f.bars.some(v => v < 0) && <span className="ls-frag-tag">SUB</span>}
                </div>
              )
            })()}
            {bankFrags.map(f => (
              <div key={f.id} className="ls-frag"
                draggable
                onDragStart={e => onDragStart(e, f.id)}
                onClick={() => clickFrag(f.id)}>
                <FragStrip bars={f.bars}/>
                {f.bars.some(v => v < 0) && <span className="ls-frag-tag">SUB</span>}
              </div>
            ))}
          </div>

          {error && (
            <div className="ls-error terminal-text">⚠ SPECTRUM MISMATCH — ADJUST FRAGMENT SELECTION</div>
          )}

          <button
            className={`ls-submit terminal-text ${allFilled ? 'ls-submit--ready' : ''} ${error ? 'ls-submit--error' : ''}`}
            disabled={!allFilled}
            onClick={handleSubmit}>
            [ SUBMIT SPECTRAL ANALYSIS ]
          </button>
        </div>
      )}

      {/* ── Round win flash ── */}
      {roundWin && (
        <div className="ls-body ls-win-body">
          <div className="terminal-text ls-win-text">✓ PATTERN MATCH CONFIRMED</div>
          <div className="terminal-text terminal-text--dim ls-win-sub">
            ADVANCING TO SCAN {roundIdx + 2}...
          </div>
        </div>
      )}

      {/* ── Solved ── */}
      {solved && (
        <div className="ls-body">
          <p className="terminal-text ls-solved__headline">✓ VITAGEN-7 MUTATION SEQUENCE IDENTIFIED</p>
          {showFrag && (
            <div className="ls-fragment">
              <p className="terminal-text ls-fragment__label">◈ MEMORY FRAGMENT 04 RECOVERED</p>
              <div className="ls-fragment__row">
                <span className="terminal-text terminal-text--dim">COMPOUND:&nbsp;</span>
                <span className="terminal-text ls-fragment__value">VITAGEN-7 (MUTATED)</span>
              </div>
              <div className="ls-fragment__row">
                <span className="terminal-text terminal-text--dim">SCANS COMPLETED:&nbsp;</span>
                <span className="terminal-text ls-fragment__value">3 / 3</span>
              </div>
              <div className="ls-fragment__row">
                <span className="terminal-text terminal-text--dim">ORIGIN LAB:&nbsp;</span>
                <span className="terminal-text ls-fragment__value">LAB-07</span>
              </div>
              <button className="ls-confirm terminal-text" onClick={() => onSolve?.('LAB-07')}>
                INTEGRATE FRAGMENT → CONTINUE
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
