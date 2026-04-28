import { useState, useEffect } from 'react'
import ControlRoom from './components/ControlRoom/ControlRoom'

// Initial state for the 4 side panels (matches MODULE_LIST order)
const INITIAL_MODULES = [
  { id: 'power',       label: null, value: null, restored: false },
  { id: 'comms',       label: null, value: null, restored: false },
  { id: 'navigation',  label: null, value: null, restored: false },
  { id: 'lifesupport', label: null, value: null, restored: false },
  { id: 'memory',      label: null, value: null, restored: false },
]

function App() {
  const [stage,   setStage]   = useState(1)
  const [modules, setModules] = useState(INITIAL_MODULES)

  // Apply stage class to <html> — drives all CSS variable swaps
  useEffect(() => {
    document.documentElement.className = `stage-${stage}`
  }, [stage])

  // Custom cursor — white sphere dot + persistent hover ring
  useEffect(() => {
    const dot  = document.createElement('div')
    dot.className = 'custom-cursor'
    document.body.appendChild(dot)

    const ring = document.createElement('div')
    ring.className = 'cursor-ring'
    document.body.appendChild(ring)

    const HALF = 3.5
    let mouseX = -20, mouseY = -20
    let wasHot = false
    let rafId

    function tick() {
      try {
        // Move dot
        dot.style.transform = `translate(${mouseX - HALF}px, ${mouseY - HALF}px)`

        // Move ring to cursor position
        ring.style.left = mouseX + 'px'
        ring.style.top  = mouseY + 'px'

        const el  = document.elementFromPoint(mouseX, mouseY)
        const hot = !!(el && getComputedStyle(el).getPropertyValue('--cursor-hot').trim() === '1')

        if (hot && !wasHot) {
          // Just entered an interactive element — fire one-shot expand animation.
          // Reset first so re-entering always restarts from the dot.
          ring.style.animation = 'none'
          void ring.offsetWidth                           // force reflow
          ring.style.animation = 'cursor-ring-expand 0.55s ease-out 1 forwards'
        } else if (!hot && wasHot) {
          // Just left — cut animation immediately so ring is invisible.
          ring.style.animation = 'none'
        }

        wasHot = hot
      } catch (_) { /* never let an error kill the loop */ }

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    function onMouseMove(e) {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(rafId)
      dot.remove()
      ring.remove()
    }
  }, [])

  function handleModuleRestore(id, label, value) {
    setModules(prev =>
      prev.map(m => m.id === id ? { ...m, restored: true, label, value } : m)
    )
  }

  return (
    <ControlRoom
      stage={stage}
      modules={modules}
      onStageChange={setStage}
      onModuleRestore={handleModuleRestore}
    />
  )
}

export default App
