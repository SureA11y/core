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
 *   A child that does not belong FAILS only where the page shows an item
 *   the markup loses: the child is drawn as a list item (display list-item
 *   with a marker), or it wraps <li> elements that are, which HTML-AAM then
 *   maps to no list item. That is a relationship shown and not
 *   programmatically determinable (SC 1.3.1). Anything else (a heading or a
 *   separator between the items, loose text, an <li> whose role replaces
 *   listitem with no marker drawn) breaks HTML's content model, and H48 is
 *   only a sufficient technique: it is reported at CANTTELL, for a person to
 *   say whether the page shows it as one of the items. The marker is read
 *   from the computed style; jsdom does not resolve the list-style
 *   shorthand, so there `list-style: none` set that way still reads as a
 *   marker, and the finding fails as it would have before.
 * @reports
 *   - `reasonCode`: `LIST_ITEM_ROLE_OVERRIDDEN` when every child that
 *     does not belong is an <li> whose explicit role replaces listitem
 *     (`<li role="presentation">`, `role="none"`, `role="group"`...), and
 *     `LIST_INVALID_CHILD` for any other child: an element that is not an
 *     <li>, or text. A list with both is `LIST_INVALID_CHILD`.
 *   - `element`: the list's tag name, `ul` or `ol`.
 *   - `invalidChildren`: the children that do not belong in the list, one
 *     tag name per child (`#text` for text placed directly inside).
 *   - `overriddenRoles`: with `LIST_ITEM_ROLE_OVERRIDDEN`, the role of
 *     each such <li>, in order.
 *   - `element` is a stable contract, unlike the rest of
 *     `data.details`.
 * @reason-codes
 *   - `LIST_INVALID_CHILD` (fail, cantTell): the list holds an element that
 *     is not a list item, script or template, or text outside any list item.
 *     It fails where that child is drawn as a list item or wraps items that
 *     are, and is asked about otherwise.
 *     Basis: WCAG 1.3.1; H48; HTML ul and ol elements content model (MUST);
 *     WAI-ARIA 1.2 list role (MUST).
 *   - `LIST_ITEM_ROLE_OVERRIDDEN` (fail, cantTell): an li in the list has a
 *     role that replaces listitem, so it is not one of the list's items. It
 *     fails where the li is still drawn as a list item, and is asked about
 *     where no marker is drawn.
 *     Basis: WCAG 1.3.1; ARIA in HTML li element (MUST); WAI-ARIA 1.2 list
 *     role (MUST).
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
 * - An <li> with a role other than listitem is valid HTML (the content
 *   model of <ul>/<ol> only names the tag), but ARIA in HTML allows "no
 *   role other than listitem" on an <li> whose parent is a list, and
 *   Chromium then exposes the list with a child that is not a list item:
 *   the "…" of a Drupal pager's `<li role="presentation">` as bare text,
 *   or an Owl carousel's `<li role="group">` slides as groups, leaving a
 *   list of no items. So it fails too, under its own reason code: it is a
 *   role misapplied to an item rather than markup outside any item, and a
 *   standard whose list criterion is about the markup alone may weigh it
 *   differently.
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

  const failOccurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  // Whether the page draws the element as a list item: display list-item
  // with a marker (a bullet, number or image). That is the item a reader
  // sees; WCAG 1.3.1 asks that it also be one in the markup.
  function drawnAsListItem(el) {
    try {
      const cs = helpers.computedStyle(el) || {};
      if (!/\blist-item\b/.test(String(cs.display || ''))) return false;
      const type = String(cs.listStyleType || '').trim();
      const image = String(cs.listStyleImage || '').trim();
      return (type !== '' && type !== 'none') || (image !== '' && image !== 'none');
    } catch {
      return false;
    }
  }
  // An element with <li> descendants drawn as items: a wrapper between the
  // list and its items, which leaves them items of no list.
  function wrapsDrawnItems(el) {
    try {
      return Array.from(dom.querySelectorAll(el, 'li')).some((li) => drawnAsListItem(li));
    } catch {
      return false;
    }
  }

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
    // The roles given to <li> children in place of listitem, and whether
    // every invalid child is one of those.
    const overriddenRoles = [];
    let onlyOverriddenItems = true;
    // Whether a child that does not belong is drawn as one of the list's
    // items, or wraps items that are: then an item the page shows is not one
    // in the markup (SC 1.3.1). Any other stray child, or loose text, breaks
    // HTML's content model without such a loss being shown.
    let showsLostItem = false;
    for (const child of childElementsOf(el)) {
      if (!child || !dom.tagName(child)) continue;
      if (!isExposedToAt(child)) continue;
      const tag = dom.tagName(child).toLowerCase();

      const explicitRole = resolvedExplicitRole(child);

      // An explicit role always wins over the tag, see header comment.
      const valid = explicitRole ? explicitRole === 'listitem' : ALLOWED_CHILD_TAGS.has(tag);

      if (valid) continue;
      invalidTags.push(tag);
      if (drawnAsListItem(child) || (tag !== 'li' && wrapsDrawnItems(child))) showsLostItem = true;
      if (tag === 'li' && explicitRole) overriddenRoles.push(explicitRole);
      else onlyOverriddenItems = false;
    }
    if (hasText) {
      invalidTags.push('#text');
      onlyOverriddenItems = false;
    }

    if (!invalidTags.length) continue;

    const dedupedInvalidTags = [...new Set(invalidTags)];

    const tag = dom.tagName(el).toLowerCase();

    const bucket = showsLostItem ? failOccurrences : cantTellOccurrences;
    const tier = showsLostItem
      ? { occurrenceOutcome: 'fail' }
      : {
          occurrenceOutcome: 'cantTell',
          uncertainty: {
            code: 'spec-only',
            needed:
              'Whether the page shows the content that does not belong as one of the list’s items.',
            evidence: { element: dom.tagName(el).toLowerCase(), invalidChildren: invalidTags }
          }
        };

    if (onlyOverriddenItems) {
      const roles = [...new Set(overriddenRoles)];
      bucket.push(
        helpers.reportOccurrence(el, {
          ...tier,
          summary: `This list has an <li> whose role (${roles.join(', ')}) replaces listitem, so it is not one of the list's items.`,
          hint: 'Remove the role from the <li>, or take the element out of the list, or give the list itself the role its children need, such as tablist for tabs.',
          i18n: {
            summaryKey: 'listChildrenValid_summary_fail_itemRoleOverridden',
            hintKey: 'listChildrenValid_hint_fail_itemRoleOverridden',
            params: { element: tag, roles: roles.join(', ') }
          },
          data: {
            details: {
              reasonCode: 'LIST_ITEM_ROLE_OVERRIDDEN',
              element: tag,
              invalidChildren: invalidTags,
              overriddenRoles
            }
          }
        })
      );
      continue;
    }

    bucket.push(
      helpers.reportOccurrence(el, {
        ...tier,
        summary: 'This list contains a direct child that is not a list item.',
        hint: 'Only <li>, <script> and <template> may sit directly inside <ul> or <ol>; move other markup inside an <li>.',
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
  return {
    ruleId: rule.ruleId,
    ...helpers.resolveTieredOutcome(
      failOccurrences,
      cantTellOccurrences,
      rule.defaultSeverity || 'serious'
    )
  };
}

module.exports = { id, meta, runInPage };
