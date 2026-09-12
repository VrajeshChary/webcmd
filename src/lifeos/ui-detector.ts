import type { UIChangeReport, UIElementObservation } from './types.js';

export interface RawPagePerception {
  url: string;
  title: string;
  snapshotText?: string;
  htmlExcerpt?: string;
  dialogsCount?: number;
  alertsText?: string[];
  formElements?: UIElementObservation[];
}

export class UIDetector {
  /**
   * Compares previous page perception with current page perception to identify UI changes.
   */
  detectChange(before: RawPagePerception | null, after: RawPagePerception): UIChangeReport {
    if (!before) {
      return {
        hasChanges: false,
        newModalsDetected: (after.dialogsCount || 0) > 0,
        errorBannersDetected: after.alertsText || [],
        missingRequiredFields: [],
        formStageChanged: false,
        details: 'Initial page baseline established.',
      };
    }

    const modalOpened = (after.dialogsCount || 0) > (before.dialogsCount || 0);
    const newErrors = (after.alertsText || []).filter(
      (err) => !(before.alertsText || []).includes(err)
    );
    const urlChanged = before.url !== after.url;
    const titleChanged = before.title !== after.title;

    // Detect missing required fields
    const missingRequired: string[] = [];
    if (after.formElements) {
      for (const el of after.formElements) {
        if (el.isRequired && (!el.value || el.value.trim() === '')) {
          missingRequired.push(el.name || el.selector);
        }
      }
    }

    const hasChanges =
      modalOpened ||
      newErrors.length > 0 ||
      urlChanged ||
      titleChanged ||
      (before.snapshotText && after.snapshotText && before.snapshotText !== after.snapshotText);

    let details = 'No significant UI changes detected.';
    if (modalOpened) {
      details = `A new modal/dialog was detected overlaying the page (count: ${after.dialogsCount}).`;
    } else if (newErrors.length > 0) {
      details = `Form validation or alert error displayed: "${newErrors.join('; ')}".`;
    } else if (urlChanged) {
      details = `Page navigated to new URL: ${after.url}.`;
    } else if (hasChanges) {
      details = 'Page state or form content was updated.';
    }

    return {
      hasChanges: Boolean(hasChanges),
      newModalsDetected: modalOpened,
      errorBannersDetected: newErrors,
      missingRequiredFields: missingRequired,
      formStageChanged: urlChanged || titleChanged,
      details,
    };
  }

  /**
   * Script to be evaluated in the browser page to inspect interactive form fields,
   * modals, and alerts.
   */
  static getPerceptionScript(): string {
    return `
(() => {
  const dialogs = document.querySelectorAll('dialog[open], [role="dialog"], [aria-modal="true"], .modal.show, .modal.is-active');
  const alertEls = document.querySelectorAll('[role="alert"], .alert-danger, .error-message, .validation-error, [aria-invalid="true"]');
  const alerts = Array.from(alertEls).map(el => (el.textContent || '').trim()).filter(t => t.length > 0);

  const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea, button[type="submit"], [role="button"]'));
  const formElements = inputs.slice(0, 50).map(el => {
    let name = el.getAttribute('name') || el.getAttribute('id') || el.getAttribute('aria-label') || '';
    if (!name && el.labels && el.labels.length > 0) {
      name = el.labels[0].textContent || '';
    }
    if (!name && el.placeholder) {
      name = el.placeholder;
    }
    const isRequired = el.hasAttribute('required') || el.getAttribute('aria-required') === 'true';
    const val = 'value' in el ? String(el.value || '') : (el.textContent || '');
    return {
      selector: el.id ? '#' + el.id : (el.name ? '[name="' + el.name + '"]' : el.tagName.toLowerCase()),
      role: el.getAttribute('role') || el.tagName.toLowerCase(),
      name: name.trim().slice(0, 100),
      type: el.getAttribute('type') || el.tagName.toLowerCase(),
      value: val.slice(0, 100),
      placeholder: el.getAttribute('placeholder') || '',
      isRequired: Boolean(isRequired),
      isVisible: el.offsetParent !== null
    };
  });

  return {
    url: window.location.href,
    title: document.title,
    dialogsCount: dialogs.length,
    alertsText: alerts.slice(0, 5),
    formElements
  };
})()
    `;
  }
}
