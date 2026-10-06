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
 *   child and whose role is list: no role attribute, role="list", or a role
 *   attribute naming no concrete ARIA role. A <ul>/<ol> given another role
 *   (listbox, menubar, tablist, none, ...) is not a list, so its children
 *   follow that role's rules instead.
 * @expectation
 *   Every direct element child is <li>, <script>, or <template>. UNLESS it
 *   has an explicit `role` attribute, in which case the explicit role wins
 *   over the tag entirely: a child is valid iff that role is "listitem"
 *   (so `<li role="presentation">`/`<li role="menuitem">` are invalid
 *   despite the <li> tag, and conversely a non-<li> element explicitly
 *   given `role="listitem"` is valid). A wrapper <div> used for styling
 *   (no role at all) still breaks list semantics the same as before.
 * @reports
 *   - `invalidChildren`: the children that do not belong in the list, one
 *     tag name per child.
 * @implementation-notes
 * - Checked via the child elements, which already excludes text/comment nodes,
 *   no whitespace-node filtering needed.
 * - Distinct, atomic decision from listitem-parent-valid (the
 *   inverse relationship: does a given <li> have a valid parent).
 * - Children are read in the flat tree: a <slot> stands for the elements
 *   assigned to it, or its fallback content when none is.
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

  // The first role token that names a concrete ARIA role, or '' when none
  // does (the element keeps its native list role).
  const aria = helpers && helpers.aria;
  function resolvedExplicitRole(el) {
    const tokens = String((dom.get(el, 'getAttribute') && dom.getAttribute(el, 'role')) || '')
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    if (!aria || typeof aria.isValidConcreteRole !== 'function') return tokens[0] || '';
    return tokens.find((t) => aria.isValidConcreteRole(t)) || '';
  }

  // An element's child elements by sibling links, not el.children: in jsdom
  // that collection stays live once read, and each later change under a
  // large parent (a list of thousands of items) rebuilds it.
  // Children in the flat tree, as the page renders them: a <slot> stands
  // for the elements assigned to it (a shadow <ul><slot></slot></ul> lists
  // the host's <li> children), or for its fallback content when none is.
  function childElementsOf(el, depth = 0) {
    const out = [];
    for (let c = el ? dom.firstElementChild(el) : null; c; c = dom.nextElementSibling(c)) {
      if (String(dom.localName(c)) !== 'slot' || depth > 20) {
        out.push(c);
        continue;
      }
      let assigned;
      try {
        assigned =
          typeof dom.get(c, 'assignedElements') === 'function'
            ? dom.assignedElements(c, { flatten: true })
            : [];
      } catch {
        assigned = [];
      }
      if (assigned.length) out.push(...assigned);
      else out.push(...childElementsOf(c, depth + 1));
    }
    return out;
  }

  for (const el of nodes) {
    if (!el || !dom.firstElementChild(el)) continue;
    const listRole = resolvedExplicitRole(el);
    if (listRole && listRole !== 'list') continue;

    applicableCount += 1;

    const invalidTags = [];
    for (const child of childElementsOf(el)) {
      if (!child || !dom.tagName(child)) continue;
      if (!isExposedToAt(child)) continue;
      const tag = dom.tagName(child).toLowerCase();

      const roleAttr = dom.get(child, 'getAttribute')
        ? String(dom.getAttribute(child, 'role') || '').trim()
        : '';
      const explicitRole = roleAttr ? (roleAttr.split(/\s+/)[0] || '').toLowerCase() : '';

      // An explicit role always wins over the tag, see header comment.
      const valid = explicitRole ? explicitRole === 'listitem' : ALLOWED_CHILD_TAGS.has(tag);

      if (!valid) invalidTags.push(tag);
    }

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
