import type { FailureClassification, RecoveryTactic, UIChangeReport } from './types.js';

export class RecoveryEngine {
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
   * Creates a concrete recovery tactic based on the classification and domain context.
   */
  synthesizeRecoveryTactic(
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
          remedyCode: `
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
  // Try dispatching Escape key to close dialog
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
  return { recovered: true, method: 'escape-key' };
})()
          `,
          confidence: 0.9,
        };

      case 'HIDDEN_FILE_INPUT':
        return {
          strategyId,
          domain,
          classification,
          triggerPattern: 'hidden-resume-file-input',
          description: 'Make hidden file input accessible or dispatch directly to file dropzone',
          recoveryAction: 'DISPATCH_FILE_INPUT',
          fallbackSelector: 'input[type="file"]',
          remedyCode: `
(() => {
  const fileInputs = document.querySelectorAll('input[type="file"]');
  for (const input of fileInputs) {
    input.style.display = 'block';
    input.style.visibility = 'visible';
    input.style.opacity = '1';
    input.style.position = 'relative';
    input.style.zIndex = '999999';
  }
  return { recovered: true, fileInputCount: fileInputs.length };
})()
          `,
          confidence: 0.85,
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
          remedyCode: `
(() => {
  // Check any unchecked required checkboxes (e.g. terms, privacy policy)
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
          `,
          confidence: 0.8,
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
          description: `Fall back to fuzzy and semantic alternatives for ${failedSelector}`,
          recoveryAction: 'RETRY_WITH_FALLBACK_SELECTOR',
          alternativeSelectors: alternatives,
          fallbackSelector: alternatives[0],
          confidence: 0.75,
        };
      }
    }
  }

  /**
   * Generates alternative CSS and text selectors when a primary selector fails.
   */
  private inferAlternativeSelectors(failedSelector: string): string[] {
    const s = failedSelector.toLowerCase();
    const fallbacks: string[] = [];

    if (s.includes('submit') || s.includes('apply')) {
      fallbacks.push(
        'button[type="submit"]',
        'button:has-text("Submit")',
        'button:has-text("Apply")',
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
