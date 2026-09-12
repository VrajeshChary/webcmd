import { LearningAdapter } from './learning-adapter.js';
import type { FailureClassification, RecoveryTactic, UIChangeReport } from './types.js';

/**
 * Valid recovery actions recognized by the LifeOS execution model.
 * Any learned tactic with an unsupported action is rejected for safety.
 */
export const ALLOWED_RECOVERY_ACTIONS = new Set<string>([
  'DISMISS_MODAL',
  'RETRY_WITH_FALLBACK_SELECTOR',
  'CORRECT_INPUT_FORMAT',
  'DISPATCH_FILE_INPUT',
  'SCROLL_AND_RETRY',
  'WAIT_AND_RETRY',
]);

export const DEFAULT_MIN_CONFIDENCE_THRESHOLD = 0.65;

export interface RecoveryEngineOptions {
  learningAdapter?: LearningAdapter;
  homeDir?: string;
  minConfidenceThreshold?: number;
}

export class RecoveryEngine {
  private learningAdapter: LearningAdapter;
  private minConfidenceThreshold: number;

  constructor(opts?: RecoveryEngineOptions | LearningAdapter) {
    if (opts instanceof LearningAdapter) {
      this.learningAdapter = opts;
      this.minConfidenceThreshold = DEFAULT_MIN_CONFIDENCE_THRESHOLD;
    } else {
      this.learningAdapter = opts?.learningAdapter ?? new LearningAdapter({ homeDir: opts?.homeDir });
      this.minConfidenceThreshold = opts?.minConfidenceThreshold ?? DEFAULT_MIN_CONFIDENCE_THRESHOLD;
    }
  }

  setLearningAdapter(adapter: LearningAdapter): void {
    this.learningAdapter = adapter;
  }

  getLearningAdapter(): LearningAdapter {
    return this.learningAdapter;
  }

  /**
   * Classifies an observed failure based on error message, UI change reports, and action context.
   */
  classifyFailure(
    errorMessage: string,
    uiChange?: UIChangeReport,
    selectorAttempted?: string
  ): FailureClassification {
    const msg = errorMessage.toLowerCase();

    if (
      msg.includes('captcha') ||
      msg.includes('turnstile') ||
      msg.includes('cloudflare') ||
      msg.includes('challenge')
    ) {
      return 'BOT_CHALLENGE';
    }

    if (
      uiChange?.newModalsDetected ||
      msg.includes('intercepts pointer events') ||
      msg.includes('another element would receive the click') ||
      msg.includes('overlay') ||
      msg.includes('dialog')
    ) {
      return 'MODAL_BLOCKER';
    }

    if (
      (uiChange && uiChange.errorBannersDetected.length > 0) ||
      msg.includes('validation') ||
      msg.includes('required') ||
      msg.includes('invalid')
    ) {
      return 'FORM_VALIDATION_ERROR';
    }

    if (
      selectorAttempted &&
      (selectorAttempted.includes('file') || selectorAttempted.includes('resume') || selectorAttempted.includes('upload')) &&
      (msg.includes('hidden') || msg.includes('not visible') || msg.includes('not an <input> element'))
    ) {
      return 'HIDDEN_FILE_INPUT';
    }

    if (
      msg.includes('not found') ||
      msg.includes('waiting for selector') ||
      msg.includes('failed to find') ||
      msg.includes('no element matches')
    ) {
      return 'SELECTOR_DRIFT';
    }

    if (msg.includes('timeout') || msg.includes('navigation')) {
      return 'TIMEOUT_OR_NETWORK';
    }

    return 'SELECTOR_DRIFT';
  }

