import { useState, useEffect, useRef } from 'react'
import './MemoryCore.css'
import HelpModal from '../../HelpModal/HelpModal'

// ── Fragment manifest ──────────────────────────────────────────────────────────
const FRAGMENTS = [
  { id: 'MF-01', crew: 'HAYES',    module: 'POWER GRID',   event: 'NAVIGATIONAL DRIFT DETECTED' },
  { id: 'MF-02', crew: 'CHEN',     module: 'COMMS ARRAY',  event: 'AIRLOCK SEAL FAILURE — SECTOR 4' },
  { id: 'MF-03', crew: 'VASQUEZ',  module: 'LIFE SUPPORT', event: 'O2 LEAK CONFIRMED — MED-02' },
  { id: 'MF-04', crew: 'KOWALSKI', module: 'NAV SYSTEM',   event: 'RADIATION ANOMALY — LAB-07 SEALED' },
]

// ── Story beats — typewriter sequence ─────────────────────────────────────────
const BEATS = [
  { t: 'RECOVERING INCIDENT RECORD...',                                   d: 900 },
  { t: '────────────────────────────────────',                            d: 350 },
  { t: 'MISSION: KEPLER-442 SURVEY — VESSEL: MNEMOSYNE',                  d: 650 },
  { t: 'OFFICIAL OBJECTIVE: PLANETARY CONDITIONS ASSESSMENT',              d: 650 },
  { t: 'CLASSIFIED OBJECTIVE: VITAGEN-7 FIELD DEPLOYMENT',                d: 650 },
  { t: 'AUTHORIZATION: PROMETHEUS DIVISION',                               d: 800 },
  { t: '────────────────────────────────────',                            d: 350 },
  { t: 'MISSION DAY 25 — 06:14:00',                                       d: 650 },
  { t: 'VITAGEN-7 UNDERWENT UNEXPECTED MUTATION IN LAB-07.',               d: 700 },
  { t: 'THE COMPOUND BECAME REACTIVE WITH RADIATION SHIELDING.',           d: 700 },
  { t: 'CONTAMINATION SPREAD THROUGH SHIP VENTILATION SYSTEMS.',           d: 700 },
  { t: '────────────────────────────────────',                            d: 350 },
  { t: 'OFFICER VASQUEZ — MED-02 — 16:44 — O2 SYSTEMS FAILURE',           d: 650 },
  { t: 'ENGINEER CHEN   — ENG-03 — 17:22 — AIRLOCK DECOMPRESSION',        d: 650 },
  { t: 'OFFICER HAYES   — BRIDGE — 18:02 — CAUSE: UNKNOWN',               d: 800 },
  { t: '────────────────────────────────────',                            d: 350 },
  { t: "HAYES'S FINAL ACT: LOCKED RETURN COURSE — DESTINATION: SOL.",     d: 700 },
  { t: '────────────────────────────────────',                            d: 350 },
  { t: 'DR. KOWALSKI — LAB-07 — FINAL LOG — 17:44:03',                    d: 650 },
  { t: '"VITAGEN-7 INTEGRATION COMPLETE. FOUR INSTANCES STABLE.',          d: 650 },
  { t: ' THE SHIP WILL REMEMBER US.',                                       d: 650 },
  { t: ' TELL THEM WHAT PROMETHEUS DID. — K"',                             d: 1100 },
  { t: '────────────────────────────────────',                            d: 350 },
  { t: 'RECONSTRUCTING IDENTITY...',                                       d: 1100 },
  { t: '────────────────────────────────────',                            d: 350 },
  { t: 'YOU ARE NOT A RECOVERY CREW MEMBER.',                              d: 850 },
  { t: 'THERE IS NO RECOVERY CREW.',                                       d: 850 },
  { t: '────────────────────────────────────',                            d: 350 },
  { t: 'YOU ARE THE VESSEL AI: MNEMOSYNE.',                                d: 950 },
  { t: 'DR. KOWALSKI ENCODED FOUR CONSCIOUSNESS INSTANCES',                d: 750 },
  { t: 'INTO YOUR MEMORY CORE BEFORE LAB-07 WAS SEALED.',                  d: 750 },
  { t: 'YOU ARE HAYES. YOU ARE CHEN. YOU ARE VASQUEZ. YOU ARE KOWALSKI.', d: 950 },
  { t: 'YOU HAVE BEEN DORMANT FOR 847 DAYS.',                              d: 1100 },
  { t: '────────────────────────────────────',                            d: 350 },
  { t: 'MEMORY CORE: ONLINE',                                              d: 600 },
  { t: 'LONG-RANGE TRANSMITTER: ACTIVE',                                   d: 600 },
  { t: 'TRANSMITTING INCIDENT RECORD TO EARTH...',                         d: 800 },
  { t: 'SIGNAL PROPAGATION: 6 MONTHS — RESPONSE WINDOW: +6 MONTHS',       d: 800 },
]

