import { useState, useEffect } from 'react'
import './MainCRT.css'
import PowerModule        from '../Modules/PowerModule/PowerModule'
import CommsModule        from '../Modules/CommsModule/CommsModule'
import NavModule          from '../Modules/NavModule/NavModule'
import LifeSupportModule  from '../Modules/LifeSupportModule/LifeSupportModule'
import MemoryCore         from '../Modules/MemoryCore/MemoryCore'

// ── Boot sequence lines (typewriter) ────────────────────────────────────────
const BOOT_LINES = [
  { text: 'BOOT SEQUENCE INITIATED...',          delay: 0,    dim: false },
  { text: 'RUNNING HARDWARE DIAGNOSTICS...',     delay: 500,  dim: true  },
  { text: 'MEMORY BANKS — FRAGMENTED',           delay: 1000, dim: true  },
  { text: 'SCANNING SUBSYSTEMS...',              delay: 1500, dim: true  },
  { text: '5 MODULES DETECTED.',                 delay: 2000, dim: false },
  { text: 'STATUS: ALL MODULES OFFLINE.',        delay: 2400, dim: false, error: true },
  { text: 'AWAITING RESTORATION SEQUENCE.',      delay: 3000, dim: false },
]

// ── Module registry ──────────────────────────────────────────────────────────
const MODULE_LIST = [
  { id: 'power',       label: 'PWR', name: 'POWER GRID',     accessible: true  },
  { id: 'comms',       label: 'COM', name: 'COMMUNICATIONS', accessible: false },
  { id: 'navigation',  label: 'NAV', name: 'NAVIGATION',     accessible: false },
  { id: 'lifesupport', label: 'LSP', name: 'LIFE SUPPORT',   accessible: false },
  { id: 'memory',      label: 'MEM', name: 'MEMORY CORE',    accessible: false },
]

