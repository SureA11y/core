'use strict';

/**
 * Optimized, regression-safe rewrite of:
 * a11ycore-form-control-programmatic-label-present
 *
 * Goals:
 * - Preserve semantics, schema, determinism, and no-throw behavior.
 * - Reduce per-element DOM queries and avoid unnecessary helper calls.
 *
 * Key safety points:
 * - Control discovery remains scoped to `root || document` (same as original).
 * - label[for] association uses a single precomputed Set of `for` values (document-wide, like original).
 * - getFocusableInfo is only invoked when role is presentational and thus relevant.
 * - aria-labelledby / aria-label helper resolution is only invoked when the attribute is present.
 */

const id = 'a11ycore-form-control-programmatic-label-present';

const meta = {
  title: 'Form controls must have a programmatic label',
  description:
    'Checks that form controls have a programmatic label via <label>, aria-label, aria-labelledby, title, or placeholder.',
  i18n: {
    titleKey: 'a11ycore_formControl_programmaticLabelPresent_title',
    descriptionKey: 'a11ycore_formControl_programmaticLabelPresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag131', 'wcag332', 'wcag412', 'forms', 'labels', 'atomic', 'automatic'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '4.1.2', title: 'Name, Role, Value', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {
    facetsBySc: {
      '4.1.2': ['form-control-name-present']
    }
  }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;
  const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;
  const getAriaLabelInfo = helpers && typeof helpers.getAriaLabelInfo === 'function' ? helpers.getAriaLabelInfo : null;
  const getAriaLabelledByInfo =
    helpers && typeof helpers.getAriaLabelledByInfo === 'function' ? helpers.getAriaLabelledByInfo : null;

  const getAttributeInfo = helpers && typeof helpers.getAttributeInfo === 'function' ? helpers.getAttributeInfo : null;
  const getLabelMethod = helpers && typeof helpers.getLabelMethod === 'function' ? helpers.getLabelMethod : null;

  const trim = (v) => (v == null ? '' : String(v)).trim();

  const metrics = {
    applicableCount: 0,
    passCount: 0,
    failCount: 0,
    byMethod: { label: 0, 'aria-labelledby': 0, 'aria-label': 0, title: 0, placeholder: 0, none: 0 },
    weakPassCount: 0
  };

  function getLabelStrength(method) {
    if (method === 'label' || method === 'aria-labelledby') return 'strong';
    if (method === 'aria-label') return 'medium';
    if (method === 'title' || method === 'placeholder') return 'weak';
    return 'none';
  }

  function getNonEmptyAttrViaHelper(el, name) {
    if (!getAttributeInfo) return '';
    try {
      const info = getAttributeInfo(el, name);
      return info && info.present ? trim(info.value) : '';
    } catch {
      return '';
    }
  }

  // Build a document-wide Set of label[for] values once (O(#labels) instead of O(#controls) selector queries).
  // This matches original semantics, which queried `document.querySelector(label[for="id"])`.
  const labelForSet = new Set();
  try {
    if (document && typeof document.getElementsByTagName === 'function') {
      const labels = document.getElementsByTagName('label');
      for (let i = 0; i < labels.length; i++) {
        const lab = labels[i];
        if (!lab || !lab.getAttribute) continue;
        const f = trim(lab.getAttribute('for'));
        if (f) labelForSet.add(f);
      }
    }
  } catch {
    // no-throw
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

  function hasLabelAssociation(el) {
    // 1) Native labels API
    try {
      if (el && 'labels' in el && el.labels && el.labels.length) return true;
    } catch {}

    // 2) Wrapped by <label>
    try {
      if (el && el.closest) {
        const wrap = el.closest('label');
        if (wrap) return true;
      }
    } catch {}

    // 3) <label for="id">
    try {
      const idAttr = el && el.getAttribute ? trim(el.getAttribute('id')) : '';
      if (!idAttr) return false;
      return labelForSet.has(idAttr);
    } catch {
      return false;
    }
  }

  function computeLabelMethodFallback(el) {
    // Deterministic priority order
    if (hasLabelAssociation(el)) return { method: 'label', value: '' };

    // Only resolve aria-labelledby if attribute exists
    let raw = '';
    try {
      raw = el && el.getAttribute ? trim(el.getAttribute('aria-labelledby')) : '';
    } catch {
      raw = '';
    }
    if (raw && getAriaLabelledByInfo) {
      try {
        const info = getAriaLabelledByInfo(el, ctx, { maxRefs: 8 });
        const v = info && info.present ? trim(info.value) : '';
        if (v) return { method: 'aria-labelledby', value: v };
      } catch {}
    }

    // Only resolve aria-label if attribute exists
    raw = '';
    try {
      raw = el && el.getAttribute ? trim(el.getAttribute('aria-label')) : '';
    } catch {
      raw = '';
    }
    if (raw && getAriaLabelInfo) {
      try {
        const info = getAriaLabelInfo(el, ctx);
        const v = info && info.present ? trim(info.value) : '';
        if (v) return { method: 'aria-label', value: v };
      } catch {}
    }

    // title / placeholder
    const titleV = getNonEmptyAttrViaHelper(el, 'title') || (() => {
      try { return trim(el.getAttribute('title')); } catch { return ''; }
    })();
    if (titleV) return { method: 'title', value: titleV };

    const phV = getNonEmptyAttrViaHelper(el, 'placeholder') || (() => {
      try { return trim(el.getAttribute('placeholder')); } catch { return ''; }
    })();
    if (phV) return { method: 'placeholder', value: phV };

    return { method: 'none', value: '' };
  }

  function getLabelMethodSafe(el) {
    if (getLabelMethod) {
      try {
        const r = getLabelMethod(el, ctx);
        const m = r && typeof r.method === 'string' ? r.method : 'none';
        const v = r && r.value != null ? trim(r.value) : '';
        if (!Object.prototype.hasOwnProperty.call(metrics.byMethod, m)) return { method: 'none', value: '' };
        return { method: m, value: v };
      } catch {
        // fall through
      }
    }
    return computeLabelMethodFallback(el);
  }

  // Collect nodes scoped to safeRoot (matching original semantics).
  // Prefer getElementsByTagName (fast) when available on the root.
  const nodes = [];
  try {
    const rootHasGetByTag = safeRoot && typeof safeRoot.getElementsByTagName === 'function';

    const pushInputs = (coll) => {
      for (let i = 0; i < coll.length; i++) {
        const el = coll[i];
        if (!el || !el.getAttribute) continue;
        const t = trim(el.getAttribute('type')).toLowerCase();
        // exclude hidden|submit|reset|button|image
        if (t === 'hidden' || t === 'submit' || t === 'reset' || t === 'button' || t === 'image') continue;
        nodes.push(el);
      }
    };

    const pushAll = (coll) => {
      for (let i = 0; i < coll.length; i++) {
        const el = coll[i];
        if (el) nodes.push(el);
      }
    };

    if (rootHasGetByTag) {
      pushInputs(safeRoot.getElementsByTagName('input'));
      pushAll(safeRoot.getElementsByTagName('select'));
      pushAll(safeRoot.getElementsByTagName('textarea'));
    } else if (safeRoot && typeof safeRoot.querySelectorAll === 'function') {
      // fallback: match original selector
      const sel =
        'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]):not([type="image"]),select,textarea';
      const list = safeRoot.querySelectorAll(sel);
      for (let i = 0; i < list.length; i++) nodes.push(list[i]);
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
    let role = '';
    try {
      role = trim(el.getAttribute('role')).toLowerCase();
    } catch {
      role = '';
    }

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

    const vf = getEligibilityInfo ? (() => { try { return getEligibilityInfo(el, ctx, { targetSet: 'acc' }); } catch { return null; } })() : null;

    const baseOccurrence = {
      summary: 'Form control is missing a programmatic label.',
      hint: 'Provide a <label> association, aria-label, aria-labelledby, title, or placeholder.',
      i18n: {
        summaryKey: 'a11ycore_formControl_programmaticLabelPresent_summary_fail',
        hintKey: 'a11ycore_formControl_programmaticLabelPresent_hint_fail',
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
