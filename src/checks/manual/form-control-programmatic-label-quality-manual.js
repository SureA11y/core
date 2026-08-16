/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check form-control-programmatic-label-quality
 * @atomic true
 * @summary Form controls should not rely on placeholder or title as the primary label
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to labelable native form controls exposed to assistive technologies:
 *     - input (excluding type=hidden|submit|reset|button|image)
 *     - select
 *     - textarea
 *   role="presentation"/"none" are excluded only when not focusable.
 * @expectation
 *   If a control has a programmatic name, it should not rely ONLY on:
 *     - placeholder (non-empty)
 *     - title (non-empty)
 *   Prefer an associated <label> or aria-labelledby.
 * @note
 *   This is a quality/best-practice signal. Controls may still meet SC 4.1.2
 *   while relying on placeholder/title; this rule surfaces that risk as cantTell.
 */

const id = 'form-control-programmatic-label-quality';

const meta = {
  title: 'Form controls should not rely on placeholder or title as the primary label',
  description:
    'Flags form controls whose computed accessible name relies on placeholder or title as the primary labeling method. Prefer <label> or aria-labelledby.',
  i18n: {
    titleKey: 'formControl_programmaticLabelQuality_title',
    descriptionKey: 'formControl_programmaticLabelQuality_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'forms', 'labels', 'quality', 'atomic', 'manual'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '4.1.2',
      title: 'Name, Role, Value',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {
    facetsBySc: {
      '4.1.2': ['form-control-name-quality']
    }
  }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart =
    helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;
  const getEligibilityInfo =
    helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  const getFocusableInfo =
    helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;

  const getLabelMethod =
    helpers && typeof helpers.getLabelMethod === 'function' ? helpers.getLabelMethod : null;

  const trim = (v) => (v == null ? '' : String(v)).trim();

  const metrics = {
    applicableCount: 0,
    flaggedCount: 0,
    byMethod: { label: 0, 'aria-labelledby': 0, 'aria-label': 0, title: 0, placeholder: 0, none: 0 }
  };

  function safeQueryAll(sel) {
    try {
      if (queryAllSmart) return Array.from(queryAllSmart(sel) || []);
      return safeRoot && safeRoot.querySelectorAll
        ? Array.from(safeRoot.querySelectorAll(sel))
        : [];
    } catch {
      return [];
    }
  }

  function isEligibleAcc(el) {
    if (!isAccTreeEligible) return true;
    try {
      const r = isAccTreeEligible(el, ctx);
      if (typeof r === 'boolean') return r;
      return !!(r && r.eligible);
    } catch {
      return true;
    }
  }

  // getLabelMethod is provided by the shared dom-helpers bundle that
  // dom-runner.js always constructs for every rule execution (built-in or
  // custom) — see createDomHelpers's own getLabelMethod, which implements
  // this exact <label>/aria-labelledby/aria-label/title/placeholder
  // priority order. No local reimplementation is needed as a fallback.
  function getLabelMethodSafe(el) {
    if (!getLabelMethod) return { method: 'none', value: '' };
    try {
      const r = getLabelMethod(el, ctx);
      const m = r && typeof r.method === 'string' ? r.method : 'none';
      const v = r && r.value != null ? trim(r.value) : '';
      if (!Object.prototype.hasOwnProperty.call(metrics.byMethod, m))
        return { method: 'none', value: '' };
      return { method: m, value: v };
    } catch {
      return { method: 'none', value: '' };
    }
  }

  // Native controls only (same as your current rule)
  const selector =
    'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="image"]),select,textarea';

  const nodes = safeQueryAll(selector);

  if (!nodes.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: 'minor',
      occurrences: [],
      data: { details: { metrics } }
    };
  }

  const occurrences = [];

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    if (!isEligibleAcc(el)) continue;

    const role = (() => {
      try {
        return trim(el.getAttribute('role')).toLowerCase();
      } catch {
        return '';
      }
    })();

    let fi = null;
    if (getFocusableInfo) {
      try {
        fi = getFocusableInfo(el, ctx);
      } catch {
        fi = null;
      }
    }
    const tabbable = !!(fi && fi.tabbable);

    if ((role === 'presentation' || role === 'none') && !tabbable) continue;

    metrics.applicableCount += 1;

    const label = getLabelMethodSafe(el);
    const method = label && typeof label.method === 'string' ? label.method : 'none';
    if (Object.prototype.hasOwnProperty.call(metrics.byMethod, method))
      metrics.byMethod[method] += 1;
    else metrics.byMethod.none += 1;

    // Flag only when the *primary* (best) method is title/placeholder
    const isWeakPrimary = method === 'title' || method === 'placeholder';
    if (!isWeakPrimary) continue;

    metrics.flaggedCount += 1;

    const vf = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    const reasonCode =
      method === 'title' ? 'label_from_title_primary' : 'label_from_placeholder_primary';
    const baseOccurrence = {
      summary: `Form control’s primary label is derived from ${method}.`,
      hint: 'Prefer a persistent <label> or aria-labelledby. Avoid relying on placeholder/title as the primary label.',
      i18n: {
        summaryKey: 'formControl_programmaticLabelQuality_summary_cantTell',
        hintKey: 'formControl_programmaticLabelQuality_hint_cantTell',
        params: { element: (el.tagName || '').toLowerCase(), method }
      },
      data: {
        visibilityFilter: vf || { targetSet: 'acc', accEligible: null, reasons: [] },
        details: {
          reasonCode,
          labelMethod: method,
          labelStrength: 'weak',
          recommendedMethods: ['label', 'aria-labelledby'],
          sourceText: label && label.value ? String(label.value).slice(0, 120) : ''
        }
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      occurrences.push({ selector: '', html: '', ...baseOccurrence });
    }
  }

  if (metrics.applicableCount === 0) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: 'minor',
      occurrences: [],
      data: { details: { metrics } }
    };
  }

  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'minor',
      occurrences,
      data: { details: { metrics } }
    };
  }

  // Manual rules may only emit cantTell/notApplicable (never pass/fail) —
  // no applicable control relied on a weak (title/placeholder) primary
  // label, so there is nothing to flag for review.
  return {
    ruleId: rule.ruleId,
    outcome: 'notApplicable',
    severity: 'minor',
    occurrences: [],
    data: { details: { metrics } }
  };
}

module.exports = { id, meta, runInPage };
