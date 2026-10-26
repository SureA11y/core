/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check option-name-present
 * @atomic true
 * @summary Elements with role="option" must have an accessible name
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to elements whose role attribute resolves to option (the first
 *   token naming a known role, matched case-insensitively, so
 *   role="foo option" and role="OPTION" count) that are included in the
 *   accessibility tree. An element with the matching implicit role but no role attribute
 *   is out of scope.
 *   A custom element whose ElementInternals give it the role
 *   (this.attachInternals().role), with no role attribute naming another, is
 *   in scope too: that is its default role, and no other rule checks it.
 * @expectation
 *   The element has a non-empty accessible name from aria-label, from an
 *   aria-labelledby that resolves to non-empty text, from title, or,
 *   role="option" being name-from-content, from its own subtree text, where
 *   a descendant's own name (an <img alt>, aria-label or title) counts as
 *   that descendant's contribution rather than only its text nodes.
 * @reason-codes
 *   - `name_missing` (fail): the option has no accessible name from
 *     aria-label, aria-labelledby, title or its content.
 *     Basis: WCAG 4.1.2; F68; accname 1.2; WAI-ARIA 1.2 option role.
 *   - `name_closedContent` (cantTell): the option may take its name from
 *     content inside a closed shadow root, which no script can read, so
 *     whether it has a name could not be told.
 *     Basis: WCAG 4.1.2 (not settled); accname 1.2 (not settled).
 *   - `name_contentTooDeep` (cantTell): the option's content is nested too
 *     deeply for its name to be worked out, so whether it has a name could not
 *     be told.
 *     Basis: WCAG 4.1.2 (not settled); accname 1.2 (not settled).
 *   - `name_internals` (cantTell): the element is a custom element that may
 *     give itself a name through ElementInternals, which no script can read, so
 *     whether it has one could not be told.
 *     Basis: WCAG 4.1.2 (not settled); accname 1.2 (not settled).
 */

const id = 'option-name-present';

const meta = {
  title: 'Options have an accessible name',
  description: 'Checks that elements with role="option" expose a non-empty accessible name.',
  i18n: {
    titleKey: 'optionNamePresent_title',
    descriptionKey: 'optionNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'forms', 'atomic', 'automatic', 'name', 'option'],
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
  coverage: { facetsBySc: { '4.1.2': ['option-name-present'] } },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    name_closedContent: {
      steps: [
        'Find the option the report names and note the text or icon it shows on screen.',
        "Open the Accessibility pane in the browser's developer tools and read the element's accessible name, which the browser works out from content no script can read.",
        'With a screen reader, move to the element and listen to the name announced.'
      ],
      passWhen:
        'The accessibility tree shows a name for the option, taken from its content, and the screen reader announces it.',
      failWhen:
        'The option has no name in the accessibility tree, since its content gives none, which fails WCAG 4.1.2.'
    },
    name_contentTooDeep: {
      steps: [
        'Find the option the report names and note the text it shows on screen.',
        "Open the Accessibility pane in the browser's developer tools and read the element's accessible name, which the browser works out from all of its nested content.",
        'With a screen reader, move to the element and listen to the name announced.'
      ],
      passWhen:
        'The accessibility tree shows a name for the option, taken from its nested content, and the screen reader announces it.',
      failWhen:
        'The option has no name in the accessibility tree, since its content gives none, which fails WCAG 4.1.2.'
    },
    name_internals: {
      steps: [
        'Inspect the option the report names, a custom element, and note its role.',
        "Open the Accessibility pane in the browser's developer tools and read the element's accessible name.",
        'With a screen reader, move to the element and listen to the name announced.'
      ],
      passWhen:
        'The accessibility tree shows a name for the option, set through its internals or otherwise, and the screen reader announces it.',
      failWhen:
        'The option has no name in the accessibility tree and the screen reader announces only its role, which fails WCAG 4.1.2.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  // Set while the name is worked out from content: the name may sit in a
  // component no script can read (a closed shadow root), or in content
  // nested too deep to read (getContentNameInfo's depth-limit). Either is
  // asked about, not failed, as button-name-present and link-name-present do.
  let closedContent;
  let tooDeep;
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

  function getConservativeSubtreeText(document, container) {
    // "Name from content", recurses into descendants and uses each one's
    // own accessible name (img alt, aria-label/aria-labelledby, title) when
    // it has one, not just literal text nodes. See getContentNameInfo's
    // header comment in src/core/dom-helpers.js for the full rationale
    // (this replaced a text-node-only TreeWalker that missed the common
    // "<a><img alt='...'></a>" logo-link / "<button><img alt='...'></button>"
    // icon-button pattern).
    if (helpers.getContentNameInfo) {
      const info = helpers.getContentNameInfo(container, ctx);
      const flags = info && Array.isArray(info.flags) ? info.flags : [];
      closedContent = flags.includes('closedContent');
      tooDeep = flags.includes('depth-limit');
      return info && info.present ? info.value : '';
    }
    const t = container && dom.textContent(container) ? String(dom.textContent(container)) : '';
    return t.replace(/\s+/g, ' ').trim();
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
  // Elements whose name could not be told (closedContent, tooDeep).
  const questions = [];
  let applicableCount = 0;

  // Token match, case-insensitive; the resolved-role filter in the loop
  // drops fallback lists whose first known token is some other role.
  const selector = '[role~="option" i]';
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

    const t = getConservativeSubtreeText(document, el);
    if (t) return { ok: true, method: 'content' };

    return { ok: false, method: 'none' };
  }

  for (const el of nodes) {
    if (!el) continue;
    if (!isEligibleAcc(helpers, el, ctx)) continue;
    // The role attribute is a fallback list: the first token naming a known
    // role wins, case-insensitively (role="foo option" is a option).
    if (helpers.aria.getAuthorRole(el) !== 'option') continue;

    applicableCount += 1;

    closedContent = false;
    tooDeep = false;
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
    if (tooDeep || closedContent) {
      questions.push(
        helpers.reportOccurrence(el, {
          summary: tooDeep
            ? "This element's content is nested too deeply to work out a name from, so whether it has one could not be told."
            : 'This element may take its name from a component whose content no script can read (a closed shadow root), so whether it has one could not be told.',
          hint: tooDeep
            ? "Check its name in the browser's accessibility tree; browsers stop reading content that deep too, so give the element an aria-label or visible text near its top."
            : "Check its name in the browser's accessibility tree or with a screen reader; if it has none, give it an aria-label or visible text.",
          i18n: {
            summaryKey: tooDeep
              ? 'nameFromContent_summary_cantTell_contentTooDeep'
              : 'nameFromContent_summary_cantTell_closedContent',
            hintKey: tooDeep
              ? 'nameFromContent_hint_cantTell_contentTooDeep'
              : 'nameFromContent_hint_cantTell_closedContent'
          },
          uncertainty: {
            code: 'not-computable',
            needed: tooDeep
              ? "The element's name, from content nested too deep to read."
              : 'Whether the component inside gives the element a name.'
          },
          data: {
            details: { reasonCode: tooDeep ? 'name_contentTooDeep' : 'name_closedContent' }
          }
        })
      );
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
        hint: 'Provide aria-label or aria-labelledby (preferred), or provide visible text that is not hidden from assistive technologies.',
        i18n: {
          summaryKey: 'optionNamePresent_summary_fail',
          hintKey: 'optionNamePresent_hint_fail',
          params: { controlType: 'option' }
        },
        data: {
          details: { reasonCode: 'name_missing', controlType: 'option', methodTried: res.method },
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
