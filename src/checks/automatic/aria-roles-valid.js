/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check aria-roles-valid
 * @atomic true
 * @summary An explicit role attribute must resolve to a real, non-abstract ARIA role
 * @standard WCAG 2.2
 * @sc 1.3.1, 4.1.2
 * @applicability
 *   Applies to any element with a non-empty role="" attribute in the composed DOM.
 * @expectation
 *   At least one role token names a concrete, non-abstract ARIA role.
 *   Graded by what the element falls back to when none does:
 *   - FAIL on a roleless host (div, span, custom element), which is left
 *     exposed as generic, so the role the author meant reaches no one.
 *   - CANTTELL where the element has a native role (a <button>, <nav>,
 *     <a href>), which the accessibility tree keeps using. ACT 674b10 lists
 *     4.1.2 as a secondary requirement only, "satisfied through the implicit
 *     role," so the bad token is worth reporting but is not itself the
 *     criterion failing.
 * @reports
 *   - `role`: the first token of the role attribute. No token in it is a
 *     known role, or the known ones are all abstract.
 *   - `nativeRole` (the CANTTELL case): the element's native role, which
 *     assistive technology keeps using.
 * @reason-codes
 *   - `ARIA_ROLE_INVALID` (fail, cantTell): no token of the role attribute is a
 *     known ARIA role; it fails on an element left with no role, and is asked
 *     about where the element keeps its native role.
 *     Where asked about, it leans pass when the value is a near misspelling of
 *     the native role and fail when it is one of another role.
 *     Basis: WCAG 1.3.1; WCAG 4.1.2; ACT 674b10; WAI-ARIA 1.2 role attribute.
 *   - `ARIA_ROLE_ABSTRACT` (fail, cantTell): the role attribute names only
 *     abstract roles, which authors must not use; it fails on an element left
 *     with no role, and is asked about where the element keeps its native role.
 *     Where asked about, it leans pass when the native role is a kind of the
 *     abstract role named, and fail when it is not.
 *     Basis: WCAG 1.3.1; WCAG 4.1.2; ACT 674b10; WAI-ARIA 1.2 abstract roles
 *     (MUST).
 */

const id = 'aria-roles-valid';

