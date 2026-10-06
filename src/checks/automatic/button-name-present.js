/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check button-name-present
 * @atomic true
 * @summary Buttons must have an accessible name
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to <button>, <input type="button">, <input type="submit">,
 *   <input type="reset"> and elements whose role attribute resolves to
 *   button (its first known, non-abstract token, in any case, so
 *   role="foo button" counts and role="link button" does not), where the
 *   element is included in the accessibility tree. role="presentation"/"none" takes
 *   an element out of scope unless a global ARIA attribute or focusability
 *   restores its role, per presentational roles conflict resolution.
 * @expectation
 *   The element has a non-empty accessible name. A programmatic name is
 *   taken first (aria-labelledby, aria-label, an associated <label>, title).
 *   Failing that, an <input> button falls back to its value attribute, and
 *   type="submit"/type="reset" fall back to the user agent's own
 *   "Submit"/"Reset" default, which is why those two are never nameless.
 *   Failing both, a button whose role is name-from-content falls back to its
 *   subtree text, counting each descendant's own name (an <img alt>,
 *   aria-label, an <svg>'s <title> child, or title) rather than only text
 *   nodes.
 * @reports
 *   - `refs.accessibleName`: what the lookup of a programmatic name
 *     (aria-labelledby, aria-label, <label>, title) found. Its `mechanism`
 *     is the source it stopped at, `none` when there was none, and its
 *     `flags` say why a naming attribute that is there gave no name, for
 *     example `aria-label-empty` or `aria-labelledby-empty-or-unresolvable`.
 */

// NOTE: Repo ruleId contract requires ENGINE_TAG prefix in the rule id.
// File name intentionally has no prefix, per request.
const id = 'button-name-present';

