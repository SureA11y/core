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
 * - Control discovery goes through helpers.queryAllSmart/queryAll (multi-root
 *   and shadow-DOM aware), not a direct root/safeRoot DOM query -- ctx.root
 *   is an array (multi-region contextSelector support), not a single element.
 * - label[for] association uses a single precomputed Set of `for` values (document-wide, like original).
 * - getFocusableInfo is only invoked when role is presentational and thus relevant.
 * - aria-labelledby / aria-label helper resolution is only invoked when the attribute is present.
 *
 * WCAG mapping: matches technique H44 ("Using label elements to associate
 * text labels with form controls"), which WCAG's own Techniques document
 * lists as sufficient for 1.3.1, 3.3.2, AND 4.1.2 simultaneously — a label
 * that programmatically associates with a control conveys the
 * relationship (1.3.1), provides the instruction (3.3.2), and exposes the
 * accessible name (4.1.2) all at once. This rule was originally only wired
 * to 4.1.2, even though its own `tags` already listed wcag131/wcag332 and
 * wcag-facets.js already had matching facet ids under those SCs.
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
  wcagSc: ['1.3.1', '3.3.2', '4.1.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '1.3.1', title: 'Info and Relationships', conformanceLevel: 'A' },
    { standard: 'WCAG', version: '2.2', requirement: '3.3.2', title: 'Labels or Instructions', conformanceLevel: 'A' },
    { standard: 'WCAG', version: '2.2', requirement: '4.1.2', title: 'Name, Role, Value', conformanceLevel: 'A' }
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
  const { document, helpers, rule } = ctx;

  const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;
  const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  const getFocusableInfo = helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;
  const getAriaLabelInfo = helpers && typeof helpers.getAriaLabelInfo === 'function' ? helpers.getAriaLabelInfo : null;
  const getAriaLabelledByInfo =
    helpers && typeof helpers.getAriaLabelledByInfo === 'function' ? helpers.getAriaLabelledByInfo : null;

  const getAttributeInfo = helpers && typeof helpers.getAttributeInfo === 'function' ? helpers.getAttributeInfo : null;
  const getLabelMethod = helpers && typeof helpers.getLabelMethod === 'function' ? helpers.getLabelMethod : null;
  const getContentNameInfo = helpers && typeof helpers.getContentNameInfo === 'function' ? helpers.getContentNameInfo : null;
  const getAriaNameInfo = helpers && typeof helpers.getAriaNameInfo === 'function' ? helpers.getAriaNameInfo : null;

  // A <label> counts as an association if it contributes a name either via
  // its own aria-label/aria-labelledby (checked first, same ARIA-over-
  // content precedence any element's accessible name gives — verified
  // against a real page: <label aria-label="Toggle Navigation"><svg
  // aria-hidden="true">...</svg></label> names its control "Toggle
  // Navigation" even though the label's only child content is aria-hidden)
  // or, failing that, non-empty ACCESSIBLE content (getContentNameInfo
  // already excludes aria-hidden/display:none/inert descendants — a label
  // whose only text is aria-hidden gives the control no real accessible
  // name even though the structural association exists). See
  // dom-helpers.js's labelContributesAccessibleName for the primary
  // (shared-helper) path; this is the fallback-only mirror.
  function labelHasAccessibleContent(labelEl) {
    if (getAriaNameInfo) {
      try {
        const aria = getAriaNameInfo(labelEl, ctx);
        if (aria && aria.present && trim(aria.value)) return true;
      } catch {}
    }
    if (!getContentNameInfo) return true; // conservative: don't newly fail without the helper
    try {
      const info = getContentNameInfo(labelEl, ctx);
      return !!(info && info.present && trim(info.value));
    } catch {
      return true;
    }
  }

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

  // Build a document-wide Map of label[for] value -> label element once
  // (O(#labels) instead of O(#controls) selector queries). Keeps the
  // element reference (not just a presence flag) so hasLabelAssociation can
  // check the label's actual accessible content.
  const labelForMap = new Map();
  try {
    if (document && typeof document.getElementsByTagName === 'function') {
      const labels = document.getElementsByTagName('label');
      for (let i = 0; i < labels.length; i++) {
        const lab = labels[i];
        if (!lab || !lab.getAttribute) continue;
        const f = trim(lab.getAttribute('for'));
        if (f && !labelForMap.has(f)) labelForMap.set(f, lab);
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
    // 1) Native labels API — resolves both wrapping <label> and
    // <label for="id"> as real elements in one call.
    try {
      if (el && 'labels' in el && el.labels && el.labels.length) {
        return Array.prototype.some.call(el.labels, labelHasAccessibleContent);
      }
    } catch {}

    // 2) Wrapped by <label>
    try {
      if (el && el.closest) {
        const wrap = el.closest('label');
        if (wrap) return labelHasAccessibleContent(wrap);
      }
    } catch {}

    // 3) <label for="id">
    try {
      const idAttr = el && el.getAttribute ? trim(el.getAttribute('id')) : '';
      if (!idAttr) return false;
      const lab = labelForMap.get(idAttr);
      return !!lab && labelHasAccessibleContent(lab);
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

    // `placeholder` is only a valid name/hint source for text-entry input
    // types and <textarea> — not checkbox/radio/range/color/date/... or
    // <select>, which browsers/AT never read a placeholder from.
    const isPlaceholderCapable = (() => {
      try {
        const tag = (el.tagName || '').toLowerCase();
        if (tag === 'textarea') return true;
        if (tag !== 'input') return false;
        const type = trim(el.getAttribute('type') || 'text').toLowerCase() || 'text';
        return ['text', 'search', 'tel', 'url', 'email', 'password', 'number'].includes(type);
      } catch {
        return false;
      }
    })();

    const phV = isPlaceholderCapable && (getNonEmptyAttrViaHelper(el, 'placeholder') || (() => {
      try { return trim(el.getAttribute('placeholder')); } catch { return ''; }
    })());
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

  // Collect candidate nodes via the shared queryAllSmart/queryAll helpers
  // (multi-root/shadow-DOM-aware, cached) rather than raw safeRoot DOM
  // access -- safeRoot is ctx.root, which is an array with multi-region
  // contextSelector support and never had a .querySelectorAll/
  // .getElementsByTagName of its own to call directly.
  const nodes = [];
  try {
    const sel = 'input,select,textarea';
    const candidates = (helpers && typeof helpers.queryAllSmart === 'function')
      ? helpers.queryAllSmart(sel)
      : (helpers && typeof helpers.queryAll === 'function' ? helpers.queryAll(sel) : []);

    for (const el of (candidates || [])) {
      if (!el || !el.getAttribute) continue;
      const tag = (el.tagName || '').toLowerCase();
      if (tag === 'input') {
        const t = trim(el.getAttribute('type')).toLowerCase();
        // exclude hidden|submit|reset|button|image
        if (t === 'hidden' || t === 'submit' || t === 'reset' || t === 'button' || t === 'image') continue;
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
