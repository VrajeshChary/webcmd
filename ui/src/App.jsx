import { useState, useEffect, useRef, useCallback } from 'react'
import Header from './components/Header'
import GoalInput from './components/GoalInput'
import AgentTimeline from './components/AgentTimeline'
import RecoveryPanel from './components/RecoveryPanel'
import UiChangeCard from './components/UiChangeCard'
import ApprovalModal from './components/ApprovalModal'
import ProfileCard from './components/ProfileCard'
import ApplicationHistory from './components/ApplicationHistory'
import RunDetails from './components/RunDetails'
import MetricsCard from './components/MetricsCard'
import {
  agentService,
  INITIAL_PROFILE,
  INITIAL_METRICS,
  INITIAL_APPLICATIONS,
  DEMO_SEQUENCE,
} from './services/agentService'

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('mission')

  // Agent State
  const [prompt, setPrompt] = useState('Apply for this internship')
  const [agentStatus, setAgentStatus] = useState('Ready') // Ready | Running | Demo Running | Waiting Approval | Completed
  const [currentSite, setCurrentSite] = useState('stripe.com/jobs')
  const [currentProgress, setCurrentProgress] = useState(0)
  const [currentStepLabel, setCurrentStepLabel] = useState('')

  // Data State
  const [profile, setProfile] = useState(INITIAL_PROFILE)
  const [metrics, setMetrics] = useState(INITIAL_METRICS)
  const [applications, setApplications] = useState(INITIAL_APPLICATIONS)
  const [selectedRunId, setSelectedRunId] = useState(INITIAL_APPLICATIONS[0].id)
  const [runDetailsData, setRunDetailsData] = useState(null)

  // Timeline & Recovery State
  const [timelineSteps, setTimelineSteps] = useState([
    { id: 1, label: 'Goal understood', status: 'success', detail: 'Parsed goal target and constraints' },
    { id: 2, label: 'Opening application portal', status: 'success', detail: 'Initialized CloakBrowser session' },
    { id: 3, label: 'Reading page', status: 'success', detail: 'Captured DOM accessibility tree' },
    { id: 4, label: 'Mapping form fields', status: 'success', detail: 'Matched candidate profile attributes' },
    { id: 5, label: 'Waiting for agent', status: 'pending', detail: 'Ready for user command execution' },
  ])

  const [recoveryData, setRecoveryData] = useState({
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
  })

  // Modals & UI Toggles
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showUiChangeCard, setShowUiChangeCard] = useState(true)

  // Demo Simulation State
  const [isDemoRunning, setIsDemoRunning] = useState(false)
  const [demoStepIndex, setDemoStepIndex] = useState(0)
  const timerRef = useRef(null)

  // Load Run Details when selected
  useEffect(() => {
    agentService.getRunDetails(selectedRunId).then((data) => {
      setRunDetailsData(data)
    })
  }, [selectedRunId])

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Handle Demo Mode Simulation
  const stepDemoForward = useCallback((nextIndex) => {
    if (nextIndex >= DEMO_SEQUENCE.length) {
      if (timerRef.current) clearInterval(timerRef.current)
      setIsDemoRunning(false)
      return
    }

    const step = DEMO_SEQUENCE[nextIndex]
    setCurrentProgress(step.progress)
    setCurrentStepLabel(step.label)
    setCurrentSite(step.site)

    // Append / update timeline
    setTimelineSteps(() => {
      const updated = DEMO_SEQUENCE.slice(0, nextIndex + 1).map((s, idx) => ({
        id: s.id,
        label: s.label,
        status: idx === nextIndex && s.requireApproval ? 'active' : s.status,
        detail: s.detail,
      }))
      return updated
    })

    // Update Recovery Panel if this step triggers adaptation
    if (step.stepKey === 'site-changed' || step.stepKey === 'apply-now-missing') {
      setShowUiChangeCard(true)
      setRecoveryData((prev) => ({
        ...prev,
        activeProblem: 'Primary submit selector button[name="apply-now"] missing from DOM',
        whatChanged: 'Career portal design shifted: "Apply Now" replaced with "Start Application" CTA',
        whatAgentTried: 'Queried accessibility tree; fall back to semantic text intent search',
        recoveryMethod: 'Autonomous CDP selector reconciliation & mutation retry',
        recoverySucceeded: false,
      }))
    }

    if (step.stepKey === 'recovery-success') {
      setRecoveryData((prev) => ({
        ...prev,
        recoverySucceeded: true,
        recoveryCount: prev.recoveryCount + 1,
        whatAgentTried: 'Synthesized click on fallback [role="button"][name="Start Application"]',
      }))
      setMetrics((prev) => ({
        ...prev,
        recoveryCount: prev.recoveryCount + 1,
      }))
    }

    if (step.stepKey === 'strategy-saved') {
      setRecoveryData((prev) => ({
        ...prev,
        learnedCount: prev.learnedCount + 1,
        learnedStrategy: 'stripe.com: map button[name="apply-now"] → role="button"[text*="Start Application"]',
        memoryKey: 'stripe.com/jobs/applicant-gateway',
        usedMemory: true,
      }))
      setMetrics((prev) => ({
        ...prev,
        learnedStrategies: prev.learnedStrategies + 1,
        memoryHits: prev.memoryHits + 1,
      }))
    }

    // When reaching Step 13: Waiting for Human Approval
    if (step.requireApproval) {
      if (timerRef.current) clearInterval(timerRef.current)
      setIsDemoRunning(false)
      setAgentStatus('Waiting Approval')
      setShowApprovalModal(true)
      return
    }

    setDemoStepIndex(nextIndex + 1)
  }, [])

  const handleRunDemo = () => {
    if (isDemoRunning) {
      // Pause
      if (timerRef.current) clearInterval(timerRef.current)
      setIsDemoRunning(false)
      setAgentStatus('Ready')
      return
    }

    // Start or resume
    setIsDemoRunning(true)
    setAgentStatus('Demo Running')
    setActiveTab('mission')

    let currentIndex = demoStepIndex >= DEMO_SEQUENCE.length ? 0 : demoStepIndex
    if (currentIndex === 0) {
      setTimelineSteps([])
    }

    timerRef.current = setInterval(() => {
      stepDemoForward(currentIndex)
      currentIndex += 1
    }, 1200)
  }

  // Human Approval Actions
  const handleApproveSubmission = () => {
    setShowApprovalModal(false)
    setAgentStatus('Completed')
    setCurrentProgress(100)
    setCurrentStepLabel('Completed — Application Submitted')

    // Add completed final step to timeline
    setTimelineSteps((prev) => [
      ...prev,
      {
        id: 99,
        label: '✓ Application submitted with verified human approval',
        status: 'success',
        detail: 'Receipt stored. Confirmation snapshot logged to .webcmd/receipts/',
      },
    ])

    // Prepend to application history
    const newApp = {
      id: `run-${Math.floor(1000 + Math.random() * 9000)}`,
      company: 'Stripe',
      role: 'Software Engineering Intern — Infrastructure',
      website: 'stripe.com/jobs',
      status: 'Completed',
      date: 'Just now',
      recoveryCount: 1,
      learnedStrategy: 'button[name="apply-now"] → Start Application',
      duration: '1m 12s',
      llmCalls: 6,
      memoryHits: 4,
    }

    setApplications((prev) => [newApp, ...prev])
    setSelectedRunId(newApp.id)
  }

  const handleCancelSubmission = () => {
    setShowApprovalModal(false)
    setAgentStatus('Cancelled by User')
    setCurrentStepLabel('Run cancelled before submission')
  }

  // Custom Goal Run
  const handleStartAgent = () => {
    setAgentStatus('Running')
    setCurrentProgress(15)
    setCurrentStepLabel(`Analyzing: ${prompt}`)
    setTimelineSteps([
      { id: 1, label: 'Goal parsed', status: 'success', detail: prompt },
      { id: 2, label: 'Connecting to browser', status: 'active', detail: 'Spawning CloakBrowser session' },
      { id: 3, label: 'Form discovery', status: 'pending', detail: 'Awaiting navigation to target portal' },
    ])
  }

  const handleSelectRun = (runId) => {
    setSelectedRunId(runId)
    setActiveTab('rundetails')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        agentStatus={agentStatus}
        currentRunProgress={isDemoRunning || currentProgress > 0 ? currentProgress : null}
      />

      {/* Main Content Area */}
      <main style={{
        maxWidth: '1280px',
        width: '100%',
        margin: '0 auto',
        padding: '1.75rem 1.5rem 3rem',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Runtime Performance Telemetry Cards */}
        <MetricsCard metrics={metrics} />

        {/* TAB 1: MISSION (Dashboard) */}
        {activeTab === 'mission' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Upper Grid: Goal Input + Live Activity */}
            <div className="two-column-grid" style={{
              display: 'grid',
              gridTemplateColumns: '1.15fr 0.85fr',
              gap: '1.75rem',
            }}>
              <GoalInput
                prompt={prompt}
                setPrompt={setPrompt}
                onStartAgent={handleStartAgent}
                onRunDemo={handleRunDemo}
                isDemoRunning={isDemoRunning}
                currentSite={currentSite}
                currentStepLabel={currentStepLabel}
                progress={currentProgress}
              />

              <AgentTimeline steps={timelineSteps} />
            </div>

            {/* Lower Grid: Recovery & Learning + Website Change Visualization */}
            <div className="two-column-grid" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.75rem',
            }}>
              <RecoveryPanel recoveryData={recoveryData} />
              <UiChangeCard isAdapted={showUiChangeCard} />
            </div>
          </div>
        )}

        {/* TAB 2: PROFILE */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <ProfileCard
              profile={profile}
              onUpdateProfile={setProfile}
            />
          </div>
        )}

        {/* TAB 3: APPLICATIONS */}
        {activeTab === 'applications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <ApplicationHistory
              applications={applications}
              onSelectRun={handleSelectRun}
            />
          </div>
        )}

        {/* TAB 4: RUN DETAILS */}
        {activeTab === 'rundetails' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <RunDetails
              run={runDetailsData}
              onBackToHistory={() => setActiveTab('applications')}
            />
          </div>
        )}
      </main>

      {/* Human Approval Modal (High-stakes safety gate) */}
      <ApprovalModal
        isOpen={showApprovalModal}
        onApprove={handleApproveSubmission}
        onCancel={handleCancelSubmission}
        targetWebsite={currentSite}
        role="Software Engineering Intern — Infrastructure"
        candidate={{
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          resume: profile.resume.fileName,
          skills: profile.skills.slice(0, 4).join(', '),
        }}
      />
    </div>
  )
}