const meta = {
  title: 'Buttons have an accessible name',
  description: 'Checks that buttons expose a non-empty accessible name.',
  i18n: {
    titleKey: 'buttonNamePresent_title',
    descriptionKey: 'buttonNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'forms', 'atomic', 'automatic', 'buttons', 'name'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '4.1.2',
      title: 'Name, Role, Value',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['button-name-present'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const occurrences = [];
  let applicableCount = 0;

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getConservativeSubtreeText(container) {
    // "Name from content", recurses into descendants and uses each one's
    // own accessible name (img alt, aria-label/aria-labelledby, title) when
    // it has one, not just literal text nodes. See getContentNameInfo's
    // header comment in src/core/dom-helpers.js for the full rationale
    // (covers the common "<a><img alt='...'></a>" logo-link /
    // "<button><img alt='...'></button>" icon-button pattern).
    if (helpers.getContentNameInfo) {
      const info = helpers.getContentNameInfo(container, ctx);
      return info && info.present ? info.value : '';
    }
    const t = container && dom.textContent(container) ? String(dom.textContent(container)) : '';
    return t.replace(/\s+/g, ' ').trim();
  }

  function getInputButtonValueName(el) {
    try {
      const type = normalizeWs(
        dom.get(el, 'getAttribute') ? dom.getAttribute(el, 'type') : ''
      ).toLowerCase();
      if (type !== 'button' && type !== 'submit' && type !== 'reset') return '';
      const vAttr = dom.get(el, 'getAttribute') ? dom.getAttribute(el, 'value') : '';
      const explicit = normalizeWs(
        vAttr != null ? vAttr : typeof el.value === 'string' ? el.value : ''
      );
      if (explicit) return explicit;
      // HTML spec: input[type=submit]/[type=reset] with no `value` fall back
      // to a UA-supplied default label ("Submit"/"Reset"), so they are never
      // actually nameless -- unlike type=button, whose value defaults to "".
      if (type === 'submit') return 'Submit';
      if (type === 'reset') return 'Reset';
      return '';
    } catch {
      return '';
    }
  }

  // The element's explicit role as user agents resolve it: the first known,
  // non-abstract token of the role attribute, in any case ('' for none).
  function getExplicitRole(el) {
    try {
      return helpers.aria && typeof helpers.aria.getExplicitRole === 'function'
        ? helpers.aria.getExplicitRole(el)
        : '';
    } catch {
      return '';
    }
  }

  // The role attribute is a fallback list, so role="foo button" and
  // role="BUTTON" are buttons; role="link button" is a link. Select by token,
  // case-insensitively, then keep role-only candidates that resolve to button.
  const NATIVE_BUTTONS = 'button, input[type="button"], input[type="submit"], input[type="reset"]';
  const selector = `${NATIVE_BUTTONS}, [role~="button" i]`;
  const nodes = (
    helpers.queryAllSmart ? helpers.queryAllSmart(selector) : helpers.queryAll(selector)
  ).filter((el) => {
    try {
      if (dom.matches(el, NATIVE_BUTTONS)) return true;
    } catch {
      // fall through to the role check
    }
    return getExplicitRole(el) === 'button';
  });

  for (const el of nodes) {
    // isAccTreeEligible returns { eligible, reasons }, not a boolean.
    // Naming rules apply only to elements included in the accessibility tree
    // (ACT c487ae), which excludes focusable aria-hidden content;
    // aria-hidden-focus (ACT 6cfa84) covers that markup instead.
    const eligResult = helpers.isIncludedInAccessibilityTree
      ? helpers.isIncludedInAccessibilityTree(el, ctx)
      : helpers.isAccTreeEligible
        ? helpers.isAccTreeEligible(el, ctx)
        : true;
    const eligible =
      typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    const tag = (dom.tagName(el) || '').toLowerCase();
    const role = getExplicitRole(el);
    const roleNorm = role;
    // The role the name is computed for: the explicit one, unless the
    // presentational-role conflict below restores the implicit role.
    let nameRole = roleNorm;

    // role="none"/"presentation" removes this element from the accessibility
    // tree as a button (WAI-ARIA Presentational Roles Conflict Resolution),
    // UNLESS a conflicting global ARIA attribute or focusability restores
    // its native/explicit role -- mirrors presentation-role-conflict-manual.js's
    // detection logic. Kept local to this rule rather than routed through
    // the shared eligibility helper: several other rules rely
    // on that helper staying permissive for role="none" wrappers they walk
    // through themselves (e.g. aria-prohibited-children's "transparent
    // wrapper" traversal).
    if (roleNorm === 'none' || roleNorm === 'presentation') {
      const ariaHiddenTrue =
        dom.get(el, 'getAttribute') && dom.getAttribute(el, 'aria-hidden') === 'true';
      if (!ariaHiddenTrue) {
        const GLOBAL_ARIA_ATTRS = [
          'aria-atomic',
          'aria-braillelabel',
          'aria-brailleroledescription',
          'aria-busy',
          'aria-controls',
          'aria-current',
          'aria-describedby',
          'aria-description',
          'aria-details',
          'aria-disabled',
          'aria-dropeffect',
          'aria-errormessage',
          'aria-flowto',
          'aria-grabbed',
          'aria-haspopup',
          'aria-hidden',
          'aria-invalid',
          'aria-keyshortcuts',
          'aria-label',
          'aria-labelledby',
          'aria-live',
          'aria-owns',
          'aria-relevant',
          'aria-roledescription'
        ];
        const hasConflict = GLOBAL_ARIA_ATTRS.some((a) =>
          dom.get(el, 'hasAttribute') ? dom.hasAttribute(el, a) : false
        );
        let isFocusable = false;
        if (!hasConflict && helpers.getFocusableInfo) {
          try {
            const fi = helpers.getFocusableInfo(el, ctx);
            isFocusable = !!(fi && fi.focusable);
          } catch {
            isFocusable = false;
          }
        }
        if (!hasConflict && !isFocusable) continue;
      }
      // The conflict restores the native role, a button, which takes its
      // name from its content: <button role="presentation">Save</button>
      // is a button named "Save".
      nameRole = '';
    }

    applicableCount += 1;

    const nameInfo = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(el, ctx) : null;

    // getAccessibleNameInfo only resolves programmatic mechanisms (aria-labelledby,
    // aria-label, native <label> association, title), it never falls back to
    // subtree content, so it's safe to trust directly whenever present.
    const trustedProgrammaticName = normalizeWs(
      nameInfo && nameInfo.present && typeof nameInfo.value === 'string' ? nameInfo.value : ''
    );
    const explicitProg = !!trustedProgrammaticName;

    let inputValueName = '';
    if (!trustedProgrammaticName && tag === 'input') {
      inputValueName = getInputButtonValueName(el);
    }

    // ARIA 1.2 "Name From: author, contents". Every other known role is
    // name-from-author-only: <button role="combobox">List</button> exposes a
    // value, not a label. An unknown role falls back to the implicit role.
    // <generated:aria-name-from-content>
    const NAME_FROM_CONTENT_ROLES = [
      'button',
      'cell',
      'checkbox',
      'columnheader',
      'doc-backlink',
      'doc-biblioref',
      'doc-glossref',
      'doc-noteref',
      'graphics-object',
      'gridcell',
      'heading',
      'link',
      'menuitem',
      'menuitemcheckbox',
      'menuitemradio',
      'option',
      'radio',
      'row',
      'rowgroup',
      'rowheader',
      'switch',
      'tab',
      'tooltip',
      'treeitem'
    ];
    // </generated:aria-name-from-content>
    const isKnownRoleToken =
      helpers && helpers.aria && typeof helpers.aria.isKnownRole === 'function'
        ? (() => {
            try {
              return !!helpers.aria.isKnownRole(nameRole);
            } catch {
              return false;
            }
          })()
        : false;
    const isContentNameCandidate =
      (tag === 'button' || role === 'button') &&
      (!nameRole || !isKnownRoleToken || NAME_FROM_CONTENT_ROLES.includes(nameRole));
    const contentName =
      !trustedProgrammaticName && !inputValueName && isContentNameCandidate
        ? getConservativeSubtreeText(el)
        : '';

    const finalName = normalizeWs(trustedProgrammaticName || inputValueName || contentName);

    if (!finalName) {
      // Only compute the richer eligibility-info payload (used solely for
      // the occurrence's visibilityFilter) once we know an occurrence is
      // actually being built, rather than for every applicable element.
      const eligInfo = helpers.getEligibilityInfo
        ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
        : null;

      occurrences.push(
        helpers.reportOccurrence(el, {
          summary: 'This button has no accessible name.',
          hint: 'Provide visible button text or a programmatic accessible-name mechanism (for example aria-label) so assistive technologies can identify the button.',
          i18n: {
            summaryKey: 'buttonNamePresent_summary_fail',
            hintKey: 'buttonNamePresent_hint_fail',
            params: { element: tag }
          },
          data: {
            visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
            details: {
              reasonCode: 'name_missing',
              metrics: {
                trustedProgrammaticNameLength: trustedProgrammaticName.length,
                inputValueNameLength: inputValueName.length,
                contentNameLength: contentName.length,
                explicitProgrammatic: explicitProg ? 1 : 0
              },
              refs: { accessibleName: nameInfo || null }
            }
          }
        })
      );
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
