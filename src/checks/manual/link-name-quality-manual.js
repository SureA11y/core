'use strict';

/**
 * @check link-name-quality
 * @atomic true
 * @summary Link text should not be a generic, non-descriptive phrase
 * @standard WCAG 2.2
 * @sc 2.4.4
 * @applicability
 *   Elements matching `a[href]` with a non-empty computed accessible
 *   name (programmatic first, then "name from content" — same
 *   two-step resolution as `link-name-present`). Links with no name at
 *   all are `link-name-present`'s concern, not this rule's.
 * @expectation
 *   The link's full accessible name, normalized (trimmed, case-folded,
 *   trailing punctuation stripped), is not an exact match for a known
 *   non-descriptive phrase ("click here", "read more", "more", "here",
 *   "details", "link", etc.) — WCAG technique F84's known failure
 *   pattern for SC 2.4.4.
 * @implementation-notes
 * - Deliberately EXACT match only, against a small, well-established
 *   phrase list — not a substring/contains check. "Read more about our
 *   privacy policy" does not match "read more"; only the bare phrase
 *   alone does. This keeps false positives near zero at the cost of
 *   not catching every possible non-descriptive phrasing (e.g. "click
 *   this", a legitimate but uncommon variant, is not in the list).
 * - Authored as `type: 'manual'` (cantTell-capped, never fail): this
 *   check does not verify whether *surrounding context* (adjacent text,
 *   aria-describedby) makes the purpose clear, which is exactly what
 *   distinguishes a genuine 2.4.4 failure (context doesn't help) from
 *   a link that's fine in context despite generic-sounding text alone.
 *   Flagging is a signal for review, not a definitive violation.
 * - Reuses the same accessible-name computation as `link-name-present`
 *   (`getAccessibleNameInfo` then `getContentNameInfo` as fallback), so
 *   this benefits from the same "name from content" recursion fix
 *   (img alt / nested role="img" aria-label count toward the name).
 */

const id = 'link-name-quality';

const meta = {
  title: 'Link text should be descriptive, not generic',
  description:
    'Flags links whose full accessible name is a known non-descriptive phrase (e.g. "click here", "read more", "more"), for manual review of whether the purpose is clear without additional context.',
  i18n: {
    titleKey: 'linkNameQuality_title',
    descriptionKey: 'linkNameQuality_description'
  },
  helpUrl: null,
  tags: ['wcag2a', 'wcag244', 'navigation', 'quality', 'atomic', 'manual'],
  wcagSc: ['2.4.4'],
  normativeMappings: [
    { standard: 'WCAG', version: '2.2', requirement: '2.4.4', title: 'Link Purpose (In Context)', conformanceLevel: 'A' }
  ],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '2.4.4': ['link-text-descriptive-evidence'] } }
};

function runInPage(ctx) {
  const { document, root, helpers, rule } = ctx;
  const safeRoot = root || document;

  const GENERIC_LINK_TEXT = new Set([
    'click here', 'here', 'click', 'more', 'more info', 'more information',
    'read more', 'learn more', 'continue reading', 'continue', 'details',
    'more details', 'link', 'this link', 'go', 'download', 'view more',
    'see more', 'info'
  ]);

  function normalize(s) {
    return (s == null ? '' : String(s))
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
      .replace(/[.,;:!?]+$/g, '')
      .trim();
  }

  const selector = 'a[href]';
  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart(selector, safeRoot) : helpers.queryAll(selector, safeRoot);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible = typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    const nameInfo = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(el, ctx) : null;
    const programmaticName = (nameInfo && typeof nameInfo.value === 'string') ? nameInfo.value : '';

    let rawName = programmaticName;
    if (!rawName.trim() && helpers.getContentNameInfo) {
      const contentInfo = helpers.getContentNameInfo(el, ctx);
      rawName = contentInfo && contentInfo.present ? contentInfo.value : '';
    }

    const normalized = normalize(rawName);
    if (!normalized) continue; // no name at all: link-name-present's concern, not this rule's.

    applicableCount += 1;

    if (!GENERIC_LINK_TEXT.has(normalized)) continue;

    const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
    const html = helpers.getOuterHtmlSnippet ? helpers.getOuterHtmlSnippet(el) : (el.outerHTML || '');
    const eligInfo = helpers.getEligibilityInfo ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' }) : null;

    occurrences.push({
      selector: stableSelector,
      html,
      summary: `This link's accessible name ("${rawName.trim()}") is a generic, non-descriptive phrase.`,
      hint: 'Make the link text itself describe its destination/purpose (e.g. "Download the 2026 pricing guide" instead of "Download"), or confirm the surrounding context already makes the purpose clear.',
      i18n: {
        summaryKey: 'linkNameQuality_summary_cantTell',
        hintKey: 'linkNameQuality_hint_cantTell',
        params: { name: rawName.trim() }
      },
      data: {
        details: { reasonCode: 'GENERIC_LINK_TEXT', normalizedName: normalized },
        visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] }
      }
    });
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'cantTell', severity: rule.defaultSeverity || 'minor', occurrences };
  }

  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
