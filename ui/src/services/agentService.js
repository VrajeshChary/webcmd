/**
 * agentService.js - LifeOS Agent Service Boundary
 * 
 * NOTE FOR JUGRAJ (Backend Integration):
 * This service currently provides structured mock data and simulation runners
 * for the hackathon frontend. To connect with the real Webcmd LifeOS backend:
 * 
 * 1. Replace the mock promises with fetch / WebSocket calls to the local Webcmd daemon:
 *    - POST /api/lifeos/start -> calls `src/lifeos/agent-loop.ts`
 *    - GET /api/lifeos/status/:runId -> streams AgentWorkflowStep events
 *    - POST /api/lifeos/approve -> releases human approval lock in `RecoveryEngine`
 *    - GET /api/lifeos/profile -> loads from `src/lifeos/profile-store.ts`
 *    - GET /api/lifeos/memory -> queries `src/site-memory/`
 * 
 * The data schemas here directly mirror `src/lifeos/types.ts`!
 */

export const ACTIVE_LLM_CONFIG = {
  provider: 'OpenRouter',
  model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
  modelDisplayName: 'NVIDIA Nemotron 3 Ultra (550B)',
  isFreeTier: true,
  status: 'Online',
}

export const INITIAL_PROFILE = {
  name: 'Alex Chen',
  email: 'alex.chen@example.com',
  phone: '+1 (415) 890-2341',
  location: 'San Francisco, CA (Open to Remote / Relocation)',
  education: 'B.S. in Computer Science — Stanford University (2022 - 2026)',
  experience: 'Software Engineering Intern @ Cloudflare (Summer 2025) • Open Source Contributor',
  skills: [
    'React 19',
    'TypeScript',
    'Python',
    'Node.js',
    'Browser Automation',
    'CDP / Playwright',
    'Agentic AI Workflows',
    'Distributed Systems',
  ],
  links: {
    github: 'https://github.com/alexchen-dev',
    linkedin: 'https://linkedin.com/in/alexchen-tech',
    portfolio: 'https://alexchen.codes',
  },
  resume: {
    fileName: 'Alex_Chen_Resume_2026.pdf',
    size: '142 KB',
    lastUpdated: 'Sep 10, 2026',
    status: 'Verified & Indexed',
  },
}

export const INITIAL_METRICS = {
  taskCompletionRate: '100%',
  recoveryCount: 0,
  learnedStrategies: 0,
  memoryHits: 0,
  llmCalls: 0,
  timeSaved: '0 hrs',
  currentRunDuration: '0s',
}

export const INITIAL_APPLICATIONS = []

export const DEMO_SEQUENCE = [
  {
    id: 1,
    stepKey: 'goal-understood',
    label: 'Goal understood',
    status: 'success',
    site: 'stripe.com/jobs',
    detail: 'Extracted objective: Apply for Software Engineer Internship with profile Alex Chen.',
    progress: 8,
  },
  {
    id: 2,
    stepKey: 'portal-a-opened',
    label: 'Portal A opened',
    status: 'success',
    site: 'stripe.com/jobs/applicant-gateway',
    detail: 'Established CloakBrowser isolated session lease #lease-8891.',
    progress: 16,
  },
  {
    id: 3,
    stepKey: 'form-detected',
    label: 'Application form detected',
    status: 'success',
    site: 'stripe.com/jobs/applicant-gateway',
    detail: 'Discovered ATS entrypoint and 8 interactive form targets.',
    progress: 24,
  },
  {
    id: 4,
    stepKey: 'fields-mapped',
    label: 'Fields mapped',
    status: 'success',
    site: 'stripe.com/jobs/applicant-gateway',
    detail: 'Paired contact details, education history, and portfolio URL.',
    progress: 32,
  },
  {
    id: 5,
    stepKey: 'site-changed',
    label: 'Website changed unexpectedly',
    status: 'warning',
    site: 'stripe.com/jobs/applicant-gateway#v2',
    detail: 'DOM Mutation detected! Candidate application layout shifted to variant design.',
    progress: 40,
    triggerDiff: true,
  },
  {
    id: 6,
    stepKey: 'apply-now-missing',
    label: '"Apply Now" not found',
    status: 'error',
    site: 'stripe.com/jobs/applicant-gateway#v2',
    detail: 'Primary submit selector button[name="apply-now"] missing from accessibility tree.',
    progress: 48,
    problem: 'Missing Primary Action Button (Apply Now)',
  },
  {
    id: 7,
    stepKey: 'recovery-activated',
    label: 'Recovery engine activated',
    status: 'warning',
    site: 'stripe.com/jobs/applicant-gateway#v2',
    detail: 'RecoveryEngine evaluating candidate selectors & semantic button intent.',
    progress: 56,
  },
  {
    id: 8,
    stepKey: 'start-app-found',
    label: 'Found "Start Application"',
    status: 'success',
    site: 'stripe.com/jobs/applicant-gateway#v2',
    detail: 'Semantic recovery paired role="button" with text content "Start Application".',
    progress: 64,
  },
  {
    id: 9,
    stepKey: 'recovery-success',
    label: 'Recovery successful',
    status: 'success',
    site: 'stripe.com/jobs/applicant-gateway#v2',
    detail: 'Simulated click synthesized on fallback element with verified navigation response.',
    progress: 72,
    recoverySuccess: true,
  },
  {
    id: 10,
    stepKey: 'strategy-saved',
    label: 'Strategy saved',
    status: 'success',
    site: 'stripe.com/jobs/applicant-gateway#v2',
    detail: 'Learned selector rule committed to local site-memory database for future sessions.',
    progress: 80,
    strategySaved: true,
  },
  {
    id: 11,
    stepKey: 'portal-b-opened',
    label: 'Portal B opened',
    status: 'success',
    site: 'stripe.com/jobs/apply/stage-2',
    detail: 'Advanced to Step 2: Questionnaire and resume attachment surface.',
    progress: 88,
  },
  {
    id: 12,
    stepKey: 'data-transferred',
    label: 'Candidate information transferred',
    status: 'success',
    site: 'stripe.com/jobs/apply/stage-2',
    detail: 'All fields filled; Alex_Chen_Resume_2026.pdf verified and attached.',
    progress: 94,
  },
  {
    id: 13,
    stepKey: 'waiting-approval',
    label: 'Waiting for human approval',
    status: 'active',
    site: 'stripe.com/jobs/apply/stage-2',
    detail: 'Final sensitive submit action intercepted. Human sign-off required.',
    progress: 98,
    requireApproval: true,
  },
]

