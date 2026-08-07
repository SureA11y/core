'use strict';

/**
 * @check iframe-title-unique
 * @atomic true
 * @summary <iframe>/<frame> title attributes must be unique among frames
 * @standard WCAG 2.2
 * @sc 4.1.2
 * @applicability
 *   Applies to <iframe>/<frame> elements that carry a non-empty title
 *   attribute.
 * @expectation
 *   No two frames in scope share the same (trimmed, case-sensitive) title
 *   attribute value — a duplicate title prevents assistive technology
 *   users from telling frames apart when scanning by name.
 * @implementation-notes
 * - Distinct, atomic decision from iframe-name-present (presence):
 *   a frame can have a non-empty title while still failing uniqueness.
 * - Compares the title ATTRIBUTE specifically, not the full computed
 *   accessible name (aria-label could legitimately differ in wording even
 *   when title happens to collide).
 * - Not rule-gated on isAccTreeEligible: duplicate titles are a static
 *   markup property. Engine-level hidden-subtree filtering still applies
 *   unless engineOptions.includeHiddenElements is true.
 */

const id = 'iframe-title-unique';

const meta = {
  title: 'Frame titles must be unique',
  description:
    'Checks that no two <iframe>/<frame> elements in scope share the same title attribute value.',
  i18n: {
    titleKey: 'iframeTitleUnique_title',
    descriptionKey: 'iframeTitleUnique_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag412', 'structure', 'atomic', 'automatic', 'name', 'iframe'],
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
  defaultSeverity: 'moderate',
  category: 'robust',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '4.1.2': ['iframe-title-unique'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('iframe, frame')
    : helpers.queryAll('iframe, frame');

  const groups = new Map(); // trimmed title -> elements[]
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const title = String(el.getAttribute('title') || '').trim();
    if (!title) continue;

    applicableCount += 1;

    const list = groups.get(title);
    if (list) list.push(el);
    else groups.set(title, [el]);
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const occurrences = [];

  for (const [title, els] of groups) {
    if (els.length < 2) continue;

    for (const el of els) {
      const tag = el.tagName.toLowerCase();
      const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
      const html = helpers.getOuterHtmlSnippet
        ? helpers.getOuterHtmlSnippet(el)
        : el.outerHTML || '';

      occurrences.push({
        selector: stableSelector,
        html,
        summary: 'This frame’s title is not unique among the frames on this page.',
        hint: 'Give each frame a distinct title describing its specific content or purpose.',
        i18n: {
          summaryKey: 'iframeTitleUnique_summary_fail',
          hintKey: 'iframeTitleUnique_hint_fail',
          params: { element: tag, title }
        },
        data: {
          details: {
            reasonCode: 'IFRAME_TITLE_DUPLICATE',
            element: tag,
            title,
            duplicateCount: els.length
          }
        }
      });
    }
  }

  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
