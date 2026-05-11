import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Shows the help modal automatically after `delayMs` of user inactivity.
 * Returns [showHelp, setShowHelp] — drop-in replacement for useState(false).
 *
 * The timer resets on any mouse move, click, keypress, touch, or scroll.
 * While the modal is open the timer is paused; it restarts on close.
 */
export default function useIdleHelp(delayMs = 120_000) {
  const [showHelp, setShowHelp] = useState(false)
  const timerRef   = useRef(null)
  const isOpenRef  = useRef(false)   // avoids stale closure in event callbacks

  // Keep the ref in sync so reset() can read the latest value without
  // being re-created (and re-attached) every time showHelp changes.
  useEffect(() => {
    isOpenRef.current = showHelp
  }, [showHelp])

  const reset = useCallback(() => {
    if (isOpenRef.current) return   // don't restart while modal is visible
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setShowHelp(true), delayMs)
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
