export default function ApplicationHistory({ applications = [], onSelectRun }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return {
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.3)',
          color: 'var(--accent-emerald)',
          text: '✓ Completed',
        }
      case 'Waiting Approval':
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.3)',
          color: 'var(--accent-amber)',
          text: '⚡ Waiting Approval',
        }
      case 'Recovered':
        return {
          bg: 'rgba(168, 85, 247, 0.12)',
          border: 'rgba(168, 85, 247, 0.3)',
          color: 'var(--accent-purple)',
          text: '🛡️ Recovered',
        }
      case 'Failed':
        return {
          bg: 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          text: '✕ Failed',
        }
      default:
        return {
          bg: 'rgba(255, 255, 255, 0.05)',
          border: 'var(--border-subtle)',
          color: 'var(--text-secondary)',
          text: status,
        }
    }
  }

  return (
    <div className="lifeos-card">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
        paddingBottom: '0.875rem',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a5b4fc',
          }}>
            📑
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Application History
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Deterministic audit trail of all automated browser application sessions
            </p>
          </div>
        </div>

        <span style={{
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
        }}>
          {applications.length} applications logged
        </span>
      </div>

      {/* Table Container */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: '0 0.5rem',
          textAlign: 'left',
          fontSize: '0.8125rem',
        }}>
          <thead>
            <tr style={{ color: 'var(--text-muted)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <th style={{ padding: '0.5rem 0.75rem' }}>Company &amp; Role</th>
              <th style={{ padding: '0.5rem 0.75rem' }}>Website</th>
              <th style={{ padding: '0.5rem 0.75rem' }}>Status</th>
              <th style={{ padding: '0.5rem 0.75rem' }}>Date</th>
              <th style={{ padding: '0.5rem 0.75rem' }}>Recoveries</th>
              <th style={{ padding: '0.5rem 0.75rem' }}>Learned Strategy</th>
              <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan={7} style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📭</div>
                  No applications recorded yet. Run a mission or click &quot;Simulate Live Demo&quot; to log a new application.
                </td>
              </tr>
            ) : (
              applications.map((app) => {
                const badge = getStatusBadge(app.status)
                return (
                  <tr
                    key={app.id}
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                  {/* Company & Role */}
                  <td style={{ padding: '0.75rem', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                      {app.company}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                      {app.role}
                    </div>
                  </td>

                  {/* Website */}
                  <td style={{ padding: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                    {app.website}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      fontSize: '0.6875rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: badge.bg,
                      border: `1px solid ${badge.border}`,
                      color: badge.color,
                      whiteSpace: 'nowrap',
                    }}>
                      {badge.text}
                    </span>
                  </td>

                  {/* Date */}
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                    {app.date}
                  </td>

                  {/* Recovery Count */}
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: app.recoveryCount > 0 ? 'var(--accent-amber)' : 'var(--text-muted)',
                    }}>
                      {app.recoveryCount} {app.recoveryCount === 1 ? 'recovery' : 'recoveries'}
                    </span>
                  </td>

                  {/* Learned Strategy */}
                  <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', maxWidth: '240px' }}>
                    <div style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                    }} title={app.learnedStrategy}>
                      {app.learnedStrategy || '—'}
                    </div>
                  </td>

                  {/* View Run Action */}
                  <td style={{ padding: '0.75rem', textAlign: 'right', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => onSelectRun(app.id)}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      View run →
                    </button>
                  </td>
                </tr>
              )
            }))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