  /**
   * Asynchronously queries LearningAdapter for learned strategies (local cache + Breeth memory)
   * and selects the highest-confidence relevant strategy BEFORE falling back to deterministic rules.
   */
  async resolveRecoveryTactic(
    domain: string,
    classification: FailureClassification,
    failedSelector?: string,
    uiChange?: UIChangeReport,
    context?: { errorMessage?: string; triggerContext?: string }
  ): Promise<RecoveryTactic> {
    try {
      // 1. Query LearningAdapter for learned strategies (local cache + Breeth)
      const learned = await this.learningAdapter.getLearnedRecoveryStrategies(domain);

      // 2. Select best-ranked matching tactic
      const selected = this.selectBestLearnedTactic(
        domain,
        classification,
        failedSelector,
        uiChange,
        learned,
        context?.errorMessage || context?.triggerContext
      );

      if (selected) {
        return selected;
      }
    } catch {
      // Graceful fallback: LearningAdapter or memory failures never crash the recovery engine
    }

    // 3. Fall back to deterministic rules
    return this.synthesizeDeterministicTactic(domain, classification, failedSelector, uiChange);
  }

  /**
   * Synthesizes a concrete recovery tactic.
   * If candidate learned strategies are supplied or present in local memory, selects the best learned
   * tactic first; otherwise falls back to deterministic heuristic rules.
   */
  synthesizeRecoveryTactic(
    domain: string,
    classification: FailureClassification,
    failedSelector?: string,
    uiChange?: UIChangeReport,
    learnedStrategies?: RecoveryTactic[]
  ): RecoveryTactic {
    const candidates = learnedStrategies ?? this.learningAdapter.loadFromLocalCache();
    const selected = this.selectBestLearnedTactic(domain, classification, failedSelector, uiChange, candidates);

    if (selected) {
      return selected;
    }

    return this.synthesizeDeterministicTactic(domain, classification, failedSelector, uiChange);
  }

  /**
   * Evaluates learned strategies against the current failure context, applies security checks,
   * ranks candidates by relevance and confidence, and returns the top strategy.
   */
  selectBestLearnedTactic(
    domain: string,
    classification: FailureClassification,
    failedSelector?: string,
    uiChange?: UIChangeReport,
    candidates?: RecoveryTactic[],
    errorContext?: string
  ): RecoveryTactic | null {
    if (!candidates || candidates.length === 0) {
      return null;
    }

    const scored: Array<{ tactic: RecoveryTactic; score: number }> = [];

    for (const c of candidates) {
      // 1. Safety check: recoveryAction must be in supported action whitelist
      if (!ALLOWED_RECOVERY_ACTIONS.has(c.recoveryAction)) {
        continue;
      }

      // 2. Classification match: learned strategy must address this failure kind
      if (c.classification !== classification) {
        continue;
      }

      // 3. Confidence threshold: low-confidence strategies are ignored
      const conf = c.confidence ?? 0;
      if (conf < this.minConfidenceThreshold) {
        continue;
      }

      // 4. Domain relevance check
      const domainMatch =
        c.domain === domain ||
        domain.includes(c.domain) ||
        c.domain.includes(domain) ||
        c.domain === 'generic';
      if (!domainMatch) {
        continue;
      }

      // 5. Code safety validation: reject suspicious scripts
      if (!this.isSafeRemedyCode(c.remedyCode)) {
        continue;
      }

      // Compute relevance score
      let score = conf;

      // Exact domain match bonus
      if (c.domain === domain) {
        score += 0.05;
      }

      // Selector match bonus
      if (failedSelector) {
        const normSel = failedSelector.toLowerCase();
        if (
          (c.fallbackSelector && c.fallbackSelector.toLowerCase() === normSel) ||
          c.alternativeSelectors?.some((s) => s.toLowerCase() === normSel) ||
          c.triggerPattern?.toLowerCase().includes(normSel)
        ) {
          score += 0.1;
        }
      }

      // Trigger / symptom match bonus
      if (errorContext && c.triggerPattern) {
        const words = c.triggerPattern.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
        const matchCount = words.filter((w) => errorContext.toLowerCase().includes(w)).length;
        if (matchCount > 0) {
          score += 0.05 * matchCount;
        }
      }

      scored.push({ tactic: c, score });
    }

    if (scored.length === 0) {
      return null;
    }

    // Sort by highest score
    scored.sort((a, b) => b.score - a.score);
    const top = scored[0].tactic;

    // Clean up description and mark as learned
    const cleanDesc = top.description.replace(/^(Recovered using learned strategy:\s*)+/i, '');
    const isBreeth = top.strategyId?.startsWith('breeth') || Boolean(top.source === 'breeth');

    return {
      strategyId: top.strategyId || `strat-${Date.now()}`,
      domain: top.domain || domain,
      classification: top.classification,
      triggerPattern: top.triggerPattern,
      description: `Recovered using learned strategy: ${cleanDesc}`,
      recoveryAction: top.recoveryAction,
      fallbackSelector: top.fallbackSelector,
      alternativeSelectors: top.alternativeSelectors,
      remedyCode: top.remedyCode || this.synthesizeDefaultRemedy(top.recoveryAction, top.fallbackSelector),
      confidence: top.confidence,
      isLearned: true,
      source: isBreeth ? 'breeth' : 'local_cache',
      originDetails: `Recovered using learned strategy (${isBreeth ? 'Breeth memory' : 'local memory'}: ${top.strategyId})`,
    };
  }

