import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ActionLogger } from './action-logger.js';
import { LifeOsAgent } from './agent-loop.js';
import { GoalPlanner } from './goal-planner.js';
import { LearningAdapter } from './learning-adapter.js';
import { ProfileStore } from './profile-store.js';
import { RecoveryEngine } from './recovery-engine.js';
import { UIDetector } from './ui-detector.js';

describe('Apply Anywhere - LifeOS Agent Suite', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lifeos-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  });

  describe('GoalPlanner', () => {
    it('parses natural language goal and extracts target URL, role, and ATS', () => {
      const goal = 'Apply for Frontend Engineer position at Acme Corp on https://boards.greenhouse.io/acme/jobs/456 with my resume';
      const intent = GoalPlanner.parseGoal(goal);

      expect(intent.targetUrl).toBe('https://boards.greenhouse.io/acme/jobs/456');
      expect(intent.atsType).toBe('greenhouse');
      expect(intent.targetRole?.toLowerCase()).toContain('frontend engineer');
    });

    it('detects Lever, Ashby, and Workday ATS platforms', () => {
      expect(GoalPlanner.detectAts('https://jobs.lever.co/company/123')).toBe('lever');
      expect(GoalPlanner.detectAts('https://jobs.ashbyhq.com/org/789')).toBe('ashby');
      expect(GoalPlanner.detectAts('https://mycompany.myworkdayjobs.com/en-US/careers')).toBe('workday');
      expect(GoalPlanner.detectAts('https://company.com/careers')).toBe('generic');
    });

    it('recognizes auto-submit and dry-run flags in prompt', () => {
      const autoSubmit = GoalPlanner.parseGoal('Apply to job on https://example.com/apply and auto-submit directly');
      expect(autoSubmit.autoSubmit).toBe(true);
      expect(autoSubmit.dryRun).toBe(false);

      const dryRun = GoalPlanner.parseGoal('Apply to job on https://example.com/apply preview only dry-run');
      expect(dryRun.dryRun).toBe(true);
      expect(dryRun.autoSubmit).toBe(false);
    });

    it('generates a standard multi-phase workflow plan', () => {
      const intent = GoalPlanner.parseGoal('Apply for Backend Engineer on https://boards.greenhouse.io/acme/jobs/1');
      const plan = GoalPlanner.planWorkflow(intent);

      expect(plan.length).toBeGreaterThanOrEqual(4);
      expect(plan.map((s) => s.phase)).toContain('discovery');
      expect(plan.map((s) => s.phase)).toContain('form_filling');
      expect(plan.map((s) => s.phase)).toContain('file_upload');
      expect(plan.map((s) => s.phase)).toContain('review');
    });
  });

  describe('ProfileStore', () => {
    it('initializes default profile and loads fields', () => {
      const profilePath = path.join(tempDir, 'profile.json');
      const store = new ProfileStore(profilePath);

      expect(store.exists()).toBe(false);
      const profile = store.initDefault();
      expect(store.exists()).toBe(true);
      expect(profile.fullName).toBe('Alex Morgan');
      expect(profile.email).toBe('alex.morgan@example.com');
    });

    it('validates profile required fields', () => {
      const store = new ProfileStore(path.join(tempDir, 'p.json'));
      const valid = store.validate({ fullName: 'John Doe', email: 'j@example.com', phone: '1234567890' });
      expect(valid.valid).toBe(true);

      const invalid = store.validate({ fullName: '', email: 'j@example.com' });
      expect(invalid.valid).toBe(false);
      expect(invalid.missingFields).toContain('fullName');
      expect(invalid.missingFields).toContain('phone');
    });

    it('resolves semantic form cues to profile attributes', () => {
      const store = new ProfileStore(path.join(tempDir, 'p.json'));
      const profile = store.initDefault();

      expect(store.resolveFieldValue('First Name *', profile)?.value).toBe('Alex');
      expect(store.resolveFieldValue('last_name', profile)?.value).toBe('Morgan');
      expect(store.resolveFieldValue('Candidate Email Address', profile)?.value).toBe('alex.morgan@example.com');
      expect(store.resolveFieldValue('Mobile Phone Number', profile)?.value).toBe('+1 (555) 234-5678');
      expect(store.resolveFieldValue('LinkedIn Profile URL', profile)?.value).toBe('https://linkedin.com/in/alexmorgan-dev');
      expect(store.resolveFieldValue('GitHub URL', profile)?.value).toBe('https://github.com/alexmorgan');
    });
  });

  describe('UIDetector', () => {
    it('detects overlay modals and error banners', () => {
      const detector = new UIDetector();

      const before = {
        url: 'https://example.com/apply',
        title: 'Apply to Acme',
        dialogsCount: 0,
        alertsText: [],
      };

      const afterModal = {
        url: 'https://example.com/apply',
        title: 'Apply to Acme',
        dialogsCount: 1,
        alertsText: [],
      };

      const report1 = detector.detectChange(before, afterModal);
      expect(report1.hasChanges).toBe(true);
      expect(report1.newModalsDetected).toBe(true);
      expect(report1.details).toContain('new modal/dialog');

      const afterErrors = {
        url: 'https://example.com/apply',
        title: 'Apply to Acme',
        dialogsCount: 0,
        alertsText: ['Please enter a valid phone number'],
      };

      const report2 = detector.detectChange(before, afterErrors);
      expect(report2.hasChanges).toBe(true);
      expect(report2.errorBannersDetected).toContain('Please enter a valid phone number');
    });

    it('detects URL and stage changes', () => {
      const detector = new UIDetector();
      const before = { url: 'https://example.com/step1', title: 'Step 1' };
      const after = { url: 'https://example.com/step2', title: 'Step 2' };

      const report = detector.detectChange(before, after);
      expect(report.hasChanges).toBe(true);
      expect(report.formStageChanged).toBe(true);
    });
  });

  describe('RecoveryEngine', () => {
    it('classifies failures into actionable failure types', () => {
      const engine = new RecoveryEngine();

      expect(engine.classifyFailure('Element intercepts pointer events; another element received click')).toBe('MODAL_BLOCKER');
      expect(engine.classifyFailure('Please complete Cloudflare Turnstile challenge')).toBe('BOT_CHALLENGE');
      expect(engine.classifyFailure('Form validation failed: Required field is empty', { errorBannersDetected: ['Required'] } as any)).toBe('FORM_VALIDATION_ERROR');
      expect(engine.classifyFailure('element is not visible or hidden', undefined, 'input[type="file"]')).toBe('HIDDEN_FILE_INPUT');
      expect(engine.classifyFailure('waiting for selector "button#submit-btn-random" failed')).toBe('SELECTOR_DRIFT');
    });

    it('synthesizes concrete recovery tactics with executable remedy code', () => {
      const engine = new RecoveryEngine();

      const modalTactic = engine.synthesizeRecoveryTactic('boards.greenhouse.io', 'MODAL_BLOCKER');
      expect(modalTactic.recoveryAction).toBe('DISMISS_MODAL');
      expect(modalTactic.remedyCode).toContain('Escape');

      const hiddenFileTactic = engine.synthesizeRecoveryTactic('jobs.lever.co', 'HIDDEN_FILE_INPUT', 'input[type="file"]');
      expect(hiddenFileTactic.recoveryAction).toBe('DISPATCH_FILE_INPUT');
      expect(hiddenFileTactic.remedyCode).toContain('fileInputs');

      const driftTactic = engine.synthesizeRecoveryTactic('ashbyhq.com', 'SELECTOR_DRIFT', 'button.submit');
      expect(driftTactic.recoveryAction).toBe('RETRY_WITH_FALLBACK_SELECTOR');
      expect(driftTactic.alternativeSelectors?.length).toBeGreaterThan(0);
    });
  });

  describe('LearningAdapter', () => {
    it('persists and recalls learned recovery strategies for a domain', async () => {
      const adapter = new LearningAdapter({ homeDir: tempDir });

      const tactic = {
        strategyId: 'test-strat-1',
        domain: 'boards.greenhouse.io',
        classification: 'MODAL_BLOCKER' as const,
        triggerPattern: 'cookie-consent-overlay',
        description: 'Dismiss greenhouse cookie banner',
        recoveryAction: 'DISMISS_MODAL' as const,
        remedyCode: 'document.querySelector("#accept")?.click();',
        confidence: 0.95,
      };

      await adapter.recordSuccessfulRecovery(tactic);

      const recalled = await adapter.getLearnedRecoveryStrategies('boards.greenhouse.io');
      expect(recalled.length).toBeGreaterThan(0);
      expect(recalled[0].triggerPattern).toBe('cookie-consent-overlay');
      expect(recalled[0].recoveryAction).toBe('DISMISS_MODAL');
    });
  });

  describe('ActionLogger', () => {
    it('logs workflow steps and writes JSON and Markdown audit reports', () => {
      const logsDir = path.join(tempDir, 'logs');
      const logger = new ActionLogger('test-run-123', logsDir);

      logger.log('discovery', 'Open Page', 'PAGE_GOTO', 'success', 'Loaded target page', { target: 'https://example.com' });
      logger.log('form_filling', 'Fill Name', 'FILL_INPUT', 'success', 'Entered candidate name', { target: '#name', valuePreview: 'Alex' });
      logger.log('review', 'Validate', 'REVIEW', 'recovered', 'Dismissed unexpected modal');

      expect(logger.getEntries().length).toBe(3);

      const artifacts = logger.writeArtifacts({
        status: 'completed',
        url: 'https://example.com',
        goal: 'Apply for Test Role',
        fieldsFilled: 1,
        recoveriesApplied: 1,
      });

      expect(fs.existsSync(artifacts.jsonPath)).toBe(true);
      expect(fs.existsSync(artifacts.markdownPath)).toBe(true);

      const mdContent = fs.readFileSync(artifacts.markdownPath, 'utf-8');
      expect(mdContent).toContain('LifeOS Agent Run Report: test-run-123');
      expect(mdContent).toContain('✅ success');
      expect(mdContent).toContain('🔁 recovered');

      const jsonContent = JSON.parse(fs.readFileSync(artifacts.jsonPath, 'utf-8'));
      expect(jsonContent.runId).toBe('test-run-123');
      expect(jsonContent.entries.length).toBe(3);
    });
  });

  describe('LifeOsAgent End-to-End Orchestration', () => {
    it('executes full adaptive workflow with recovery and memory learning', async () => {
      const agent = new LifeOsAgent({ homeDir: tempDir });
      const profilePath = path.join(tempDir, 'profile.json');
      const store = new ProfileStore(profilePath);
      const profile = store.initDefault();
      profile.resumePath = path.join(tempDir, 'resume.pdf');
      fs.writeFileSync(profile.resumePath, 'Resume content placeholder');
      store.save(profile);

      // Custom mock browser executor simulating a dynamic job application page
      let modalDismissed = false;
      const customExecutor = async (script: string) => {
        if (script.includes('goto')) {
          return { ok: true };
        }
        if (script.includes('dialogs = document.querySelectorAll')) {
          // Returns form elements and a blocking modal if not yet dismissed
          return {
            url: 'https://boards.greenhouse.io/testcompany/jobs/123',
            title: 'Software Engineer Application',
            dialogsCount: modalDismissed ? 0 : 1,
            alertsText: [],
            formElements: [
              { selector: '#first_name', name: 'First Name', type: 'text', isRequired: true, value: '' },
              { selector: '#last_name', name: 'Last Name', type: 'text', isRequired: true, value: '' },
              { selector: '#email', name: 'Email Address', type: 'email', isRequired: true, value: '' },
              { selector: '#phone', name: 'Phone', type: 'tel', isRequired: true, value: '' },
              { selector: '#linkedin', name: 'LinkedIn Profile', type: 'text', isRequired: false, value: '' },
            ],
          };
        }
        if (script.includes('dismissSelectors') || script.includes('Escape')) {
          modalDismissed = true;
          return { recovered: true };
        }
        if (script.includes('const actions =')) {
          return { filled: 5 };
        }
        if (script.includes('input[type="file"]')) {
          return { ok: true, selector: 'input[type="file"]' };
        }
        if (script.includes('submitBtn')) {
          return { clicked: true };
        }
        return { ok: true };
      };

      const result = await agent.run({
        goal: 'Apply for Software Engineer on https://boards.greenhouse.io/testcompany/jobs/123 preview dry-run',
        profilePath,
        homeDir: tempDir,
        customExecutor,
      });

      expect(result.status).toBe('completed');
      expect(result.fieldsFilled).toBe(5);
      expect(result.recoveriesApplied).toBeGreaterThanOrEqual(1); // Modal blocker detected & recovered!
      expect(result.learnedStrategies.length).toBeGreaterThanOrEqual(1);
      expect(result.learnedStrategies[0].classification).toBe('MODAL_BLOCKER');
      expect(fs.existsSync(result.actionLogPath)).toBe(true);

      // Verify that the learned recovery strategy was saved and can be recalled
      const adapter = new LearningAdapter({ homeDir: tempDir });
      const recalled = await adapter.getLearnedRecoveryStrategies('boards.greenhouse.io');
      expect(recalled.length).toBeGreaterThan(0);
      expect(recalled[0].classification).toBe('MODAL_BLOCKER');
    });
  });
});
