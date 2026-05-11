import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Shows the help modal automatically after `delayMs` of user inactivity.
 * Returns [showHelp, setShowHelp] — drop-in replacement for useState(false).
 *
 * The timer fires at most ONCE per puzzle (module mount). After it triggers,
 * all event listeners are removed and the timer never runs again for that module.
 */
export default function useIdleHelp(delayMs = 120_000) {
  const [showHelp, setShowHelp] = useState(false)
  const timerRef  = useRef(null)
  const firedRef  = useRef(false)   // true once the auto-open has happened

  const reset = useCallback(() => {
    if (firedRef.current) return    // already fired — never trigger again
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      firedRef.current = true       // mark as fired before opening
      setShowHelp(true)
    }, delayMs)
  }, [delayMs])

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    reset()   // start the timer on mount
    return () => {
      clearTimeout(timerRef.current)
      events.forEach(e => window.removeEventListener(e, reset))
    }
  }, [reset])

  return [showHelp, setShowHelp]
}
