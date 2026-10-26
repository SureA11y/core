/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check searchbox-name-present
 * @atomic true
 * @summary Elements with role="searchbox" must have an accessible name
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to elements whose role attribute resolves to searchbox (the
 *   attribute is a fallback list: its first known, non-abstract token, in
 *   any case, is the role, so role="foo searchbox" counts and role="link searchbox"
 *   does not) that are included in the accessibility tree. An element with the matching implicit role but no
 *   role attribute is out of scope.
 *   A custom element whose ElementInternals give it the role
 *   (this.attachInternals().role), with no role attribute naming another, is
 *   in scope too: that is its default role, and no other rule checks it.
 * @expectation
 *   The element has a non-empty accessible name from aria-label, from an
 *   aria-labelledby that resolves to non-empty text, or from title.
 *   role="searchbox" is name-from-author-only, so subtree text is never
 *   accepted: text sitting inside a custom searchbox widget is not reliably
 *   exposed as its name. On a labelable element (<input role="searchbox">)
 *   an associated <label> counts as well.
 *   On a text-like <input> or a <textarea>, the placeholder counts last
 *   (HTML-AAM's final name source): a placeholder-only label is a 3.3.2
 *   question, not a missing name.
 *   An element named by nothing but aria-placeholder fails: accname gives
 *   it no name, and only some browsers name it from aria-placeholder.
 * @reason-codes
 *   - `name_missing` (fail): the search box has no accessible name from
 *     aria-label, aria-labelledby, title, an associated label or a
 *     placeholder; aria-placeholder alone does not count.
 *     Basis: WCAG 4.1.2; F68; accname 1.2; HTML-AAM 4.1.1;
 *     WAI-ARIA 1.2 searchbox role; ACT e086e5.
 *   - `name_internals` (cantTell): the element is a custom element that may
 *     give itself a name through ElementInternals, which no script can read, so
 *     whether it has one could not be told.
 *     Basis: WCAG 4.1.2 (not settled); accname 1.2 (not settled).
 */

const id = 'searchbox-name-present';

const meta = {
  title: 'Searchboxes have an accessible name',
  description: 'Checks that elements with role="searchbox" expose a non-empty accessible name.',
  i18n: {
    titleKey: 'searchboxNamePresent_title',
    descriptionKey: 'searchboxNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'forms', 'atomic', 'automatic', 'name', 'searchbox'],
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
  coverage: { facetsBySc: { '4.1.2': ['searchbox-name-present'] } },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    name_internals: {
      steps: [
        'Inspect the search box the report names, a custom element, and note its role.',
        "Open the Accessibility pane in the browser's developer tools and read the element's accessible name.",
        'With a screen reader, move to the element and listen to the name announced.'
      ],
      passWhen:
        'The accessibility tree shows a name for the search box, set through its internals or otherwise, and the screen reader announces it.',
      failWhen:
        'The search box has no name in the accessibility tree and the screen reader announces only its role, which fails WCAG 4.1.2.'
    }
  }
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

  // The role attribute is a fallback list matched in any case: select by
  // token, then keep the elements whose resolved role (the first known,
  // non-abstract token) is searchbox. role="foo searchbox" and role="SEARCHBOX" count;
  // role="link searchbox" is a link.
  const selector = '[role~="searchbox" i]';
  const nodes = (
    helpers.queryAllSmart
      ? helpers.queryAllSmart(selector, { internalsRoles: true })
      : helpers.queryAll(selector)
  ).filter((el) => {
    try {
      return helpers.aria.getAuthorRole(el) === 'searchbox';
    } catch {
      return false;
    }
  });

  function hasName(el) {
    const ariaLabel = getAttr(el, 'aria-label');
    if (ariaLabel) return { ok: true, method: 'aria-label' };

    const labelled = resolveAriaLabelledbyText(document, el, 8);
    if (labelled) return { ok: true, method: 'aria-labelledby' };

    const title = getAttr(el, 'title');
    if (title) return { ok: true, method: 'title' };

    // Native <label> association (e.g. <input role="searchbox">).
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

    // role="searchbox" is name-from-author-only per WAI-ARIA: it must NOT
    // fall back to subtree content.
    return { ok: false, method: 'none' };
  }

  for (const el of nodes) {
    if (!el) continue;
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
        hint: 'Name it with aria-label, aria-labelledby or a title attribute. Text inside a searchbox does not become its name.',
        i18n: {
          summaryKey: 'searchboxNamePresent_summary_fail',
          hintKey: 'searchboxNamePresent_hint_fail',
          params: { controlType: 'searchbox' }
        },
        data: {
          details: {
            reasonCode: 'name_missing',
            controlType: 'searchbox',
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
