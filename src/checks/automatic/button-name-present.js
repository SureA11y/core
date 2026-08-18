/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

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
  const { helpers, rule } = ctx;

  const occurrences = [];
  let applicableCount = 0;

  function normalizeWs(s) {
    return String(s || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getConservativeSubtreeText(container) {
    // "Name from content" — recurses into descendants and uses each one's
    // own accessible name (img alt, aria-label/aria-labelledby, title) when
    // it has one, not just literal text nodes. See getContentNameInfo's
    // header comment in src/core/dom-helpers.js for the full rationale
    // (covers the common "<a><img alt='...'></a>" logo-link /
    // "<button><img alt='...'></button>" icon-button pattern).
    if (helpers.getContentNameInfo) {
      const info = helpers.getContentNameInfo(container, ctx);
      return info && info.present ? info.value : '';
    }
    const t = container && container.textContent ? String(container.textContent) : '';
    return t.replace(/\s+/g, ' ').trim();
  }

  function getInputButtonValueName(el) {
    try {
      const type = normalizeWs(el.getAttribute ? el.getAttribute('type') : '').toLowerCase();
      if (type !== 'button' && type !== 'submit' && type !== 'reset') return '';
      const vAttr = el.getAttribute ? el.getAttribute('value') : '';
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

  const selector =
    'button, input[type="button"], input[type="submit"], input[type="reset"], [role="button"]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

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

    const tag = (el.tagName || '').toLowerCase();
    const role = el.getAttribute ? el.getAttribute('role') : null;
    const roleNorm = normalizeWs(role).toLowerCase();

    // role="none"/"presentation" removes this element from the accessibility
    // tree as a button (WAI-ARIA Presentational Roles Conflict Resolution),
    // UNLESS a conflicting global ARIA attribute or focusability restores
    // its native/explicit role -- mirrors presentation-role-conflict-manual.js's
    // detection logic. Kept local to this rule rather than routed through
    // the shared eligibility helper: several other rules deliberately rely
    // on that helper staying permissive for role="none" wrappers they walk
    // through themselves (e.g. aria-prohibited-children's "transparent
    // wrapper" traversal).
    if (roleNorm === 'none' || roleNorm === 'presentation') {
      const ariaHiddenTrue = el.getAttribute && el.getAttribute('aria-hidden') === 'true';
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
          el.hasAttribute ? el.hasAttribute(a) : false
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
    }

    applicableCount += 1;

    const nameInfo = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(el, ctx) : null;

    // getAccessibleNameInfo only resolves programmatic mechanisms (aria-labelledby,
    // aria-label, native <label> association, title) — it never falls back to
    // subtree content — so it's safe to trust directly whenever present.
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
              return !!helpers.aria.isKnownRole(roleNorm);
            } catch {
              return false;
            }
          })()
        : false;
    const isContentNameCandidate =
      (tag === 'button' || role === 'button') &&
      (!roleNorm || !isKnownRoleToken || NAME_FROM_CONTENT_ROLES.includes(roleNorm));
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
