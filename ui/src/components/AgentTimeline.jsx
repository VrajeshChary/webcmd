export default function AgentTimeline({ steps = [] }) {
  const renderStepIcon = (status) => {
    switch (status) {
      case 'success':
        return (
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: 'var(--accent-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            flexShrink: 0,
            zIndex: 1,
          }}>
            ✓
          </div>
        )
      case 'active':
        return (
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(56, 189, 248, 0.18)',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            color: 'var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            flexShrink: 0,
            zIndex: 1,
          }} className="pulse-icon">
            ⚡
          </div>
        )
      case 'warning':
        return (
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(245, 158, 11, 0.18)',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            color: 'var(--accent-amber)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            flexShrink: 0,
            zIndex: 1,
          }}>
            !
          </div>
        )
      case 'error':
        return (
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.18)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            flexShrink: 0,
            zIndex: 1,
          }}>
            ✕
          </div>
        )
      default: // pending
        return (
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.625rem',
            flexShrink: 0,
            zIndex: 1,
          }}>
            ○
          </div>
        )
    }
  }

  const getStepTitleColor = (status) => {
    switch (status) {
      case 'success':
        return 'var(--text-primary)'
      case 'active':
        return 'var(--accent-cyan)'
      case 'warning':
        return 'var(--accent-amber)'
      case 'error':
        return '#f87171'
      default:
        return 'var(--text-muted)'
    }
  }

  const completedCount = steps.filter((s) => s.status === 'success').length

  return (
    <div className="lifeos-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Card Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
        paddingBottom: '0.875rem',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Live Agent Activity
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Deterministic CDP execution &amp; DOM action trace
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-cyan)',
            backgroundColor: 'rgba(56, 189, 248, 0.08)',
            padding: '0.2rem 0.5rem',
            borderRadius: '6px',
            border: '1px solid rgba(56, 189, 248, 0.2)',
          }}>
            {completedCount} / {steps.length} completed
          </span>
        </div>
      </div>

      {/* Stepped Timeline */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.125rem',
        maxHeight: '440px',
        overflowY: 'auto',
        paddingRight: '0.35rem',
      }}>
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1
          return (
            <div key={step.id || idx} className="timeline-item">
              {!isLast && <div className="timeline-line" />}
              {renderStepIcon(step.status)}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.875rem',
                    fontWeight: step.status === 'active' ? 700 : 600,
                    color: getStepTitleColor(step.status),
                  }}>
                    {step.label}
                  </span>

                  {step.status === 'active' && (
                    <span style={{
                      fontSize: '0.6875rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--accent-cyan)',
                      background: 'rgba(56, 189, 248, 0.1)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                    }}>
                      In Flight
                    </span>
                  )}
                  {step.status === 'warning' && (
                    <span style={{
                      fontSize: '0.6875rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--accent-amber)',
                      background: 'rgba(245, 158, 11, 0.1)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                    }}>
                      Deviation
                    </span>
                  )}
                  {step.status === 'error' && (
                    <span style={{
                      fontSize: '0.6875rem',
                      fontFamily: 'var(--font-mono)',
                      color: '#f87171',
                      background: 'rgba(239, 68, 68, 0.1)',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                    }}>
                      Intervention
                    </span>
                  )}
                </div>

                {step.detail && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: step.status === 'pending' ? 'var(--text-muted)' : 'var(--text-secondary)',
                    marginTop: '0.2rem',
                    lineHeight: 1.4,
                  }}>
                    {step.detail}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
