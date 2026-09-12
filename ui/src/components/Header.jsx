export default function Header({ activeTab, onSelectTab, agentStatus = 'Ready', currentRunProgress = null }) {
  const tabs = [
    { id: 'mission', label: 'Mission', icon: '⚡' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'applications', label: 'Applications', icon: '📑' },
    { id: 'rundetails', label: 'Run Details', icon: '🔍' },
  ]

  const getStatusBadge = () => {
    switch (agentStatus) {
      case 'Running':
      case 'Demo Running':
        return {
          bg: 'rgba(56, 189, 248, 0.12)',
          border: 'rgba(56, 189, 248, 0.3)',
          color: 'var(--accent-cyan)',
          dotClass: 'pulse-icon',
          dotColor: 'var(--accent-cyan)',
          text: agentStatus,
        }
      case 'Waiting Approval':
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.3)',
          color: 'var(--accent-amber)',
          dotClass: 'pulse-icon',
          dotColor: 'var(--accent-amber)',
          text: 'Waiting Approval',
        }
      case 'Completed':
        return {
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.3)',
          color: 'var(--accent-emerald)',
          dotClass: 'pulse-dot',
          dotColor: 'var(--accent-emerald)',
          text: 'Completed',
        }
      default:
        return {
          bg: 'rgba(16, 185, 129, 0.08)',
          border: 'rgba(16, 185, 129, 0.25)',
          color: 'var(--accent-emerald)',
          dotClass: 'pulse-dot',
          dotColor: 'var(--accent-emerald)',
          text: 'Ready',
        }
    }
  }

  const statusInfo = getStatusBadge()

  return (
    <header style={{
      backgroundColor: 'rgba(11, 15, 25, 0.88)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0.875rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        {/* Brand & Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(99, 102, 241, 0.35))',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)',
            boxShadow: '0 0 16px rgba(56, 189, 248, 0.15)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4" />
              <path d="m4.93 4.93 2.83 2.83" />
              <path d="M2 12h4" />
              <path d="m4.93 19.07 2.83-2.83" />
              <path d="M12 22v-4" />
              <path d="m19.07 19.07-2.83-2.83" />
              <path d="M22 12h-4" />
              <path d="m19.07 4.93-2.83 2.83" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                color: 'var(--text-primary)',
              }}>
                LifeOS Agent
              </span>
              <span style={{
                fontSize: '0.6875rem',
                fontFamily: 'var(--font-mono)',
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                fontWeight: 600,
              }}>
                SLAB Hackathon
              </span>
            </div>
            <p style={{
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}>
              Adaptive browser employee
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          padding: '0.25rem',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
        }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 0.875rem',
                  borderRadius: '7px',
                  border: isActive ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                  background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Live Engine Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {currentRunProgress !== null && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
            }}>
              <span>Progress: {currentRunProgress}%</span>
            </div>
          )}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.875rem',
            borderRadius: '9999px',
            backgroundColor: statusInfo.bg,
            border: `1px solid ${statusInfo.border}`,
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: statusInfo.color,
          }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: statusInfo.dotColor,
                display: 'inline-block',
              }}
              className={statusInfo.dotClass}
            />
            <span>{statusInfo.text}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
