import { useEffect, useRef, useState } from 'react'
import './ControlRoom.css'
import StatusPanel from '../StatusPanel/StatusPanel'
import MainCRT from '../MainCRT/MainCRT'

function ControlRoom({ stage, modules, onStageChange, onModuleRestore }) {
  const sceneRef  = useRef(null)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    const target  = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }
    let raf

    function onMouseMove(e) {
      target.x = (e.clientX / window.innerWidth  - 0.5) * 2  // -1 → +1
      target.y = (e.clientY / window.innerHeight - 0.5) * 2  // -1 → +1
    }

    function tick() {
      // Lerp toward target — feels like a heavy camera settling
      current.x += (target.x - current.x) * 0.08
      current.y += (target.y - current.y) * 0.08

      if (sceneRef.current) {
        // Translate the scene — feels like panning a camera, not tilting
        const tx = -current.x * 36  // mouse right → scene shifts left  ±36px
        const ty = -current.y * 20  // mouse down  → scene shifts up    ±20px
        sceneRef.current.style.transform =
          `translateX(${tx.toFixed(2)}px) translateY(${ty.toFixed(2)}px)`
      }

      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMouseMove)
    raf = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="control-room" ref={sceneRef}>

      {/* Ambient room glow — shifts color with stage */}
      <div className="control-room__ambient" />

      {/* CRT scanline + vignette overlay */}
      <div className="crt-overlay" />

      {/* Header */}
      <div className="control-room__header">
        <span className="terminal-text terminal-text--dim">SYSTEM.RESTORE</span>
        <span className="terminal-text terminal-text--dim">STAGE {stage} / 4</span>
      </div>

      {/* Main layout */}
      <div className={`control-room__grid${focused ? ' control-room__grid--focused' : ''}`}>

        {/* Left panels */}
        <div className="control-room__side control-room__side--left">
          <StatusPanel module={modules[0]} stage={stage} />
          <StatusPanel module={modules[1]} stage={stage} />
        </div>

        {/* Central CRT */}
        <MainCRT
          stage={stage}
          modules={modules}
          onStageChange={onStageChange}
          onModuleRestore={onModuleRestore}
          onFocusChange={setFocused}
        />

        {/* Right panels */}
        <div className="control-room__side control-room__side--right">
          <StatusPanel module={modules[2]} stage={stage} />
          <StatusPanel module={modules[3]} stage={stage} />
        </div>

      </div>

      {/* Footer */}
      <div className="control-room__footer">
        <span className="terminal-text terminal-text--dim">
          PWR: {stage >= 2 ? '100%' : '---'}
        </span>
        <span className="terminal-text terminal-text--dim">
          SYS: {stage >= 2 ? 'ONLINE' : 'DORMANT'}
        </span>
        <span className="terminal-text terminal-text--dim">
          MEM: {stage >= 2 ? 'RESTORING...' : '---'}
        </span>
      </div>

    </div>
  )
}

export default ControlRoom
