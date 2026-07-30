'use strict';

/**
 * @check iframe-name-present
 * @atomic true
 * @summary <iframe>/<frame> elements must have an accessible name
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to <iframe>/<frame> elements that are eligible for the
 *   accessibility tree (isAccTreeEligible).
 * @expectation
 *   The element has a non-empty accessible name via aria-labelledby,
 *   aria-label, or the title attribute. Unlike most interactive elements,
 *   an iframe's name is never derived from its rendered content (the
 *   embedded document is a separate browsing context) — this mirrors
 *   dialog-name-present's "name-from-author-only" reasoning.
 * @implementation-notes
 * - Uses helpers.getAccessibleNameInfo, which already stops at
 *   aria-label/aria-labelledby/label[for]/title without falling back to
 *   subtree text content — the right shape for this element.
 */

const id = 'iframe-name-present';

const meta = {
  title: 'Frames have an accessible name',
  description: 'Checks that <iframe>/<frame> elements expose a non-empty accessible name via aria-label, aria-labelledby, or the title attribute.',
  i18n: {
    titleKey: 'iframeNamePresent_title',
    descriptionKey: 'iframeNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'structure', 'atomic', 'automatic', 'name', 'iframe'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '4.1.2', title: 'Name, Role, Value', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['iframe-name-present'] } }
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('iframe, frame') : helpers.queryAll('iframe, frame');

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.tagName) continue;

    if (helpers.isAccTreeEligible) {
      const elig = helpers.isAccTreeEligible(el);
      const isEligible = typeof elig === 'boolean' ? elig : !!(elig && elig.eligible);
      if (!isEligible) continue;
    }

    applicableCount += 1;

    const nameInfo = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(el, ctx, { maxRefs: 8 }) : null;
    if (nameInfo && nameInfo.present && nameInfo.value) continue;

    const eligInfo = helpers.getEligibilityInfo
      ? (() => { try { return helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' }); } catch { return null; } })()
      : null;
    const tag = el.tagName.toLowerCase();
    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

    occurrences.push({
      selector: stableSelector,
      html,
      summary: 'This frame has no accessible name.',
      hint: 'Add a title attribute (or aria-label/aria-labelledby) describing the frame’s content or purpose.',
      i18n: {
        summaryKey: 'iframeNamePresent_summary_fail',
        hintKey: 'iframeNamePresent_hint_fail',
        params: { element: tag }
      },
      data: {
        details: { reasonCode: 'IFRAME_NAME_MISSING', element: tag },
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'serious', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };