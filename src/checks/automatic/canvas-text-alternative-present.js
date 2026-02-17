'use strict';

/**
 * @check a11ycore-canvas-text-alternative-present
 * @atomic true
 * @summary Accessible <canvas> elements must provide a text alternative
 * @standard WCAG 2.2
 * @sc 1.1.1
 * @applicability
 *   Applies to <canvas> elements that are exposed to assistive technologies.
 *   Elements otherwise hidden from the accessibility tree remain applicable
 *   if they are focusable (tabbable) or referenced by IDREF relationships (per engine eligibility checks).
 * @expectation
 *   Each applicable <canvas> provides a text alternative via fallback content or an accessible name.
 */

const id = 'a11ycore-canvas-text-alternative-present';

const meta = {
  title: '<canvas> must provide a text alternative',
  description: 'Checks that <canvas> elements provide a text alternative via fallback content or an accessible name.',
  i18n: {
    titleKey: 'a11ycore_canvas_textAltPresent_title',
    descriptionKey: 'a11ycore_canvas_textAltPresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag111', 'nontext', 'canvas', 'atomic', 'automatic'],
  wcagSc: ['1.1.1'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '1.1.1', title: 'Non-text Content', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {
    facetsBySc: {
      '1.1.1': ['canvas-text-alternative-present']
    }
  }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const queryAllSmart = helpers && typeof helpers.queryAllSmart === 'function' ? helpers.queryAllSmart : null;
  const queryAll = helpers && typeof helpers.queryAll === 'function'
    ? helpers.queryAll
    : (sel) => {
      try { return safeRoot && safeRoot.querySelectorAll ? Array.from(safeRoot.querySelectorAll(sel)) : []; }
      catch { return []; }
    };

  const getEligibilityInfo = helpers && typeof helpers.getEligibilityInfo === 'function'
    ? helpers.getEligibilityInfo
    : null;

  const isAccTreeEligible = helpers && typeof helpers.isAccTreeEligible === 'function'
    ? helpers.isAccTreeEligible
    : null;

  const getTextAlternativeInfo = helpers && typeof helpers.getTextAlternativeInfo === 'function'
    ? helpers.getTextAlternativeInfo
    : null;

  const canvases = (() => {
    try { return Array.from((queryAllSmart ? queryAllSmart('canvas') : queryAll('canvas')) || []); }
    catch { return queryAll('canvas'); }
  })();

  if (!canvases.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of canvases) {
    if (!el) continue;

    // Applicability: eligible in the accessibility tree (with focusable/IDREF exceptions handled by helper).
    if (isAccTreeEligible) {
      const elig = (() => {
        try { return isAccTreeEligible(el, ctx); } catch { return { eligible: true, reasons: [] }; }
      })();
      if (elig && elig.eligible === false) continue;
    }

    applicableCount += 1;

    // Expectation: must provide a text alternative.
    const ti = getTextAlternativeInfo
      ? (() => { try { return getTextAlternativeInfo(el, ctx); } catch { return null; } })()
      : null;

    const hasTextAlt = !!(ti && ti.present);

    if (hasTextAlt) continue;

    const eligInfo = getEligibilityInfo ? getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    const baseOccurrence = {
      selector: '',
      html: '',
      summary: 'Missing text alternative for <canvas>.',
      hint: 'Provide fallback text inside <canvas> or an accessible name (e.g., aria-label/aria-labelledby).',
      i18n: {
        summaryKey: 'a11ycore_canvas_textAltPresent_summary_fail',
        hintKey: 'a11ycore_canvas_textAltPresent_hint_fail',
        params: { element: 'canvas' }
      },
      data: {
        // Always log eligibility/filter info (engine contract for targetSet=acc checks)
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
        // Debuggable, deterministic helper facts (non-verdict)
        textAlternative: ti || null
      }
    };

    if (helpers && typeof helpers.reportOccurrence === 'function') {
      occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
    } else {
      // Never compute selector/snippet in the rule.
      occurrences.push({ ...baseOccurrence });
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
