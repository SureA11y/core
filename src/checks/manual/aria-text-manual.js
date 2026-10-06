/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-text
 * @atomic true
 * @summary role="text" elements should have no focusable descendants
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Elements whose role attribute resolves to text: its first token naming
 *   a known role, matched in any case, is `text`, so `role="foo text"` and
 *   `role="TEXT"` count while `role="link text"` (a link) does not.
 * @expectation
 *   `role="text"` tells assistive technology to treat an element's whole
 *   subtree as a single unit of plain text (e.g. text visually split
 *   across multiple `<span>`s by styling). Per the WAI-ARIA Authoring
 *   Practices, this only makes sense when that subtree contains no
 *   focusable content: a focusable descendant inside a "this is just
 *   text" region is unreachable or confusing for keyboard/AT users.
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule, matching the Tier 1b precedent (see
 *   `landmark-unique`'s header comment for the shared rationale).
 * - "Focusable descendant" is decided by `helpers.getFocusableInfo`, so a
 *   disabled control or `<input type="hidden">` does not count and a
 *   `<summary>`, an `<iframe>` or an `<audio>`/`<video>` with `controls`
 *   does.
 *   With no focusable descendant the rule passes, which needs no
 *   judgment.
 */

const id = 'aria-text';

const meta = {
  title: 'role="text" elements should have no focusable descendants',
  description:
    'Checks that elements with role="text" contain no focusable descendant (link, button, form control, tabindex, iframe, or contenteditable).',
  i18n: {
    titleKey: 'ariaText_title',
    descriptionKey: 'ariaText_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'aria', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'robust',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  // Content the page does not show (a closed <details>, hidden="until-found")
  // takes no focus, so it is left out.
  function findFocusableDescendant(el) {
    for (const d of dom.querySelectorAll(el, '*')) {
      if (helpers.isHiddenContent && helpers.isHiddenContent(d)) continue;
      if (helpers.getFocusableInfo(d, ctx).focusable) return d;
    }
    return null;
  }

  // role is a fallback list matched in any case: select by token, then keep
  // only elements whose resolved role is text (role="link text" is a link).
  const nodes = (
    helpers.queryAllSmart
      ? helpers.queryAllSmart('[role~="text" i]')
      : helpers.queryAll('[role~="text" i]')
  ).filter((el) => helpers.aria.getExplicitRole(el) === 'text');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !dom.get(el, 'querySelector')) continue;

    applicableCount += 1;

    let focusableDescendant;
    try {
      focusableDescendant = findFocusableDescendant(el);
    } catch {
      focusableDescendant = null;
    }
    if (!focusableDescendant) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet
      ? helpers.getOuterHtmlSnippet(el)
      : dom.outerHTML(el) || '';

    const baseOccurrence = {
      selector: stableSelector,
      html,
      summary: 'This role="text" element contains a focusable descendant.',
      hint: 'Remove role="text" (or remove the focusable descendant); a "plain text" region should not contain focusable content.',
      i18n: {
        summaryKey: 'ariaText_summary_cantTell',
        hintKey: 'ariaText_hint_cantTell',
        params: {}
      },
      data: {
        details: { reasonCode: 'ROLE_TEXT_HAS_FOCUSABLE_DESCENDANT' }
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      occurrences.push(baseOccurrence);
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }

  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
