'use strict';

const id = 'label-in-name';

const meta = {
  title: 'Label in Name: accessible name contains visible text',
  description:
    'Checks that when a control has a visible text label, the accessible name (from aria-label/aria-labelledby) contains that visible label text (WCAG 2.5.3).',
  i18n: {
    titleKey: 'labelInName_title',
    descriptionKey: 'labelInName_description'
  },
  helpUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html',
  tags: ['wcag21a', 'wcag253', 'forms', 'atomic', 'automatic'],
  wcagSc: ['2.5.3'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.5.3',
      title: 'Label in Name',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '2.5.3': ['label-in-name'] } }
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const occurrences = [];
  let applicableCount = 0;

  // Applicability: focus/activation controls with explicit ARIA naming.
  // NOTE: aria-hidden is intentionally NOT excluded here; it does not affect visual rendering.
  const selector =
    ':is(button, a[href], summary, input:not([type="hidden"]), textarea, select, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="searchbox"], [role="tab"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"], [role="treeitem"], [role="gridcell"]):not([hidden]):not([disabled]):not([aria-disabled="true"]):is([aria-label], [aria-labelledby])';

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  function norm(s) {
    const v = s == null ? '' : String(s);
    // deterministic normalization: trim + collapse whitespace + case-fold
    return v.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function getElementDescriptor(el) {
    const tag = el && el.tagName ? String(el.tagName).toLowerCase() : 'element';
    let role;
    try {
      role = el && el.getAttribute ? el.getAttribute('role') || '' : '';
    } catch {
      role = '';
    }
    const r = String(role || '').trim();
    return r ? `${tag}[role="${r}"]` : tag;
  }

  function clipForSummary(s) {
    const v = (s == null ? '' : String(s)).replace(/\s+/g, ' ').trim();
    if (v.length <= 80) return v;
    return v.slice(0, 77) + '...';
  }

  function isNonRenderedTag(el) {
    const tn = el && el.tagName ? String(el.tagName).toLowerCase() : '';
    return (
      tn === 'script' ||
      tn === 'style' ||
      tn === 'template' ||
      tn === 'noscript' ||
      tn === 'meta' ||
      tn === 'link'
    );
  }

  function isDomVisible(el) {
    if (!el) return false;
    if (helpers.isDomVisibleEligible)
      return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
    if (helpers.getEligibilityInfo)
      return !!helpers.getEligibilityInfo(el, ctx, { targetSet: 'dom' }).eligible;
    return true;
  }

  // Unlike isDomVisible above, this also excludes aria-hidden subtrees.
  // Needed specifically for collectVisibleTextUnder's per-text-node check
  // below: an aria-hidden icon-font glyph (e.g. Material Icons' ligature
  // pattern, <mat-icon aria-hidden="true">format_color_fill</mat-icon>) is
  // technically DOM-visible pixels, but is never perceived by a sighted or
  // voice-control user as literal readable words the way real visible text
  // is — a widely-used reference engine's own label-content-name-mismatch check reaches the same
  // practical outcome via a canvas-based ligature-detection heuristic
  // (measuring rendered glyph shapes), not replicable here since this rule
  // runs against static markup with no real canvas/font rendering
  // available; excluding aria-hidden content is a cheaper, static-markup
  // signal that gets the common case (decorative icon fonts) right without
  // needing one (e.g. Angular Material's theme-picker button,
  // aria-label="Select a theme", with an aria-hidden icon that would
  // otherwise render literally as "format_color_fill").
  function isAccEligible(el) {
    if (!el) return false;
    const fn =
      helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;
    if (!fn) return isDomVisible(el);
    try {
      const r = fn(el, ctx);
      if (typeof r === 'boolean') return r;
      return !!(r && r.eligible);
    } catch {
      return isDomVisible(el);
    }
  }

  // DOM's NodeFilter.SHOW_TEXT constant, inlined as a numeric literal rather
  // than referencing the global NodeFilter object directly: runInPage must
  // have zero free vars (see docs/RULE_AUTHORING.md's free-var footgun) and
  // NodeFilter is not itself present in the execution realm this function
  // actually runs in, unlike window/document. Referencing the global
  // directly would silently make createTreeWalker throw on every call,
  // falling back to raw container.textContent (which respects none of
  // isNonRenderedTag/isDomVisible/isAccEligible below, since that whole
  // per-node loop is skipped in the fallback path). Same pattern already
  // used correctly in
  // region-manual.js's own createTreeWalker call.
  const SHOW_TEXT = 4;

  function collectVisibleTextUnder(container) {
    if (!container) return '';
    if (!isDomVisible(container)) return '';

    // TreeWalker is deterministic in document order.
    let walker;
    try {
      walker = document.createTreeWalker(container, SHOW_TEXT, null);
    } catch {
      walker = null;
    }
    if (!walker) {
      try {
        const t = container.textContent;
        return t == null ? '' : String(t);
      } catch {
        return '';
      }
    }

    const parts = [];
    let n;
    // eslint-disable-next-line no-cond-assign
    while ((n = walker.nextNode())) {
      try {
        const raw = n && n.nodeValue != null ? String(n.nodeValue) : '';
        const t = raw.replace(/\s+/g, ' ').trim();
        if (!t) continue;

        const p = n.parentElement || null;
        if (!p || !p.tagName) continue;
        if (isNonRenderedTag(p)) continue;

        // Require the parent element to be visually eligible AND not inside
        // an aria-hidden subtree (see isAccEligible's docblock above).
        if (!isAccEligible(p)) continue;

        parts.push(t);
      } catch {
        // no-throws
      }
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  function getAssociatedLabelElements(control) {
    const labels = [];
    try {
      if (control && control.labels && typeof control.labels.length === 'number') {
        for (const l of control.labels) labels.push(l);
      }
    } catch {
      // ignore
    }

    // Fallback: wrapped label
    try {
      const w = control && control.closest ? control.closest('label') : null;
      if (w) labels.push(w);
    } catch {
      // ignore
    }

    // Fallback: label[for=id]. Uses `document` directly rather than
    // ctx.root -- label[for] association is a document-wide relationship
    // (IDs are document-unique), not bounded by whatever contextSelector
    // region happens to be scanned, and ctx.root is an array (multi-region
    // contextSelector support), not a single element with its own
    // .querySelector to call directly.
    try {
      const idAttribute = control && control.getAttribute ? control.getAttribute('id') || '' : '';
      const key = String(idAttribute || '').trim();
      if (key && document && document.querySelector) {
        const l = document.querySelector('label[for="' + CSS.escape(key) + '"]');
        if (l) labels.push(l);
      }
    } catch {
      // ignore
    }

    // De-dupe in document order
    const seen = new Set();
    const out = [];
    for (const l of labels) {
      try {
        if (!l || !l.tagName) continue;
        if (seen.has(l)) continue;
        seen.add(l);
        out.push(l);
      } catch {
        // ignore
      }
    }
    return out;
  }

  function getVisibleTextLabelInfo(el) {
    // Returns { text, source } where source helps reporting.
    // Source policy (deterministic):
    // 1) <label> association for form controls
    // 2) visible text inside the element
    // 3) visible text from aria-labelledby referenced elements
    let text;
    let source = 'none';

    const tn = el && el.tagName ? String(el.tagName).toLowerCase() : '';

    // 1) Label association (native form controls)
    const isFormControl = tn === 'input' || tn === 'select' || tn === 'textarea';
    if (isFormControl) {
      const labels = getAssociatedLabelElements(el);
      const labelParts = [];
      for (const l of labels) {
        if (!l || !isDomVisible(l)) continue;
        const t = collectVisibleTextUnder(l);
        if (t) labelParts.push(t);
      }
      const joined = labelParts.join(' ').replace(/\s+/g, ' ').trim();
      if (joined) return { text: joined, source: 'label' };
    }

    // 2) Text inside the control itself
    text = collectVisibleTextUnder(el);
    if (text) return { text, source: 'self' };

    // 3) aria-labelledby referenced visible text (only if refs exist and are visible)
    try {
      const idrefs = el && el.getAttribute ? el.getAttribute('aria-labelledby') : null;
      if (idrefs && helpers.resolveIdRefs) {
        const r = helpers.resolveIdRefs(idrefs, ctx, { maxRefs: 8 });
        const parts = [];
        for (const ref of r && Array.isArray(r.refs) ? r.refs : []) {
          if (!ref || !ref.tagName) continue;
          if (!isDomVisible(ref)) continue;
          const t = collectVisibleTextUnder(ref);
          if (t) parts.push(t);
        }
        const joined = parts.join(' ').replace(/\s+/g, ' ').trim();
        if (joined) return { text: joined, source: 'aria-labelledby' };
      }
    } catch {
      // ignore
    }

    return { text: '', source };
  }

  for (const el of nodes) {
    // Gate: control must be visually rendered (SC is about visual labels).
    if (!isDomVisible(el)) continue;

    const labelInfo = getVisibleTextLabelInfo(el);
    const visibleLabel = labelInfo && labelInfo.text ? String(labelInfo.text) : '';
    const visibleNorm = norm(visibleLabel);

    // Applicability: only when we can deterministically extract visible label text.
    if (!visibleNorm) continue;

    applicableCount += 1;

    let acc = { present: false, value: '', mechanism: 'none', flags: [] };
    try {
      acc = helpers.getAccessibleNameInfo
        ? helpers.getAccessibleNameInfo(el, ctx, { maxRefs: 8 })
        : acc;
    } catch {
      acc = { present: false, value: '', mechanism: 'none', flags: ['exception'] };
    }
    const accName = acc && acc.value != null ? String(acc.value) : '';
    const accNorm = norm(accName);

    const contains = !!(accNorm && visibleNorm && accNorm.indexOf(visibleNorm) !== -1);

    if (!contains) {
      const selectorOut = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
      const html = helpers.getOuterHtmlSnippet
        ? helpers.getOuterHtmlSnippet(el)
        : el.outerHTML || '';

      occurrences.push({
        selector: selectorOut,
        html,
        summary: 'Accessible name does not contain the visible label text.',
        hint: 'Ensure the accessible name includes the visible text label (e.g., update aria-label/aria-labelledby to include the visible wording).',
        i18n: {
          summaryKey: 'labelInName_summary_fail',
          hintKey: 'labelInName_hint_fail',
          params: {
            element: getElementDescriptor(el),
            visibleLabel: clipForSummary(visibleLabel),
            labelSource: labelInfo && labelInfo.source ? labelInfo.source : 'none',
            nameMechanism: acc && acc.mechanism ? acc.mechanism : 'none'
          }
        },
        data: {
          details: {
            reasonCode: 'VISIBLE_LABEL_NOT_IN_ACCESSIBLE_NAME',
            visibleLabel,
            accessibleName: accName,
            normalized: { visibleLabel: visibleNorm, accessibleName: accNorm },
            labelSource: labelInfo && labelInfo.source ? labelInfo.source : 'none',
            nameMechanism: acc && acc.mechanism ? acc.mechanism : 'none'
          }
        }
      });
    }
  }

  if (applicableCount === 0)
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  if (occurrences.length)
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
