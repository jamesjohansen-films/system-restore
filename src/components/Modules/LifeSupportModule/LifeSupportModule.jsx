import { useState } from 'react'
import './LifeSupportModule.css'

// ── Constants ──────────────────────────────────────────────────────────────────
const NUM_COLS = 6
const CHAN_X   = [22, 54, 86, 118, 150, 182]   // shared 200-unit viewBox x positions
const MAX_VAL  = 4                              // highest target/result value across all rounds

// ── Puzzle data ────────────────────────────────────────────────────────────────
const ROUND_DATA = [
  {
    id: 1, label: 'COMPOUND IDENTIFICATION',
    target:     [2, 4, 1, 3, 0, 2],
    slotsCount: 2,
    bankCount:  4,
    fragments: [
      { id:'r1-a', bars:[ 1, 2, 1, 2, 0, 1] },  // ✓
      { id:'r1-b', bars:[ 1, 2, 0, 1, 0, 1] },  // ✓
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
    bankCount:  6,
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
    bankCount: 10,
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

function computeResult(selectedIds, frags) {
  const result = Array(NUM_COLS).fill(0)
  selectedIds.forEach(id => {
    const f = frags.find(x => x.id === id)
    if (f) f.bars.forEach((v, i) => { result[i] += v })
  })
  return result
}

// ── Spectral strip — bars grow from the bottom; height = value / MAX_VAL ───────
//   pending  → dim ghost bar at target height (shows the goal)
//   matched  → bright white bar, exactly target height ✓
//   wrong    → red bar at result height + white target marker line
function SpecStrip({ target, result }) {
  const vw = 200, vh = 44
  const BW = 12   // bar width in viewBox units

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} width="100%" height="100%" preserveAspectRatio="none">
      {CHAN_X.map((x, i) => {
        const tgt = target[i]
        const res = result[i]
        if (tgt === 0 && res === 0) return null

        const matched = res === tgt && tgt !== 0
        const tgtH   = tgt > 0 ? (tgt / MAX_VAL) * vh : 0
        const resH   = res !== 0 ? (Math.min(Math.abs(res), MAX_VAL) / MAX_VAL) * vh : 0

        return (
          <g key={i}>
            {/* Ghost: empty target column when nothing selected yet */}
            {tgt > 0 && res === 0 && (
              <rect x={x - BW/2} y={vh - tgtH} width={BW} height={tgtH}
                fill="rgba(255,255,255,0.07)"
                stroke="rgba(255,255,255,0.18)" strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"/>
            )}
            {/* Result bar: white if matched, red if not */}
            {res !== 0 && (
              <rect x={x - BW/2} y={vh - resH} width={BW} height={resH}
                fill={matched ? 'rgba(255,255,255,0.88)' : 'rgba(193,18,31,0.78)'}/>
            )}
            {/* Target marker line — visible when result is wrong so player sees the goal */}
            {tgt > 0 && !matched && (
              <line
                x1={x - BW/2 - 1} y1={vh - tgtH}
                x2={x + BW/2 + 1} y2={vh - tgtH}
                stroke="rgba(255,255,255,0.6)" strokeWidth="1"
                vectorEffect="non-scaling-stroke"/>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── Fragment strip — bar height shows magnitude; value labels at bottom ────────
//   positive → white bar growing from bottom
//   negative → red bar hanging from top (subtractive contribution)
function FragStrip({ bars }) {
  const vw = 200, vh = 28
  const BW = 12

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} width="100%" height="100%" preserveAspectRatio="none">
      {bars.map((v, i) => {
        if (v === 0) return null
        const x   = CHAN_X[i]
        const h   = (Math.abs(v) / MAX_VAL) * vh
        const neg = v < 0
        return (
          <rect key={i}
            x={x - BW/2} y={neg ? 0 : vh - h}
            width={BW} height={h}
            fill={neg ? 'rgba(193,18,31,0.65)' : 'rgba(255,255,255,0.78)'}/>
        )
      })}
    </svg>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function LifeSupportModule({ onSolve, onBack }) {
  const [rounds] = useState(() =>
    ROUND_DATA.map(r => {
      const correct = r.fragments.slice(0, r.slotsCount)
      const decoys  = shuffle(r.fragments.slice(r.slotsCount))
                        .slice(0, r.bankCount - r.slotsCount)
      return { ...r, fragments: shuffle([...correct, ...decoys]) }
    })
  )

  const [roundIdx,   setRoundIdx]   = useState(0)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [error,      setError]      = useState(false)
  const [roundWin,   setRoundWin]   = useState(false)
  const [solved,     setSolved]     = useState(false)
  const [showFrag,   setShowFrag]   = useState(false)

  const round     = rounds[roundIdx]
  const result    = computeResult(selectedIds, round.fragments)
  const allFilled = selectedIds.size === round.slotsCount
  const isMatch   = allFilled && result.every((v, i) => v === round.target[i])

  // ── Toggle a fragment on/off ──────────────────────────────────────────────
  function toggleFrag(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < round.slotsCount) {
        next.add(id)
      }
      return next
    })
    setError(false)
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
          setSelectedIds(new Set())
          setError(false)
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
      setSelectedIds(new Set())
      setError(false)
    } else {
      setSolved(true)
      setTimeout(() => setShowFrag(true), 300)
    }
  }

  const statusText = solved   ? '✓ ANALYSIS COMPLETE'
    : roundWin                ? '✓ PATTERN MATCHED'
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

          {/* Spec strip */}
          <div className="ls-spec-label terminal-text terminal-text--dim">// SPECTRAL ANALYSIS</div>
          <div className="ls-spec-wrap">
            <SpecStrip target={round.target} result={result}/>
          </div>

          {/* Fragment list — all stacked, click to select */}
          <div className="ls-section-label terminal-text">
            SELECT {selectedIds.size} / {round.slotsCount} SAMPLES:
          </div>
          <div className="ls-frag-list">
            {round.fragments.map((f, idx) => {
              const isSelected = selectedIds.has(f.id)
              const atMax      = selectedIds.size >= round.slotsCount
              const isSub      = f.bars.some(v => v < 0)
              return (
                <div
                  key={f.id}
                  className={`ls-frag-row
                    ${isSelected ? 'ls-frag-row--selected' : ''}
                    ${!isSelected && atMax ? 'ls-frag-row--locked' : ''}`}
                  onClick={() => toggleFrag(f.id)}
                >
                  <span className="ls-frag-idx terminal-text">{idx + 1}</span>
                  <div className="ls-frag-inner">
                    <FragStrip bars={f.bars}/>
                  </div>
                  {isSub && <span className="ls-frag-tag">SUB</span>}
                  {isSelected && <span className="ls-frag-check">✓</span>}
                </div>
              )
            })}
          </div>

          {error && (
            <div className="ls-error terminal-text">⚠ SPECTRUM MISMATCH — ADJUST SELECTION</div>
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
