/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check focus-order-semantics
 * @atomic true
 * @summary Elements added to the tab order should have interactive semantics
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Elements with an explicit `tabindex` of `0` or greater (in the tab
 *   order) AND an explicit `role` attribute that is one of a curated set
 *   of clearly non-interactive, structural/document roles.
 * @expectation
 *   An element placed in the tab order on purpose should communicate
 *   why it's focusable: a role like `heading`, `list`, `region`, or
 *   `presentation` gives assistive technology no interactive semantic to
 *   announce, which is confusing for keyboard users who land on it and
 *   get no indication of what activating it (if anything) would do.
 * @implementation-notes
 * - Not WCAG-normative, authored as an advisory, cantTell-capped
 *   `type: 'manual'` rule.
 * - The non-interactive role list is curated and conservative
 *   (structural/document roles only). Legitimate custom widget patterns
 *   using `tabindex` with an actually interactive role (`option`, `tab`,
 *   `menuitem`, etc.) are never flagged. Elements with `tabindex` and NO
 *   role at all are also not flagged: native semantics or an
 *   intentionally generic custom-interactive pattern cannot be
 *   distinguished from markup alone with the same confidence.
 * - `region` is intentionally excluded from the non-interactive role
 *   list: a tabbable `role="region"` is a real, WCAG 2.1.1/2.1.3-grounded
 *   pattern this engine's own `scrollable-region-focusable` check exists
 *   to RECOMMEND (a scrollable landmark with no other focusable content
 *   needs `tabindex="0"` to be keyboard-reachable at all), so flagging it
 *   here would be internally inconsistent with that sibling check. A
 *   `role="region"` is also commonly made tabbable on its own merits
 *   (e.g. a cookie-consent banner or notification/toast region a keyboard
 *   user should be able to reach directly, as in
 *   `<div role="region" tabindex="0">`). Scoped to `region` only;
 *   navigation/status/tabpanel remain flagged pending their own evidence.
 */

const id = 'focus-order-semantics';

const meta = {
  title: 'Elements added to the tab order should have interactive semantics',
  description:
    'Flags elements with tabindex >= 0 whose explicit role is a non-interactive structural/document role (e.g. heading, list, region, presentation), for manual review.',
  i18n: {
    titleKey: 'focusOrderSemantics_title',
    descriptionKey: 'focusOrderSemantics_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'aria', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const NON_INTERACTIVE_ROLES = new Set([
    'generic',
    'group',
    'text',
    'presentation',
    'none',
    'img',
    'heading',
    'article',
    'banner',
    'contentinfo',
    'main',
    'navigation',
    'complementary',
    'document',
    'note',
    'list',
    'listitem',
    'table',
    'row',
    'cell',
    'columnheader',
    'rowheader',
    'figure',
    'term',
    'definition',
    'paragraph',
    'caption',
    'status',
    'alert',
    'log',
    'tooltip'
  ]);

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[tabindex][role]')
    : helpers.queryAll('[tabindex][role]');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const tabindexAttr = el.getAttribute('tabindex');
    const tabindex = Number.parseInt(tabindexAttr, 10);
    if (!Number.isFinite(tabindex) || tabindex < 0) continue;

    const role = (el.getAttribute('role') || '').trim().toLowerCase();
    if (!role) continue;

    applicableCount += 1;

    if (!NON_INTERACTIVE_ROLES.has(role)) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    const baseOccurrence = {
      selector: stableSelector,
      html,
      summary: `This element is in the tab order (tabindex="${tabindex}") but has a non-interactive role ("${role}").`,
      hint: 'Remove tabindex if this element is not meant to be interactive, or use an interactive role that matches its actual behavior.',
      i18n: {
        summaryKey: 'focusOrderSemantics_summary_cantTell',
        hintKey: 'focusOrderSemantics_hint_cantTell',
        params: { tabindex: String(tabindex), role }
      },
      data: {
        details: { reasonCode: 'TABBABLE_WITH_NON_INTERACTIVE_ROLE', tabindex, role }
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

  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
