'use strict';

/**
 * @rule form-control-explicit-label
 * @atomic true
 * @summary Applicable form controls should have an explicitly associated <label> element.
 *
 * @standard WCAG 2.2
 * @sc 1.3.1 Info and Relationships
 *
 * @standard EN 301 549 (Web)
 * @ref 9.1.3.1 Info and Relationships
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
 * - FAIL when an applicable form control has no explicitly associated <label> element (wrapping or for/id).
 * - PASS otherwise.
 *
 * @implementation-notes
 * - Atomic scope: this rule checks only the presence of an explicit <label> association.
 * - This rule does NOT consider aria-label/aria-labelledby sufficient (those are covered by the accessible-name rule).
 * - Shadow DOM: checks label association within the element's root (document or open shadow root).
 */

const id = 'form-control-explicit-label';

const meta = {
  title: 'Form controls should have an explicit <label> element',
  description: 'Fails when an applicable form control is not associated with a <label> element (wrapping or for/id).',
  helpUrl: null,
  tags: ['wcag2a', 'wcag131', 'forms', 'atomic'],
  wcagSc: ['1.3.1'],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {
    facetsBySc: {
      '1.3.1': ['programmatic-relationships']
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

  function escapeAttrValue(value) {
    // Minimal escaping for use inside CSS attribute selectors with quotes.
    // If CSS.escape is available, use it for better correctness.
    try {
      if (typeof window !== 'undefined' && window.CSS && typeof window.CSS.escape === 'function') {
        return window.CSS.escape(value);
      }
    } catch {
      // ignore
    }
    return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function hasExplicitLabel(el) {
    try {
      if (!el || typeof el !== 'object') return false;

      // Wrapped by a label (works across shadow boundaries within same tree)
      if (typeof el.closest === 'function') {
        const wrap = el.closest('label');
        if (wrap && typeof wrap.textContent === 'string' && wrap.textContent.trim()) return true;
      }

      // Associated label via for/id, scoped to the element's root (document or shadow root)
      const getAttr = typeof el.getAttribute === 'function' ? el.getAttribute.bind(el) : null;
      if (!getAttr) return false;
      const id = getAttr('id');
      if (!id || !String(id).trim()) return false;

      const rootNode = typeof el.getRootNode === 'function' ? el.getRootNode() : null;
      const scope = rootNode && typeof rootNode.querySelector === 'function' ? rootNode : document;

      const esc = escapeAttrValue(String(id).trim());
      let label = null;
      try {
        label = scope.querySelector('label[for="' + esc + '"]');
      } catch {
        // fallback without escaping
        try {
          label = scope.querySelector('label[for="' + String(id).trim() + '"]');
        } catch {
          label = null;
        }
      }
      if (label && typeof label.textContent === 'string' && label.textContent.trim()) return true;

      return false;
    } catch {
      return false;
    }
  }

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
    if (hasExplicitLabel(el)) continue;

    const fallbackTag = el && el.tagName ? String(el.tagName).toLowerCase() : 'html';
    const selector = buildSimpleSelector(el, fallbackTag);
    const html = getOuterHtmlSnippet(el);

    occurrencesFail.push({
      selector,
      html,
      summary: 'Form control has no explicit <label> element association.',
      hint: 'Associate a <label> by wrapping the control or using label[for] with a matching id.'
    });
  }

  if (occurrencesFail.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'serious',
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
