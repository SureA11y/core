'use strict';

/**
 * @check a11ycore-focus-order-semantics
 * @atomic true
 * @summary Elements added to the tab order should have interactive semantics
 * @standard the reference engine "Best Practices" (no formal WCAG Success Criterion — see ROADMAP.md Tier 1b)
 * @applicability
 *   Elements with an explicit `tabindex` of `0` or greater (in the tab
 *   order) AND an explicit `role` attribute that is one of a curated set
 *   of clearly non-interactive, structural/document roles.
 * @expectation
 *   An element deliberately placed in the tab order should communicate
 *   why it's focusable — a role like `heading`, `list`, `region`, or
 *   `presentation` gives assistive technology no interactive semantic to
 *   announce, which is confusing for keyboard users who land on it and
 *   get no indication of what activating it (if anything) would do.
 * @implementation-notes
 * - Not WCAG-normative by the reference engine's own classification — authored as an
 *   advisory, cantTell-capped `type: 'manual'` rule.
 * - The non-interactive role list is deliberately curated and
 *   conservative (structural/document roles only) — legitimate custom
 *   widget patterns using `tabindex` with a genuinely interactive role
 *   (`option`, `tab`, `menuitem`, etc.) are never flagged. Elements with
 *   `tabindex` and NO role at all are also not flagged: native semantics
 *   or an intentionally generic custom-interactive pattern cannot be
 *   distinguished from markup alone with the same confidence.
 */

const id = 'a11ycore-focus-order-semantics';

const meta = {
  title: 'Elements added to the tab order should have interactive semantics',
  description: 'Flags elements with tabindex >= 0 whose explicit role is a non-interactive structural/document role (e.g. heading, list, region, presentation), for manual review.',
  i18n: {
    titleKey: 'a11ycore_focusOrderSemantics_title',
    descriptionKey: 'a11ycore_focusOrderSemantics_description'
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
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const NON_INTERACTIVE_ROLES = new Set([
    'generic', 'group', 'text', 'presentation', 'none', 'img', 'heading',
    'region', 'article', 'banner', 'contentinfo', 'main', 'navigation',
    'complementary', 'document', 'note', 'list', 'listitem', 'table',
    'row', 'cell', 'columnheader', 'rowheader', 'figure', 'term',
    'definition', 'paragraph', 'caption', 'status', 'alert', 'log', 'tooltip'
  ]);

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('[tabindex][role]', safeRoot) : helpers.queryAll('[tabindex][role]', safeRoot);

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
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    const baseOccurrence = {
      selector: stableSelector,
      html,
      summary: `This element is in the tab order (tabindex="${tabindex}") but has a non-interactive role ("${role}").`,
      hint: 'Remove tabindex if this element is not meant to be interactive, or use an interactive role that matches its actual behavior.',
      i18n: {
        summaryKey: 'a11ycore_focusOrderSemantics_summary_cantTell',
        hintKey: 'a11ycore_focusOrderSemantics_hint_cantTell',
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
    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: rule.defaultSeverity || 'minor', occurrences };
  }

  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
