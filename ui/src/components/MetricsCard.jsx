export default function MetricsCard({
  metrics = {
    taskCompletionRate: '98.4%',
    recoveryCount: 7,
    learnedStrategies: 12,
    memoryHits: 34,
    llmCalls: 48,
    timeSaved: '4.8 hrs',
    currentRunDuration: '1m 24s',
  }
}) {
  const tiles = [
    { label: 'Task Completion', value: metrics.taskCompletionRate, color: 'var(--accent-emerald)', sub: 'Across 5 ATS platforms' },
    { label: 'Self-Healing Recoveries', value: metrics.recoveryCount, color: 'var(--accent-amber)', sub: 'Zero manual interventions' },
    { label: 'Learned Strategies', value: metrics.learnedStrategies, color: 'var(--accent-purple)', sub: 'Committed to site-memory' },
    { label: 'Memory Hits', value: metrics.memoryHits, color: 'var(--accent-cyan)', sub: 'Instant selector resolution' },
    { label: 'Total LLM Calls', value: metrics.llmCalls, color: '#a5b4fc', sub: 'Compact structured inference' },
    { label: 'Time Saved', value: metrics.timeSaved, color: '#f472b6', sub: 'Applicant time preserved' },
    { label: 'Run Duration', value: metrics.currentRunDuration, color: 'var(--text-primary)', sub: 'End-to-end telemetry' },
  ]

  return (
    <div className="lifeos-card" style={{ marginBottom: '1.75rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        paddingBottom: '0.625rem',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem' }}>📊</span>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            LifeOS Runtime Telemetry &amp; Performance
          </h3>
        </div>
        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          Real-time agent metrics
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0.75rem',
      }}>
        {tiles.map((tile, idx) => (
          <div key={idx} className="stat-tile" style={{ padding: '0.75rem 0.875rem' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {tile.label}
            </span>
            <span className="stat-value" style={{ fontSize: '1.375rem', color: tile.color }}>
              {tile.value}
            </span>
            <span style={{ fontSize: '0.625rem', color: 'var(--text-secondary)' }}>
              {tile.sub}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
