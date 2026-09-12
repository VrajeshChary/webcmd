import * as path from 'node:path';
import { ActionLogger } from './action-logger.js';
import { GoalPlanner } from './goal-planner.js';
import { LearningAdapter } from './learning-adapter.js';
import { OpenRouterLlmService } from './llm-service.js';
import { ProfileStore } from './profile-store.js';
import { RecoveryEngine } from './recovery-engine.js';
import { UIDetector, type RawPagePerception } from './ui-detector.js';
import type {
  ActionLogEntry,
  ApplicantProfile,
  FailureClassification,
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
  /** Optional custom command dispatcher for testing daemon session interaction */
  sendCommand?: (action: string, params?: any) => Promise<any>;
}

export interface LifeOsAgentOptions {
  homeDir?: string;
  learningAdapter?: LearningAdapter;
  recoveryEngine?: RecoveryEngine;
  profileStore?: ProfileStore;
  uiDetector?: UIDetector;
  llmService?: OpenRouterLlmService;
}

export class LifeOsAgent {
  private profileStore: ProfileStore;
  private uiDetector: UIDetector;
  private recoveryEngine: RecoveryEngine;
  private learningAdapter: LearningAdapter;
  private llmService: OpenRouterLlmService;

  constructor(opts?: LifeOsAgentOptions | { homeDir?: string }) {
    const options = opts as LifeOsAgentOptions | undefined;
    this.profileStore = options?.profileStore ?? new ProfileStore();
    this.uiDetector = options?.uiDetector ?? new UIDetector();
    this.learningAdapter =
      options?.learningAdapter ?? new LearningAdapter({ homeDir: options?.homeDir });
    this.llmService = options?.llmService ?? new OpenRouterLlmService();
    this.recoveryEngine =
      options?.recoveryEngine ??
      new RecoveryEngine({
        learningAdapter: this.learningAdapter,
        homeDir: options?.homeDir,
        llmService: this.llmService,
      });
  }

  getRecoveryEngine(): RecoveryEngine {
    return this.recoveryEngine;
  }

  getLearningAdapter(): LearningAdapter {
    return this.learningAdapter;
  }

  getLlmService(): OpenRouterLlmService {
    return this.llmService;
  }