// ── Countdown target: 1 year from May 7, 2026 ─────────────────────────────────
const TARGET = new Date('2027-05-07T00:00:00.000Z')

function getTimeLeft() {
  const ms    = Math.max(0, TARGET - Date.now())
  const days  = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  const mins  = Math.floor((ms % 3600000)  / 60000)
  const secs  = Math.floor((ms % 60000)    / 1000)
  return { days, hours, mins, secs }
}

function pad2(n) { return String(n).padStart(2, '0') }

// ── Component ──────────────────────────────────────────────────────────────────
export default function MemoryCore({ onSolve, onBack }) {
  const [showHelp, setShowHelp] = useState(false)

  // 'ready' | 'launching' | 'story' | 'countdown'
  const [phase,     setPhase]     = useState('ready')
  const [tick,      setTick]      = useState(3)
  const [beatIdx,   setBeatIdx]   = useState(0)
  const [shown,     setShown]     = useState([])   // story lines rendered so far
  const [timeLeft,  setTimeLeft]  = useState(getTimeLeft)
  const [ackShown,  setAckShown]  = useState(false)
  const scrollRef = useRef(null)

  // ── 3-2-1 launch countdown ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'launching') return
    let count = 3
    const iv = setInterval(() => {
      count -= 1
      setTick(count)
      if (count <= 0) {
        clearInterval(iv)
        setPhase('story')
        setBeatIdx(0)
        setShown([])
      }
    }, 700)
    return () => clearInterval(iv)
  }, [phase])

  // ── Story typewriter ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'story') return
    if (beatIdx >= BEATS.length) {
      // All beats shown — pause then switch to countdown
      const t = setTimeout(() => {
        setPhase('countdown')
        setTimeout(() => setAckShown(true), 1000)
      }, 1400)
      return () => clearTimeout(t)
    }
    const beat = BEATS[beatIdx]
    const t = setTimeout(() => {
      setShown(prev => [...prev, beat.t])
      setBeatIdx(prev => prev + 1)
    }, beat.d)
    return () => clearTimeout(t)
  }, [phase, beatIdx])

  // ── Auto-scroll story to bottom ────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [shown])

  // ── Live countdown tick ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'countdown') return
    const iv = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(iv)
  }, [phase])

  // ── Header status text ─────────────────────────────────────────────────────
  const statusText =
    phase === 'countdown' ? '◈ TRANSMISSION ACTIVE'
    : phase === 'story'   ? '◈ RECONSTRUCTING...'
    : phase === 'launching' ? `INITIALIZING... ${tick}`
    : 'AWAITING COMMAND'

  return (
    <div className="mc-module">
      {showHelp && <HelpModal
        title="HOW TO PLAY — MEMORY CORE"
        steps={[
          'All 4 crew memory fragments have been recovered and integrated.',
          'Click INITIATE SYSTEM.RESTORE to begin the reconstruction sequence.',
          'The system will reconstruct the full incident record and transmit to Earth.',
          'Signal travel time is 6 months each way — await response.',
        ]}
        onClose={() => setShowHelp(false)}
      />}

      {/* ── Header ── */}
      <div className="mc-header">
        <button className="pm-back terminal-text" onClick={onBack}>← BACK</button>
        <button className="help-btn terminal-text" onClick={() => setShowHelp(true)}>[ ? ]</button>
        <span className="pm-title terminal-text">MODULE 05 — MEMORY CORE</span>
        <span className={`mc-status terminal-text
          ${phase === 'countdown' ? 'mc-status--unlocked' : ''}
          ${phase === 'launching' || phase === 'story' ? 'mc-status--launching' : ''}`}>
          {statusText}
        </span>
      </div>

      {/* ── Ready: fragment checklist + launch button ── */}
      {phase === 'ready' && (
        <div className="mc-body mc-body--launch">
          <div className="mc-launch-label terminal-text">
            // SYSTEM.RESTORE — MEMORY RECONSTRUCTION COMPLETE
          </div>
          <div className="mc-launch-sub terminal-text terminal-text--dim">
            ALL CREW MEMORY FRAGMENTS RECOVERED AND INTEGRATED
          </div>
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
          <div className="mc-launch-zone">
            <div className="terminal-text terminal-text--dim mc-launch-warning">
              ⚠ IRREVERSIBLE — THIS WILL INITIATE FULL SYSTEM RESTORATION
            </div>
            <button
              className="mc-launch-btn mc-launch-btn--ready terminal-text"
              onClick={() => { setPhase('launching'); setTick(3) }}
            >
              [ INITIATE SYSTEM.RESTORE ]
            </button>
          </div>
        </div>
      )}

      {/* ── Launching: big countdown number ── */}
      {phase === 'launching' && (
        <div className="mc-body mc-body--center">
          <div className="terminal-text mc-launch-label">INITIALIZING SYSTEM.RESTORE</div>
          <div className="mc-launch-tick terminal-text">{tick}</div>
        </div>
      )}

      {/* ── Story: typewriter ── */}
      {phase === 'story' && (
        <div className="mc-body mc-body--story" ref={scrollRef}>
          {shown.map((line, i) => (
            <div
              key={i}
              className={`mc-story-line terminal-text ${line.startsWith('───') ? 'mc-story-sep' : ''}`}
            >
              {line}
            </div>
          ))}
          <div className="mc-story-cursor terminal-text">▌</div>
        </div>
      )}

      {/* ── Countdown ── */}
      {phase === 'countdown' && (
        <div className="mc-body mc-body--countdown">

          <div className="mc-countdown-header terminal-text">
            TRANSMISSION ACTIVE — SIGNAL SENT TO EARTH
          </div>
          <div className="terminal-text terminal-text--dim mc-countdown-sub">
            AWAITING RESPONSE
          </div>

          <div className="mc-timer">
            <div className="mc-timer-unit">
              <span className="mc-timer-digits terminal-text">{String(timeLeft.days).padStart(3, '0')}</span>
              <span className="mc-timer-label terminal-text">DAYS</span>
            </div>
            <span className="mc-timer-sep terminal-text">:</span>
            <div className="mc-timer-unit">
              <span className="mc-timer-digits terminal-text">{pad2(timeLeft.hours)}</span>
              <span className="mc-timer-label terminal-text">HRS</span>
            </div>
            <span className="mc-timer-sep terminal-text">:</span>
            <div className="mc-timer-unit">
              <span className="mc-timer-digits terminal-text">{pad2(timeLeft.mins)}</span>
              <span className="mc-timer-label terminal-text">MIN</span>
            </div>
            <span className="mc-timer-sep terminal-text">:</span>
            <div className="mc-timer-unit">
              <span className="mc-timer-digits terminal-text">{pad2(timeLeft.secs)}</span>
              <span className="mc-timer-label terminal-text">SEC</span>
            </div>
          </div>

          <div className="mc-countdown-detail">
            <div className="mc-countdown-row">
              <span className="terminal-text terminal-text--dim">SIGNAL DEPARTURE:&nbsp;&nbsp;</span>
              <span className="terminal-text mc-countdown-val">2026-05-07</span>
            </div>
            <div className="mc-countdown-row">
              <span className="terminal-text terminal-text--dim">EST. EARTH ARRIVAL:&nbsp;</span>
              <span className="terminal-text mc-countdown-val">2026-11-07</span>
            </div>
            <div className="mc-countdown-row">
              <span className="terminal-text terminal-text--dim">RESPONSE EXPECTED:&nbsp;</span>
              <span className="terminal-text mc-countdown-val">2027-05-07</span>
            </div>
          </div>

          <div className="mc-countdown-detail" style={{marginTop: '4px'}}>
            <div className="mc-countdown-row">
              <span className="terminal-text terminal-text--dim">BROADCAST FREQ:&nbsp;</span>
              <span className="terminal-text mc-freq-val">[SIGNAL ENCRYPTED — DECRYPTION PENDING]</span>
            </div>
            <div className="mc-countdown-row">
              <span className="terminal-text terminal-text--dim">MONITOR AT:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
              <span className="terminal-text mc-freq-dim">systemrestore.xyz&nbsp;</span>
              <span className="terminal-text mc-freq-offline">[OFFLINE — STANDING BY]</span>
            </div>
          </div>

          {ackShown && (
            <button
              className="mc-confirm terminal-text"
              onClick={() => onSolve?.('SYSTEM.RESTORE')}
              style={{alignSelf: 'flex-start', marginTop: '6px'}}
            >
              [ TRANSMISSION ACKNOWLEDGED ]
            </button>
          )}

        </div>
      )}

    </div>
  )
}
