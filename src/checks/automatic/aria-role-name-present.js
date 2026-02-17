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

const id = 'a11ycore-aria-role-name-present';

const meta = {
  title: 'ARIA widget/container roles have an accessible name',
  description: 'Checks that selected ARIA widget/container roles expose a non-empty accessible name.',
  i18n: {
    titleKey: 'a11ycore_ariaRoleNamePresent_title',
    descriptionKey: 'a11ycore_ariaRoleNamePresent_description'
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


  const hasVisibleLabelledbyRef = (el) => {
    const raw = getAttr(el, 'aria-labelledby');
    if (!raw) return false;
    const refs = raw.split(/\s+/).filter(Boolean).slice(0, 8);
    for (const refKey of refs) {
      try {
        const refEl = document.getElementById(refKey);
        if (!refEl) continue;
        if (refEl.getAttribute && refEl.getAttribute('aria-hidden') === 'true') continue;
        if (refEl.hasAttribute && refEl.hasAttribute('hidden')) continue;
        return true;
      } catch {}
    }
    return false;
  };

  const resolveLabelledby = (el, maxRefs) => {
    const raw = getAttr(el, 'aria-labelledby');
    if (!raw) return '';

    const refs = raw.split(/\s+/).filter(Boolean).slice(0, Math.max(1, maxRefs || 8));

    // If every referenced node is hidden from AT, treat aria-labelledby as empty.
    let hasVisibleRef = false;
    for (const refKey of refs) {
      try {
        const refEl = document.getElementById(refKey);
        if (!refEl) continue;
        try {
          if (refEl.getAttribute && refEl.getAttribute('aria-hidden') === 'true') continue;
          if (refEl.hasAttribute && refEl.hasAttribute('hidden')) continue;
        } catch {}
        hasVisibleRef = true;
        break;
      } catch {}
    }
    if (!hasVisibleRef) return '';

    // Prefer shared helper (expected to follow engine semantics), but only after the visible-ref gate above.
    if (getAriaLabelledByInfo) {
      try {
        const info = getAriaLabelledByInfo(el, ctx, { maxRefs: Math.max(1, maxRefs || 8) });
        const v = info && info.present ? normalizeWs(info.value) : '';
        if (v) return v;
      } catch {}
    }

    // Fallback: resolve referenced nodes and ignore labels hidden from AT.
    const parts = [];
    for (const refKey of refs) {
      try {
        const refEl = document.getElementById(refKey);
        if (!refEl) continue;

        try {
          if (refEl.getAttribute && refEl.getAttribute('aria-hidden') === 'true') continue;
          if (refEl.hasAttribute && refEl.hasAttribute('hidden')) continue;
        } catch {}

        const stack = [refEl];
        const txt = [];
        while (stack.length) {
          const node = stack.pop();
          if (!node) continue;
          if (node.nodeType === 3) {
            const s = normalizeWs(node.nodeValue || '');
            if (s) txt.push(s);
            continue;
          }
          if (node.nodeType === 1) {
            try {
              if (node.getAttribute && node.getAttribute('aria-hidden') === 'true') continue;
              if (node.hasAttribute && node.hasAttribute('hidden')) continue;
            } catch {}
            const kids = node.childNodes ? Array.from(node.childNodes) : [];
            for (let i = kids.length - 1; i >= 0; i -= 1) stack.push(kids[i]);
          }
        }
        const text = normalizeWs(txt.join(' '));
        if (text) parts.push(text);
      } catch {}
    }
    return normalizeWs(parts.join(' '));
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

    // aria-labelledby: only valid if it references at least one AT-visible node
    let labelled = '';
    if (!ariaLabel && hasVisibleLabelledbyRef(el)) {
      labelled = resolveLabelledby(el, 8);
    }

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
        summaryKey: 'a11ycore_ariaRoleNamePresent_summary_fail',
        hintKey: 'a11ycore_ariaRoleNamePresent_hint_fail',
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
