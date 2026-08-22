/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check identical-links-same-purpose
 * @atomic true
 * @summary Links with the same accessible name should lead to the same destination
 * @standard WCAG 2.2
 * @sc 2.4.9
 * @applicability
 *   Any `a[href]` or `[role="link"]` with a non-empty accessible name,
 *   grouped by that name (trimmed, whitespace-collapsed, case-folded).
 * @expectation
 *   Within a page, links that share the same accessible name are expected
 *   to serve the same purpose (i.e. resolve to the same destination, the
 *   full resolved URL, including any fragment). Same-text-different-
 *   destination links are common and frequently intentional in real
 *   sites (e.g. repeated "Read more" links per article card), so this is
 *   authored as `type: 'manual'` (cantTell-capped, never fail) rather
 *   than a hard fail, flagging a real name/destination mismatch for
 *   human judgment instead of guessing intent.
 * @implementation-notes
 * - Destination comparison uses the DOM `.href` property (already
 *   resolved to an absolute URL by the engine/browser), not the raw
 *   `href` attribute, so relative vs. absolute forms of the same target
 *   are correctly treated as identical.
 * - A `role="link"` element with no `href` (ACT fd3a94/b20e66's own
 *   `<span role="link" onclick="location='...'">`-style examples) falls
 *   back to extracting the destination from a `location`/`location.href`
 *   assignment or `location.assign(...)`/`location.replace(...)` call in
 *   its `onclick` attribute, a literal string already present in
 *   markup, not something that requires executing script. An unrecognized
 *   onclick shape is simply not resolved (this rule is cantTell-capped,
 *   so a missed destination costs recall, never a false fail).
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
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.4.9',
      title: 'Link Purpose (Link Only)',
      conformanceLevel: 'AAA'
    }
  ],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'low',
  coverage: { facetsBySc: { '2.4.9': ['identical-links-same-purpose-evidence'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  function normName(s) {
    return (s == null ? '' : String(s)).replace(/\s+/g, ' ').trim().toLowerCase();
  }

  // A location-assignment call in an onclick attribute is a literal
  // string already present in markup (`location='...'`,
  // `location.href='...'`, `window.location.assign('...')`, etc.) --
  // reading it needs no script execution, just a regex over the
  // attribute value.
  const ONCLICK_LOCATION_RE =
    /(?:window\s*\.\s*)?location(?:\s*\.\s*href)?\s*=\s*['"]([^'"]+)['"]|(?:window\s*\.\s*)?location\s*\.\s*(?:assign|replace)\s*\(\s*['"]([^'"]+)['"]/;

  function resolveOnclickLocation(el) {
    try {
      const onclick = el.getAttribute('onclick') || '';
      if (!onclick) return '';
      const m = onclick.match(ONCLICK_LOCATION_RE);
      const raw = m ? m[1] || m[2] : '';
      if (!raw) return '';
      try {
        return new URL(raw, el.ownerDocument.baseURI).href;
      } catch {
        return raw;
      }
    } catch {
      return '';
    }
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('a[href], [role="link"]')
    : helpers.queryAll('a[href], [role="link"]');

  const groups = new Map(); // normName -> [{ el, href }]
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible =
      typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    // getAccessibleNameInfo alone only covers ARIA/label/title naming, not
    // name-from-content -- a raw el.textContent fallback misses a link
    // named only by a descendant image's alt text (e.g.
    // <a href="..."><img alt="ACT rules"></a> has no text nodes at all).
    // getContentNameInfo is the same content-aware helper link-name-present
    // uses for exactly this reason.
    const nameInfo = helpers.getAccessibleNameInfo ? helpers.getAccessibleNameInfo(el, ctx) : null;
    let rawName =
      nameInfo && typeof nameInfo.value === 'string' && nameInfo.value.trim() ? nameInfo.value : '';
    if (!rawName) {
      const contentInfo = helpers.getContentNameInfo ? helpers.getContentNameInfo(el, ctx) : null;
      rawName =
        contentInfo && typeof contentInfo.value === 'string' && contentInfo.value.trim()
          ? contentInfo.value
          : el.textContent || '';
    }
    const name = normName(rawName);
    if (!name) continue;

    // `.href` on an SVG <a> is an SVGAnimatedString, not a plain string
    // IDL property like HTMLAnchorElement.href -- `String(el.href)` would
    // stringify the wrapper object itself, not its value, silently
    // grouping every SVG link under the same bogus "destination". Fall
    // back to the raw attribute, resolved against the document's base
    // URL, whenever `.href` isn't already a usable string.
    let href;
    try {
      href = typeof el.href === 'string' ? el.href : '';
      if (!href) {
        const raw = el.getAttribute('href') || el.getAttribute('xlink:href') || '';
        if (raw) {
          try {
            href = new URL(raw, el.ownerDocument.baseURI).href;
          } catch {
            href = raw;
          }
        }
      }
    } catch {
      href = '';
    }
    if (!href) href = resolveOnclickLocation(el);
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
      const html = helpers.getOuterHtmlSnippet
        ? helpers.getOuterHtmlSnippet(el)
        : el.outerHTML || '';

      const baseOccurrence = {
        selector: stableSelector,
        html,
        summary:
          'This link shares an accessible name with other links on the page that lead to a different destination.',
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
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'minor',
      occurrences
    };
  }

  // Manual rules may only emit cantTell/notApplicable (never pass/fail):
  // every name group already resolves to a single shared destination.
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
