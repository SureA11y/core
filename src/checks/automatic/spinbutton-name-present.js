/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check spinbutton-name-present
 * @atomic true
 * @summary Elements with role="spinbutton" must have an accessible name
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to elements whose role attribute resolves to spinbutton: its first
 *   token naming a known role, matched in any case, is spinbutton, so
 *   role="foo spinbutton" and role="SPINBUTTON" count while role="link spinbutton"
 *   (a link) does not. The element must be included in the
 *   accessibility tree. An element with the matching implicit role but no
 *   role attribute is out of scope.
 *   A custom element whose ElementInternals give it the role
 *   (this.attachInternals().role), with no role attribute naming another, is
 *   in scope too: that is its default role, and no other rule checks it.
 * @expectation
 *   The element has a non-empty accessible name from aria-label, from an
 *   aria-labelledby that resolves to non-empty text, or from title.
 *   role="spinbutton" is name-from-author-only, so subtree text is never
 *   accepted: text sitting inside a custom spinbutton widget is not reliably
 *   exposed as its name. On a labelable element (<input role="spinbutton">)
 *   an associated <label> counts as well.
 *   On a text-like <input> or a <textarea>, the placeholder counts last
 *   (HTML-AAM's final name source): a placeholder-only label is a 3.3.2
 *   question, not a missing name.
 */

const id = 'spinbutton-name-present';

const meta = {
  title: 'Spinbuttons have an accessible name',
  description: 'Checks that elements with role="spinbutton" expose a non-empty accessible name.',
  i18n: {
    titleKey: 'spinbuttonNamePresent_title',
    descriptionKey: 'spinbuttonNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'forms', 'atomic', 'automatic', 'name', 'spinbutton'],
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
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['spinbutton-name-present'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;
  const getEligibilityInfo =
    helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getAttr(el, name) {
    try {
      if (!el || !dom.get(el, 'getAttribute')) return '';
      return normalizeWs(dom.getAttribute(el, name));
    } catch {
      return '';
    }
  }

  // The name the control's associated <label>s give it, in document order,
  // each read as accname reads a label (helpers.getAssociatedLabelsNameInfo).
  function getNativeLabelText(el) {
    if (!helpers || typeof helpers.getAssociatedLabelsNameInfo !== 'function') return '';
    try {
      const info = helpers.getAssociatedLabelsNameInfo(el, ctx);
      return normalizeWs(info && info.value);
    } catch {
      return '';
    }
  }

  function resolveAriaLabelledbyText(document, el, maxRefs) {
    const raw = getAttr(el, 'aria-labelledby');
    if (!raw) {
      // References a script set as elements (el.ariaLabelledByElements)
      // leave the attribute empty; the shared helper reads them.
      if (helpers.getAriaLabelledByInfo) {
        try {
          const info = helpers.getAriaLabelledByInfo(el, ctx, { maxRefs: maxRefs || 8 });
          return normalizeWs(info && info.value);
        } catch {}
      }
      return '';
    }
    // Delegates to the shared getTextFromIdRefs helper instead of computing
    // name-from-content of the referenced element, see dialog-name-
    // present.js's identical fix for the full rationale (an <iframe>
    // aria-labelledby target's only name source is its title attribute,
    // which name-from-content alone can never see).
    if (helpers.getTextFromIdRefs) {
      try {
        const r = helpers.getTextFromIdRefs(raw, ctx, { maxRefs: maxRefs || 8 }, el);
        return normalizeWs(r && r.text);
      } catch {}
    }
    return '';
  }

  // Naming rules apply only to elements included in the accessibility tree
  // (ACT c487ae and siblings), which excludes focusable aria-hidden content.
  // aria-hidden-focus (ACT 6cfa84) covers that markup instead.
  function isEligibleAcc(helpers, el, ctx) {
    const fn =
      helpers && typeof helpers.isIncludedInAccessibilityTree === 'function'
        ? helpers.isIncludedInAccessibilityTree
        : helpers && typeof helpers.isAccTreeEligible === 'function'
          ? helpers.isAccTreeEligible
          : null;
    if (!fn) return true;
    try {
      const r = fn(el, ctx);
      if (typeof r === 'boolean') return r;
      return !!(r && r.eligible);
    } catch {
      return true;
    }
  }

  const occurrences = [];
  // Custom elements whose internals no script can read (internalsQuestion).
  const questions = [];
  let applicableCount = 0;

  // role is a fallback list matched in any case: select by token, then keep
  // only elements whose resolved role is spinbutton (role="link spinbutton" is a link).
  const selector = '[role~="spinbutton" i]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector, { internalsRoles: true })
    : helpers.queryAll(selector);

  function hasName(el) {
    const ariaLabel = getAttr(el, 'aria-label');
    if (ariaLabel) return { ok: true, method: 'aria-label' };

    const labelled = resolveAriaLabelledbyText(document, el, 8);
    if (labelled) return { ok: true, method: 'aria-labelledby' };

    const title = getAttr(el, 'title');
    if (title) return { ok: true, method: 'title' };

    // Native <label> association (e.g. <input role="spinbutton">).
    const lab = getNativeLabelText(el);
    if (lab) return { ok: true, method: 'label' };

    // HTML-AAM's last name source for a text-like <input> or a <textarea>,
    // after title: the placeholder. A placeholder-only label is a 3.3.2
    // question, not a missing name.
    if (helpers.getNativeHostNameInfo) {
      try {
        const host = helpers.getNativeHostNameInfo(el, ctx, { placeholder: true });
        if (host && host.present) return { ok: true, method: host.mechanism };
      } catch {}
    }

    // role="spinbutton" is name-from-author-only per WAI-ARIA: it must NOT
    // fall back to subtree content.
    return { ok: false, method: 'none' };
  }

  for (const el of nodes) {
    if (!el) continue;
    if (helpers.aria.getAuthorRole(el) !== 'spinbutton') continue;
    if (!isEligibleAcc(helpers, el, ctx)) continue;

    applicableCount += 1;

    const res = hasName(el);
    if (res.ok) continue;
    // A custom element may name itself through ElementInternals
    // (helpers.getInternalsNameInfo).
    const internalsName =
      typeof helpers.getInternalsNameInfo === 'function'
        ? helpers.getInternalsNameInfo(el, ctx)
        : null;
    if (internalsName && internalsName.status === 'named') continue;
    if (internalsName && internalsName.status === 'unknown') {
      questions.push(helpers.reportOccurrence(el, helpers.internalsQuestion(el, 'name')));
      continue;
    }

    const eligInfo = getEligibilityInfo
      ? (() => {
          try {
            return getEligibilityInfo(el, ctx, { targetSet: 'acc' });
          } catch {
            return null;
          }
        })()
      : null;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This element has no accessible name.',
        hint: 'Name it with aria-label, aria-labelledby or a title attribute. Text inside a spinbutton does not become its name.',
        i18n: {
          summaryKey: 'spinbuttonNamePresent_summary_fail',
          hintKey: 'spinbuttonNamePresent_hint_fail',
          params: { controlType: 'spinbutton' }
        },
        data: {
          details: {
            reasonCode: 'name_missing',
            controlType: 'spinbutton',
            methodTried: res.method
          },
          visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  // Tiered only when there is a question, so a plain failure reads as before.
  if (questions.length) {
    return {
      ruleId: rule.ruleId,
      ...helpers.resolveTieredOutcome(occurrences, questions, rule.defaultSeverity || 'minor')
    };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
