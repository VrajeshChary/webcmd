import { useState, useRef } from 'react'

export default function App() {
  const [prompt, setPrompt] = useState('')
  const [resumeName, setResumeName] = useState('Alex_Chen_Resume_2026.pdf')
  const fileInputRef = useRef(null)

  const exampleSteps = [
    {
      id: '1',
      title: 'Goal understood',
      status: 'done',
      time: 'Just now',
      description: 'Extracted application target and profile constraints',
    },
    {
      id: '2',
      title: 'Opening application portal',
      status: 'done',
      time: 'Just now',
      description: 'Connected via CloakBrowser with clean session lease',
    },
    {
      id: '3',
      title: 'Reading page',
      status: 'done',
      time: 'Just now',
      description: 'Captured DOM accessibility tree and interactive elements',
    },
    {
      id: '4',
      title: 'Mapping form fields',
      status: 'done',
      time: 'Just now',
      description: 'Matched profile attributes to job application fields',
    },
    {
      id: '5',
      title: 'Waiting for agent',
      status: 'waiting',
      time: 'Active',
      description: 'Ready to execute submit flow or step-by-step verification',
    },
  ]

  const handleResumeUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setResumeName(file.name)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Top Header */}
      <header style={{
        backgroundColor: 'rgba(15, 20, 34, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}>
          {/* Logo & Subtitle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(99, 102, 241, 0.3))',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)',
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                <h1 style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                }}>
                  LifeOS Agent
                </h1>
                <span style={{
                  fontSize: '0.6875rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '0.125rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  color: 'var(--accent-cyan)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
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

          {/* Right Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 0.875rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--accent-emerald)',
            }}>
              <span className="pulse-dot" />
              Ready
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '2rem 1.5rem 3rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem',
        flex: 1,
      }}>
        {/* Top Two-Column Grid: Task Input + Agent Activity */}
        <section className="two-column-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1.15fr 0.85fr',
          gap: '1.75rem',
        }}>
          {/* 2. Main Left Section: Goal & Prompt */}
          <div className="lifeos-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--accent-cyan)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  Autonomous Mission
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Natural language goal
                </span>
              </div>

              <h2 style={{
                fontSize: '1.625rem',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                marginBottom: '0.75rem',
                color: 'var(--text-primary)',
              }}>
                What do you want me to do?
              </h2>

              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.25rem',
                lineHeight: 1.5,
              }}>
                Specify an internship or job URL, target company, or goal. The LifeOS agent analyzes the application portal, resolves required fields, and adapts around roadblocks.
              </p>

              {/* Text Input */}
              <div style={{ marginBottom: '1rem' }}>
                <textarea
                  className="lifeos-textarea"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Apply for this internship"
                  rows={4}
                  aria-label="Agent instructions"
                />
              </div>

              {/* Quick Prompt Suggestions */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button
                  type="button"
                  className="pill-button"
                  onClick={() => setPrompt('Apply for this internship')}
                >
                  ⚡ Apply for this internship
                </button>
                <button
                  type="button"
                  className="pill-button"
                  onClick={() => setPrompt('Apply for Software Engineer Intern role at Stripe with my resume')}
                >
                  Stripe SWE Intern
                </button>
                <button
                  type="button"
                  className="pill-button"
                  onClick={() => setPrompt('Review application form on Lever and map all fields')}
                >
                  Autofill Lever Portal
                </button>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>Full deterministic audit trail enabled</span>
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={() => {}}
              >
                <span>Start Agent</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="6 3 20 12 6 21 6 3" />
                </svg>
              </button>
            </div>
          </div>

          {/* 3. Main Right Section: Agent Activity Timeline */}
          <div className="lifeos-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              paddingBottom: '0.875rem',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Agent Activity
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Live execution trace &amp; step resolution
                </p>
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-cyan)',
                backgroundColor: 'rgba(56, 189, 248, 0.08)',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid rgba(56, 189, 248, 0.2)',
              }}>
                5 steps
              </span>
            </div>

            {/* Stepped Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
              {exampleSteps.map((step) => (
                <div key={step.id} className="timeline-item">
                  <div className="timeline-line" />
                  
                  {step.status === 'done' ? (
                    <div className="timeline-icon-done" aria-label="Step completed">
                      ✓
                    </div>
                  ) : (
                    <div className="timeline-icon-waiting pulse-icon" aria-label="Waiting for execution">
                      ⚡
                    </div>
                  )}

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: step.status === 'done' ? 'var(--text-primary)' : 'var(--accent-cyan)',
                      }}>
                        {step.title}
                      </div>
                      <span style={{
                        fontSize: '0.6875rem',
                        color: step.status === 'done' ? 'var(--text-muted)' : 'var(--accent-cyan)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {step.time}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom Two-Column Grid: Your Profile + Recovery & Learning */}
        <section className="two-column-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1.25fr 0.75fr',
          gap: '1.75rem',
        }}>
          {/* 4. Below: Your Profile Card */}
          <div className="lifeos-card">
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
                  Your Profile
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Credential and application metadata stored locally
                </p>
              </div>

              {/* Upload Resume Button */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={triggerFileInput}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>Upload Resume</span>
                </button>
              </div>
            </div>

            {/* Profile Fields Details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}>
              {/* Name */}
              <div style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
              }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Name
                </span>
                <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
                  Alex Chen
                </div>
              </div>

              {/* Email */}
              <div style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
              }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Email
                </span>
                <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
                  alex.chen@example.com
                </div>
              </div>
            </div>

            {/* Skills */}
            <div style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
            }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Skills
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span className="skill-badge">React 19</span>
                <span className="skill-badge">TypeScript</span>
                <span className="skill-badge">Python</span>
                <span className="skill-badge">Node.js</span>
                <span className="skill-badge">Browser Automation</span>
                <span className="skill-badge">Agentic Workflows</span>
              </div>
            </div>

            {/* Resume File Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f87171',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                }}>
                  PDF
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {resumeName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Resume file linked for automatic file upload matching
                  </div>
                </div>
              </div>

              <span style={{
                fontSize: '0.6875rem',
                color: 'var(--accent-emerald)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}>
                Active
              </span>
            </div>
          </div>

          {/* 5. Bottom/Side Area: Recovery & Learning */}
          <div className="lifeos-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
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
                    Recovery &amp; Learning
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Self-healing heuristics &amp; site memory
                  </p>
                </div>

                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-purple)',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.25rem' }}>
                <div className="stat-tile">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Recoveries
                  </span>
                  <span className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
                    0
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                    0 recoveries
                  </span>
                </div>

                <div className="stat-tile">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Strategies
                  </span>
                  <span className="stat-value" style={{ color: 'var(--accent-emerald)' }}>
                    0
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                    0 learned strategies
                  </span>
                </div>
              </div>
            </div>

            {/* Memory Store Sync Footer */}
            <div style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.75rem 0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-cyan)',
              }} />
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
              }}>
                Connected to local site-memory engine. Will autonomously record ATS field adaptations.
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
