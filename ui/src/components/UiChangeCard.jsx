export default function UiChangeCard({ isAdapted = true }) {
  const diffItems = [
    { before: 'Apply Now', after: 'Start Application', changeType: 'CTA Button Shift' },
    { before: 'Full Name', after: 'Candidate Name', changeType: 'Input Label Mutation' },
    { before: 'Email', after: 'Contact', changeType: 'Consolidated Contact Field' },
    { before: 'Upload Resume', after: 'Attach CV', changeType: 'File Input Renaming' },
  ]

  return (
    <div className="lifeos-card" style={{
      border: '1px solid rgba(56, 189, 248, 0.25)',
      background: 'radial-gradient(ellipse at 0% 0%, rgba(56, 189, 248, 0.08) 0%, var(--bg-card) 70%)',
    }}>
      {/* Header with badges */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'rgba(56, 189, 248, 0.15)',
            color: 'var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
          }}>
            ⇄
          </div>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Website Change Visualization
            </h3>
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
              Real-time DOM mutation diff &amp; semantic alignment
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.6875rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: 'var(--accent-amber)',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            padding: '0.15rem 0.5rem',
            borderRadius: '4px',
          }}>
            ⚡ UI changed
          </span>

          {isAdapted && (
            <span style={{
              fontSize: '0.6875rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: 'var(--accent-emerald)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
            }}>
              ✓ Agent adapted
            </span>
          )}
        </div>
      </div>

      {/* Side-by-side comparison table */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem',
        marginBottom: '0.75rem',
      }}>
        {/* BEFORE Column */}
        <div style={{
          background: 'rgba(239, 68, 68, 0.04)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          padding: '0.75rem',
        }}>
          <div style={{
            fontSize: '0.6875rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: '#f87171',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}>
            <span>[-] BEFORE (Expected DOM)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {diffItems.map((item, i) => (
              <div key={i} style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                padding: '0.3rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderLeft: '2px solid #ef4444',
                textDecoration: 'line-through',
                opacity: 0.8,
              }}>
                {item.before}
              </div>
            ))}
          </div>
        </div>

        {/* AFTER Column */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.04)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '8px',
          padding: '0.75rem',
        }}>
          <div style={{
            fontSize: '0.6875rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: 'var(--accent-emerald)',
            textTransform: 'uppercase',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}>
            <span>[+] AFTER (Detected Portal Layout)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {diffItems.map((item, i) => (
              <div key={i} style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
                padding: '0.3rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.08)',
                borderLeft: '2px solid var(--accent-emerald)',
                fontWeight: 600,
              }}>
                {item.after}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer explanation */}
      <div style={{
        fontSize: '0.6875rem',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span>4/4 UI tokens reconciled automatically</span>
        <span style={{ color: 'var(--accent-cyan)' }}>0 human interventions required for DOM drift</span>
      </div>
    </div>
  )
}