const meta = {
  title: 'role attribute must be a valid, non-abstract ARIA role',
  description:
    'Checks that an explicit role="" attribute resolves to a real, non-abstract WAI-ARIA role.',
  i18n: {
    titleKey: 'ariaRolesValid_title',
    descriptionKey: 'ariaRolesValid_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag131', 'wcag412', 'aria', 'structure', 'atomic', 'automatic'],
  wcagSc: ['1.3.1', '4.1.2'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.3.1',
      title: 'Info and Relationships',
      conformanceLevel: 'A'
    },
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
  coverage: { facetsBySc: { '1.3.1': ['aria-role-valid'], '4.1.2': ['aria-role-valid'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;

  const ariaHelpers = helpers && helpers.aria ? helpers.aria : null;
  if (!ariaHelpers) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[role]')
    : helpers.queryAll('[role]');

  const failOccurrences = [];
  const cantTellOccurrences = [];
  let applicableCount = 0;

  // Programmatically hidden per the ACT glossary: display:none, visibility not
  // visible, or aria-hidden on the element or an ancestor. inert is treated
  // the same although the glossary predates it -- an inert subtree is out of
  // the accessibility tree entirely, so a role on it reaches no one.
  function isHidden(el) {
    try {
      if (typeof helpers.isDomVisibleEligible === 'function') {
        if (!helpers.isDomVisibleEligible(el, ctx)) return true;
      }
      // Walk the composed tree, not parentElement: that stops at a shadow
      // root, so a host carrying aria-hidden or inert would never be seen
      // from inside its own shadow content.
      const up =
        typeof helpers.composedParent === 'function'
          ? helpers.composedParent
          : (n) => dom.parentElement(n);

      // A shadow root has no getAttribute, so skip past it rather than
      // stopping: the host one step further up is the node that matters.
      for (let n = el; n; n = up(n)) {
        if (!dom.get(n, 'getAttribute')) continue;
        if (String(dom.getAttribute(n, 'aria-hidden') || '').toLowerCase() === 'true') return true;
        if (dom.get(n, 'hasAttribute') && dom.hasAttribute(n, 'inert')) return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  // The native roles that are a kind of each abstract role (WAI-ARIA 1.2
  // superclass chains), for the native roles getNativeRoleForElement gives.
  const NATIVE_BY_ABSTRACT = {
    command: ['link', 'button'],
    composite: ['listbox'],
    input: ['checkbox', 'radio', 'textbox', 'searchbox', 'combobox'],
    landmark: ['complementary', 'form', 'banner', 'navigation', 'main'],
    range: [],
    roletype: null, // every role
    section: [
      'complementary',
      'form',
      'banner',
      'img',
      'listitem',
      'navigation',
      'list',
      'listbox',
      'main',
      'table',
      'cell',
      'columnheader',
      'row'
    ],
    sectionhead: ['heading', 'columnheader'],
    select: ['listbox'],
    structure: [
      'article',
      'complementary',
      'form',
      'banner',
      'heading',
      'separator',
      'img',
      'listitem',
      'navigation',
      'list',
      'listbox',
      'main',
      'table',
      'cell',
      'columnheader',
      'row'
    ],
    widget: [
      'link',
      'button',
      'checkbox',
      'radio',
      'textbox',
      'searchbox',
      'combobox',
      'listbox',
      'columnheader',
      'row'
    ],
    window: []
  };

  // Edits (insert, delete, replace, or swap two neighbours) from a to b.
  function editDistance(a, b) {
    const d = [];
    for (let i = 0; i <= a.length; i++) {
      d.push([i]);
      for (let j = 1; j <= b.length; j++) {
        if (i === 0) {
          d[0].push(j);
          continue;
        }
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        let v = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
          v = Math.min(v, d[i - 2][j - 2] + 1);
        d[i].push(v);
      }
    }
    return d[a.length][b.length];
  }

  // The one concrete role a token is a near misspelling of: one edit away
  // for a token of up to five letters, two for a longer one, and no other
  // role as near. Shorter tokens resemble too many words to tell.
  function nearestRole(token) {
    if (token.length < 4 || typeof ariaHelpers.concreteRoles !== 'function') return '';
    const limit = token.length <= 5 ? 1 : 2;
    let best = '';
    let bestDistance = Infinity;
    let tie = false;
    for (const r of ariaHelpers.concreteRoles()) {
      const d = editDistance(token, r);
      if (d < bestDistance) {
        best = r;
        bestDistance = d;
        tie = false;
      } else if (d === bestDistance) tie = true;
    }
    return bestDistance <= limit && !tie ? best : '';
  }

  // Which way an unusable role on an element that keeps its native role
  // points: whether the native role is what the author named.
  function leanFor(reasonCode, tokens, nativeRole) {
    if (reasonCode === 'ARIA_ROLE_INVALID') {
      if (tokens.length !== 1) return null;
      const nearest = nearestRole(tokens[0]);
      if (!nearest) return null;
      const signals = [
        { signal: 'nearest-known-role', value: nearest },
        { signal: 'native-role', value: nativeRole }
      ];
      if (nearest === nativeRole) {
        return {
          toward: 'pass',
          why: 'The role value looks like a misspelling of the element’s native role, which the element keeps.',
          signals,
          i18n: { whyKey: 'ariaRolesValid_lean_why_typoOfNative' }
        };
      }
      return {
        toward: 'fail',
        why: 'The role value looks like a misspelling of another role, which the element does not get: it keeps its native role instead.',
        signals,
        caution: 'A short value can resemble a role it was never meant to be.',
        i18n: {
          whyKey: 'ariaRolesValid_lean_why_typoOfOther',
          cautionKey: 'ariaRolesValid_lean_caution_typoOfOther'
        }
      };
    }
    const named = tokens.filter((t) => ariaHelpers.isAbstractRole(t));
    if (!named.length) return null;
    const isKind = named.some((t) => {
      const kinds = NATIVE_BY_ABSTRACT[t];
      return kinds === null || (Array.isArray(kinds) && kinds.includes(nativeRole));
    });
    const signals = [
      { signal: 'native-role', value: nativeRole },
      { signal: 'native-is-subclass', value: isKind }
    ];
    if (isKind) {
      return {
        toward: 'pass',
        why: 'The element’s native role is a kind of the abstract role named, so it already exposes a concrete form of it.',
        signals,
        caution: 'Being a kind of the abstract role does not show it is the role meant.',
        i18n: {
          whyKey: 'ariaRolesValid_lean_why_abstractKind',
          cautionKey: 'ariaRolesValid_lean_caution_abstractKind'
        }
      };
    }
    return {
      toward: 'fail',
      why: 'The element’s native role is not a kind of the abstract role named, so what the author named is not exposed.',
      signals,
      i18n: { whyKey: 'ariaRolesValid_lean_why_abstractOther' }
    };
  }

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    // ACT 674b10 is not applicable to a programmatically hidden element.
    if (isHidden(el)) continue;

    // role takes a fallback list and the first token the browser recognises
    // wins, so role="searchfield searchbox" resolves to searchbox. The rule
    // fails only when no token names a concrete role.
    const tokens =
      typeof ariaHelpers.getAllRoleTokens === 'function'
        ? ariaHelpers.getAllRoleTokens(el)
        : [ariaHelpers.getExplicitRole(el)].filter(Boolean);
    if (!tokens.length) continue; // role="" or whitespace-only: not this rule's concern

    applicableCount += 1;

    const usable = tokens.find((t) => ariaHelpers.isKnownRole(t) && !ariaHelpers.isAbstractRole(t));
    if (usable) continue;

    const role = tokens[0];
    const isKnown = tokens.some((t) => ariaHelpers.isKnownRole(t));
    const reasonCode = !isKnown ? 'ARIA_ROLE_INVALID' : 'ARIA_ROLE_ABSTRACT';

    // An unusable role token leaves the element on its native role, when it
    // has one: ACT 674b10 lists 4.1.2 as only a secondary requirement for
    // exactly that reason. A roleless host (div, span, custom element) has
    // nothing to fall back to and is exposed as generic instead.
    const nativeRole =
      typeof ariaHelpers.getNativeRoleForElement === 'function'
        ? ariaHelpers.getNativeRoleForElement(el) || ''
        : '';

    if (nativeRole) {
      const lean = leanFor(reasonCode, tokens, nativeRole);
      cantTellOccurrences.push(
        helpers.reportOccurrence(el, {
          occurrenceOutcome: 'cantTell',
          summary: `The role attribute has no usable value, so this element keeps its native role, "${nativeRole}".`,
          hint: 'Fix or remove the role attribute; until then, assistive technology treats the element by its native role.',
          i18n: {
            summaryKey: 'ariaRolesValid_summary_cantTell',
            hintKey: 'ariaRolesValid_hint_cantTell',
            params: { role, nativeRole }
          },
          uncertainty: {
            code: 'spec-only',
            needed: 'Whether the native role this element falls back to is the one intended.',
            evidence: { role, nativeRole, fallbackExposed: true }
          },
          ...(lean ? { lean } : {}),
          data: {
            details: { reasonCode, role, nativeRole }
          }
        })
      );
      continue;
    }

    failOccurrences.push(
      helpers.reportOccurrence(el, {
        occurrenceOutcome: 'fail',
        summary: !isKnown
          ? 'The role attribute value is not a recognized ARIA role.'
          : 'The role attribute value is an abstract ARIA role, which must not be used directly.',
        hint: !isKnown
          ? 'Use a valid ARIA role, or remove the role attribute if none fits.'
          : 'Replace it with a concrete role that matches what the element is, such as "button" or "region".',
        i18n: {
          summaryKey: !isKnown
            ? 'ariaRolesValid_summary_invalid'
            : 'ariaRolesValid_summary_abstract',
          hintKey: !isKnown ? 'ariaRolesValid_hint_invalid' : 'ariaRolesValid_hint_abstract',
          params: { role }
        },
        data: {
          details: { reasonCode, role }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  const resolved = helpers.resolveTieredOutcome(
    failOccurrences,
    cantTellOccurrences,
    rule.defaultSeverity || 'serious'
  );
  return { ruleId: rule.ruleId, ...resolved };
}

module.exports = { id, meta, runInPage };
