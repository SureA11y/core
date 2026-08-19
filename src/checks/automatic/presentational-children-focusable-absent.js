/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check presentational-children-focusable-absent
 * @atomic true
 * @summary A role whose children are presentational must not contain content in sequential focus navigation
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to elements whose semantic role is one of the WAI-ARIA roles
 *   defined as having presentational children (button, checkbox, img,
 *   menuitemcheckbox, menuitemradio, meter, option, progressbar, radio,
 *   scrollbar, separator, slider, switch, tab — plus doc-pagebreak and
 *   graphics-symbol from the DPUB-ARIA/Graphics-ARIA modules, which
 *   inherit the same trait). The role can be explicit (role="tab") or
 *   native (<button>, <meter>, <progress>, <option>).
 * @expectation
 *   No descendant of the element is part of sequential focus navigation.
 *   The presentational-children mechanism removes every descendant from
 *   the accessibility tree, so a descendant that still takes a tab stop
 *   receives focus with no role and no name to announce.
 * @implementation-notes
 * - "Presentational children" is the implicit, role-driven mechanism from
 *   WAI-ARIA §5.2.7, NOT an explicit role="presentation"/"none" attribute
 *   — an element carrying that attribute has a semantic role of
 *   presentation/none, which is not in the list above, so it is out of
 *   scope here (presentation-role-conflict covers that case).
 * - Only tab stops count, not everything focusable: a descendant with
 *   tabindex="-1" is programmatically focusable but is not part of
 *   sequential focus navigation, so it takes no tab stop and is not
 *   reported. helpers.getFocusableInfo's `tabbable` flag is exactly this
 *   distinction, and also accounts for :disabled, inert and invalid
 *   tabindex values.
 * - Native tags are mapped only where the element can actually have
 *   descendants: <input type="checkbox">, <img> and <hr> also carry a
 *   presentational-children role, but they are void, so no descendant can
 *   ever exist to report. Including them would only inflate the applicable
 *   count.
 * - The walk stops at each reported tab stop, and at a nested element that
 *   has a presentational-children role of its own without being a tab stop
 *   — that one owns whatever is inside it, and is examined as its own
 *   container. A tab stop therefore lands on the nearest role that dropped
 *   it from the accessibility tree, the element an author would fix, rather
 *   than on every enclosing one. A nested role that IS a tab stop
 *   (role="button" tabindex="0" inside a <button>) is reported here: focus
 *   lands inside this element.
 * - Anything inside an aria-hidden="true" subtree is left to
 *   aria-hidden-focus, which reports that exact defect (a tab stop with no
 *   accessibility-tree node) as its own normative decision. Non-rendered
 *   descendants (display:none, hidden, visibility:hidden) take no tab stop
 *   at all and are skipped.
 * - Browsers implement presentational children inconsistently — some
 *   expose the descendants anyway, especially when they are focusable — so
 *   the announced result varies by browser. The markup contradiction is
 *   the same in every one of them, which is what this rule reports.
 */

const id = 'presentational-children-focusable-absent';

