/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check form-control-programmatic-label-quality
 * @atomic true
 * @summary Form controls should have a label shown on screen
 * @standard WCAG 2.2
 * @sc 3.3.2
 * @applicability
 *   Applies to labelable native form controls exposed to assistive technologies:
 *     - input (excluding type=hidden|submit|reset|button|image)
 *     - select
 *     - textarea
 *   role="presentation"/"none" are excluded only when not focusable.
 *   Only controls that have a programmatic name count: a control with none
 *   is form-control-programmatic-label-present's finding, not
 *   a question about how good its name is.
 * @expectation
 *   If a control has a programmatic name, it should not come ONLY from:
 *     - placeholder (non-empty)
 *     - title (non-empty)
 *     - aria-label
 *     - aria-labelledby whose every referenced element is unrendered
 *       (hidden, display:none, visibility:hidden)
 *   Prefer an associated <label> or aria-labelledby pointing at visible text.
 * @reports
 *   - `labelMethod`: where the control's label comes from: `placeholder`,
 *     `title`, `aria-label` or `aria-labelledby`.
 *   - `reasonCode`: `label_from_placeholder_primary`, `label_from_title_primary`,
 *     `label_from_aria_label_only` or `label_from_hidden_labelledby`.
 *   - `sourceText`: the label text, up to 120 characters.
 * @note
 *   Mapped to SC 3.3.2 Labels or Instructions, not 4.1.2: a control named
 *   by title or placeholder has an accessible name, so 4.1.2 is met (WCAG
 *   lists title as sufficient technique H65), but 3.3.2's label is "presented
 *   to all users", which a title (shown only on hover) and a placeholder
 *   (gone once the user types) are not. IBM Equal Access maps its visible-
 *   label check to 3.3.2 the same way. It replaces label-title-only, whose
 *   findings were a subset of this rule's.
 *
 *   aria-label and aria-labelledby to hidden text are flagged as IBM Equal
 *   Access's input_label_visible flags them, as a potential issue: visible
 *   text beside the control that is not linked to it still meets 3.3.2,
 *   and markup can't tell. Two scope choices also match IBM: a visually
 *   hidden (clipped) <label> or aria-labelledby target is not flagged, since
 *   that text was placed on purpose and often repeats a visible cue; and
 *   aria-labelledby with at least one rendered target is not flagged.
 *   axe and Alfa have no equivalent check.
 */

const id = 'form-control-programmatic-label-quality';

const meta = {
  title: 'Form controls should have a label shown on screen',
  description:
    'Flags form controls whose accessible name comes from placeholder, title, aria-label, or aria-labelledby pointing only at hidden text, none of which is a label shown on screen. Prefer a visible <label>, or aria-labelledby pointing at visible text.',
  i18n: {
    titleKey: 'formControl_programmaticLabelQuality_title',
    descriptionKey: 'formControl_programmaticLabelQuality_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag332', 'forms', 'labels', 'quality', 'atomic', 'manual'],
  wcagSc: ['3.3.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '3.3.2',
      title: 'Labels or Instructions',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'understandable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {
    facetsBySc: {
      '3.3.2': ['form-control-visible-label-quality']
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

  const isDomVisibleEligible =
    helpers && typeof helpers.isDomVisibleEligible === 'function'
      ? helpers.isDomVisibleEligible
      : null;

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
  // custom); see createDomHelpers's own getLabelMethod, which implements
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

  // Whether any element aria-labelledby points at is rendered. Style only,
  // so visually hidden (clipped) text counts as rendered, as it does for a
  // visually hidden <label>: someone placed that text on purpose, and markup
  // can't tell whether it repeats a visible cue.
  function hasRenderedLabelledByRef(el) {
    const ids = trim(el.getAttribute('aria-labelledby')).split(/\s+/).filter(Boolean);
    const scope =
      el.getRootNode && typeof el.getRootNode().getElementById === 'function'
        ? el.getRootNode()
        : document;
    for (const refId of ids) {
      const ref = scope.getElementById(refId);
      if (!ref) continue;
      if (!isDomVisibleEligible) return true;
      try {
        const r = isDomVisibleEligible(ref, ctx, {
          visibilityMode: 'styleOnly',
          ignoreOpacity: true
        });
        if (r && r.eligible) return true;
      } catch {
        return true;
      }
    }
    return false;
  }

  // Native controls only
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

    const label = getLabelMethodSafe(el);
    const method = label && typeof label.method === 'string' ? label.method : 'none';
    if (Object.prototype.hasOwnProperty.call(metrics.byMethod, method))
      metrics.byMethod[method] += 1;
    else metrics.byMethod.none += 1;
    if (method === 'none') continue;

    metrics.applicableCount += 1;

    const isWeakPrimary = method === 'title' || method === 'placeholder';
    const isUnseenName =
      method === 'aria-label' || (method === 'aria-labelledby' && !hasRenderedLabelledByRef(el));
    if (!isWeakPrimary && !isUnseenName) continue;

    metrics.flaggedCount += 1;

    const vf = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;
    const element = (el.tagName || '').toLowerCase();
    const sourceText = label && label.value ? String(label.value).slice(0, 120) : '';

    let reasonCode;
    let message;
    if (isWeakPrimary) {
      reasonCode =
        method === 'title' ? 'label_from_title_primary' : 'label_from_placeholder_primary';
      message = {
        summary: `Form control’s primary label is derived from ${method}.`,
        hint: 'Prefer a persistent <label> or aria-labelledby. Avoid relying on placeholder/title as the primary label.',
        summaryKey: 'formControl_programmaticLabelQuality_summary_cantTell',
        hintKey: 'formControl_programmaticLabelQuality_hint_cantTell'
      };
    } else {
      reasonCode =
        method === 'aria-label' ? 'label_from_aria_label_only' : 'label_from_hidden_labelledby';
      message = {
        summary: `Form control’s name comes from ${method}, which is not shown on screen.`,
        hint: 'Check that a visible label or instruction sits next to the control. If there is none, add a <label> or point aria-labelledby at visible text.',
        summaryKey: 'formControl_programmaticLabelQuality_summary_unseenName',
        hintKey: 'formControl_programmaticLabelQuality_hint_unseenName'
      };
    }

    const baseOccurrence = {
      summary: message.summary,
      hint: message.hint,
      i18n: {
        summaryKey: message.summaryKey,
        hintKey: message.hintKey,
        params: { element, method }
      },
      data: {
        visibilityFilter: vf || { targetSet: 'acc', accEligible: null, reasons: [] },
        details: {
          reasonCode,
          labelMethod: method,
          labelStrength: isWeakPrimary ? 'weak' : 'medium',
          recommendedMethods: ['label', 'aria-labelledby'],
          sourceText
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

  // No named control relies on title or placeholder as its primary label.
  return {
    ruleId: rule.ruleId,
    outcome: 'pass',
    severity: 'minor',
    occurrences: [],
    data: { details: { metrics } }
  };
}

module.exports = { id, meta, runInPage };