// ── Component ────────────────────────────────────────────────────────────────
function MainCRT({ stage, modules, onStageChange, onModuleRestore }) {
  // view: 'boot' | 'booting' | 'modules' | 'power'
  const [view, setView]             = useState('boot')
  const [input, setInput]           = useState('')
  const [rejected, setRejected]     = useState(false)
  const [invalid, setInvalid]       = useState(false)
  const [visibleLines, setVisible]  = useState([])

  // ── Typewriter effect after y+Enter ─────────────────────────────────────
  useEffect(() => {
    if (view !== 'booting') return
    setVisible([])

    const timers = BOOT_LINES.map(line =>
      setTimeout(() => {
        setVisible(prev => [...prev, line])
      }, line.delay)
    )

    // Transition to modules after last line
    const finalTimer = setTimeout(() => setView('modules'), 3800)

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(finalTimer)
    }
  }, [view])

  // ── Input handlers ───────────────────────────────────────────────────────
  function handleChange(e) {
    const val = e.target.value.toLowerCase()
    if (val === '' || val === 'y' || val === 'n') {
      setInput(val)
      setInvalid(false)
      setRejected(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key !== 'Enter') return
    if (input === 'y') {
      setView('booting')
    } else if (input === 'n') {
      setRejected(true)
      setInput('')
    } else {
      setInvalid(true)
      setInput('')
    }
  }

  // ── Module solved handlers ───────────────────────────────────────────────
  function handlePowerSolved(sig) {
    onModuleRestore('power', 'POWER GRID', String(sig))
    onStageChange(2)
    setView('modules')
  }

  function handleCommsSolved(word) {
    onModuleRestore('comms', 'COMMS ARRAY', word)
    onStageChange(3)
    setView('modules')
  }

  function handleNavSolved(pos) {
    onModuleRestore('navigation', 'NAV SYSTEM', pos)
    setView('modules')
  }

  function handleLifeSupportSolved(comp) {
    onModuleRestore('lifesupport', 'LIFE SUPPORT', comp)
    setView('modules')
  }

  function handleMemoryCoreSolved(code) {
    onModuleRestore('memory', 'MEMORY CORE', code)
    setView('modules')
  }

  // ── Helper: retrieve a solved module's output value ──────────────────────
  function moduleVal(id) {
    return modules.find(m => m.id === id)?.value ?? ''
  }

  return (
    <div className="panel main-crt">


      {/* Physical screen */}
      <div className="main-crt__screen">

        {/* ── BOOT PROMPT ── */}
        {view === 'boot' && (
          <div className="main-crt__boot">
            <p className="terminal-text">SYSTEM DETECTED.</p>
            <p className="terminal-text">LOW POWER STATE.</p>

            {!rejected ? (
              <>
                <p className="terminal-text mct-highlight" style={{ marginTop: '20px' }}>
                  INITIALIZE BOOT SEQUENCE?
                </p>
                <div className="main-crt__prompt">
                  <span className="terminal-text mct-arrow">&gt;&nbsp;</span>
                  <input
                    className="main-crt__input terminal-text"
                    type="text"
                    value={input}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    maxLength={1}
                    placeholder="y/n"
                    autoFocus
                    spellCheck={false}
                  />
                  <span className="main-crt__hint terminal-text">[ ENTER ]</span>
                </div>
                {invalid && (
                  <p className="terminal-text mct-error" style={{ marginTop: '10px' }}>
                    INVALID INPUT. TYPE y OR n.
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="terminal-text mct-highlight" style={{ marginTop: '20px' }}>
                  BOOT SEQUENCE ABORTED.
                </p>
                <p className="terminal-text mct-error" style={{ marginTop: '6px' }}>
                  SYSTEM REMAINS IN LOW POWER STATE.
                </p>
                <p className="terminal-text mct-highlight" style={{ marginTop: '14px' }}>
                  INITIALIZE BOOT SEQUENCE?
                </p>
                <div className="main-crt__prompt">
                  <span className="terminal-text mct-arrow">&gt;&nbsp;</span>
                  <input
                    className="main-crt__input terminal-text"
                    type="text"
                    value={input}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    maxLength={1}
                    placeholder="y/n"
                    autoFocus
                    spellCheck={false}
                  />
                  <span className="main-crt__hint terminal-text">[ ENTER ]</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── BOOT SEQUENCE TYPEWRITER ── */}
        {view === 'booting' && (
          <div className="main-crt__booting">
            {visibleLines.map((line, i) => (
              <div key={i} className="mct-boot-line">
                <span className="mct-arrow terminal-text">&gt;&nbsp;</span>
                <span className={`terminal-text ${line.dim ? 'terminal-text--dim' : ''} ${line.error ? 'mct-error' : ''}`}>
                  {line.text}
                </span>
              </div>
            ))}
            {/* Blinking cursor at end */}
            <div className="mct-boot-line" style={{ marginTop: '4px' }}>
              <span className="terminal-text terminal-cursor" style={{ color: '#333' }}>&nbsp;</span>
            </div>
          </div>
        )}

        {/* ── MODULE SELECTION ── */}
        {view === 'modules' && (
          <div className="main-crt__modules">
            <div className="mct-modules-header">
              <span className="terminal-text mct-modules-title">SUBSYSTEM SELECTION</span>
              <span className="terminal-text terminal-text--dim">
                {modules.filter(m => m.restored).length} / {MODULE_LIST.length} RESTORED
              </span>
            </div>

            <div className="mct-module-list">
              {MODULE_LIST.map((mod, idx) => {
                const restored   = modules.find(m => m.id === mod.id)?.restored ?? false
                // Sequential unlock — each module needs the previous one restored
                const prevDone   = idx === 0 || (modules.find(m => m.id === MODULE_LIST[idx - 1].id)?.restored ?? false)
                const accessible = prevDone

                return (
                  <div
                    key={mod.id}
                    className={`mct-module-row ${restored ? 'mct-module-row--restored' : ''} ${accessible && !restored ? 'mct-module-row--accessible' : ''} ${!accessible ? 'mct-module-row--locked' : ''}`}
                    onClick={() => accessible && !restored && setView(mod.id)}
                  >
                    <span className="mct-module-label terminal-text">[{mod.label}]</span>
                    <span className={`mct-module-name terminal-text${accessible && !restored ? ' terminal-cursor' : ''}`}>{mod.name}</span>
                    <span className="mct-module-status terminal-text">
                      {restored   ? '✓ ONLINE'   : accessible ? '— OFFLINE' : '⊘ LOCKED'}
                    </span>
                    {accessible && !restored && (
                      <span className="mct-module-action terminal-text">[ RESTORE →]</span>
                    )}
                  </div>
                )
              })}
            </div>

            <p className="terminal-text terminal-text--dim mct-modules-footer terminal-cursor">
              SELECT MODULE TO BEGIN RESTORATION
            </p>
          </div>
        )}

        {/* ── POWER MODULE PUZZLE ── */}
        {view === 'power' && (
          <PowerModule
            onSolve={handlePowerSolved}
            onBack={() => setView('modules')}
          />
        )}

        {/* ── COMMS MODULE PUZZLE ── */}
        {view === 'comms' && (
          <CommsModule
            onSolve={handleCommsSolved}
            onBack={() => setView('modules')}
          />
        )}

        {/* ── NAVIGATION MODULE PUZZLE ── */}
        {view === 'navigation' && (
          <NavModule
            onSolve={handleNavSolved}
            onBack={() => setView('modules')}
          />
        )}

        {/* ── LIFE SUPPORT MODULE ── */}
        {view === 'lifesupport' && (
          <LifeSupportModule
            onSolve={handleLifeSupportSolved}
            onBack={() => setView('modules')}
          />
        )}

        {/* ── MEMORY CORE MODULE ── */}
        {view === 'memory' && (
          <MemoryCore
            onSolve={handleMemoryCoreSolved}
            onBack={() => setView('modules')}
          />
        )}

      </div>

      {/* Bezel LEDs */}
      <div className="main-crt__indicators">
        <div className={`main-crt__led ${view !== 'boot' ? 'main-crt__led--active' : ''}`} />
        <div className={`main-crt__led ${view === 'modules' || view === 'power' ? 'main-crt__led--active' : ''}`} />
        <div className="main-crt__led" />
      </div>

    </div>
  )
}

export default MainCRT
