'use strict';

const id = 'link-name-present';

const meta = {
  title: 'Links have an accessible name',
  description: 'Checks that links expose a non-empty accessible name.',
  i18n: {
    titleKey: 'linkNamePresent_title',
    descriptionKey: 'linkNamePresent_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'navigation', 'atomic', 'automatic', 'links', 'name'],
  wcagSc: ['4.1.2'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '4.1.2', title: 'Name, Role, Value', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'serious',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  // IMPORTANT: update your facets registry to include "link-name-present" under 4.1.2
  coverage: { facetsBySc: { '4.1.2': ['link-name-present'] } }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const occurrences = [];
  let applicableCount = 0;

  function getConservativeSubtreeText(container) {
    // "Name from content" — recurses into descendants and uses each one's
    // own accessible name (img alt, aria-label/aria-labelledby, title) when
    // it has one, not just literal text nodes. See getContentNameInfo's
    // header comment in src/core/dom-helpers.js for the full rationale
    // (this replaced a text-node-only TreeWalker that missed the common
    // "<a><img alt='...'></a>" logo-link pattern).
    if (helpers.getContentNameInfo) {
      const info = helpers.getContentNameInfo(container, ctx);
      return info && info.present ? info.value : '';
    }
    const t = (container && container.textContent) ? String(container.textContent) : '';
    return t.replace(/\s+/g, ' ').trim();
  }

  const selector = 'a[href], area[href], [role="link"]';
  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart(selector, safeRoot) : helpers.queryAll(selector, safeRoot);

  for (const el of nodes) {
    // isAccTreeEligible returns { eligible, reasons }, not a boolean.
    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible = typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    applicableCount += 1;

    const nameInfo = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(el, ctx) : null;
    const programmaticName = (nameInfo && typeof nameInfo.value === 'string') ? nameInfo.value : '';

    const contentName = programmaticName.trim().length === 0 ? getConservativeSubtreeText(el) : '';
    const finalName = (programmaticName.trim().length ? programmaticName : contentName).trim();

    if (finalName.length === 0) {
      // Only compute the richer eligibility-info payload (used solely for
      // the occurrence's visibilityFilter) once we know an occurrence is
      // actually being built, rather than for every applicable element.
      const eligInfo = helpers.getEligibilityInfo ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

      const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
      const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');
      const tag = (el.tagName || '').toLowerCase();

      occurrences.push({
        selector: stableSelector,
        html,

        // Human fallbacks (allowed)
        summary: 'This link has no accessible name.',
        hint: 'Provide link text or an accessible-name mechanism (for example aria-label) so assistive technologies can identify the link.',

        // Validator requires these keys to exist in the English dictionary
        i18n: {
          summaryKey: 'linkNamePresent_summary_fail',
          hintKey: 'linkNamePresent_hint_fail',
          params: { element: tag }
        },

        data: {
          visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
          details: {
            reasonCode: 'name_missing',
            metrics: {
              programmaticNameLength: programmaticName.trim().length,
              contentNameLength: contentName.trim().length
            },
            refs: { accessibleName: nameInfo || null }
          }
        }
      });
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'fail', severity: rule.defaultSeverity || 'minor', occurrences };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
