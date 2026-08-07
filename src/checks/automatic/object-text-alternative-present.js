/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check object-text-alternative-present
 * @atomic true
 * @summary Accessible <object> elements must provide a text alternative
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @applicability
 *   Applies to <object> elements that are exposed to assistive technologies.
 *   Objects otherwise hidden from the accessibility tree remain applicable
 *   if they are tabbable or referenced by IDREF relationships (per engine eligibility checks).
 *   role="presentation"/role="none" are excluded only when not focusable.
 * @expectation
 *   Each applicable <object> provides a text alternative via:
 *   - fallback content (non-empty text content inside <object>), OR
 *   - an accessible name (aria-labelledby/aria-label), OR
 *   - a title attribute (best-effort fallback).
 */

const id = 'object-text-alternative-present';

const meta = {
  title: '<object> must provide a text alternative',
  description:
    'Checks that <object> elements provide a text alternative via fallback content or an accessible name.',
  i18n: {
    titleKey: 'object_textAltPresent_title',
    descriptionKey: 'object_textAltPresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'object', 'atomic', 'automatic'],
  wcagSc: ['1.1.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.1.1',
      title: 'Non-text Content',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.1.1': ['object-text-alternative-present'] } }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart =
    helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const queryAll =
    helpers && typeof helpers.queryAll === 'function'
      ? helpers.queryAll
      : (sel) => {
          try {
            return safeRoot && safeRoot.querySelectorAll
              ? Array.from(safeRoot.querySelectorAll(sel))
              : [];
          } catch {
            return [];
          }
        };

  const getEligibilityInfo =
    helpers && typeof helpers.getEligibilityInfo === 'function' ? helpers.getEligibilityInfo : null;

  const isAccTreeEligible =
    helpers && typeof helpers.isAccTreeEligible === 'function' ? helpers.isAccTreeEligible : null;

  const getFocusableInfo =
    helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;

  const getAriaNameInfo =
    helpers && typeof helpers.getAriaNameInfo === 'function' ? helpers.getAriaNameInfo : null;

  const objects = (() => {
    try {
      return Array.from((queryAllSmart ? queryAllSmart('object') : queryAll('object')) || []);
    } catch {
      return queryAll('object');
    }
  })();

  if (!objects.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  const trim = (v) => (v == null ? '' : String(v)).trim();

  function computeNameInfo(el) {
    // For <object>, treat ARIA name as primary. Do not accept HTML <label> associations.
    const flags = [];
    let aria = null;

    if (getAriaNameInfo) {
      aria = (() => {
        try {
          return getAriaNameInfo(el, ctx);
        } catch {
          return null;
        }
      })();
    }

    if (aria && aria.present && trim(aria.value)) {
      return {
        present: true,
        value: trim(aria.value),
        mechanism: aria.mechanism || 'aria',
        flags: (aria.flags || []).slice(0)
      };
    }

    const title = trim(el.getAttribute && el.getAttribute('title'));
    if (title) {
      flags.push('title-used');
      return { present: true, value: title, mechanism: 'title', flags };
    }

    if (aria && aria.flags && aria.flags.length) {
      for (const f of aria.flags) flags.push(f);
    }

    return { present: false, value: '', mechanism: 'none', flags };
  }

  function computeFallbackText(el) {
    try {
      // Deterministic + bounded: textContent can be large
      const raw = trim(el.textContent || '');
      const t = raw.length > 1000 ? raw.slice(0, 1000) : raw;
      return { present: !!t, value: t, mechanism: 'fallback', flags: t ? [] : ['empty'] };
    } catch {
      return { present: false, value: '', mechanism: 'fallback', flags: ['error'] };
    }
  }

  for (const el of objects) {
    if (!el || !el.getAttribute) continue;

    if (isAccTreeEligible) {
      const elig = (() => {
        try {
          return isAccTreeEligible(el, ctx);
        } catch {
          return { eligible: true, reasons: [] };
        }
      })();
      if (elig && elig.eligible === false) continue;
    }

    // role presentation/none exclusion only when not focusable
    const role = (() => {
      try {
        return String(el.getAttribute('role') || '')
          .trim()
          .toLowerCase();
      } catch {
        return '';
      }
    })();
    if (role === 'presentation' || role === 'none') {
      let focusable;
      if (getFocusableInfo) {
        const fi = (() => {
          try {
            return getFocusableInfo(el, ctx);
          } catch {
            return null;
          }
        })();
        focusable = !!(fi && fi.focusable);
      } else {
        const tabindex = el.getAttribute('tabindex');
        focusable =
          tabindex != null &&
          String(tabindex).trim() !== '' &&
          !Number.isNaN(Number(String(tabindex).trim()));
      }
      if (!focusable) continue;
    }

    applicableCount += 1;

    const name = computeNameInfo(el);

    // Only compute fallback text if there is no name.
    // (textContent can be expensive; avoid when not needed)
    const fb = name.present
      ? { present: false, value: '', mechanism: 'fallback', flags: ['skipped-name-present'] }
      : computeFallbackText(el);

    const hasTextAlt = !!(name.present || fb.present);
    if (hasTextAlt) continue;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    const baseOccurrence = {
      summary: 'Missing text alternative for <object>.',
      hint: 'Provide meaningful fallback content inside <object>, add an accessible name (aria-label/aria-labelledby), or use a title attribute as a best-effort fallback.',
      i18n: {
        summaryKey: 'object_textAltPresent_summary_fail',
        hintKey: 'object_textAltPresent_hint_fail',
        params: { element: 'object' }
      },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
        fallback: fb,
        name
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      // Never compute selector/snippet in the rule.
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
