/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Control discovery goes through helpers.queryAllSmart/queryAll (multi-root
 * and shadow-DOM aware), not a direct root/safeRoot DOM query -- ctx.root
 * is an array (multi-region contextSelector support), not a single element.
 * Label-method resolution (label/aria-labelledby/aria-label/title/
 * placeholder priority) delegates entirely to the shared dom-helpers
 * bundle's getLabelMethod, which dom-runner.js always provides to every
 * rule execution -- see getLabelMethodSafe below.
 *
 * WCAG mapping: matches technique H44 ("Using label elements to associate
 * text labels with form controls"), which WCAG's own Techniques document
 * lists as sufficient for 1.3.1, 3.3.2, AND 4.1.2 simultaneously — a label
 * that programmatically associates with a control conveys the
 * relationship (1.3.1), provides the instruction (3.3.2), and exposes the
 * accessible name (4.1.2) all at once. This rule was originally only wired
 * to 4.1.2, even though its own `tags` already listed wcag131/wcag332 and
 * wcag-facets.js already had matching facet ids under those SCs.
 *
 * @applicability
 *   Applies to <input>, <select> and <textarea> elements included in the
 *   accessibility tree, excluding the input types hidden, submit, reset,
 *   button and image, which take their name from a value or alt attribute
 *   rather than from a label. A control carrying
 *   an explicit ARIA widget role is out of scope — button, checkbox,
 *   combobox, listbox, textbox, slider and the rest of ROLE_OWNED_ELSEWHERE
 *   each have a naming rule of their own — and role="presentation"/"none"
 *   removes a control unless it is still tabbable.
 * @expectation
 *   Each applicable control carries a programmatic label by one of the
 *   mechanisms helpers.getLabelMethod resolves, in its priority order: an
 *   associated <label>, aria-labelledby, aria-label, title, then
 *   placeholder. Any of the five satisfies this rule. Whether the weaker two
 *   are an appropriate primary label is a separate question, asked by
 *   form-control-programmatic-label-quality.
 */

const id = 'form-control-programmatic-label-present';

const meta = {
  title: 'Form controls must have a programmatic label',
  description:
    'Checks that form controls have a programmatic label via <label>, aria-label, aria-labelledby, title, or placeholder.',
  i18n: {
    titleKey: 'formControl_programmaticLabelPresent_title',
    descriptionKey: 'formControl_programmaticLabelPresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag131', 'wcag332', 'wcag412', 'forms', 'labels', 'atomic', 'automatic'],
  wcagSc: ['1.3.1', '3.3.2', '4.1.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.3.1',
      title: 'Info and Relationships',
      conformanceLevel: 'A'
    },
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '3.3.2',
      title: 'Labels or Instructions',
      conformanceLevel: 'A'
    },
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '4.1.2',
      title: 'Name, Role, Value',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {
    facetsBySc: {
      '1.3.1': ['form-control-programmatic-label-present'],
      '3.3.2': ['form-control-labels-or-instructions-present'],
      '4.1.2': ['form-control-name-present']
    }
  }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  // ACT e086e5 applies only to controls included in the accessibility tree, so
  // a focusable control inside aria-hidden is out of scope; aria-hidden-focus
  // reports that markup instead.
  const isEligibleHelper =
    helpers && typeof helpers.isIncludedInAccessibilityTree === 'function'
      ? helpers.isIncludedInAccessibilityTree
      : helpers && typeof helpers.isAccTreeEligible === 'function'
        ? helpers.isAccTreeEligible
        : null;
  const getEligibilityInfo =
    helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  const getFocusableInfo =
    helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;
  const getLabelMethod =
    helpers && typeof helpers.getLabelMethod === 'function' ? helpers.getLabelMethod : null;

  const trim = (v) => (v == null ? '' : String(v)).trim();

  // Roles with their own *-name-present rule; a control carrying one
  // explicitly is skipped here so it is reported once.
  const ROLE_OWNED_ELSEWHERE = [
    'alertdialog',
    'button',
    'checkbox',
    'combobox',
    'dialog',
    'grid',
    'link',
    'listbox',
    'menu',
    'menubar',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'meter',
    'option',
    'progressbar',
    'radio',
    'radiogroup',
    'scrollbar',
    'searchbox',
    'slider',
    'spinbutton',
    'switch',
    'tab',
    'tablist',
    'textbox',
    'toolbar',
    'tooltip',
    'tree',
    'treeitem'
  ];

  const metrics = {
    applicableCount: 0,
    passCount: 0,
    failCount: 0,
    byMethod: {
      label: 0,
      'aria-labelledby': 0,
      'aria-label': 0,
      title: 0,
      placeholder: 0,
      none: 0
    },
    weakPassCount: 0
  };

  function getLabelStrength(method) {
    if (method === 'label' || method === 'aria-labelledby') return 'strong';
    if (method === 'aria-label') return 'medium';
    if (method === 'title' || method === 'placeholder') return 'weak';
    return 'none';
  }

  function isEligibleAcc(el) {
    if (!isEligibleHelper) return true;
    try {
      const r = isEligibleHelper(el, ctx);
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

  // Collect candidate nodes via the shared queryAllSmart/queryAll helpers
  // (multi-root/shadow-DOM-aware, cached) rather than raw safeRoot DOM
  // access -- safeRoot is ctx.root, which is an array with multi-region
  // contextSelector support and never had a .querySelectorAll/
  // .getElementsByTagName of its own to call directly.
  const nodes = [];
  try {
    const sel = 'input,select,textarea';
    const candidates =
      helpers && typeof helpers.queryAllSmart === 'function'
        ? helpers.queryAllSmart(sel)
        : helpers && typeof helpers.queryAll === 'function'
          ? helpers.queryAll(sel)
          : [];

    for (const el of candidates || []) {
      if (!el || !el.getAttribute) continue;
      const tag = (el.tagName || '').toLowerCase();
      if (tag === 'input') {
        const t = trim(el.getAttribute('type')).toLowerCase();
        // exclude hidden|submit|reset|button|image
        if (t === 'hidden' || t === 'submit' || t === 'reset' || t === 'button' || t === 'image')
          continue;
      }
      nodes.push(el);
    }
  } catch {
    // no-throw
  }

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

  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i];
    if (!el || !el.getAttribute) continue;

    if (!isEligibleAcc(el)) continue;

    // role="presentation"/"none" exclusion only when NOT focusable
    let role;
    try {
      role = trim(el.getAttribute('role')).toLowerCase();
    } catch {
      role = '';
    }

    if (role && ROLE_OWNED_ELSEWHERE.indexOf(role) !== -1) continue;

    if (role === 'presentation' || role === 'none') {
      const fi = getFocusableInfo
        ? (() => {
            try {
              return getFocusableInfo(el, ctx);
            } catch {
              return null;
            }
          })()
        : null;
      const tabbable = !!(fi && fi.tabbable);
      if (!tabbable) continue;
    }

    metrics.applicableCount += 1;

    const label = getLabelMethodSafe(el);
    if (Object.prototype.hasOwnProperty.call(metrics.byMethod, label.method)) {
      metrics.byMethod[label.method] += 1;
    } else {
      metrics.byMethod.none += 1;
    }

    const strength = getLabelStrength(label.method);
    const ok = label.method !== 'none';

    if (ok) {
      metrics.passCount += 1;
      if (strength === 'weak') metrics.weakPassCount += 1;
      continue;
    }

    metrics.failCount += 1;

    const vf = getEligibilityInfo
      ? (() => {
          try {
            return getEligibilityInfo(el, ctx, { targetSet: 'acc' });
          } catch {
            return null;
          }
        })()
      : null;

    const baseOccurrence = {
      summary: 'Form control is missing a programmatic label.',
      hint: 'Provide a <label> association, aria-label, aria-labelledby, title, or placeholder.',
      i18n: {
        summaryKey: 'formControl_programmaticLabelPresent_summary_fail',
        hintKey: 'formControl_programmaticLabelPresent_hint_fail',
        params: { element: (el.tagName || '').toLowerCase() }
      },
      data: {
        visibilityFilter: vf
          ? { targetSet: vf.targetSet, accEligible: vf.accEligible, reasons: vf.reasons }
          : { targetSet: 'acc', accEligible: null, reasons: [] },
        details: {
          reasonCode: 'missing_programmatic_label',
          labelMethod: 'none',
          labelStrength: 'none'
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
      outcome: 'fail',
      severity: rule.defaultSeverity || 'minor',
      occurrences,
      data: { details: { metrics } }
    };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'pass',
    severity: 'minor',
    occurrences: [],
    data: { details: { metrics } }
  };
}

module.exports = { id, meta, runInPage };
