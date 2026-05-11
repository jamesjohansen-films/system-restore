import './HelpModal.css'

export default function HelpModal({ title, steps, onClose }) {
  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-modal panel" onClick={e => e.stopPropagation()}>

        <div className="help-modal__header">
          <span className="terminal-text help-modal__title">{title}</span>
          <button className="help-modal__close terminal-text" onClick={onClose}>
            [ CLOSE ]
          </button>
        </div>

        <div className="help-modal__body">
          {steps.map((step, i) => (
            <div key={i} className="help-modal__step">
              <span className="terminal-text help-modal__num">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="terminal-text help-modal__text">{step}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
