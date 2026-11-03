/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-text
 * @atomic true
 * @summary role="text" elements should have no focusable descendants
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Elements whose role attribute has the token `text`, matched in any
 *   case, before any token naming a WAI-ARIA role, so `role="foo text"`
 *   and `role="TEXT"` count while `role="link text"` (a link) does not.
 * @expectation
 *   `role="text"` names no WAI-ARIA role (neither WAI-ARIA 1.2 nor the
 *   1.3 draft defines it; aria-roles-valid reports it), but some
 *   assistive technology has read it as asking to treat an element's
 *   whole subtree as a single unit of plain text (e.g. text visually split
 *   across multiple `<span>`s by styling). That only makes sense when the
 *   subtree contains no focusable content: a focusable descendant inside
 *   a "this is just text" region is unreachable or confusing for
 *   keyboard/AT users.
 * @reason-codes
 *   - `ROLE_TEXT_HAS_FOCUSABLE_DESCENDANT` (cantTell): an element with
 *     role="text" contains content that can take keyboard focus.
 *     It leans fail: the page states it.
 *     Basis: WAI-ARIA Authoring Practices (best practice).
 * @implementation-notes
 * - `text` is no WAI-ARIA role (neither 1.2 nor the 1.3 draft defines it),
 *   so `aria-roles-valid` reports `role="text"` as naming no valid role
 *   (ACT 674b10); this rule reads the token itself.
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
  // only elements where text comes before any WAI-ARIA role (role="link
  // text" is a link). text is no WAI-ARIA role, so it is read here, not by
  // the role helpers, which don't know it.
  const textFirst = (el) => {
    const tokens =
      typeof helpers.aria.getAllRoleTokens === 'function' ? helpers.aria.getAllRoleTokens(el) : [];
    for (const t of tokens) {
      if (t === 'text') return true;
      if (helpers.aria.isValidConcreteRole && helpers.aria.isValidConcreteRole(t)) return false;
    }
    return false;
  };
  const nodes = (
    helpers.queryAllSmart
      ? helpers.queryAllSmart('[role~="text" i]')
      : helpers.queryAll('[role~="text" i]')
  ).filter(textFirst);

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
      summary: 'This role="text" element contains something that can take focus.',
      hint: 'Remove role="text", or move the focusable content out of it.',
      i18n: {
        summaryKey: 'ariaText_summary_cantTell',
        hintKey: 'ariaText_hint_cantTell',
        params: {}
      },
      lean: {
        toward: 'fail',
        why: 'A focusable element sits inside role="text", which flattens it into plain text.',
        signals: [{ signal: 'focusable-descendant', value: true }],
        i18n: { whyKey: 'ariaText_lean_why' }
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
