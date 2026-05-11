import { useState } from 'react'
import './LifeSupportModule.css'
import HelpModal from '../../HelpModal/HelpModal'
import useIdleHelp from '../../../hooks/useIdleHelp'

// ── Constants ──────────────────────────────────────────────────────────────────
const NUM_COLS = 6
const CHAN_X   = [22, 54, 86, 118, 150, 182]   // shared 200-unit viewBox x positions
const MAX_VAL  = 4                              // highest target/result value across all rounds

// ── Puzzle data ────────────────────────────────────────────────────────────────
// Design principle for decoys:
//   Rounds 1 & 2 have a ZERO column in the target. Correct fragments never put
//   anything in that column. Every decoy has a conspicuous bar there — instantly
//   telling the player "this can't fit."
//   Round 3 has no zero column, so decoys use dramatically different bar
//   distributions (sparse alternating vs. the correct fragments' varied heights).

const ROUND_DATA = [
  {
    id: 1, label: 'COMPOUND IDENTIFICATION',
    // Target col 4 = 0.  Correct frags: col4=0.  Decoys: col4>0 (impossible to use).
    target:     [2, 4, 1, 3, 0, 2],
    slotsCount: 2,
    bankCount:  4,
    fragments: [
      { id:'r1-a', bars:[ 1, 2, 1, 2, 0, 1] },  // ✓  col4=0
      { id:'r1-b', bars:[ 1, 2, 0, 1, 0, 1] },  // ✓  col4=0
      // ── Decoys — all have a bar at col4 (target=0) ──
      { id:'r1-c', bars:[ 1, 2, 1, 2, 3, 1] },  // tall col4 bar
      { id:'r1-d', bars:[ 1, 2, 0, 1, 2, 1] },  // col4 bar
      { id:'r1-e', bars:[ 3, 0, 1, 0, 2, 3] },  // different heights + col4
      { id:'r1-f', bars:[ 0, 3, 0, 3, 1, 0] },  // concentrated + col4
      { id:'r1-g', bars:[ 2, 1, 2, 0, 3, 2] },  // tall col4
      { id:'r1-h', bars:[ 0, 2, 1, 1, 2, 2] },  // col4
      { id:'r1-i', bars:[ 2, 0, 2, 2, 1, 1] },  // col4
      { id:'r1-j', bars:[ 1, 1, 0, 3, 2, 0] },  // col4
    ],
  },
  {
    id: 2, label: 'CATALYST TRACE',
    // Target col 3 = 0.  Correct frags: col3=0.  Decoys: col3>0 (impossible).
    target:     [3, 1, 4, 0, 2, 3],
    slotsCount: 4,
    bankCount:  6,
    fragments: [
      { id:'r2-a', bars:[ 1, 0, 2, 0, 1, 1] },  // ✓  col3=0
      { id:'r2-b', bars:[ 1, 0, 1, 0, 0, 1] },  // ✓  col3=0
      { id:'r2-c', bars:[ 0, 1, 1, 0, 1, 0] },  // ✓  col3=0
      { id:'r2-d', bars:[ 1, 0, 0, 0, 0, 1] },  // ✓  col3=0  — all 4 sum to [3,1,4,0,2,3]; no subset of 2-3 matches
      // ── Decoys — all have a bar at col3 (target=0) ──
      { id:'r2-e', bars:[ 2, 0, 3, 3, 1, 2] },  // tall col3 bar
      { id:'r2-f', bars:[ 1, 1, 1, 2, 1, 1] },  // col3
      { id:'r2-g', bars:[-1, 0,-2, 1, 0,-1] },  // col3 (subtractive-looking)
      { id:'r2-h', bars:[ 2, 1, 2, 3, 0, 2] },  // tall col3
      { id:'r2-i', bars:[ 1, 0, 1, 2, 0, 1] },  // col3
      { id:'r2-j', bars:[-2, 0,-1, 2, 0,-2] },  // col3 (subtractive)
    ],
  },
  {
    id: 3, label: 'MUTATION MARKER',
    // No zero column — decoys use sparse/extreme distributions instead.
    target:     [2, 3, 1, 4, 2, 3],
    slotsCount: 6,
    bankCount: 10,
    fragments: [
      { id:'r3-a', bars:[ 1, 1, 1, 2, 1, 1] },  // ✓
      { id:'r3-b', bars:[ 1, 1, 0, 1, 1, 1] },  // ✓
      { id:'r3-c', bars:[ 2, 1, 1, 2, 1, 2] },  // ✓
      { id:'r3-d', bars:[-1, 1, 0, 0, 0, 0] },  // ✓  subtractive
      { id:'r3-e', bars:[ 0, 0, 0, 1, 0, 1] },  // ✓
      { id:'r3-f', bars:[-1,-1,-1,-2,-1,-2] },  // ✓  subtractive
      // ── Decoys — very different visual patterns ──
      { id:'r3-g', bars:[ 4, 0, 3, 0, 4, 0] },  // only even cols, max height
      { id:'r3-h', bars:[ 0, 4, 0, 4, 0, 4] },  // only odd cols, max height
      { id:'r3-i', bars:[ 3, 3, 3, 3, 3, 3] },  // all same, too tall
      { id:'r3-j', bars:[-3,-2, 0,-3,-2,-3] },  // all strongly subtractive
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
  const [showHelp, setShowHelp] = useIdleHelp(120_000)

  const [rounds] = useState(() =>
    ROUND_DATA.map(r => {
      const correct = r.fragments.slice(0, r.slotsCount)
      const decoys  = shuffle(r.fragments.slice(r.slotsCount))
                        .slice(0, r.bankCount - r.slotsCount)
      return { ...r, fragments: shuffle([...correct, ...decoys]) }
    })
  )

  const [roundIdx,    setRoundIdx]    = useState(0)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [error,       setError]       = useState(false)
  const [scanning,    setScanning]    = useState(false)   // blue scan sweep
  const [roundWin,    setRoundWin]    = useState(false)
  const [solved,      setSolved]      = useState(false)
  const [showFrag,    setShowFrag]    = useState(false)

  const round     = rounds[roundIdx]
  const result    = computeResult(selectedIds, round.fragments)
  const allFilled = selectedIds.size === round.slotsCount
  const isMatch   = allFilled && result.every((v, i) => v === round.target[i])

  // ── Toggle a fragment on/off ──────────────────────────────────────────────
  function toggleFrag(id) {
    if (scanning) return
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
    if (!allFilled || scanning) return
    if (isMatch) {
      // 1. Trigger blue scan sweep across the spectrograph
      setScanning(true)
      setTimeout(() => {
        setScanning(false)
        // 2. Show round-win flash
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
      }, 950)   // scan duration
    } else {
      setError(true)
      setTimeout(() => setError(false), 1600)
    }
  }

  // ── Dev skip ─────────────────────────────────────────────────────────────
  function devSkip() {
    if (solved || roundWin || scanning) return
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
    : scanning                ? '◈ SCANNING...'
    : `SCAN ${roundIdx + 1} / 3`

  return (
    <div className="ls-module">
      {showHelp && <HelpModal
        title="HOW TO PLAY — LIFE SUPPORT"
        steps={[
          'You are shown a TARGET pattern — a bar chart across 6 channels.',
          'Click fragments in the bank to add them to your selection. Their bar values stack together.',
          'Match the combined bars exactly to the target pattern, then submit.',
          'Complete all 3 rounds to restore life support systems.',
        ]}
        onClose={() => setShowHelp(false)}
      />}
      {!solved && <button className="dev-skip-btn" onClick={devSkip}>⚡ DEV</button>}

      {/* Header */}
      <div className="ls-header">
        <div className="pm-header-left">
          <button className="pm-back terminal-text" onClick={onBack}>← BACK</button>
          <button className="help-btn terminal-text" onClick={() => setShowHelp(true)}>[ ? ]</button>
        </div>
        <span className="pm-title terminal-text">MODULE 04 — LIFE SUPPORT</span>
        <span className={`ls-status terminal-text
          ${solved   ? 'ls-status--restored' : ''}
          ${roundWin ? 'ls-status--matched'  : ''}
          ${scanning ? 'ls-status--scanning' : ''}`}>
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

          {/* Spec strip + optional scan bar overlay */}
          <div className="ls-spec-label terminal-text terminal-text--dim">// SPECTRAL ANALYSIS</div>
          <div className="ls-spec-wrap">
            <SpecStrip target={round.target} result={result}/>
            {scanning && <div className="ls-scan-bar" key={roundIdx}/>}
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
                    ${!isSelected && atMax ? 'ls-frag-row--locked' : ''}
                    ${scanning ? 'ls-frag-row--scanning' : ''}`}
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
            className={`ls-submit terminal-text
              ${allFilled && !scanning ? 'ls-submit--ready' : ''}
              ${error ? 'ls-submit--error' : ''}
              ${scanning ? 'ls-submit--scanning' : ''}`}
            disabled={!allFilled || scanning}
            onClick={handleSubmit}>
            {scanning ? '[ ANALYZING... ]' : '[ SUBMIT SPECTRAL ANALYSIS ]'}
          </button>

          {/* ── Crew log — one entry at a time, most recent wins ── */}
          <div className="crew-log-strip">
            {roundIdx >= 1 ? (
              <div key="day25" className="crew-log-entry">
                <div className="crew-log-meta">
                  <span className="terminal-text crew-log-who">◈ LOG — KOWALSKI</span>
                  <span className="terminal-text crew-log-day">MISSION DAY 25</span>
                </div>
                <p className="terminal-text crew-log-text">Hayes is gone. Chen is not responding. The Prometheus team triggered this. I know it. I cannot prove it.</p>
              </div>
            ) : (
              <div key="day24" className="crew-log-entry">
                <div className="crew-log-meta">
                  <span className="terminal-text crew-log-who">◈ LOG — KOWALSKI</span>
                  <span className="terminal-text crew-log-day">MISSION DAY 24</span>
                </div>
                <p className="terminal-text crew-log-text">Vitagen-7 mutation rate has exceeded all projections. The compound is no longer stable. I should report this. I am not sure I should.</p>
              </div>
            )}
          </div>
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
            <div className="crew-log-strip" style={{marginTop: '6px'}}>
              <div className="crew-log-entry crew-log-entry--prometheus">
                <div className="crew-log-meta">
                  <span className="terminal-text crew-log-who crew-log-who--prometheus">◈ LOG — KOWALSKI — FINAL</span>
                  <span className="terminal-text crew-log-day crew-log-day--prometheus">DAY 25</span>
                </div>
                <p className="terminal-text crew-log-text crew-log-text--prometheus">I am sealing LAB-07. Vitagen-7 was designed to preserve consciousness. It worked in trials. Four instances. The ship will remember us. — K</p>
              </div>
            </div>
        </div>
      )}
    </div>
  )
}
