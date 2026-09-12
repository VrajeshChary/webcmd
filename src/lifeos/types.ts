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
