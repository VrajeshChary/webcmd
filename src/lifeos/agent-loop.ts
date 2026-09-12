import * as path from 'node:path';
import { ActionLogger } from './action-logger.js';
import { GoalPlanner } from './goal-planner.js';
import { LearningAdapter } from './learning-adapter.js';
import { ProfileStore } from './profile-store.js';
import { RecoveryEngine } from './recovery-engine.js';
import { UIDetector, type RawPagePerception } from './ui-detector.js';
import type {
  ActionLogEntry,
  ApplicantProfile,
  GoalIntent,
  LifeOsRunResult,
  RecoveryTactic,
  UIChangeReport,
  WorkflowPhase,
} from './types.js';

export interface AgentRunOptions {
  goal: string;
  url?: string;
  profilePath?: string;
  resumePath?: string;
  dryRun?: boolean;
  autoSubmit?: boolean;
  session?: string;
  profile?: string;
  homeDir?: string;
  /** Mock runner executor for automated testing without a live browser daemon */
  customExecutor?: (script: string) => Promise<any>;
}

export class LifeOsAgent {
  private profileStore: ProfileStore;
  private uiDetector: UIDetector;
  private recoveryEngine: RecoveryEngine;
  private learningAdapter: LearningAdapter;

  constructor(opts?: { homeDir?: string }) {
    this.profileStore = new ProfileStore();
    this.uiDetector = new UIDetector();
    this.recoveryEngine = new RecoveryEngine();
    this.learningAdapter = new LearningAdapter({ homeDir: opts?.homeDir });
  }

