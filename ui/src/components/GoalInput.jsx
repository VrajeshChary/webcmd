export default function GoalInput({
  prompt,
  setPrompt,
  onStartAgent,
  onRunDemo,
  isDemoRunning,
  currentSite,
  currentStepLabel,
  progress = 0,
}) {
  const suggestions = [
    { label: '⚡ Apply for this internship', value: 'Apply for this internship' },
    { label: 'Stripe SWE Intern', value: 'Apply for Software Engineer Internship at Stripe using my profile' },
    { label: 'Linear Product Engineer', value: 'Complete application for Product Engineering Fellow at Linear' },
    { label: 'OpenAI Research Fellow', value: 'Autofill OpenAI internship application portal with verified resume' },
  ]

  return (
    <div className="lifeos-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Meta Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--accent-cyan)',
            fontFamily: 'var(--font-mono)',
          }}>
            Autonomous Mission
          </span>
          <span style={{
            fontSize: '0.6875rem',
            padding: '0.125rem 0.4rem',
            borderRadius: '4px',
            background: 'rgba(56, 189, 248, 0.1)',
            color: 'var(--accent-cyan)',
            fontFamily: 'var(--font-mono)',
          }}>
            Browser Session
          </span>
        </div>

        {currentSite && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '0.2rem 0.5rem',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)' }} />
            <span>{currentSite}</span>
          </div>
        )}
      </div>

      <h2 style={{
        fontSize: '1.625rem',
        fontWeight: 700,
        letterSpacing: '-0.025em',
        marginBottom: '0.5rem',
        color: 'var(--text-primary)',
      }}>
        What do you want me to do?
      </h2>

      <p style={{
        fontSize: '0.875rem',
        color: 'var(--text-secondary)',
        marginBottom: '1rem',
        lineHeight: 1.5,
      }}>
        Enter any job portal URL, target role, or instruction. LifeOS operates a dedicated CloakBrowser instance to analyze forms, match your profile, self-heal UI drifts, and hold before final submission.
      </p>

      {/* Input Box */}
      <div style={{ marginBottom: '0.875rem', position: 'relative' }}>
        <textarea
          className="lifeos-textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Apply for this internship"
          rows={3}
          disabled={isDemoRunning}
          aria-label="Agent prompt input"
        />
      </div>

      {/* Suggestion Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {suggestions.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            className="pill-button"
            disabled={isDemoRunning}
            onClick={() => setPrompt(chip.value)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Active Run Status & Progress Bar (When running or has progress) */}
      {progress > 0 && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '0.875rem 1rem',
          marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <span className="pulse-icon" style={{ color: 'var(--accent-cyan)' }}>⚙</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {currentStepLabel || 'Operating in browser...'}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              {progress}%
            </span>
          </div>

          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #38bdf8, #6366f1, #10b981)',
              borderRadius: '9999px',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '1.25rem',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: 'auto',
        gap: '0.75rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <span>Human-in-the-loop gate active</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Run Demo Button (Track 01 Presentation Feature) */}
          <button
            type="button"
            onClick={onRunDemo}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              borderRadius: '10px',
              background: isDemoRunning ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
              border: isDemoRunning ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(99, 102, 241, 0.35)',
              color: isDemoRunning ? 'var(--accent-amber)' : '#a5b4fc',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <span>{isDemoRunning ? '⏹ Pause Simulation' : '🎬 Run Demo'}</span>
          </button>

          {/* Start Agent Button */}
          <button
            type="button"
            className="btn-primary"
            disabled={isDemoRunning}
            onClick={onStartAgent}
          >
            <span>Start Agent</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="6 3 20 12 6 21 6 3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
