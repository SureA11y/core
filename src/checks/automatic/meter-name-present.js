/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check meter-name-present
 * @atomic true
 * @summary Elements with role="meter" must have an accessible name
 * @standard WCAG 2.2
 * @sc 1.1.1
 *   Not 4.1.2: a meter or a progress bar shows a value and takes no input,
 *   so it is not a user interface component (WCAG's glossary: perceived as
 *   a single control for a distinct function), and WAI-ARIA doesn't count
 *   it as a widget. What it needs is a text alternative for what it shows.
 *   A slider or a spinbutton, whose value the user sets, is a control:
 *   slider-name-present and spinbutton-name-present map to 4.1.2.
 * @applicability
 *   Applies to elements whose role attribute resolves to meter (the first
 *   token naming a known role, matched case-insensitively, so
 *   role="foo meter" and role="METER" count) that are included in the
 *   accessibility tree. An element with the matching implicit role but no role attribute
 *   is out of scope.
 *   A custom element whose ElementInternals give it the role
 *   (this.attachInternals().role), with no role attribute naming another, is
 *   in scope too: that is its default role, and no other rule checks it.
 * @expectation
 *   The element has a non-empty accessible name from aria-label, from an
 *   aria-labelledby that resolves to non-empty text, or from title.
 *   role="meter" is name-from-author-only, so subtree text is never
 *   accepted: text sitting inside a custom meter widget is not reliably
 *   exposed as its name.
 * @reason-codes
 *   - `name_missing` (fail): the meter has no accessible name from aria-label,
 *     aria-labelledby or title.
 *     Basis: WCAG 1.1.1; accname 1.2; WAI-ARIA 1.2 meter role.
 *   - `name_internals` (cantTell): the element is a custom element that may
 *     give itself a name through ElementInternals, which no script can read, so
 *     whether it has one could not be told.
 *     Basis: WCAG 1.1.1 (not settled); accname 1.2 (not settled).
 */

const id = 'meter-name-present';

const meta = {
  title: 'Meters have an accessible name',
  description: 'Checks that elements with role="meter" expose a non-empty accessible name.',
  i18n: {
    titleKey: 'meterNamePresent_title',
    descriptionKey: 'meterNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'atomic', 'automatic', 'name'],
  wcagSc: ['1.1.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.1.1',
      title: 'Non-text Content',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.1.1': ['meter-name-present'] } },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    name_internals: {
      steps: [
        'Inspect the meter the report names, a custom element, and note its role.',
        "Open the Accessibility pane in the browser's developer tools and read the element's accessible name.",
        'With a screen reader, move to the element and listen to the name announced.'
      ],
      passWhen:
        'The accessibility tree shows a name for the meter, set through its internals or otherwise, and the screen reader announces it.',
      failWhen:
        'The meter has no name in the accessibility tree and the screen reader announces only its role, which fails WCAG 1.1.1.'
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

  // Token match, case-insensitive; the resolved-role filter in the loop
  // drops fallback lists whose first known token is some other role.
  const selector = '[role~="meter" i]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector, { internalsRoles: true })
    : helpers.queryAll(selector);

  function evaluate(el) {
    const ariaLabel = getAttr(el, 'aria-label');
    if (ariaLabel) return { ok: true, method: 'aria-label' };

    const ariaLabelledby = resolveAriaLabelledbyText(document, el, 8);
    if (ariaLabelledby) return { ok: true, method: 'aria-labelledby' };

    const title = getAttr(el, 'title');
    if (title) return { ok: true, method: 'title' };

    // role="meter" is name-from-author-only per WAI-ARIA: aria-label,
    // aria-labelledby, or title, no content-based naming method at all.
    // It must NOT fall back to subtree content, visible text near/inside a
    // custom meter widget is not reliably exposed as its accessible name.
    return { ok: false, method: 'none' };
  }

  for (const el of nodes) {
    if (!el) continue;
    if (!isEligibleAcc(helpers, el, ctx)) continue;

    // The role attribute is a fallback list: the first token naming a known
    // role wins, case-insensitively (role="foo meter" is a meter).
    if (helpers.aria.getAuthorRole(el) !== 'meter') continue;

    applicableCount += 1;

    const res = evaluate(el);
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
        summary: 'This meter has no accessible name.',
        hint: 'Name it with aria-label, aria-labelledby or a title attribute. Text inside a meter does not become its name.',
        i18n: {
          summaryKey: 'meterNamePresent_summary_fail',
          hintKey: 'meterNamePresent_hint_fail',
          params: {}
        },
        data: {
          details: { reasonCode: 'name_missing', controlType: 'meter', methodTried: res.method },
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
