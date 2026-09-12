export default function RunDetails({ run, onBackToHistory }) {
  if (!run) {
    return (
      <div className="lifeos-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Select an application run from the Applications tab to inspect its detailed telemetry trace.</p>
        <button
          type="button"
          className="btn-primary"
          onClick={onBackToHistory}
          style={{ marginTop: '1rem' }}
        >
          View Application History
        </button>
      </div>
    )
  }

  return (
    <div className="lifeos-card">
      {/* Header with Back Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        paddingBottom: '0.875rem',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onBackToHistory}
            style={{ padding: '0.35rem 0.65rem' }}
          >
            ← Back
          </button>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Run Telemetry: {run.company}
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              Run ID: {run.id} • Session Timestamp: {run.date}
            </p>
          </div>
        </div>

        <span style={{
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          background: 'rgba(56, 189, 248, 0.15)',
          color: 'var(--accent-cyan)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
        }}>
          Status: {run.status}
        </span>
      </div>

      {/* Top Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0.875rem',
        marginBottom: '1.5rem',
      }}>
        <div className="stat-tile">
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Total Duration</span>
          <span className="stat-value" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
            {run.totalDuration || run.duration}
          </span>
        </div>

        <div className="stat-tile">
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>LLM Calls</span>
          <span className="stat-value" style={{ fontSize: '1.25rem', color: 'var(--accent-cyan)' }}>
            {run.llmCalls}
          </span>
        </div>

        <div className="stat-tile">
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Memory Hits</span>
          <span className="stat-value" style={{ fontSize: '1.25rem', color: 'var(--accent-emerald)' }}>
            {run.memoryHits}
          </span>
        </div>

        <div className="stat-tile">
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Recovery Events</span>
          <span className="stat-value" style={{ fontSize: '1.25rem', color: 'var(--accent-amber)' }}>
            {run.recoveryCount}
          </span>
        </div>
      </div>

      {/* Goal & Target Information */}
      <div style={{
        background: 'var(--bg-input)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        padding: '1rem',
        marginBottom: '1.25rem',
      }}>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Mission Goal
        </span>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
          {run.goal || `Apply for ${run.role} at ${run.company}`}
        </div>
      </div>

      {/* Websites Visited */}
      <div style={{
        background: 'var(--bg-input)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        padding: '1rem',
        marginBottom: '1.25rem',
      }}>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Websites Visited ({run.websitesVisited?.length || 1})
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
          {(run.websitesVisited || [run.website]).map((site, i) => (
            <div key={i} style={{
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{ color: 'var(--text-muted)' }}>{i + 1}.</span>
              <span>https://{site}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Steps Completed */}
      <div style={{
        background: 'var(--bg-input)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        padding: '1rem',
        marginBottom: '1.25rem',
      }}>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Steps Completed
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
          {(run.stepsCompleted || ['Goal parsed', 'Application submitted']).map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 'bold' }}>✓</span>
              <span style={{ color: 'var(--text-secondary)' }}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Failures & Recovery Events */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
      }}>
        {/* Failures */}
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '1rem',
        }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Encountered Roadblocks
          </span>
          <div style={{ marginTop: '0.5rem' }}>
            {run.failures && run.failures.length > 0 ? (
              run.failures.map((f, i) => (
                <div key={i} style={{ fontSize: '0.8125rem', color: '#f87171', padding: '0.35rem 0' }}>
                  ✕ {f}
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.8125rem', color: 'var(--accent-emerald)' }}>
                ✓ Zero unhandled failures. All barriers resolved autonomously.
              </div>
            )}
          </div>
        </div>

        {/* Learned Strategies */}
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '1rem',
        }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Committed Site-Memory Strategies
          </span>
          <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)' }}>
            🧠 {run.learnedStrategy || 'Direct ATS match stored in persistent cache'}
          </div>
        </div>
      </div>
    </div>
  )
}