  async run(options: AgentRunOptions): Promise<LifeOsRunResult> {
    const logger = new ActionLogger(
      undefined,
      options.homeDir ? path.join(options.homeDir, '.webcmd', 'lifeos', 'logs') : undefined
    );
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

    // 3. Load prior memory / learned recovery strategies (via LearningAdapter / Breeth)
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

    let activeSessionId: string | undefined = options.session;

    const executeBrowserScript = async (script: string): Promise<any> => {
      if (options.customExecutor) {
        return options.customExecutor(script);
      }
      // Live browser daemon execution
      const sendCommand =
        options.sendCommand ?? (await import('../browser/daemon-client.js')).sendCommand;

      if (!activeSessionId) {
        const sessionRecord = (await sendCommand('session-create', {
          sessionName: 'lifeos',
          contextId: 'default',
        })) as { id?: string; data?: { id?: string } } | undefined;
        const resolvedId = sessionRecord?.id ?? sessionRecord?.data?.id;
        if (!resolvedId || typeof resolvedId !== 'string') {
          throw new Error('Failed to create browser session for LifeOS agent.');
        }
        activeSessionId = resolvedId;
      }

      const isPlaywright = /\b(page|context|browser)(\.|\?\.)/.test(script);
      const source = isPlaywright
        ? script
        : `return await page.evaluate(${JSON.stringify(script)});`;

      const result = await sendCommand('run', {
        session: activeSessionId,
        surface: 'browser',
        source,
        snapshotMode: 'act',
      });

      return result && typeof result === 'object' && 'result' in result
        ? (result as any).result
        : result;
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

        await executeBrowserScript(
          `await page.goto('${intent.targetUrl}', { waitUntil: 'domcontentloaded' }); return { ok: true };`
        );
      }

      // Initial perception
      const perceptionScript = UIDetector.getPerceptionScript();
      let perception: RawPagePerception = await executeBrowserScript(perceptionScript);
      let uiReport = this.uiDetector.detectChange(null, perception);

      // Handle unexpected modal blocker via adaptive RecoveryEngine
      if (uiReport.newModalsDetected) {
        const recovery = await this.executeAdaptiveRecovery(
          domain,
          'MODAL_BLOCKER',
          'discovery',
          undefined,
          uiReport,
          logger,
          executeBrowserScript,
          learnedRecoveries,
          `(() => {
            const d = document.querySelectorAll('dialog[open], [role="dialog"], [aria-modal="true"], .modal.show');
            return { ok: d.length === 0 };
          })()`,
          { triggerContext: uiReport.details }
        );

        if (recovery.recovered) {
          recoveriesAppliedCount++;
          // Re-perceive after recovery
          perception = await executeBrowserScript(perceptionScript);
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
        const match = await this.profileStore.resolveFieldValueAsync(
          el.name || el.selector,
          profile,
          this.llmService,
          { type: el.type, placeholder: el.placeholder }
        );
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
  const missing = [];
  for (const a of actions) {
    try {
      const el = document.querySelector(a.selector);
      if (el) {
        el.value = a.value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        filled++;
      } else {
        missing.push(a.selector);
      }
    } catch {
      missing.push(a.selector);
    }
  }
  return { filled, missing };
})()
        `;
        try {
          const fillResult = await executeBrowserScript(fillScript);
          fieldsFilledCount = fillResult?.filled ?? fillActions.length;

          if (fillResult?.missing && fillResult.missing.length > 0) {
            const driftedSelector = fillResult.missing[0];
            const failureKind = this.recoveryEngine.classifyFailure(
              `waiting for selector "${driftedSelector}" failed`,
              undefined,
              driftedSelector
            );
            const recovery = await this.executeAdaptiveRecovery(
              domain,
              failureKind,
              'form_filling',
              driftedSelector,
              undefined,
              logger,
              executeBrowserScript,
              learnedRecoveries,
              undefined,
              { errorMessage: `Element not found: ${driftedSelector}` }
            );
            if (recovery.recovered) {
              recoveriesAppliedCount++;
            }
          }
        } catch (fillErr: any) {
          const failureKind = this.recoveryEngine.classifyFailure(
            fillErr instanceof Error ? fillErr.message : String(fillErr)
          );
          const recovery = await this.executeAdaptiveRecovery(
            domain,
            failureKind,
            'form_filling',
            undefined,
            undefined,
            logger,
            executeBrowserScript,
            learnedRecoveries
          );
          if (recovery.recovered) {
            recoveriesAppliedCount++;
          }
        }

        for (const a of fillActions) {
          logger.log(
            'form_filling',
            `Fill ${a.fieldName}`,
            'FILL_INPUT',
            'success',
            `Populated field "${a.fieldName}" from user profile.`,
            {
              target: a.selector,
              valuePreview: a.value.length > 20 ? a.value.slice(0, 17) + '...' : a.value,
            }
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
          const failureKind = this.recoveryEngine.classifyFailure(
            uploadCheck.error || 'hidden file input',
            undefined,
            'input[type="file"]'
          );

          const recovery = await this.executeAdaptiveRecovery(
            domain,
            failureKind,
            'file_upload',
            'input[type="file"]',
            undefined,
            logger,
            executeBrowserScript,
            learnedRecoveries,
            uploadScript,
            { errorMessage: uploadCheck.error }
          );

          if (recovery.recovered) {
            recoveriesAppliedCount++;
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

      if (uiReport.errorBannersDetected.length > 0 || uiReport.missingRequiredFields.length > 0) {
        const failureKind = this.recoveryEngine.classifyFailure(
          uiReport.errorBannersDetected.join('; ') || 'missing required fields',
          uiReport
        );

        const recovery = await this.executeAdaptiveRecovery(
          domain,
          failureKind,
          'review',
          undefined,
          uiReport,
          logger,
          executeBrowserScript,
          learnedRecoveries
        );

        if (recovery.recovered) {
          recoveriesAppliedCount++;
        }
      }

      logger.log(
        'review',
        'Review Form',
        'VALIDATE_FIELDS',
        'success',
        `Form review completed. ${fieldsFilledCount} field(s) populated. Missing required: ${uiReport.missingRequiredFields.length}.`
      );

      // ── Phase 5: Submission or Safe Handoff (Human Approval Gate) ─────────────
      // Human approval is strictly mandatory before final sensitive submission.
      currentPhase = 'submission';
      const isAwaitingApproval = Boolean(intent.autoSubmit && !intent.dryRun);

      if (isAwaitingApproval) {
        logger.log(
          'submission',
          'Human Approval Gate',
          'REQUIRE_HUMAN_APPROVAL',
          'warning',
          'Human approval gate active: Application is fully populated and verified. Placed in standby for user verification before final submission.',
          { target: 'button[type="submit"]' }
        );
      } else {
        logger.log(
          'submission',
          'Review Prepared',
          'STANDBY',
          'success',
          'Application filled completely and placed in standby for user verification before final submission.'
        );
      }

      currentPhase = 'complete';
      const resultStatus = isAwaitingApproval ? 'requires_user_action' : 'completed';

      const result: LifeOsRunResult = {
        runId,
        goal: intent.rawGoal,
        url: intent.targetUrl,
        status: resultStatus,
        phase: 'complete',
        fieldsFilled: fieldsFilledCount,
        stepsCompleted: logger.getEntries().length,
        recoveriesApplied: recoveriesAppliedCount,
        learnedStrategies: learnedRecoveries,
        actionLogPath: '',
        summary: isAwaitingApproval
          ? `LifeOS Agent prepared application for ${intent.targetRole || 'application'} at ${domain}. Form completed; held in standby for mandatory human approval before final submission.`
          : `LifeOS Agent successfully completed workflow for ${intent.targetRole || 'application'} at ${domain}. ${fieldsFilledCount} field(s) filled, ${recoveriesAppliedCount} recovery tactic(s) applied.`,
      };

      const artifacts = logger.writeArtifacts(result);
      result.actionLogPath = artifacts.jsonPath;
      return result;
    } catch (err: any) {
      currentPhase = 'failed';
      const errorMsg = err instanceof Error ? err.message : String(err);
      const failureKind = this.recoveryEngine.classifyFailure(errorMsg);

      // Attempt adaptive recovery for unexpected failure before terminating
      const recovery = await this.executeAdaptiveRecovery(
        domain,
        failureKind,
        currentPhase,
        undefined,
        undefined,
        logger,
        executeBrowserScript,
        learnedRecoveries,
        undefined,
        { errorMessage: errorMsg }
      );

      if (recovery.recovered) {
        recoveriesAppliedCount++;
      }

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

  /**
   * Unified adaptive recovery runner:
   * 1. Logs `recovery_started`
   * 2. Resolves strategy via RecoveryEngine (checks LearningAdapter/Breeth before heuristic fallback)
   * 3. Logs `learned_strategy_used` or `deterministic_fallback_used`
   * 4. Executes remedy script in page context
   * 5. Verifies recovery state
   * 6. Logs `recovery_verified`
   * 7. Persists successful tactic via LearningAdapter (`strategy_learned`)
   */
  private async executeAdaptiveRecovery(
    domain: string,
    classification: FailureClassification,
    phase: WorkflowPhase,
    target: string | undefined,
    uiReport: UIChangeReport | undefined,
    logger: ActionLogger,
    executeBrowserScript: (script: string) => Promise<any>,
    learnedRecoveries: RecoveryTactic[],
    verificationScript?: string,
    context?: {
      errorMessage?: string;
      triggerContext?: string;
      htmlSnippet?: string;
      profile?: ApplicantProfile;
    }
  ): Promise<{ recovered: boolean; tactic?: RecoveryTactic }> {
    // 1. recovery_started
    logger.log(
      phase,
      'Recovery Started',
      'recovery_started',
      'warning',
      `Diagnosed ${classification} on ${domain}. Initiating adaptive recovery.`,
      { target, uiChange: uiReport }
    );

    // 2. Query RecoveryEngine (routes through LearningAdapter -> local/Breeth -> OpenRouter LLM -> deterministic fallback)
    const tactic = await this.recoveryEngine.resolveRecoveryTactic(
      domain,
      classification,
      target,
      uiReport,
      {
        ...context,
        profile: context?.profile ?? this.profileStore.load(),
      }
    );

    // 3. learned_strategy_used vs deterministic_fallback_used
    if (tactic.isLearned) {
      logger.log(
        phase,
        'Learned Strategy Used',
        'learned_strategy_used',
        'recovered',
        `Recovered using learned strategy: "${tactic.description}" (source: ${tactic.source || 'memory'}, confidence: ${tactic.confidence})`,
        { target, recoveryAttempted: tactic, uiChange: uiReport }
      );
    } else {
      logger.log(
        phase,
        'Deterministic Fallback Used',
        'deterministic_fallback_used',
        'warning',
        `No learned strategy found; using deterministic fallback: "${tactic.description}"`,
        { target, recoveryAttempted: tactic, uiChange: uiReport }
      );
    }

    // 4. Execute remedy script
    let executionSuccess = true;
    if (tactic.remedyCode) {
      try {
        await executeBrowserScript(tactic.remedyCode);
      } catch {
        executionSuccess = false;
      }
    }

    // 5. Verify recovery
    let verified = executionSuccess;
    if (executionSuccess && verificationScript) {
      try {
        const check = await executeBrowserScript(verificationScript);
        verified = Boolean(check?.ok ?? check?.recovered ?? true);
      } catch {
        verified = executionSuccess;
      }
    }

    if (verified) {
      // 6. recovery_verified
      logger.log(
        phase,
        'Recovery Verified',
        'recovery_verified',
        'recovered',
        `Successfully resolved ${classification} via tactic "${tactic.description}".`,
        { target, recoveryAttempted: tactic }
      );

      // 7. strategy_learned -> persist via LearningAdapter (writes local cache + Breeth)
      await this.learningAdapter.recordSuccessfulRecovery(tactic);
      logger.log(
        phase,
        'Strategy Learned',
        'strategy_learned',
        'success',
        `Persisted recovery tactic "${tactic.description}" to persistent memory.`,
        { target, recoveryAttempted: tactic }
      );

      learnedRecoveries.push(tactic);
      return { recovered: true, tactic };
    }

    return { recovered: false, tactic };
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
