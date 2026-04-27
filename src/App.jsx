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
    const INTERACTIVE = 'button, a, input, select, textarea, label, [role="button"]'
    let mouseX = -20, mouseY = -20
    let rafId

    function tick() {
      try {
        // Move dot
        dot.style.transform = `translate(${mouseX - HALF}px, ${mouseY - HALF}px)`

        // Move ring to same position (follows cursor)
        ring.style.left = mouseX + 'px'
        ring.style.top  = mouseY + 'px'

        // Show ring only when over an interactive element
        const el = document.elementFromPoint(mouseX, mouseY)
        const hot = !!(el && el.closest(INTERACTIVE))
        ring.classList.toggle('cursor-ring--active', hot)
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
