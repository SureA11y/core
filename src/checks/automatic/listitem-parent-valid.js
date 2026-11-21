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
 *   the implicit role list) or with role "presentation" or "none" (the
 *   list's presentation passes to its <li> children), or an element with
 *   an explicit role of "list" or "directory" (deprecated, but a required
 *   parent of listitem in WAI-ARIA 1.2). role "presentation" or "none" on
 *   any other element (<div role="none">) only removes that element's own
 *   role: the <li> is still in no list. An <li> used
 *   outside a real list container (e.g. as a generic flex/grid item under
 *   a <div>) is not exposed as a list item to assistive technologies.
 *   It FAILS where the page still draws the <li> as a list item (display
 *   list-item with a marker): an item a reader sees that the markup puts in
 *   no list, a relationship not programmatically determinable (SC 1.3.1).
 *   An <li> drawn with no marker, as a plain layout box, shows no list, so
 *   the broken content model is reported at CANTTELL (H48 is only a
 *   sufficient technique) for a person to say whether it reads as a list.
 *   jsdom does not resolve the list-style shorthand, so there
 *   `list-style: none` set that way still reads as a marker.
 * @reports
 *   - `reasonCode`: `LIST_ROLE_OVERRIDDEN` when the parent is a <ul>, <ol>
 *     or <menu> whose explicit role replaces list (`<ul role="tablist">`):
 *     under a composite widget role it fails where the <li> is drawn as a
 *     list item and is asked about where it is not; under another role
 *     (navigation, group, region...) it is asked about, leaning fail where
 *     the <li> is drawn as a list item. `LISTITEM_INVALID_PARENT`
 *     otherwise, which fails where the <li> is drawn as a list item and is
 *     asked about where it is not.
 *   - `parentElement`: the tag name of the `<li>`'s parent, the container
 *     it is in instead of a list.
 *   - `parentRole`: with `LIST_ROLE_OVERRIDDEN`, the parent's role.
 *   - `parentElement` is a stable contract, unlike the
 *     rest of `data.details`.
 * @reason-codes
 *   - `LISTITEM_INVALID_PARENT` (fail, cantTell): an li is not inside a ul,
 *     ol, menu or an element with role list, so it is not exposed as a list
 *     item. It fails where the li is drawn as a list item.
 *     Basis: WCAG 1.3.1; H48; HTML li element contexts (MUST); WAI-ARIA 1.2
 *     listitem role (MUST).
 *   - `LIST_ROLE_OVERRIDDEN` (fail, cantTell): the li's parent is a ul, ol
 *     or menu whose explicit role replaces list, so the li is not in a list.
 *     Under a composite widget role (tablist, menu, menubar, listbox,
 *     combobox, tree, treegrid, grid, radiogroup, toolbar) the li breaks the
 *     widget: it fails where the li is drawn as a list item. Under another
 *     role, whether losing the list loses information depends on the
 *     content (a few links in a <ul role="navigation"> read as well without
 *     it), so it is asked about, leaning fail where the li is drawn as a
 *     list item.
 *     Basis: WCAG 1.3.1; WAI-ARIA 1.2 listitem role (MUST).
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
 *   and <ul role="foo"> is still a list. A custom element with no role
 *   attribute takes the role its ElementInternals give it, so an <li> in
 *   an <x-list> whose internals say list is in a list.
 * - An explicit role on the parent WINS over its tag name, in either
 *   direction: a <ul role="menu"> no longer exposes role "list" (its own
 *   native role is fully replaced by the explicit one, the same "any
 *   explicit role overrides the element's native role" ARIA principle
 *   applied elsewhere in this engine), so an <li> inside it is invalid
 *   despite the <ul> tag (e.g. `<ul role="menu"><li>...`). Conversely
 *   role="presentation"/"none" on a <ul>, <ol> or <menu> parent is still
 *   a valid (list-semantics-suppressing) parent; on another element it is
 *   not.
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
  // The role an author gave: by the role attribute or, failing that, by a
  // custom element's ElementInternals (<x-list> whose internals say list).
  function resolvedRole(el) {
    try {
      return helpers.aria && typeof helpers.aria.getAuthorRole === 'function'
        ? helpers.aria.getAuthorRole(el)
        : '';
    } catch {
      return '';
    }
  }

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('li') : helpers.queryAll('li');

  // An element as a message names it: <div class="item-wrap">.
  function describeEl(n) {
    const tag = String(dom.localName(n) || dom.tagName(n) || '').toLowerCase();
    const cut = (v) => (v.length > 60 ? v.slice(0, 57) + '...' : v);
    const elId = String(dom.getAttribute(n, 'id') || '').trim();
    if (elId) return `<${tag} id="${cut(elId)}">`;
    const cls = String(dom.getAttribute(n, 'class') || '')
      .replace(/\s+/g, ' ')
      .trim();
    return cls ? `<${tag} class="${cut(cls)}">` : `<${tag}>`;
  }

  const failOccurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  // Composite widget roles (and toolbar), whose children must have the
  // roles the widget expects: an <li> left in one is a broken widget, not a
  // list whose loss may or may not matter.
  const WIDGET_CONTAINER_ROLES = new Set([
    'combobox',
    'grid',
    'listbox',
    'menu',
    'menubar',
    'radiogroup',
    'tablist',
    'toolbar',
    'tree',
    'treegrid'
  ]);

  // Whether the page draws the <li> as a list item: display list-item with a
  // marker. An item a reader sees that the markup puts in no list is a
  // relationship not programmatically determinable (SC 1.3.1); an <li> used
  // as a plain layout box, with no marker, shows no list.
  function drawnAsListItem(li) {
    try {
      const cs = helpers.computedStyle(li) || {};
      if (!/\blist-item\b/.test(String(cs.display || ''))) return false;
      const type = String(cs.listStyleType || '').trim();
      const image = String(cs.listStyleImage || '').trim();
      return (type !== '' && type !== 'none') || (image !== '' && image !== 'none');
    } catch {
      return false;
    }
  }
  function tierFor(li) {
    if (drawnAsListItem(li))
      return { bucket: failOccurrences, extra: { occurrenceOutcome: 'fail' } };
    return {
      bucket: cantTellOccurrences,
      extra: {
        occurrenceOutcome: 'cantTell',
        uncertainty: {
          code: 'spec-only',
          needed: 'Whether the page shows this element as an item of a list.',
          evidence: { drawnAsListItem: false }
        }
      }
    };
  }

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
    if (explicitRole === 'presentation' || explicitRole === 'none') {
      // role none or presentation is a valid parent only on a <ul>, <ol> or
      // <menu>: the list's presentation passes to its <li> children
      // (WAI-ARIA 1.2, required owned elements), which are no list items
      // then. On any other element (<div role="none">) it only removes that
      // element's own role, and the <li> is still in no list. A role none
      // wrapper inside a list (<ul><div role="none"><li>) is left as it was,
      // passing here, pending a decision (round 9, N9-5 b); list-children-valid
      // reports the wrapper.
      const grand = flatParent(parent);
      const grandTag = grand && dom.tagName(grand) ? dom.tagName(grand).toLowerCase() : '';
      const grandRole = grand ? resolvedRole(grand) : '';
      const inList =
        grandRole === 'list' ||
        (!grandRole && (grandTag === 'ul' || grandTag === 'ol' || grandTag === 'menu'));
      valid = parentTag === 'ul' || parentTag === 'ol' || parentTag === 'menu' || inList;
    } else if (explicitRole) {
      // An explicit role always wins over the tag's native role, in either
      // direction, see the header comment.
      // role="directory" is a required parent of listitem in WAI-ARIA 1.2,
      // deprecated but valid (aria-deprecated-role flags it).
      valid = explicitRole === 'list' || explicitRole === 'directory';
    } else {
      valid = parentTag === 'ul' || parentTag === 'ol' || parentTag === 'menu';
    }

    if (valid) continue;

    // A <ul>, <ol> or <menu> whose role replaces list (tablist, menu, menubar,
    // group, navigation…): the markup is a valid list, but the author made it
    // something else, so this <li> is a stray listitem in it, with its own
    // reason, since the fix differs: give the <li> the role the container
    // expects, rather than put it in a list. The list's semantics are gone
    // for certain; whether that loses information depends on the content (a
    // few links in a navigation read as well without it), so it is asked
    // about, leaning fail where the item is drawn as one of a list.
    const { bucket, extra } = tierFor(el);
    // Under a composite widget role (a <ul role="tablist">, a menu, a list
    // box...) the stray item breaks a widget whose children must have the
    // roles it expects: the <li> fails where it is drawn as a list item, and
    // is asked about as any misplaced <li> is where it is not. Under a
    // landmark or structure role (navigation, group, region...) the list is
    // asked about as below.
    if (
      explicitRole &&
      WIDGET_CONTAINER_ROLES.has(explicitRole) &&
      (parentTag === 'ul' || parentTag === 'ol' || parentTag === 'menu')
    ) {
      const fails = extra.occurrenceOutcome === 'fail';
      bucket.push(
        helpers.reportOccurrence(el, {
          ...extra,
          summary: `This list item's parent <${parentTag}> has role="${explicitRole}", which replaces list, so it is not in a list.`,
          hint: `Give the <li> the role the ${explicitRole} expects of its children, or role="none" with that role on what it holds, or remove the role from the <${parentTag}>.`,
          i18n: {
            summaryKey: fails
              ? 'listitemParentValid_summary_fail_listRoleOverridden'
              : 'listitemParentValid_summary_cantTell_listRoleOverridden',
            hintKey: fails
              ? 'listitemParentValid_hint_fail_listRoleOverridden'
              : 'listitemParentValid_hint_cantTell_listRoleOverridden',
            params: { parentElement: parentTag, parentRole: explicitRole }
          },
          data: {
            details: {
              reasonCode: 'LIST_ROLE_OVERRIDDEN',
              parentElement: parentTag,
              parentRole: explicitRole
            }
          }
        })
      );
      continue;
    }
    if (explicitRole && (parentTag === 'ul' || parentTag === 'ol' || parentTag === 'menu')) {
      const drawn = extra.occurrenceOutcome === 'fail';
      cantTellOccurrences.push(
        helpers.reportOccurrence(el, {
          occurrenceOutcome: 'cantTell',
          uncertainty: {
            code: 'spec-only',
            needed:
              'Whether the content loses information without the list: its items, their number or their order.',
            evidence: { drawnAsListItem: drawn, parentRole: explicitRole }
          },
          ...(drawn
            ? {
                lean: {
                  toward: 'fail',
                  why: 'The item is drawn with a bullet or number, as an item of a list the markup no longer exposes.',
                  signals: [
                    { signal: 'drawn-as-list-item', value: true },
                    { signal: 'parent-role', value: explicitRole }
                  ],
                  caution:
                    'A few links or controls, such as a navigation bar’s, may read as well without the list.',
                  i18n: {
                    whyKey: 'listitemParentValid_lean_why_listRoleOverridden',
                    cautionKey: 'listitemParentValid_lean_caution_listRoleOverridden'
                  }
                }
              }
            : {}),
          summary: `This list item's parent <${parentTag}> has role="${explicitRole}", which replaces list, so it is not in a list.`,
          hint: `Give the <li> the role the ${explicitRole} expects of its children, or role="none" with that role on what it holds, or remove the role from the <${parentTag}>.`,
          i18n: {
            summaryKey: 'listitemParentValid_summary_cantTell_listRoleOverridden',
            hintKey: 'listitemParentValid_hint_cantTell_listRoleOverridden',
            params: { parentElement: parentTag, parentRole: explicitRole }
          },
          data: {
            details: {
              reasonCode: 'LIST_ROLE_OVERRIDDEN',
              parentElement: parentTag,
              parentRole: explicitRole
            }
          }
        })
      );
      continue;
    }

    // A <ul>, <ol> or <menu> one to three levels up, a list still: the
    // wrappers between them (a <div>, an <a> around the item) break it,
    // and giving the wrapper role="list" would nest a second list. The
    // walk stops at another list or list item, which is not a wrapper.
    let listElement = '';
    const between = [];
    for (let cur = parent, i = 0; cur && i < 3; i++) {
      between.push(describeEl(cur));
      const up = flatParent(cur);
      const upTag = up && dom.tagName(up) ? dom.tagName(up).toLowerCase() : '';
      if (!upTag) break;
      if (upTag === 'ul' || upTag === 'ol' || upTag === 'menu') {
        const upRole = resolvedRole(up);
        if (!upRole || upRole === 'list') listElement = upTag;
        break;
      }
      if (upTag === 'li') break;
      cur = up;
    }
    const wrapper = listElement && between.length === 1 ? between[0] : '';
    // Named from the list down to the item, as they read in the markup.
    const wrappers = listElement && between.length > 1 ? between.slice(0).reverse().join(', ') : '';

    bucket.push(
      helpers.reportOccurrence(el, {
        ...extra,
        summary: wrappers
          ? `This <li> is inside a <${listElement}>, but the ${wrappers} between them break the list: a list's items must be its children.`
          : listElement
            ? `This <li> is inside a <${listElement}>, but the ${wrapper} between them breaks the list: a list's items must be its children.`
            : 'This list item is not contained by a list container.',
        hint: wrappers
          ? `Remove the elements between them, or move them inside the <li>, so the <li> is a child of the <${listElement}>.`
          : listElement
            ? `Move the <${parentTag}> inside the <li>, or remove it, so the <li> is a child of the <${listElement}>.`
            : 'Place this <li> inside a <ul> or <ol>, or give its parent role="list".',
        i18n: {
          summaryKey: wrappers
            ? 'listitemParentValid_summary_fail_wrappedMany'
            : listElement
              ? 'listitemParentValid_summary_fail_wrapped'
              : 'listitemParentValid_summary_fail',
          hintKey: wrappers
            ? 'listitemParentValid_hint_fail_wrappedMany'
            : listElement
              ? 'listitemParentValid_hint_fail_wrapped'
              : 'listitemParentValid_hint_fail',
          params: { parentElement: parentTag, listElement, wrapper, wrappers }
        },
        data: {
          details: {
            reasonCode: 'LISTITEM_INVALID_PARENT',
            parentElement: parentTag,
            ...(wrapper ? { listElement, wrapper } : {}),
            ...(wrappers ? { listElement, wrappedBy: between.slice(0) } : {})
          }
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
