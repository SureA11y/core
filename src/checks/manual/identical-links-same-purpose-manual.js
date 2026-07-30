'use strict';

/**
 * @check identical-links-same-purpose
 * @atomic true
 * @summary Links with the same accessible name should lead to the same destination
 * @standard WCAG 2.2
 * @sc 2.4.9
 * @applicability
 *   Any `a[href]` with a non-empty accessible name, grouped by that name
 *   (trimmed, whitespace-collapsed, case-folded).
 * @expectation
 *   Within a page, links that share the same accessible name are expected
 *   to serve the same purpose (i.e. resolve to the same destination — the
 *   full resolved URL, including any fragment). Same-text-different-
 *   destination links are common and frequently intentional in real
 *   sites (e.g. repeated "Read more" links per article card), so this is
 *   authored as `type: 'manual'` (cantTell-capped, never fail) rather
 *   than a hard fail — flagging a real name/destination mismatch for
 *   human judgment instead of guessing intent.
 * @implementation-notes
 * - Destination comparison uses the DOM `.href` property (already
 *   resolved to an absolute URL by the engine/browser), not the raw
 *   `href` attribute — so relative vs. absolute forms of the same target
 *   are correctly treated as identical.
 * - Only flags when a name group actually contains more than one
 *   distinct destination; a name reused for links that all point to the
 *   same place is not flagged.
 */

const id = 'identical-links-same-purpose';

const meta = {
  title: 'Links with the same accessible name should lead to the same destination',
  description:
    'Flags groups of links that share the same accessible name but resolve to more than one distinct destination, for manual review of whether they serve the same purpose.',
  i18n: {
    titleKey: 'identicalLinksSamePurpose_title',
    descriptionKey: 'identicalLinksSamePurpose_description'
  },
  helpUrl: null,
  tags: ['wcag2aaa', 'wcag249', 'navigation', 'atomic', 'manual'],
  wcagSc: ['2.4.9'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '2.4.9', title: 'Link Purpose (Link Only)', conformanceLevel: 'AAA' }
  ],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'low',
  coverage: { facetsBySc: { '2.4.9': ['identical-links-same-purpose-evidence'] } }
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  function normName(s) {
    return (s == null ? '' : String(s)).replace(/\s+/g, ' ').trim().toLowerCase();
  }

  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('a[href]') : helpers.queryAll('a[href]');

  const groups = new Map(); // normName -> [{ el, href }]
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible = typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    const nameInfo = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(el, ctx) : null;
    const rawName = (nameInfo && typeof nameInfo.value === 'string' && nameInfo.value.trim())
      ? nameInfo.value
      : (el.textContent || '');
    const name = normName(rawName);
    if (!name) continue;

    let href = '';
    try { href = String(el.href || ''); } catch { href = ''; }
    if (!href) continue;

    applicableCount += 1;

    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push({ el, href });
  }

  const occurrences = [];

  for (const [name, entries] of groups) {
    const distinctHrefs = new Set(entries.map((e) => e.href));
    if (distinctHrefs.size <= 1) continue;

    for (const { el, href } of entries) {
      const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
      const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');

      const baseOccurrence = {
        selector: stableSelector,
        html,
        summary: 'This link shares an accessible name with other links on the page that lead to a different destination.',
        hint: 'Ensure links with the same text serve the same purpose, or make the link text distinct enough to describe each destination.',
        i18n: {
          summaryKey: 'identicalLinksSamePurpose_summary_cantTell',
          hintKey: 'identicalLinksSamePurpose_hint_cantTell',
          params: { name, destinationCount: String(distinctHrefs.size) }
        },
        data: {
          details: {
            reasonCode: 'SAME_NAME_DIFFERENT_DESTINATION',
            name,
            href,
            distinctDestinationCount: distinctHrefs.size
          }
        }
      };

      if (helpers && typeof helpers.reportOccurrence === 'function') {
        occurrences.push(helpers.reportOccurrence(el, baseOccurrence));
      } else {
        occurrences.push(baseOccurrence);
      }
    }
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: rule.defaultSeverity || 'minor', occurrences };
  }

  // Manual rules may only emit cantTell/notApplicable (never pass/fail):
  // every name group already resolves to a single shared destination.
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
