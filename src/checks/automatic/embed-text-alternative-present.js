/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check embed-text-alternative-present
 * @atomic true
 * @summary Accessible <embed> elements must provide a text alternative
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @applicability
 *   Applies to <embed> elements that are exposed to assistive technologies.
 *   Elements otherwise hidden from the accessibility tree remain applicable
 *   if they are tabbable or referenced by IDREF relationships (per engine eligibility checks).
 *   role="presentation"/role="none" are excluded only when not focusable.
 * @expectation
 *   Each applicable <embed> provides a text alternative via:
 *   - an accessible name (aria-labelledby/aria-label), OR
 *   - a title attribute (best-effort fallback).
 *
 * Note: <embed> does not support fallback content in HTML, so this rule does not check children.
 */

const id = 'embed-text-alternative-present';

const meta = {
  title: '<embed> must provide a text alternative',
  description: 'Checks that <embed> elements provide a text alternative via an accessible name.',
  i18n: {
    titleKey: 'embed_textAltPresent_title',
    descriptionKey: 'embed_textAltPresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'embed', 'atomic', 'automatic'],
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
  coverage: { facetsBySc: { '1.1.1': ['embed-text-alternative-present'] } }
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

  const embeds = (() => {
    try {
      return Array.from((queryAllSmart ? queryAllSmart('embed') : queryAll('embed')) || []);
    } catch {
      return queryAll('embed');
    }
  })();

  if (!embeds.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  const trim = (v) => (v == null ? '' : String(v)).trim();

  function computeNameInfo(el) {
    // For <embed>, treat ARIA name as primary. Do not accept HTML <label> associations.
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

  // `title` is a weaker text-alternative mechanism than aria-label/
  // aria-labelledby, it is not reliably exposed to assistive technology
  // in every context (e.g. touch/mobile), so a pass achieved only via
  // `title` is reported at reduced confidence rather than the rule's
  // default `high`.
  let anyPassedViaWeakMechanism = false;

  for (const el of embeds) {
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
    if (name.present) {
      if (name.mechanism === 'title') anyPassedViaWeakMechanism = true;
      continue;
    }

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    const baseOccurrence = {
      summary: 'Missing text alternative for <embed>.',
      hint: 'Add an accessible name to <embed> (aria-label/aria-labelledby preferred, or a title attribute as a best-effort fallback).',
      i18n: {
        summaryKey: 'embed_textAltPresent_summary_fail',
        hintKey: 'embed_textAltPresent_hint_fail',
        params: { element: 'embed' }
      },
      data: {
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
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
    return {
      ruleId: rule.ruleId,
      outcome: 'pass',
      severity: 'minor',
      confidence: anyPassedViaWeakMechanism ? 'medium' : 'high',
      occurrences: []
    };
  }

  return {
    ruleId: rule.ruleId,
    outcome: 'fail',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
