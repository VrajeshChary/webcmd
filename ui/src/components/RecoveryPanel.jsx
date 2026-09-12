export default function RecoveryPanel({
  recoveryData = {
    activeProblem: 'None detected',
    whatChanged: 'No DOM deviations currently observed',
    whatAgentTried: 'Standard accessibility tree mapping',
    recoveryMethod: 'Semantic Intent Fallback + DOM Mutation Observer',
    recoverySucceeded: true,
    learnedStrategy: 'button[name="apply-now"] → role="button"[text*="Start Application"]',
    recoveryCount: 1,
    learnedCount: 2,
    usedMemory: true,
    memoryKey: 'stripe.com/jobs/applicant-gateway',
  }
}) {
  return (
    <div className="lifeos-card" style={{
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid rgba(168, 85, 247, 0.25)',
      background: 'radial-gradient(ellipse at 100% 0%, rgba(168, 85, 247, 0.08) 0%, var(--bg-card) 60%)',
    }}>
      {/* Header */}
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
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(168, 85, 247, 0.2)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-purple)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Recovery &amp; Learning Engine
              </h2>
              <span style={{
                fontSize: '0.6875rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--accent-purple)',
                background: 'rgba(168, 85, 247, 0.12)',
                padding: '0.125rem 0.5rem',
                borderRadius: '9999px',
                border: '1px solid rgba(168, 85, 247, 0.3)',
              }}>
                Track 01 Differentiator
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Self-healing browser heuristics &amp; persistent site memory
            </p>
          </div>
        </div>

        {/* Used Memory Indicator Pill */}
        {recoveryData.usedMemory && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.25rem 0.625rem',
            borderRadius: '9999px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            fontSize: '0.75rem',
            color: 'var(--accent-cyan)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }} />
            <span>Used Memory Cache</span>
          </div>
        )}
      </div>

      {/* Top Counter Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem', marginBottom: '1.25rem' }}>
        <div className="stat-tile" style={{ borderLeft: '3px solid var(--accent-amber)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Active Recoveries
          </span>
          <span className="stat-value" style={{ color: 'var(--accent-amber)' }}>
            {recoveryData.recoveryCount}
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
            {recoveryData.recoveryCount} recoveries handled
          </span>
        </div>

        <div className="stat-tile" style={{ borderLeft: '3px solid var(--accent-emerald)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Learned Strategies
          </span>
          <span className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
            {recoveryData.learnedCount}
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
            {recoveryData.learnedCount} learned strategies committed
          </span>
        </div>
      </div>

      {/* Deep Differentiator Telemetry Feed */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '0.875rem',
        marginBottom: '1rem',
      }}>
        {/* Current Problem & What Changed */}
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '0.875rem 1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-amber)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Current Problem
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {recoveryData.activeProblem}
          </div>

          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            What Changed
          </span>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            {recoveryData.whatChanged}
          </div>
        </div>

        {/* What Agent Tried & Recovery Method */}
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '0.875rem 1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-cyan)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              What Agent Tried
            </span>
            <span style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              backgroundColor: recoveryData.recoverySucceeded ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: recoveryData.recoverySucceeded ? 'var(--accent-emerald)' : '#f87171',
              fontFamily: 'var(--font-mono)',
            }}>
              {recoveryData.recoverySucceeded ? '✓ Succeeded' : 'In Progress'}
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {recoveryData.whatAgentTried}
          </div>

          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            Recovery Method
          </span>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            {recoveryData.recoveryMethod}
          </div>
        </div>
      </div>

      {/* Learned Strategy Card */}
      <div style={{
        background: 'rgba(168, 85, 247, 0.07)',
        border: '1px solid rgba(168, 85, 247, 0.25)',
        borderRadius: '10px',
        padding: '0.875rem 1rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
      }}>
        <span style={{ fontSize: '1rem', marginTop: '0.1rem' }}>🧠</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              Learned Strategy (Saved to Site Memory)
            </span>
            <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              Key: {recoveryData.memoryKey || 'domain.site-memory'}
            </span>
          </div>
          <p style={{
            fontSize: '0.8125rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-primary)',
            marginTop: '0.25rem',
            lineHeight: 1.4,
            wordBreak: 'break-all',
          }}>
            {recoveryData.learnedStrategy}
          </p>
        </div>
      </div>
    </div>
  )
}
