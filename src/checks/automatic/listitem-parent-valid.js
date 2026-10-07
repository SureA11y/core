/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check listitem-parent-valid
 * @atomic true
 * @summary <li> elements must be contained by a list container
 * @standard WCAG 2.2
 * @sc 1.3.1
 * @applicability
 *   Applies to <li> elements that have a parent element.
 * @expectation
 *   The parent is <ul>/<ol>/<menu> with no role override (all three have
 *   the implicit role list), or an element with an
 *   explicit role of "list", "presentation", or "none". An <li> used
 *   outside a real list container (e.g. as a generic flex/grid item under
 *   a <div>) is not exposed as a list item to assistive technologies.
 * @reports
 *   - `parentElement`: the tag name of the `<li>`'s parent, the container
 *     it is in instead of a list.
 * @implementation-notes
 * - The parent is the <li>'s parent in the flat tree, as the page renders
 *   it: an <li> slotted into a shadow <ul><slot></slot></ul> is in that
 *   list, and a <slot> in between is seen through. An <li> a shadow host
 *   doesn't slot is not rendered and is left out.
 * - Distinct, atomic decision from list-children-valid (the
 *   inverse relationship: does a given list container have valid
 *   children).
 * - Roles are resolved as user agents do (aria-helpers.js
 *   getExplicitRole): the role attribute is a fallback list, the first
 *   token naming a known role wins, matched in any case, and a role
 *   attribute with no known token is no role at all (the tag's native
 *   role stays). So <div role="foo list"> and <div role="LIST"> are lists,
 *   and <ul role="foo"> is still a list.
 * - An explicit role on the parent WINS over its tag name, in either
 *   direction: a <ul role="menu"> no longer exposes role "list" (its own
 *   native role is fully replaced by the explicit one, the same "any
 *   explicit role overrides the element's native role" ARIA principle
 *   applied elsewhere in this engine), so an <li> inside it is invalid
 *   despite the <ul> tag (e.g. `<ul role="menu"><li>...`). Conversely
 *   role="presentation"/"none" on the parent is still a valid
 *   (list-semantics-suppressing) parent, the accepted parent roles are
 *   presentation, none, and list.
 * - The SAME "explicit role wins" principle applies to the <li> ELEMENT
 *   ITSELF: an <li role="tab">/role="menuitem">/role="presentation"> etc.
 *   is exposed to AT with that role, never "listitem". The whole point
 *   of this check (list items need a valid list-container parent) doesn't
 *   apply when the element isn't claiming listitem semantics in the first
 *   place. Any `<li>` whose role attribute resolves to a role is excluded
 *   from candidacy. `role="listitem"` itself is a no-op restatement (not an
 *   override), so it still falls through to the normal parent-validity
 *   check below.
 */

const id = 'listitem-parent-valid';

const meta = {
  title: 'List items must be inside a list container',
  description:
    'Checks that <li> elements are contained by <ul>, <ol>, <menu>, or an element with role="list".',
  i18n: {
    titleKey: 'listitemParentValid_title',
    descriptionKey: 'listitemParentValid_description'
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
  coverage: { facetsBySc: { '1.3.1': ['listitem-parent-valid'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  // The element an <li> renders in: its parent in the flat tree, through an
  // assigned slot and past any <slot> or shadow root on the way. undefined
  // for a child of a shadow host that no slot takes: it isn't rendered
  // (helpers.flatParentElement).
  function flatParent(el) {
    return helpers.flatParentElement(el);
  }

  // The resolved explicit role: the first token of the role fallback list
  // naming a known role, lower-cased, or '' when none does (the element then
  // keeps its native role).
  function resolvedRole(el) {
    try {
      return helpers.aria && typeof helpers.aria.getExplicitRole === 'function'
        ? helpers.aria.getExplicitRole(el)
        : '';
    } catch {
      return '';
    }
  }

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('li') : helpers.queryAll('li');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el) continue;
    const parent = flatParent(el);
    if (!parent) continue;

    // An explicit role on the <li> ITSELF overrides its native "listitem"
    // role entirely, the same "any explicit role wins over the tag's
    // native role" principle this check already applies to the PARENT
    // (see the header comment). An <li role="tab">/
    // role="menuitem">/role="presentation"> etc. is exposed to AT with
    // THAT role, never "listitem" -- so the "list item needs a valid list
    // container parent" concern this rule exists for doesn't apply to it
    // at all; there's no listitem semantics being claimed to validate.
    // role="listitem" itself is a no-op restatement, not an override, so
    // it still falls through to the normal parent check below.
    const ownExplicitRole = resolvedRole(el);
    if (ownExplicitRole && ownExplicitRole !== 'listitem') continue;

    applicableCount += 1;

    const parentTag = dom.tagName(parent) ? dom.tagName(parent).toLowerCase() : '';

    const explicitRole = resolvedRole(parent);

    let valid;
    if (explicitRole) {
      // An explicit role always wins over the tag's native role, in either
      // direction, see the header comment.
      valid = explicitRole === 'list' || explicitRole === 'presentation' || explicitRole === 'none';
    } else {
      valid = parentTag === 'ul' || parentTag === 'ol' || parentTag === 'menu';
    }

    if (valid) continue;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: 'This list item is not contained by a list container.',
        hint: 'Place this <li> inside a <ul>/<ol>, or give its parent role="list".',
        i18n: {
          summaryKey: 'listitemParentValid_summary_fail',
          hintKey: 'listitemParentValid_hint_fail',
          params: { parentElement: parentTag }
        },
        data: {
          details: { reasonCode: 'LISTITEM_INVALID_PARENT', parentElement: parentTag }
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