export const agentService = {
  async getProfile() {
    return Promise.resolve({ ...INITIAL_PROFILE })
  },

  async updateProfile(newProfile) {
    return Promise.resolve({ ...newProfile })
  },

  async getMetrics() {
    return Promise.resolve({ ...INITIAL_METRICS })
  },

  async getApplicationHistory() {
    return Promise.resolve([...INITIAL_APPLICATIONS])
  },

  async getRunDetails(runId) {
    const run = INITIAL_APPLICATIONS.find((r) => r.id === runId) || INITIAL_APPLICATIONS[0]
    if (!run) {
      return Promise.resolve(null)
    }
    return Promise.resolve({
      ...run,
      goal: 'Apply for ' + (run.role || 'Role') + ' at ' + (run.company || 'Company'),
      websitesVisited: [
        run.website,
        run.website + '/auth',
        run.website + '/apply/form',
        run.website + '/review',
      ],
      stepsCompleted: [
        'Initialized CloakBrowser isolated context',
        'Navigated to application portal entrypoint',
        'Extracted semantic accessibility tree',
        'Resolved candidate profile data',
        'Mapped input fields for full name, email, and phone',
        'Overcame altered CTA selector via fuzzy semantic intent matcher',
        'Attached candidate resume',
        'Triggered human safety review gate',
      ],
      failures: run.status === 'Failed' ? ['Corporate SSO required external hardware key'] : [],
      recoveryEvents: [
        {
          timestamp: '1:16:02 PM',
          problem: 'Element [data-test="apply-btn"] not found in DOM snapshot',
          actionTaken: 'Triggered RecoveryEngine: fallback to button:has-text("Start Application")',
          result: 'Success',
        },
      ],
      learnedStrategies: [
        {
          domain: run.website || 'example.com',
          rule: 'Map [name="apply-now"] -> button:contains("Start Application")',
          cachedAt: 'Today, 1:16 PM',
        },
      ],
      llmCalls: run.llmCalls,
      memoryHits: run.memoryHits,
      totalDuration: run.duration,
    })
  },

  async startAgent(goal) {
    // Placeholder for Jugraj: Call real backend endpoint
    return Promise.resolve({
      runId: 'run-' + Math.floor(1000 + Math.random() * 9000),
      goal,
      status: 'active',
      startedAt: new Date().toISOString(),
    })
  },

  async approveSubmission(runId) {
    // Placeholder for Jugraj: Call real backend endpoint
    return Promise.resolve({
      runId,
      status: 'Completed',
      approvedAt: new Date().toISOString(),
      submitted: true,
    })
  },

  async cancelSubmission(runId) {
    // Placeholder for Jugraj: Call real backend endpoint
    return Promise.resolve({
      runId,
      status: 'Cancelled by User',
    })
  },
}
