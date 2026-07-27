'use strict';

/**
 * Generic name-presence rule for selected ARIA composite/widget roles that should expose an accessible name.
 *
 * Notes:
 * - This rule intentionally focuses on author-provided naming mechanisms:
 *   aria-label, aria-labelledby, and title.
 * - It does NOT treat descendant text content as a valid name source for these roles
 *   (to avoid false passes from labelled children inside composite widgets).
 * - Eligibility is based on helpers.isAccTreeEligible(node, ctx) per engine checks.
 */

const id = 'aria-role-name-present';

const meta = {
  title: 'ARIA widget/container roles have an accessible name',
  description: 'Checks that selected ARIA widget/container roles expose a non-empty accessible name.',
  i18n: {
    titleKey: 'ariaRoleNamePresent_title',
    descriptionKey: 'ariaRoleNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'navigation', 'atomic', 'automatic', 'name'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '4.1.2', title: 'Name, Role, Value', conformanceLevel: 'A' }
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

  const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const queryAll = helpers && typeof helpers.queryAll === 'function'
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
    helpers && typeof helpers.getAriaLabelledByInfo === 'function' ? helpers.getAriaLabelledByInfo : null;

  const normalizeWs = (s) => String(s || '').replace(/\s+/g, ' ').trim();

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

  // Frozen allowlist of roles to check in this generic rule.
  // (Keep this small, explicit, and standards-based for determinism.)
  const roleSet = new Set([
    'scrollbar',
    'toolbar',
    'tablist',
    'radiogroup',
    'tree',
    'grid',
    'menu',
    'menubar',
    'meter',
    'progressbar'
  ]);

  const selector =
    '[role="scrollbar"],[role="toolbar"],[role="tablist"],[role="radiogroup"],[role="tree"],[role="grid"],[role="menu"],[role="menubar"],[role="meter"],[role="progressbar"]';

  const nodes = (() => {
    try {
      return (queryAllSmart ? queryAllSmart(selector, safeRoot) : queryAll(selector, safeRoot)) || [];
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
    if (!roleSet.has(role)) continue;

    if (!isEligible(el)) continue;

    applicableCount += 1;

    const ariaLabel = getAttr(el, 'aria-label');
    const labelled = ariaLabel ? '' : resolveLabelledby(el, 8);

    const title = ariaLabel || labelled ? '' : getAttr(el, 'title');

    const ok = !!(ariaLabel || labelled || title);
    if (ok) continue;

    const eligInfo = getEligibilityInfo ? (() => {
      try { return getEligibilityInfo(el, ctx, { targetSet: 'acc' }); } catch { return null; }
    })() : null;

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

  return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
}

module.exports = { id, meta, runInPage };
