/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Generic name-presence rule for the ARIA roles WAI-ARIA *requires* an
 * accessible name for.
 *
 * Notes:
 * - This rule intentionally focuses on author-provided naming mechanisms:
 *   aria-label, aria-labelledby, and title.
 * - It does NOT treat descendant text content as a valid name source for these roles
 *   (to avoid false passes from labelled children inside composite widgets).
 * - Eligibility is based on helpers.isAccTreeEligible(node, ctx) per engine checks.
 * - The role set is generated from aria-query by
 *   scripts/generate-aria-tables.js; see that script for why each role is in
 *   or out, and for the name-required roles no rule covers yet.
 *
 * @applicability
 *   Applies to elements whose role attribute is exactly one of grid, meter,
 *   progressbar, radiogroup or tree, and that are included in the
 *   accessibility tree. Membership is decided by WAI-ARIA's own "Accessible
 *   Name Required: True" characteristic, not by whether a role merely permits
 *   a name: tablist, toolbar, menu, menubar and scrollbar are name-from-author
 *   roles the spec does not require a name for, and are deliberately out of
 *   scope. meter and progressbar are also covered by meter-name-present and
 *   progressbar-name-present, which map to SC 1.1.1; this rule is what gives
 *   those two roles their 4.1.2 coverage.
 * @expectation
 *   The element has a non-empty aria-label, an aria-labelledby that resolves
 *   to non-empty text, or a non-empty title. Every role in the set is
 *   name-from-author-only, so descendant text is deliberately not accepted:
 *   a labelled child inside a composite widget would otherwise pass the
 *   container that has no name of its own.
 */

const id = 'aria-role-name-present';

const meta = {
  title: 'ARIA roles that require an accessible name have one',
  description:
    'Checks that the ARIA roles WAI-ARIA requires an accessible name for expose a non-empty one.',
  i18n: {
    titleKey: 'ariaRoleNamePresent_title',
    descriptionKey: 'ariaRoleNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'navigation', 'atomic', 'automatic', 'name'],
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
  coverage: {
    facetsBySc: {
      '4.1.2': ['aria-role-name-present']
    }
  }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart =
    helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const queryAll =
    helpers && typeof helpers.queryAll === 'function'
      ? helpers.queryAll
      : (sel, rt) => {
          try {
            const scope = rt || safeRoot;
            return scope && scope.querySelectorAll ? Array.from(scope.querySelectorAll(sel)) : [];
          } catch {
            return [];
          }
        };

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

  const getEligibilityInfo =
    helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  const getAriaLabelledByInfo =
    helpers && typeof helpers.getAriaLabelledByInfo === 'function'
      ? helpers.getAriaLabelledByInfo
      : null;

  const normalizeWs = (s) =>
    String(s || '')
      .replace(/\s+/g, ' ')
      .trim();

  const getAttr = (el, name) => {
    try {
      if (!el || !el.getAttribute) return '';
      return normalizeWs(el.getAttribute(name));
    } catch {
      return '';
    }
  };

  // aria-labelledby resolution: delegate to the shared helper (used by
  // button-name-present et al.), which correctly includes hidden/aria-hidden
  // referenced nodes per the Accessible Name and Description Computation
  // spec (a hidden node directly referenced by aria-labelledby still
  // supplies its text — this is a standard visually-hidden-label pattern).
  const resolveLabelledby = (el, maxRefs) => {
    if (!getAriaLabelledByInfo) return '';
    try {
      const info = getAriaLabelledByInfo(el, ctx, { maxRefs: Math.max(1, maxRefs || 8) });
      return info && info.present ? normalizeWs(info.value) : '';
    } catch {
      return '';
    }
  };

  const isEligible = (el) => {
    if (!isAccTreeEligible) return true;
    try {
      const r = isAccTreeEligible(el, ctx);
      if (typeof r === 'boolean') return r;
      return !!(r && r.eligible);
    } catch {
      return true;
    }
  };

  // Roles WAI-ARIA marks "Accessible Name Required: True" and names from the
  // author only. Generated from aria-query by scripts/generate-aria-tables.js:
  // a role that merely *allows* an author name (tablist, toolbar, menu,
  // menubar, scrollbar) is not a 4.1.2 failure when unnamed and is not listed.
  // <generated:aria-name-required-roles>
  const NAME_REQUIRED_ROLES = new Set(['grid', 'meter', 'progressbar', 'radiogroup', 'tree']);
  // </generated:aria-name-required-roles>

  // Derived from the set above so the two cannot drift apart.
  const selector = [...NAME_REQUIRED_ROLES].map((r) => `[role="${r}"]`).join(',');

  const nodes = (() => {
    try {
      return (
        (queryAllSmart ? queryAllSmart(selector, safeRoot) : queryAll(selector, safeRoot)) || []
      );
    } catch {
      return queryAll(selector, safeRoot);
    }
  })();

  if (!nodes.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    // Role normalization + allowlist check (defensive).
    const role = (() => {
      try {
        return normalizeWs(el.getAttribute('role')).toLowerCase();
      } catch {
        return '';
      }
    })();
    if (!NAME_REQUIRED_ROLES.has(role)) continue;

    if (!isEligible(el)) continue;

    applicableCount += 1;

    const ariaLabel = getAttr(el, 'aria-label');
    const labelled = ariaLabel ? '' : resolveLabelledby(el, 8);

    const title = ariaLabel || labelled ? '' : getAttr(el, 'title');

    const ok = !!(ariaLabel || labelled || title);
    if (ok) continue;

    const eligInfo = getEligibilityInfo
      ? (() => {
          try {
            return getEligibilityInfo(el, ctx, { targetSet: 'acc' });
          } catch {
            return null;
          }
        })()
      : null;

    const baseOccurrence = {
      summary: 'This element has no accessible name.',
      hint: 'Provide aria-label or aria-labelledby (preferred), or a non-empty title attribute.',
      i18n: {
        summaryKey: 'ariaRoleNamePresent_summary_fail',
        hintKey: 'ariaRoleNamePresent_hint_fail',
        params: { role }
      },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
        details: {
          reasonCode: 'name_missing',
          role,
          nameSourcesChecked: ['aria-label', 'aria-labelledby', 'title']
        }
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      occurrences.push({ selector: '', html: '', ...baseOccurrence });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  return {
    ruleId: rule.ruleId,
    outcome: 'fail',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
