'use strict';

/**
 * @check list-children-valid
 * @atomic true
 * @summary <ul>/<ol> must only directly contain <li>, <script>, or <template>
 * @standard WCAG 2.2
 * @sc 1.3.1
 * @applicability
 *   Applies to <ul>/<ol> elements that have at least one direct element
 *   child.
 * @expectation
 *   Every direct element child is <li>, <script>, or <template> — UNLESS it
 *   has an explicit `role` attribute, in which case the explicit role wins
 *   over the tag entirely: a child is valid iff that role is "listitem"
 *   (so `<li role="presentation">`/`<li role="menuitem">` are invalid
 *   despite the <li> tag, and conversely a non-<li> element explicitly
 *   given `role="listitem"` is valid). A wrapper <div> used for styling
 *   (no role at all) still breaks list semantics the same as before.
 * @implementation-notes
 * - Checked via el.children, which already excludes text/comment nodes —
 *   no whitespace-node filtering needed.
 * - Distinct, atomic decision from listitem-parent-valid (the
 *   inverse relationship: does a given <li> have a valid parent).
 * - Direct children that are not exposed to the accessibility tree (e.g.
 *   display:none, [hidden], aria-hidden="true") are excluded from
 *   consideration entirely — an element not reachable by assistive
 *   technology can't break the list semantics a screen reader announces.
 *   Common cases: a stray `<input type="hidden">` as a direct <ul> child
 *   (UA-stylesheet display:none by spec), or `<span style="display:none">`
 *   hydration markers interleaved with real `<li>`s.
 * - Explicit-role-overrides-tag: if a child has an explicit role, only
 *   `['listitem']` is consulted — the tag name is never checked. Only
 *   without an explicit role does the tag name matter. Catches cases a
 *   tag-only check misses: `<li role="none">` hosting a list's own
 *   visually-hidden label, `<li role="menuitem">` menu items, or a real
 *   `<li>` mixed with an `<li role="presentation">`.
 */

const id = 'list-children-valid';

const meta = {
  title: 'Lists must only directly contain list items',
  description:
    'Checks that <ul>/<ol> elements only have <li>, <script>, or <template> as direct children.',
  i18n: {
    titleKey: 'listChildrenValid_title',
    descriptionKey: 'listChildrenValid_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag131', 'structure', 'atomic', 'automatic', 'list'],
  wcagSc: ['1.3.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.3.1',
      title: 'Info and Relationships',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.3.1': ['list-children-valid'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  // Declared inside runInPage — see scripts/build-core.js header
  // ("runInPage MUST be self-contained").
  const ALLOWED_CHILD_TAGS = new Set(['li', 'script', 'template']);

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('ul, ol')
    : helpers.queryAll('ul, ol');

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

  function isExposedToAt(el) {
    if (!isAccTreeEligible) return true;
    try {
      const r = isAccTreeEligible(el, ctx);
      if (typeof r === 'boolean') return r;
      return !!(r && r.eligible);
    } catch {
      return true;
    }
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.children) continue;
    if (!el.children.length) continue;

    applicableCount += 1;

    const invalidTags = [];
    for (const child of el.children) {
      if (!child || !child.tagName) continue;
      if (!isExposedToAt(child)) continue;
      const tag = child.tagName.toLowerCase();

      const roleAttr = child.getAttribute ? String(child.getAttribute('role') || '').trim() : '';
      const explicitRole = roleAttr ? (roleAttr.split(/\s+/)[0] || '').toLowerCase() : '';

      // An explicit role always wins over the tag — see header comment.
      const valid = explicitRole ? explicitRole === 'listitem' : ALLOWED_CHILD_TAGS.has(tag);

      if (!valid) invalidTags.push(tag);
    }

    if (!invalidTags.length) continue;

    const dedupedInvalidTags = [...new Set(invalidTags)];

    const tag = el.tagName.toLowerCase();
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : el.outerHTML || '';

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This list contains a direct child that is not a list item.',
      hint: 'Only use <li> (or <script>/<template>) as direct children of <ul>/<ol>; move other markup inside an <li>.',
      i18n: {
        summaryKey: 'listChildrenValid_summary_fail',
        hintKey: 'listChildrenValid_hint_fail',
        params: { element: tag, invalidChildren: dedupedInvalidTags.join(', ') }
      },
      data: {
        details: { reasonCode: 'LIST_INVALID_CHILD', element: tag, invalidChildren: invalidTags }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'serious',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
