import { useState, useRef } from 'react'

export default function ProfileCard({ profile, onUpdateProfile }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState(profile)
  const fileInputRef = useRef(null)

  const handleResumeFile = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const updated = {
        ...profile,
        resume: {
          ...profile.resume,
          fileName: file.name,
          size: `${Math.round(file.size / 1024)} KB`,
          lastUpdated: 'Just now',
        },
      }
      onUpdateProfile(updated)
    }
  }

  const handleSaveEdit = (e) => {
    e.preventDefault()
    onUpdateProfile(editForm)
    setIsEditing(false)
  }

  return (
    <div className="lifeos-card">
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
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)',
          }}>
            👤
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Your Profile
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Deterministic ground-truth attributes mapped by LifeOS
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setEditForm(profile)
              setIsEditing(true)
            }}
          >
            ✏️ Edit Profile
          </button>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".pdf,.doc,.docx"
            onChange={handleResumeFile}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            📄 Upload Resume
          </button>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1rem',
        marginBottom: '1.25rem',
      }}>
        {/* Name */}
        <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Full Name
          </span>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
            {profile.name}
          </div>
        </div>

        {/* Email */}
        <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Email Address
          </span>
          <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
            {profile.email}
          </div>
        </div>

        {/* Phone */}
        <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Phone Number
          </span>
          <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
            {profile.phone}
          </div>
        </div>

        {/* Location */}
        <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Location &amp; Work Eligibility
          </span>
          <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
            {profile.location}
          </div>
        </div>
      </div>

      {/* Education & Experience */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginBottom: '1.25rem',
      }}>
        <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Education
          </span>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
            {profile.education}
          </div>
        </div>

        <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Experience Summary
          </span>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
            {profile.experience}
          </div>
        </div>
      </div>

      {/* Skills Cloud */}
      <div style={{
        background: 'var(--bg-input)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '0.875rem 1rem',
        marginBottom: '1.25rem',
      }}>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Skills &amp; Keywords
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
          {profile.skills.map((skill, idx) => (
            <span key={idx} className="skill-badge">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Links & Resume Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
      }}>
        {/* Links */}
        <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Links &amp; Profiles
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.35rem', fontSize: '0.8125rem' }}>
            {Object.entries(profile.links).map(([key, val]) => (
              <a
                key={key}
                href={val}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <span>↗</span>
                <span style={{ textTransform: 'capitalize' }}>{key}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Resume */}
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Primary Resume Attachment
            </span>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.125rem' }}>
              {profile.resume.fileName}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {profile.resume.size} • {profile.resume.status}
            </div>
          </div>
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--accent-emerald)',
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '0.2rem 0.6rem',
            borderRadius: '4px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}>
            Ready
          </span>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '1rem',
        }}>
          <form
            onSubmit={handleSaveEdit}
            style={{
              maxWidth: '560px',
              width: '100%',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-highlight)',
              borderRadius: '14px',
              padding: '1.75rem',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Edit Candidate Profile
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    marginTop: '0.25rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    marginTop: '0.25rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    marginTop: '0.25rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    marginTop: '0.25rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Education</label>
                <input
                  type="text"
                  value={editForm.education}
                  onChange={(e) => setEditForm({ ...editForm, education: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    marginTop: '0.25rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Experience</label>
                <textarea
                  value={editForm.experience}
                  onChange={(e) => setEditForm({ ...editForm, experience: e.target.value })}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    marginTop: '0.25rem',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ padding: '0.625rem 1.25rem' }}>
                Save Profile
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
