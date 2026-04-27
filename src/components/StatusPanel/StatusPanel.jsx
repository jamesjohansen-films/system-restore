import './StatusPanel.css'

function StatusPanel({ module, stage }) {
  const isRestored = module?.restored
  const hasError = !isRestored && stage >= 2

  return (
    <div className={`panel status-panel ${hasError ? 'status-panel--error' : ''} ${isRestored ? 'status-panel--online' : ''}`}>
      <div className="status-panel__screen">
        <div className="status-panel__content">
          {isRestored ? (
            <>
              <span className="status-panel__label">{module.label}</span>
              <span className="status-panel__value terminal-text">{module.value}</span>
            </>
          ) : hasError ? (
            <span className="status-panel__error">ERROR</span>
          ) : (
            <span className="status-panel__blank">——</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default StatusPanel
