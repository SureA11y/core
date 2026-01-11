'use strict';

/**
 * @rule form-control-accessible-name
 * @atomic true
 * @summary Form controls must have an accessible name.
 *
 * @standard WCAG 2.2
 * @sc 1.3.1 Info and Relationships
 *
 * @standard WCAG 2.2
 * @sc 4.1.2 Name, Role, Value (programmatic name requirement; engine checks name presence)
 *
 * @standard EN 301 549 (Web)
 * @ref 9.1.3.1 Info and Relationships
 * @ref 9.4.1.2 Name, Role, Value
 *
 * @standard RGAA (Formulaires)
 * @ref Critère 11 (Formulaires) - libellés et champs
 *
 * @applicability
 * - Applies to: input (except hidden/submit/button/reset/image), textarea, select
 * - Excludes (NOT_APPLICABLE):
 *   - input[type="hidden"]
 *   - input[type="submit"|"button"|"reset"|"image"]
 *
 * @expectation
 * - FAIL when an applicable form control has no accessible name.
 * - PASS otherwise.
 *
 * @implementation-notes
 * - Atomic scope: this rule checks only the presence of an accessible name (not its quality).
 * - Shadow DOM: when available, uses helpers.queryAllSmart() so it can traverse open shadow roots when enabled.
 */

const id = 'form-control-accessible-name';

const meta = {
  title: 'Form controls must have an accessible name',
  description: 'Fails when an applicable form control has no accessible name (e.g., label, aria-label, aria-labelledby).',
  helpUrl: null,
  tags: ['wcag2a', 'wcag131', 'wcag412', 'forms', 'atomic'],
  wcagSc: ['1.3.1', '4.1.2'],
  defaultSeverity: 'critical',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {
    facetsBySc: {
      '1.3.1': ['programmatic-relationships'],
      '4.1.2': ['accessible-name']
    }
  }
};

/**
 * NOTE (engine constraint):
 * runInPage() is serialized and executed from source (fnSource) by a11yCore-core,
 * so it must NOT reference outer-scope variables like `meta` or `id`.
 * Only use `ctx.*`, locals, and DOM APIs.
 */
function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;

  const safeRoot =
    root ||
    document.documentElement ||
    document.body ||
    document.querySelector('html') ||
    document;

  const queryAll =
    helpers && helpers.queryAll
      ? helpers.queryAll
      : (sel) => {
          if (!safeRoot || !safeRoot.querySelectorAll) return [];
          try {
            return Array.from(safeRoot.querySelectorAll(sel));
          } catch {
            return [];
          }
        };

  const queryAllSmart =
    helpers && typeof helpers.queryAllSmart === 'function'
      ? helpers.queryAllSmart
      : queryAll;

  const getOuterHtmlSnippet =
    helpers && helpers.getOuterHtmlSnippet
      ? helpers.getOuterHtmlSnippet
      : (el) => {
          if (!el || typeof el !== 'object') return '';
          try {
            const html = el.outerHTML || '';
            return html.length > 2000 ? html.slice(0, 2000) + '…' : html;
          } catch {
            return '';
          }
        };

  const buildSimpleSelector =
    helpers && helpers.buildSimpleSelector
      ? helpers.buildSimpleSelector
      : (el, fallbackTag) => {
          try {
            if (!el || typeof el !== 'object') return fallbackTag || 'html';
            const tag = el.tagName ? String(el.tagName).toLowerCase() : (fallbackTag || 'html');
            const getAttr = typeof el.getAttribute === 'function' ? el.getAttribute.bind(el) : null;

            if (getAttr) {
              const idAttr = getAttr('id');
              if (idAttr && idAttr.trim()) return tag + '#' + idAttr.trim();

              const classAttr = getAttr('class') || '';
              const cls = String(classAttr).split(/\s+/).filter(Boolean);
              if (cls.length) return tag + '.' + cls[0];

              const nameAttr = getAttr('name');
              if (nameAttr && nameAttr.trim()) return tag + '[name="' + nameAttr.trim() + '"]';
            }

            return tag;
          } catch {
            return fallbackTag || 'html';
          }
        };

  const hasAccessibleName =
    helpers && typeof helpers.hasAccessibleName === 'function'
      ? helpers.hasAccessibleName
      : () => false;

  const allControlsRaw = queryAllSmart('input, textarea, select');
  const allControls = Array.isArray(allControlsRaw) ? allControlsRaw : [];

  const candidates = [];
  for (const el of allControls) {
    if (!el || typeof el !== 'object') continue;

    let type = '';
    try {
      if (typeof el.getAttribute === 'function') {
        const raw = el.getAttribute('type');
        type = raw == null ? '' : String(raw);
      }
    } catch {
      type = '';
    }

    const t = type.toLowerCase();
    if (t === 'hidden') continue;
    if (t === 'submit' || t === 'button' || t === 'reset' || t === 'image') continue;

    candidates.push(el);
  }

  if (!candidates.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: 'minor',
      occurrences: []
    };
  }

  const occurrencesFail = [];

  for (const el of candidates) {
    let hasName = false;
    try {
      hasName = !!hasAccessibleName(el);
    } catch {
      hasName = false;
    }

    if (hasName) continue;

    const fallbackTag = el && el.tagName ? String(el.tagName).toLowerCase() : 'html';
    const selector = buildSimpleSelector(el, fallbackTag);
    const html = getOuterHtmlSnippet(el);

    occurrencesFail.push({
      selector,
      html,
      summary: 'Form control has no accessible name.',
      hint: 'Provide an accessible name via a <label>, aria-label, or aria-labelledby.'
    });
  }

  if (occurrencesFail.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'critical',
      occurrences: occurrencesFail
    };
  }

  return {
    ruleId: rule.ruleId,
    outcome: 'pass',
    severity: 'minor',
    occurrences: []
  };
}

module.exports = { id, meta, runInPage };
