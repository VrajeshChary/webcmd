export default function ApprovalModal({
  isOpen,
  onApprove,
  onCancel,
  targetWebsite = 'stripe.com/jobs/applicant-gateway',
  role = 'Software Engineering Intern — Infrastructure',
  candidate = {
    name: 'Alex Chen',
    email: 'alex.chen@example.com',
    phone: '+1 (415) 890-2341',
    resume: 'Alex_Chen_Resume_2026.pdf',
    skills: 'React 19, TypeScript, Python, Node.js, CDP',
  },
}) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(3, 7, 18, 0.82)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
      padding: '1.25rem',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        maxWidth: '580px',
        width: '100%',
        backgroundColor: '#0f1422',
        border: '1px solid rgba(245, 158, 11, 0.45)',
        borderRadius: '16px',
        padding: '1.75rem',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(245, 158, 11, 0.15)',
        position: 'relative',
      }}>
        {/* Top Warning Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '9999px',
          backgroundColor: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          color: 'var(--accent-amber)',
          fontSize: '0.75rem',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          marginBottom: '1rem',
        }}>
          <span>🛡️ SENSITIVE ACTION INTERCEPTED</span>
        </div>

        <h2 style={{
          fontSize: '1.375rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          marginBottom: '0.5rem',
        }}>
          Human Approval Required Before Submission
        </h2>

        <p style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          marginBottom: '1.25rem',
        }}>
          LifeOS Agent is configured with an unbypassable safety gate. The agent has prepared all fields and attached your verified credentials, but <strong>cannot trigger the final submission without your explicit approval</strong>.
        </p>

        {/* Payload Summary Box */}
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          {/* Target Website & Role */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Website</span>
            <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              {targetWebsite}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target Role</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {role}
            </span>
          </div>

          {/* Candidate Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Candidate</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
              {candidate.name} ({candidate.email})
            </span>
          </div>

          {/* Resume */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Attached Resume</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
              📄 {candidate.resume}
            </span>
          </div>

          {/* Final Action */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Final Action</span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--accent-amber)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              Click button:contains("Submit Application")
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            style={{ padding: '0.75rem 1.25rem' }}
          >
            Cancel Run
          </button>

          <button
            type="button"
            onClick={onApprove}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9375rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            <span>✓ Approve &amp; Submit</span>
          </button>
        </div>
      </div>
    </div>
  )
}
