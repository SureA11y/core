/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check list-children-valid
 * @atomic true
 * @summary <ul>/<ol> must only directly contain <li>, <script>, or <template>
 * @standard WCAG 2.2
 * @sc 1.3.1
 * @applicability
 *   Applies to <ul>/<ol> elements that have at least one direct element
 *   child or non-whitespace text directly inside them, and whose role is
 *   list: no role attribute, a role attribute
 *   resolving to list (its first token naming a known role, in any case),
 *   or one naming no known ARIA role. A <ul>/<ol> given another role
 *   (listbox, menubar, tablist, none, ...) is not a list, so its children
 *   follow that role's rules instead.
 * @expectation
 *   Every direct element child is <li>, <script>, or <template>. UNLESS it
 *   has an explicit role (its role attribute's first token naming a known
 *   role, matched in any case), in which case the explicit role wins
 *   over the tag entirely: a child is valid iff that role is "listitem"
 *   (so `<li role="presentation">`/`<li role="menuitem">` are invalid
 *   despite the <li> tag, and conversely a non-<li> element explicitly
 *   given `role="listitem"` or `role="foo LISTITEM"` is valid). A role
 *   attribute naming no known role leaves the tag to decide. A wrapper
 *   <div> used for styling (no role at all) still breaks list semantics
 *   the same as before. Non-whitespace text directly inside the list is an
 *   invalid child too: HTML allows only <li> and script-supporting elements
 *   there, and the text belongs to no list item.
 * @reports
 *   - `invalidChildren`: the children that do not belong in the list, one
 *     tag name per child (`#text` for text placed directly inside).
 * @implementation-notes
 * - Element children are checked by their tag or role; text is checked
 *   separately, ignoring whitespace-only text and comments.
 * - Distinct, atomic decision from listitem-parent-valid (the
 *   inverse relationship: does a given <li> have a valid parent).
 * - Children are read in the flat tree: a <slot> stands for the nodes
 *   assigned to it, or its fallback content when none is (any assigned
 *   node, white-space text included, keeps the fallback from rendering).
 * - Direct children that are not exposed to the accessibility tree (e.g.
 *   display:none, [hidden], aria-hidden="true") are excluded from
 *   consideration entirely. An element not reachable by assistive
 *   technology can't break the list semantics a screen reader announces.
 *   Common cases: a stray `<input type="hidden">` as a direct <ul> child
 *   (UA-stylesheet display:none by spec), or `<span style="display:none">`
 *   hydration markers interleaved with real `<li>`s.
 * - Explicit-role-overrides-tag: if a child has an explicit role, only
 *   `['listitem']` is consulted, the tag name is never checked. Only
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
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  // Declared inside runInPage, see scripts/build-core.js header
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

  // The first role token that names a known, non-abstract ARIA role, in
  // any case, or '' when none does (the element keeps its native role).
  function resolvedExplicitRole(el) {
    return helpers.aria.getExplicitRole(el);
  }

  // Children in the flat tree, as the page renders them: a <slot> stands
  // for the nodes assigned to it (a shadow <ul><slot></slot></ul> lists the
  // host's <li> children), or for its fallback content when none is
  // (helpers.flatChildElements).
  function childElementsOf(el) {
    return el ? helpers.flatChildElements(el) : [];
  }

  // Non-whitespace text directly inside, in the flat tree.
  function hasDirectText(el) {
    return (el ? helpers.flatChildNodes(el) : []).some(
      (node) => dom.nodeType(node) === 3 && /\S/.test(dom.nodeValue(node) || '')
    );
  }

  for (const el of nodes) {
    if (!el) continue;
    const hasText = hasDirectText(el);
    if (!dom.firstElementChild(el) && !hasText) continue;
    const listRole = resolvedExplicitRole(el);
    if (listRole && listRole !== 'list') continue;

    applicableCount += 1;

    const invalidTags = [];
    for (const child of childElementsOf(el)) {
      if (!child || !dom.tagName(child)) continue;
      if (!isExposedToAt(child)) continue;
      const tag = dom.tagName(child).toLowerCase();

      const explicitRole = resolvedExplicitRole(child);

      // An explicit role always wins over the tag, see header comment.
      const valid = explicitRole ? explicitRole === 'listitem' : ALLOWED_CHILD_TAGS.has(tag);

      if (!valid) invalidTags.push(tag);
    }
    if (hasText) invalidTags.push('#text');

    if (!invalidTags.length) continue;

    const dedupedInvalidTags = [...new Set(invalidTags)];

    const tag = dom.tagName(el).toLowerCase();

    occurrences.push(
      helpers.reportOccurrence(el, {
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
      })
    );
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