  /**
   * Deterministic heuristic fallback rules when no learned strategy qualifies.
   */
  synthesizeDeterministicTactic(
    domain: string,
    classification: FailureClassification,
    failedSelector?: string,
    uiChange?: UIChangeReport
  ): RecoveryTactic {
    const strategyId = `strat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    switch (classification) {
      case 'MODAL_BLOCKER':
        return {
          strategyId,
          domain,
          classification,
          triggerPattern: 'pointer-event-intercepted-or-dialog-open',
          description: 'Dismiss blocking modal or accept cookie/consent overlay',
          recoveryAction: 'DISMISS_MODAL',
          remedyCode: this.synthesizeDefaultRemedy('DISMISS_MODAL'),
          confidence: 0.9,
          isLearned: false,
          source: 'heuristic_engine',
        };

      case 'HIDDEN_FILE_INPUT':
        return {
          strategyId,
          domain,
          classification,
          triggerPattern: 'hidden-resume-file-input',
          description: 'Make hidden file input accessible or dispatch directly to file dropzone',
          recoveryAction: 'DISPATCH_FILE_INPUT',
          fallbackSelector: failedSelector || 'input[type="file"]',
          remedyCode: this.synthesizeDefaultRemedy('DISPATCH_FILE_INPUT'),
          confidence: 0.85,
          isLearned: false,
          source: 'heuristic_engine',
        };

      case 'FORM_VALIDATION_ERROR': {
        const missing = uiChange?.missingRequiredFields || [];
        return {
          strategyId,
          domain,
          classification,
          triggerPattern: `validation-errors: ${missing.join(', ')}`,
          description: 'Auto-fill missed required fields and check standard consent boxes',
          recoveryAction: 'CORRECT_INPUT_FORMAT',
          remedyCode: this.synthesizeDefaultRemedy('CORRECT_INPUT_FORMAT'),
          confidence: 0.8,
          isLearned: false,
          source: 'heuristic_engine',
        };
      }

      case 'SELECTOR_DRIFT':
      default: {
        const alternatives = this.inferAlternativeSelectors(failedSelector || '');
        return {
          strategyId,
          domain,
          classification,
          triggerPattern: `selector-drift:${failedSelector}`,
          description: `Fall back to fuzzy and semantic alternatives for ${failedSelector || 'element'}`,
          recoveryAction: 'RETRY_WITH_FALLBACK_SELECTOR',
          alternativeSelectors: alternatives,
          fallbackSelector: alternatives[0],
          confidence: 0.75,
          isLearned: false,
          source: 'heuristic_engine',
        };
      }
    }
  }

  /**
   * Generates safe standard remedy JavaScript code for allowed recovery actions.
   */
  private synthesizeDefaultRemedy(action: RecoveryTactic['recoveryAction'], targetSelector?: string): string {
    switch (action) {
      case 'DISMISS_MODAL':
        return `
(() => {
  const dismissSelectors = [
    'button[aria-label="Close"]',
    'button[aria-label="close"]',
    '.modal-close',
    '.close-btn',
    'button:has-text("Accept")',
    'button:has-text("Accept All")',
    'button:has-text("I agree")',
    'button:has-text("Got it")',
    '#onetrust-accept-btn-handler',
    '.cookie-consent-accept'
  ];
  for (const sel of dismissSelectors) {
    try {
      const btn = document.querySelector(sel);
      if (btn && btn.offsetParent !== null) {
        btn.click();
        return { recovered: true, dismissed: sel };
      }
    } catch {}
  }
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
  return { recovered: true, method: 'escape-key' };
})()
        `.trim();

      case 'DISPATCH_FILE_INPUT':
        return `
(() => {
  const fileInputs = document.querySelectorAll('${targetSelector || 'input[type="file"]'}');
  for (const input of fileInputs) {
    input.style.display = 'block';
    input.style.visibility = 'visible';
    input.style.opacity = '1';
    input.style.position = 'relative';
    input.style.zIndex = '999999';
  }
  return { recovered: true, fileInputCount: fileInputs.length };
})()
        `.trim();

      case 'CORRECT_INPUT_FORMAT':
        return `
(() => {
  const requiredBoxes = document.querySelectorAll('input[type="checkbox"][required], input[type="checkbox"][aria-required="true"]');
  let checkedCount = 0;
  for (const box of requiredBoxes) {
    if (!box.checked) {
      box.checked = true;
      box.dispatchEvent(new Event('change', { bubbles: true }));
      box.dispatchEvent(new Event('input', { bubbles: true }));
      checkedCount++;
    }
  }
  return { recovered: true, autoChecked: checkedCount };
})()
        `.trim();

      case 'RETRY_WITH_FALLBACK_SELECTOR':
      default:
        return '';
    }
  }

  /**
   * Code safety check: Rejects arbitrary untrusted scripts (eval, network exfiltration, cookie theft).
   */
  private isSafeRemedyCode(code: string | undefined): boolean {
    if (!code || typeof code !== 'string') return true;
    const dangerousPatterns = /(\beval\b|\bFunction\b|\bfetch\b|\bXMLHttpRequest\b|\bWebSocket\b|\bdocument\.cookie\b|\blocalStorage\b|\bsessionStorage\b)/i;
    return !dangerousPatterns.test(code);
  }

  /**
   * Generates alternative CSS and text selectors when a primary selector fails.
   */
  private inferAlternativeSelectors(failedSelector: string): string[] {
    const s = failedSelector.toLowerCase();
    const fallbacks: string[] = [];

    if (s.includes('submit') || s.includes('apply') || s.includes('start')) {
      fallbacks.push(
        'button[type="submit"]',
        'button:has-text("Submit")',
        'button:has-text("Apply")',
        'button:has-text("Start Application")',
        'button:has-text("Start")',
        'button:has-text("Submit Application")',
        'button:has-text("Send Application")',
        'button:has-text("Next")',
        'input[type="submit"]'
      );
    } else if (s.includes('resume') || s.includes('cv') || s.includes('file')) {
      fallbacks.push(
        'input[type="file"]',
        '[data-testid*="resume"]',
        'input[name*="resume"]',
        'input[name*="cv"]',
        'input[id*="resume"]',
        'input[id*="cv"]'
      );
    } else if (s.includes('first') || s.includes('fname')) {
      fallbacks.push(
        'input[name*="first" i]',
        'input[id*="first" i]',
        'input[placeholder*="first" i]',
        'input[autocomplete="given-name"]'
      );
    } else if (s.includes('last') || s.includes('lname')) {
      fallbacks.push(
        'input[name*="last" i]',
        'input[id*="last" i]',
        'input[placeholder*="last" i]',
        'input[autocomplete="family-name"]'
      );
    } else if (s.includes('email')) {
      fallbacks.push(
        'input[type="email"]',
        'input[name*="email" i]',
        'input[id*="email" i]',
        'input[autocomplete="email"]'
      );
    } else if (s.includes('phone') || s.includes('mobile')) {
      fallbacks.push(
        'input[type="tel"]',
        'input[name*="phone" i]',
        'input[id*="phone" i]',
        'input[autocomplete="tel"]'
      );
    } else {
      fallbacks.push(
        `[data-testid*="${failedSelector.replace(/[^a-zA-Z0-9]/g, '')}"]`,
        `[aria-label*="${failedSelector.replace(/[^a-zA-Z0-9]/g, '')}"]`
      );
    }

    return fallbacks;
  }
}

