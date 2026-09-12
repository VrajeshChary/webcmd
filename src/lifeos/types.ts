/**
 * Core type definitions for Apply Anywhere - LifeOS Agent.
 */

export interface ApplicantEducation {
  school: string;
  degree: string;
  field: string;
  graduationYear?: number;
}

export interface ApplicantExperience {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  summary?: string;
}

export interface ApplicantProfile {
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  currentCompany?: string;
  currentTitle?: string;
  yearsExperience?: number;
  education?: ApplicantEducation[];
  experience?: ApplicantExperience[];
  skills?: string[];
  resumePath?: string;
  resumeText?: string;
  coverLetter?: string;
  /** Custom Q&A mappings (e.g. sponsorship: false, authorized: true, notice_period: 'immediate') */
  answers?: Record<string, string | boolean | number>;
}

export type AtsPlatform = 'greenhouse' | 'lever' | 'workday' | 'ashby' | 'smartrecruiters' | 'generic';

export interface GoalIntent {
  rawGoal: string;
  targetUrl: string;
  targetRole?: string;
  company?: string;
  atsType: AtsPlatform;
  dryRun?: boolean;
  autoSubmit?: boolean;
}

export type WorkflowPhase =
  | 'discovery'
  | 'form_filling'
  | 'file_upload'
  | 'review'
  | 'submission'
  | 'complete'
  | 'failed';

export interface UIElementObservation {
  selector: string;
  role: string;
  name: string;
  type?: string;
  value?: string;
  placeholder?: string;
  isRequired?: boolean;
  isVisible?: boolean;
  matchedProfileKey?: string;
}

export interface UIChangeReport {
  hasChanges: boolean;
  newModalsDetected: boolean;
  modalHeaders?: string[];
  errorBannersDetected: string[];
  missingRequiredFields: string[];
  formStageChanged: boolean;
  currentStepTitle?: string;
  details: string;
}

export type FailureClassification =
  | 'MODAL_BLOCKER'
  | 'SELECTOR_DRIFT'
  | 'FORM_VALIDATION_ERROR'
  | 'HIDDEN_FILE_INPUT'
  | 'STEP_ORDER_CHANGED'
  | 'BOT_CHALLENGE'
  | 'TIMEOUT_OR_NETWORK';

export interface RecoveryTactic {
  strategyId: string;
  domain: string;
  classification: FailureClassification;
  triggerPattern: string;
  description: string;
  recoveryAction: 'DISMISS_MODAL' | 'RETRY_WITH_FALLBACK_SELECTOR' | 'CORRECT_INPUT_FORMAT' | 'DISPATCH_FILE_INPUT' | 'SCROLL_AND_RETRY' | 'WAIT_AND_RETRY';
  fallbackSelector?: string;
  alternativeSelectors?: string[];
  remedyCode?: string;
  confidence: number;
  /** True when synthesized from learned Breeth or local memory */
  isLearned?: boolean;
  /** Origin of this strategy */
  source?: 'breeth' | 'local_cache' | 'heuristic_engine' | string;
  /** Human-readable attribution */
  originDetails?: string;
}


export interface ActionLogEntry {
  timestamp: string;
  phase: WorkflowPhase;
  stepIndex: number;
  stepName: string;
  action: string;
  target?: string;
  valuePreview?: string;
  outcome: 'success' | 'warning' | 'failure' | 'recovered';
  uiChange?: UIChangeReport;
  recoveryAttempted?: RecoveryTactic;
  message: string;
}

export interface LifeOsRunResult {
  runId: string;
  goal: string;
  url: string;
  status: 'completed' | 'failed' | 'partially_completed' | 'requires_user_action';
  phase: WorkflowPhase;
  fieldsFilled: number;
  stepsCompleted: number;
  recoveriesApplied: number;
  learnedStrategies: RecoveryTactic[];
  actionLogPath: string;
  summary: string;
  error?: string;
}

/**
 * Breeth episodic recovery record representing a learned recovery strategy
 * persisted to Breeth's persistent semantic memory layer.
 * 
 * Separation of concerns:
 * - Webcmd: Browser automation, DOM perception, and action execution
 * - Local Cache (strategies.json): Fast, zero-latency offline fallback
 * - Breeth: Semantic long-term recovery memory and cross-domain reasoning
 */
export interface BreethRecoveryRecord {
  /** Unique identifier for the memory record or tactic */
  id?: string;
  /** Hostname or registrable domain (e.g. 'boards.greenhouse.io') */
  domain: string;
  /** ATS platform or site category (e.g. 'greenhouse', 'lever', 'workday', 'generic') */
  atsType: AtsPlatform | string;
  /** Categorized failure kind that triggered the recovery */
  classification: FailureClassification;
  /** Error message, UI change details, or trigger symptom */
  symptom: string;
  /** Selector that failed or triggered the drift, if applicable */
  failedSelector?: string;
  /** Action type taken to recover */
  recoveryAction:
    | 'DISMISS_MODAL'
    | 'RETRY_WITH_FALLBACK_SELECTOR'
    | 'CORRECT_INPUT_FORMAT'
    | 'DISPATCH_FILE_INPUT'
    | 'SCROLL_AND_RETRY'
    | 'WAIT_AND_RETRY'
    | string;
  /** Concrete remedy: JavaScript snippet, alternative selector list, or action instructions */
  remedy: string;
  /** Fallback selector(s) discovered or verified */
  fallbackSelector?: string;
  alternativeSelectors?: string[];
  /** Outcome verification summary */
  outcome: 'success' | 'recovered' | 'partially_recovered' | string;
  /** Confidence score between 0.0 and 1.0 */
  confidence: number;
  /** Natural language explanation of why and how this strategy works */
  lessonLearned?: string;
  /** Run or workflow metadata */
  metadata?: {
    runId?: string;
    url?: string;
    stepPhase?: WorkflowPhase;
    timestamp?: string;
    [key: string]: unknown;
  };
}

/**
 * Query payload sent to Breeth semantic memory to retrieve relevant
 * recovery strategies or pre-emptive tactics.
 */
export interface BreethQueryPayload {
  /** Target domain to search against */
  domain: string;
  /** ATS platform type if known */
  atsType?: AtsPlatform | string;
  /** Specific failure classification to match */
  classification?: FailureClassification;
  /** Observable symptom, error message, or DOM change snippet */
  symptom?: string;
  /** Selector that failed */
  failedSelector?: string;
  /** Whether to search for pre-emptive setup tactics (e.g. cookie banners) */
  isPreemptive?: boolean;
  /** Maximum number of strategy candidates to return */
  limit?: number;
}

/**
 * Query result returned from Breeth semantic memory search.
 */
export interface BreethQueryResult {
  /** Strategy or memory ID */
  strategyId: string;
  /** Target domain or platform */
  domain: string;
  atsType?: AtsPlatform | string;
  classification: FailureClassification;
  triggerPattern: string;
  description: string;
  recoveryAction:
    | 'DISMISS_MODAL'
    | 'RETRY_WITH_FALLBACK_SELECTOR'
    | 'CORRECT_INPUT_FORMAT'
    | 'DISPATCH_FILE_INPUT'
    | 'SCROLL_AND_RETRY'
    | 'WAIT_AND_RETRY'
    | string;
  fallbackSelector?: string;
  alternativeSelectors?: string[];
  remedyCode?: string;
  confidence: number;
  /** Semantic relevance or similarity score returned by Breeth */
  relevanceScore?: number;
  /** Source attribution or timestamp */
  createdAt?: string;
}