const meta = {
  title: 'Roles with presentational children must not contain focusable content',
  description:
    'Checks that an element whose role makes its children presentational (button, checkbox, img, option, radio, slider, switch, tab, ...) contains no descendant that takes a tab stop.',
  i18n: {
    titleKey: 'presentationalChildrenFocusableAbsent_title',
    descriptionKey: 'presentationalChildrenFocusableAbsent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'aria', 'structure', 'focus', 'atomic', 'automatic'],
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
  coverage: { facetsBySc: { '4.1.2': ['presentational-children-focusable-absent'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  // Declared inside runInPage — see scripts/build-core.js header
  // ("runInPage MUST be self-contained").
  //
  // WAI-ARIA roles with "Children Presentational: True", plus the two
  // module roles that inherit the trait (doc-pagebreak from DPUB-ARIA,
  // graphics-symbol from Graphics-ARIA).
  const PRESENTATIONAL_CHILDREN_ROLES = [
    'button',
    'checkbox',
    'doc-pagebreak',
    'graphics-symbol',
    'img',
    'menuitemcheckbox',
    'menuitemradio',
    'meter',
    'option',
    'progressbar',
    'radio',
    'scrollbar',
    'separator',
    'slider',
    'switch',
    'tab'
  ];

  // Native tags whose implicit role is in the set above and that can hold
  // descendants — see the void-element note in the header comment.
  const NATIVE_ROLE_BY_TAG = {
    button: 'button',
    meter: 'meter',
    option: 'option',
    progress: 'progressbar'
  };

  const ariaHelpers = helpers && helpers.aria ? helpers.aria : null;

  const getFocusableInfo =
    helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;

  const isDomVisibleEligible =
    helpers && typeof helpers.isDomVisibleEligible === 'function'
      ? helpers.isDomVisibleEligible
      : null;

  const getEligibilityInfo =
    helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

  const roleSet = new Set(PRESENTATIONAL_CHILDREN_ROLES);

  function lower(v) {
    return (v == null ? '' : String(v)).trim().toLowerCase();
  }

  // The role attribute holds a fallback list; the first token that names a
  // real role wins. A role="tab" resolves here, a role="figure tab" does
  // not (figure wins and has no presentational children), and a list of
  // nothing but unknown tokens falls back to the native role.
  function getPresentationalChildrenRole(el) {
    const raw = el.getAttribute ? el.getAttribute('role') : null;
    if (raw) {
      const tokens = lower(raw).split(/\s+/);
      for (const token of tokens) {
        if (!token) continue;
        if (roleSet.has(token)) return token;
        const known = ariaHelpers ? ariaHelpers.isValidConcreteRole(token) : true;
        if (known) return '';
      }
    }
    const tag = lower(el.tagName);
    return Object.prototype.hasOwnProperty.call(NATIVE_ROLE_BY_TAG, tag)
      ? NATIVE_ROLE_BY_TAG[tag]
      : '';
  }

  function isExposed(node) {
    if (!isAccTreeEligible) return true;
    try {
      const r = isAccTreeEligible(node, ctx);
      if (typeof r === 'boolean') return r;
      return !!(r && r.eligible);
    } catch {
      return true;
    }
  }

  // Flat-tree ancestor walk, shared with every other rule via
  // ctx.helpers.composedParent so a shadow host is crossed the same way here
  // as elsewhere.
  const composedParent =
    helpers && typeof helpers.composedParent === 'function'
      ? helpers.composedParent
      : function (n) {
          return n && n.parentElement ? n.parentElement : null;
        };

  // isAccTreeEligible deliberately keeps an aria-hidden element that holds
  // tabbable content in the accessibility tree (reason
  // "ariaHiddenOverriddenTabbable", modelling the browsers that expose it
  // anyway) — which is precisely the shape aria-hidden-focus owns, so the
  // attribute is checked on its own here rather than read off eligibility.
  function inAriaHiddenSubtree(node) {
    let cur = node;
    let guard = 0;
    while (cur && guard++ < 200) {
      if (lower(cur.getAttribute && cur.getAttribute('aria-hidden')) === 'true') return true;
      cur = composedParent(cur);
    }
    return false;
  }

  function isRendered(node) {
    if (!isDomVisibleEligible) return true;
    try {
      const vis = isDomVisibleEligible(node, ctx, {
        visibilityMode: 'styleOnly',
        disableGeometry: true
      });
      return !(vis && vis.eligible === false);
    } catch {
      return true;
    }
  }

  function isTabStop(node) {
    if (!getFocusableInfo) return false;
    try {
      const info = getFocusableInfo(node, ctx);
      return !!(info && info.tabbable);
    } catch {
      return false;
    }
  }

  // Shallowest tab stops inside `root`, stopping at each one and at any
  // nested presentational-children role, so every tab stop is attributed to
  // the nearest role that removes it from the accessibility tree.
  function collectTabStops(root) {
    const out = [];
    const top = root && root.children;
    if (!top || !top.length) return out;
    const stack = [];
    for (let i = top.length - 1; i >= 0; i--) stack.push(top[i]);
    while (stack.length) {
      const node = stack.pop();
      if (!node || node.nodeType !== 1) continue;
      if (lower(node.getAttribute && node.getAttribute('aria-hidden')) === 'true') continue;
      if (!isRendered(node)) continue;
      if (isTabStop(node)) {
        out.push(node);
        continue;
      }
      // A nested role with presentational children owns whatever tab stops
      // are inside it (it is examined as its own container in the main
      // loop). It is only a boundary when it is not itself a tab stop —
      // a focusable one lands focus inside THIS element and belongs here.
      if (getPresentationalChildrenRole(node)) continue;
      const kids = node.children;
      if (kids && kids.length) {
        for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]);
      }
    }
    return out;
  }

  const SELECTOR = '[role], button, meter, option, progress';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(SELECTOR)
    : helpers.queryAll(SELECTOR);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || el.nodeType !== 1) continue;

    const role = getPresentationalChildrenRole(el);
    if (!role) continue;
    // A container that is hidden, or sits in an aria-hidden subtree, is
    // aria-hidden-focus's concern — see the note on inAriaHiddenSubtree.
    if (!isExposed(el) || inAriaHiddenSubtree(el)) continue;

    applicableCount += 1;

    const tabStops = collectTabStops(el);
    if (!tabStops.length) continue;

    const tabStopTags = tabStops.map((n) => (n && n.tagName ? lower(n.tagName) : 'unknown'));
    const dedupedTabStopTags = [...new Set(tabStopTags)];

    const eligInfo = getEligibilityInfo
      ? (() => {
          try {
            return getEligibilityInfo(el, ctx, { targetSet: 'acc' });
          } catch {
            return null;
          }
        })()
      : null;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This role="${role}" element makes its children presentational, but it contains content that is still part of sequential focus navigation (${dedupedTabStopTags.join(', ')}).`,
        hint: 'Move the focusable content outside this element, or remove the role that makes the children presentational — focus landing inside it has no role or name to announce.',
        i18n: {
          summaryKey: 'presentationalChildrenFocusableAbsent_summary_fail',
          hintKey: 'presentationalChildrenFocusableAbsent_hint_fail',
          params: { role, focusableElements: dedupedTabStopTags.join(', ') }
        },
        data: {
          visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
          details: {
            reasonCode: 'PRESENTATIONAL_CHILDREN_FOCUSABLE_CONTENT',
            role,
            element: lower(el.tagName),
            focusableElements: tabStopTags
          }
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
