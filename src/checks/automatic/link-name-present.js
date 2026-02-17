'use strict';

const id = 'a11ycore-link-name-present';

const meta = {
  title: 'Links have an accessible name',
  description: 'Checks that links expose a non-empty accessible name.',
  i18n: {
    titleKey: 'a11ycore_linkNamePresent_title',
    descriptionKey: 'a11ycore_linkNamePresent_description'
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
    try {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
      const parts = [];
      let n = walker.nextNode();

      while (n) {
        const raw = (n.nodeValue || '').replace(/\s+/g, ' ').trim();
        if (raw) {
          let p = n.parentElement;
          let blocked = false;

          while (p && p !== container) {
            if (p.getAttribute && p.getAttribute('aria-hidden') === 'true') { blocked = true; break; }
            if (p.hasAttribute && p.hasAttribute('hidden')) { blocked = true; break; }
            p = p.parentElement;
          }

          if (!blocked) {
            if (container.getAttribute && container.getAttribute('aria-hidden') === 'true') blocked = true;
            if (!blocked && container.hasAttribute && container.hasAttribute('hidden')) blocked = true;
          }

          if (!blocked) parts.push(raw);
        }
        n = walker.nextNode();
      }

      return parts.join(' ').replace(/\s+/g, ' ').trim();
    } catch {
      const t = (container && container.textContent) ? String(container.textContent) : '';
      return t.replace(/\s+/g, ' ').trim();
    }
  }

  const selector = 'a[href], area[href], [role="link"]';
  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart(selector, safeRoot) : helpers.queryAll(selector, safeRoot);

  for (const el of nodes) {
    const eligInfo = helpers.getEligibilityInfo ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;
    const eligible = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    if (!eligible) continue;

    applicableCount += 1;

    const nameInfo = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(el, ctx) : null;
    const programmaticName = (nameInfo && typeof nameInfo.value === 'string') ? nameInfo.value : '';

    const contentName = programmaticName.trim().length === 0 ? getConservativeSubtreeText(el) : '';
    const finalName = (programmaticName.trim().length ? programmaticName : contentName).trim();

    if (finalName.length === 0) {
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
        summaryKey: 'a11ycore_linkNamePresent_summary_fail',
        hintKey: 'a11ycore_linkNamePresent_hint_fail',
        i18nParams: { element: tag },

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
