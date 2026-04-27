import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import './TerminalSelect.css'

export default function TerminalSelect({
  value,
  onChange,
  options,
  placeholder = '— SELECT —',
  accentColor = null,
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const dropRef    = useRef(null)
  const posRef     = useRef({ top: 0, left: 0, width: 0 })

  function calcPos() {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    posRef.current = { top: r.bottom + 2, left: r.left, width: r.width }
  }

  useEffect(() => {
    if (!open) return

    // rAF loop — keeps dropdown pinned to trigger even as parallax moves it
    let rafId
    function syncPos() {
      calcPos()
      if (dropRef.current) {
        const p = posRef.current
        dropRef.current.style.top   = p.top   + 'px'
        dropRef.current.style.left  = p.left  + 'px'
        dropRef.current.style.width = p.width + 'px'
      }
      rafId = requestAnimationFrame(syncPos)
    }
    rafId = requestAnimationFrame(syncPos)

    // Close on outside click — must exclude the portalled dropdown itself
    function onOutside(e) {
      const inTrigger = triggerRef.current?.contains(e.target)
      const inDrop    = dropRef.current?.contains(e.target)
      if (!inTrigger && !inDrop) setOpen(false)
    }
    document.addEventListener('pointerdown', onOutside)

    return () => {
      document.removeEventListener('pointerdown', onOutside)
      cancelAnimationFrame(rafId)
    }
  }, [open])

  const selected     = options.find(o => o.value === value)
  const activeColor  = selected ? (accentColor || '#4a6a9a') : null
  const activeBorder = selected ? (accentColor || '#2a4a7a') : null

  function toggle() {
    if (disabled) return
    calcPos() // snapshot position before React re-renders the portal
    setOpen(o => !o)
  }

  function pick(val) {
    onChange(val)
    setOpen(false)
  }

  return (
    <div className={`t-select ${disabled ? 't-select--disabled' : ''}`}>
      <button
        ref={triggerRef}
        className={`t-select__trigger terminal-text ${open ? 't-select__trigger--open' : ''}`}
        onClick={toggle}
        style={selected ? { borderColor: activeBorder, color: activeColor } : {}}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <span className="t-select__caret">{open ? '▲' : '▼'}</span>
      </button>

      {open && createPortal(
        <div
          ref={dropRef}
          className="t-select__dropdown"
          style={{ top: posRef.current.top, left: posRef.current.left, width: posRef.current.width }}
        >
          {options.map(opt => {
            const isSel = opt.value === value
            return (
              <button
                key={opt.value}
                className={`t-select__option terminal-text ${isSel ? 't-select__option--active' : ''}`}
                onClick={() => pick(opt.value)}
                style={isSel && accentColor ? { color: accentColor } : {}}
              >
                {isSel && <span className="t-select__tick">▶</span>}
                {opt.label}
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </div>
  )
}