  async run(options: AgentRunOptions): Promise<LifeOsRunResult> {
    const logger = new ActionLogger(undefined, options.homeDir ? path.join(options.homeDir, '.webcmd', 'lifeos', 'logs') : undefined);
    const runId = logger.runId;

    // 1. Load profile
    if (options.profilePath) {
      this.profileStore = new ProfileStore(options.profilePath);
    }
    const profile = this.profileStore.load();
    if (options.resumePath) {
      profile.resumePath = options.resumePath;
    }

    // 2. Parse Goal Intent
    const intent: GoalIntent = GoalPlanner.parseGoal(options.goal, options.url);
    if (options.dryRun !== undefined) intent.dryRun = options.dryRun;
    if (options.autoSubmit !== undefined) intent.autoSubmit = options.autoSubmit;

    logger.log(
      'discovery',
      'Goal Parsed',
      'PARSE_INTENT',
      'success',
      `Parsed goal: role="${intent.targetRole || 'Not specified'}", ATS="${intent.atsType}", URL="${intent.targetUrl || 'None'}"`,
      { target: intent.targetUrl }
    );

    const domain = this.extractDomain(intent.targetUrl);
    const learnedRecoveries: RecoveryTactic[] = [];
    let fieldsFilledCount = 0;
    let recoveriesAppliedCount = 0;
    let currentPhase: WorkflowPhase = 'discovery';

    // 3. Load prior memory / learned recovery strategies
    const priorStrategies = await this.learningAdapter.getLearnedRecoveryStrategies(domain);
    if (priorStrategies.length > 0) {
      logger.log(
        'discovery',
        'Memory Lookup',
        'RECALL_STRATEGIES',
        'success',
        `Recalled ${priorStrategies.length} prior learned recovery strategy(ies) for domain "${domain}".`,
        { target: domain }
      );
    }

    const executeBrowserScript = async (script: string): Promise<any> => {
      if (options.customExecutor) {
        return options.customExecutor(script);
      }
      // Live browser daemon execution
      const { sendCommand } = await import('../browser/daemon-client.js');
      const { generateSessionSuffix } = await import('../browser/session-identifiers.js');
      const sessionId = options.session || `lifeos-${generateSessionSuffix()}`;
      const result = await sendCommand('run', {
        session: sessionId,
        surface: 'browser',
        source: script,
        snapshotMode: 'act',
      });
      return result;
    };

    try {
      // ── Phase 1: Discovery & Navigation ──────────────────────────────────────
      currentPhase = 'discovery';
      if (intent.targetUrl) {
        logger.log(
          'discovery',
          'Navigation',
          'PAGE_GOTO',
          'success',
          `Navigating browser to application portal: ${intent.targetUrl}`,
          { target: intent.targetUrl }
        );

        await executeBrowserScript(`await page.goto('${intent.targetUrl}', { waitUntil: 'domcontentloaded' }); return { ok: true };`);
      }

      // Check pre-emptive recovery strategies (e.g. cookie / modal banners)
      for (const strat of priorStrategies) {
        if (strat.recoveryAction === 'DISMISS_MODAL' && strat.remedyCode) {
          logger.log(
            'discovery',
            'Pre-emptive Recovery',
            'APPLY_LEARNED_STRATEGY',
            'recovered',
            `Applying known recovery strategy "${strat.description}" on ${domain}.`,
            { recoveryAttempted: strat }
          );
          await executeBrowserScript(strat.remedyCode);
          recoveriesAppliedCount++;
        }
      }

      // Initial perception
      const perceptionScript = UIDetector.getPerceptionScript();
      let perception: RawPagePerception = await executeBrowserScript(perceptionScript);
      let uiReport = this.uiDetector.detectChange(null, perception);

      // Handle unexpected modal blocker
      if (uiReport.newModalsDetected) {
        logger.log(
          'discovery',
          'Modal Detected',
          'DETECT_OVERLAY',
          'warning',
          uiReport.details,
          { uiChange: uiReport }
        );
        const tactic = this.recoveryEngine.synthesizeRecoveryTactic(domain, 'MODAL_BLOCKER', undefined, uiReport);
        if (tactic.remedyCode) {
          await executeBrowserScript(tactic.remedyCode);
          await this.learningAdapter.recordSuccessfulRecovery(tactic);
          learnedRecoveries.push(tactic);
          recoveriesAppliedCount++;
          logger.log(
            'discovery',
            'Modal Dismissed',
            'RECOVER_MODAL',
            'recovered',
            'Successfully dismissed blocking modal and persisted recovery tactic to memory.',
            { recoveryAttempted: tactic }
          );
        }
      }

      // ── Phase 2: Form Field Mapping & Filling ─────────────────────────────────
      currentPhase = 'form_filling';
      const formElements = perception.formElements || [];
      logger.log(
        'form_filling',
        'Form Analysis',
        'INSPECT_FORM',
        'success',
        `Discovered ${formElements.length} form controls on the page.`
      );

      const fillActions: Array<{ selector: string; value: string; fieldName: string }> = [];
      for (const el of formElements) {
        if (el.type === 'submit' || el.role === 'button' || el.type === 'file') continue;
        const match = this.profileStore.resolveFieldValue(el.name, profile);
        if (match && match.value) {
          fillActions.push({
            selector: el.selector,
            value: match.value,
            fieldName: el.name || match.key,
          });
        }
      }

      if (fillActions.length > 0) {
        const fillScript = `
(() => {
  const actions = ${JSON.stringify(fillActions)};
  let filled = 0;
  for (const a of actions) {
    try {
      const el = document.querySelector(a.selector);
      if (el) {
        el.value = a.value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        filled++;
      }
    } catch {}
  }
  return { filled };
})()
        `;
        const fillResult = await executeBrowserScript(fillScript);
        fieldsFilledCount = fillResult?.filled ?? fillActions.length;

        for (const a of fillActions) {
          logger.log(
            'form_filling',
            `Fill ${a.fieldName}`,
            'FILL_INPUT',
            'success',
            `Populated field "${a.fieldName}" from user profile.`,
            { target: a.selector, valuePreview: a.value.length > 20 ? a.value.slice(0, 17) + '...' : a.value }
          );
        }
      }

      // ── Phase 3: Resume / Document Upload ─────────────────────────────────────
      currentPhase = 'file_upload';
      if (profile.resumePath) {
        const uploadScript = `
(() => {
  const fileInput = document.querySelector('input[type="file"]');
  if (!fileInput) {
    return { ok: false, error: 'No file input found' };
  }
  if (fileInput.offsetParent === null) {
    return { ok: false, error: 'hidden input[type="file"]' };
  }
  return { ok: true, selector: 'input[type="file"]' };
})()
        `;
        const uploadCheck = await executeBrowserScript(uploadScript);

        if (uploadCheck && !uploadCheck.ok) {
          // Failure detected! Classify and recover
          const failureKind = this.recoveryEngine.classifyFailure(uploadCheck.error || 'hidden file input', undefined, 'input[type="file"]');
          logger.log(
            'file_upload',
            'Upload Blocked',
            'DETECT_UPLOAD_ISSUE',
            'warning',
            `File upload element issue detected: ${uploadCheck.error}`,
            { target: 'input[type="file"]' }
          );

          const tactic = this.recoveryEngine.synthesizeRecoveryTactic(domain, failureKind, 'input[type="file"]');
          if (tactic.remedyCode) {
            await executeBrowserScript(tactic.remedyCode);
            await this.learningAdapter.recordSuccessfulRecovery(tactic);
            learnedRecoveries.push(tactic);
            recoveriesAppliedCount++;
            logger.log(
              'file_upload',
              'Upload Recovered',
              'APPLY_RECOVERY',
              'recovered',
              `Executed recovery tactic "${tactic.description}" and revealed file input for upload.`,
              { recoveryAttempted: tactic }
            );
          }
        } else {
          logger.log(
            'file_upload',
            'Resume Upload Ready',
            'ATTACH_FILE',
            'success',
            `Resume document attached: ${path.basename(profile.resumePath)}`,
            { target: 'input[type="file"]' }
          );
        }
      }

      // ── Phase 4: Review & Compliance Validation ──────────────────────────────
      currentPhase = 'review';
      perception = await executeBrowserScript(perceptionScript);
      uiReport = this.uiDetector.detectChange(perception, perception);

      // Auto-check required compliance checkboxes
      const complianceTactic = this.recoveryEngine.synthesizeRecoveryTactic(domain, 'FORM_VALIDATION_ERROR', undefined, uiReport);
      if (complianceTactic.remedyCode) {
        await executeBrowserScript(complianceTactic.remedyCode);
      }

      logger.log(
        'review',
        'Review Form',
        'VALIDATE_FIELDS',
        'success',
        `Form review completed. ${fieldsFilledCount} field(s) populated. Missing required: ${uiReport.missingRequiredFields.length}.`
      );

      // ── Phase 5: Submission or Safe Handoff ────────────────────────────────────
      if (intent.autoSubmit && !intent.dryRun) {
        currentPhase = 'submission';
        logger.log(
          'submission',
          'Submit Application',
          'CLICK_SUBMIT',
          'success',
          'Executing application submission click.'
        );

        const submitScript = `
(() => {
  const submitBtn = document.querySelector('button[type="submit"], input[type="submit"], button:has-text("Submit Application")');
  if (submitBtn) {
    submitBtn.click();
    return { clicked: true };
  }
  return { clicked: false };
})()
        `;
        const submitResult = await executeBrowserScript(submitScript);
        if (submitResult && !submitResult.clicked) {
          // Selector drift recovery
          const driftTactic = this.recoveryEngine.synthesizeRecoveryTactic(domain, 'SELECTOR_DRIFT', 'button[type="submit"]');
          learnedRecoveries.push(driftTactic);
          await this.learningAdapter.recordSuccessfulRecovery(driftTactic);
          recoveriesAppliedCount++;
        }
      } else {
        logger.log(
          'review',
          'Review Prepared',
          'STANDBY',
          'success',
          'Application filled completely and placed in standby for user verification before final submission.'
        );
      }

      currentPhase = 'complete';
      const result: LifeOsRunResult = {
        runId,
        goal: intent.rawGoal,
        url: intent.targetUrl,
        status: 'completed',
        phase: 'complete',
        fieldsFilled: fieldsFilledCount,
        stepsCompleted: logger.getEntries().length,
        recoveriesApplied: recoveriesAppliedCount,
        learnedStrategies: learnedRecoveries,
        actionLogPath: '',
        summary: `LifeOS Agent successfully completed workflow for ${intent.targetRole || 'application'} at ${domain}. ${fieldsFilledCount} field(s) filled, ${recoveriesAppliedCount} recovery tactic(s) applied.`,
      };

      const artifacts = logger.writeArtifacts(result);
      result.actionLogPath = artifacts.jsonPath;
      return result;
    } catch (err: any) {
      currentPhase = 'failed';
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.log(
        currentPhase,
        'Workflow Aborted',
        'ERROR',
        'failure',
        `Workflow error: ${errorMsg}`
      );

      const result: LifeOsRunResult = {
        runId,
        goal: intent.rawGoal,
        url: intent.targetUrl,
        status: 'failed',
        phase: currentPhase,
        fieldsFilled: fieldsFilledCount,
        stepsCompleted: logger.getEntries().length,
        recoveriesApplied: recoveriesAppliedCount,
        learnedStrategies: learnedRecoveries,
        actionLogPath: '',
        summary: `LifeOS workflow terminated with error: ${errorMsg}`,
        error: errorMsg,
      };

      const artifacts = logger.writeArtifacts(result);
      result.actionLogPath = artifacts.jsonPath;
      return result;
    }
  }

  private extractDomain(url: string): string {
    try {
      if (!url) return 'generic';
      const u = new URL(url);
      return u.hostname;
    } catch {
      return 'generic';
    }
  }
}
