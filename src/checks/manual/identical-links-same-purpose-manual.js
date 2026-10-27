/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check identical-links-same-purpose
 * @atomic true
 * @summary Links with the same accessible name should lead to the same destination
 * @standard WCAG 2.2
 * @sc 2.4.9
 * @applicability
 *   Sets of two or more `a[href]` elements, or elements whose role
 *   attribute resolves to link (its first real role token, in any case),
 *   that share a non-empty accessible name (trimmed, whitespace-collapsed,
 *   case-folded), as in ACT b20e66. A link whose name no other link shares
 *   has nothing to be compared with.
 *   A custom element whose ElementInternals give it the link role
 *   (this.attachInternals().role), with no role attribute naming another,
 *   counts as a native element with that role does.
 * @expectation
 *   Within a page, links that share the same accessible name are expected
 *   to serve the same purpose (i.e. resolve to the same destination, the
 *   full resolved URL, including any fragment). Same-text-different-
 *   destination links are common and frequently intentional in real
 *   sites (e.g. repeated "Read more" links per article card), so this is
 *   authored as `type: 'manual'` (cantTell-capped, never fail) rather
 *   than a hard fail, flagging a real name/destination mismatch for
 *   human judgment instead of guessing intent.
 * @reports
 *   - `name`: the accessible name the links share, trimmed, with
 *     whitespace collapsed and in lower case.
 *   - `href`: the full URL this link leads to.
 *   - `distinctDestinationCount`: how many different URLs the links with
 *     this name lead to, a count of 2 or more.
 * @reason-codes
 *   - `SAME_NAME_DIFFERENT_DESTINATION` (cantTell): links that share an
 *     accessible name lead to two or more different URLs; a person judges
 *     whether they serve the same purpose.
 *     It leans pass when the destinations are equal without tracking
 *     parameters, an index file, a trailing slash and the scheme, and fail
 *     when the name is generic ("read more") and the paths differ.
 *     Basis: WCAG 2.4.9 (not settled); ACT b20e66; ACT fd3a94.
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
  coverage: { facetsBySc: { '2.4.9': ['identical-links-same-purpose-evidence'] } },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    SAME_NAME_DIFFERENT_DESTINATION: {
      steps: [
        "Find all links with the name the report gives (a screen reader's links list helps) and note where each leads.",
        'Open each link and compare the pages it reaches.',
        'Decide whether the pages serve the same purpose (the same page with tracking parameters, or equivalent pages) or different ones.'
      ],
      passWhen:
        'Every link with this name leads to the same page or to pages that serve the same purpose.',
      failWhen:
        'Links with the same name, such as "Read more", lead to pages with different purposes, so their name alone does not tell them apart, which fails WCAG 2.4.9 (ACT b20e66).'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
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
      const onclick = dom.getAttribute(el, 'onclick') || '';
      if (!onclick) return '';
      const m = onclick.match(ONCLICK_LOCATION_RE);
      const raw = m ? m[1] || m[2] : '';
      if (!raw) return '';
      try {
        return new URL(raw, dom.baseURI(dom.ownerDocument(el))).href;
      } catch {
        return raw;
      }
    } catch {
      return '';
    }
  }

  const NATIVE_LINK_TAGS = ['a'];
  // A native link (<a> with href), or an element whose role attribute
  // resolves to link: the first token naming a real role wins, in any case,
  // so role="foo link" and role="LINK" count but role="button link" doesn't.
  function isLinkCandidate(el) {
    const tag = String(dom.localName(el) || '').toLowerCase();
    if (NATIVE_LINK_TAGS.includes(tag) && dom.hasAttribute(el, 'href')) return true;
    // A custom element's internals may make it a link.
    return helpers.aria.getAuthorRole(el) === 'link';
  }

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('a[href], [role~="link" i]', { internalsRoles: true })
    : helpers.queryAll('a[href], [role~="link" i]');

  const groups = new Map(); // normName -> [{ el, href }]

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;
    if (!isLinkCandidate(el)) continue;

    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible =
      typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    // The name in accname order, so a link titled "Read more" around a
    // headline is named by the headline. A link with no name is left out.
    const nameInfo = helpers.getNameFromContentInfo(el, ctx);
    const name = normName(nameInfo && typeof nameInfo.value === 'string' ? nameInfo.value : '');
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
        const raw = dom.getAttribute(el, 'href') || dom.getAttribute(el, 'xlink:href') || '';
        if (raw) {
          try {
            href = new URL(raw, dom.baseURI(dom.ownerDocument(el))).href;
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

    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push({ el, href });
  }

  // ---- Lean ----

  // Query parameters that only track the visit.
  function isTrackingParam(key) {
    const k = key.toLowerCase();
    return k.indexOf('utm_') === 0 || ['gclid', 'fbclid', 'msclkid', 'dclid'].indexOf(k) !== -1;
  }
  const INDEX_FILE = /\/(?:index\.(?:html?|php|aspx?)|default\.aspx?)$/i;

  // A URL with what doesn't change the page taken out: the scheme, tracking
  // parameters, the order of the rest, a default index file and a trailing
  // slash. The fragment stays: #reviews and #specs are different parts.
  function samePageKey(href) {
    try {
      const u = new URL(href);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return href;
      let path = u.pathname.replace(INDEX_FILE, '/');
      if (path.length > 1 && path.charAt(path.length - 1) === '/') path = path.slice(0, -1);
      const params = [];
      u.searchParams.forEach((v, k) => {
        if (!isTrackingParam(k)) params.push(k + '=' + v);
      });
      params.sort();
      return u.hostname.toLowerCase() + ':' + u.port + path + '?' + params.join('&') + u.hash;
    } catch {
      return href;
    }
  }
  function pathKey(href) {
    try {
      const u = new URL(href);
      let path = u.pathname.replace(INDEX_FILE, '/');
      if (path.length > 1 && path.charAt(path.length - 1) === '/') path = path.slice(0, -1);
      return u.hostname.toLowerCase() + ':' + u.port + path;
    } catch {
      return href;
    }
  }

  // Names that say nothing about the destination (F84), in the languages
  // the engine ships.
  const GENERIC_NAMES = new Set([
    'read more',
    'more',
    'learn more',
    'click here',
    'here',
    'details',
    'more details',
    'continue',
    'continue reading',
    'more info',
    'see more',
    'view more',
    'lire la suite',
    'en savoir plus',
    'ici',
    'weiterlesen',
    'mehr erfahren',
    'mehr',
    'hier',
    'leer más',
    'saber más',
    'más información',
    'aquí',
    '続きを読む',
    '詳しくはこちら',
    'こちら'
  ]);
  function bareName(name) {
    let end = name.length;
    while (end > 0 && ' .,;:!?…>»›→'.includes(name[end - 1])) end--;
    return name.slice(0, end).trim();
  }

  // Destinations equal once tracking parameters, an index file, a trailing
  // slash and the scheme are set aside are one page: lean pass. A generic
  // name over different pages is the textbook 2.4.9 failure: lean fail.
  function groupLean(name, entries) {
    const keys = new Set(entries.map((e) => samePageKey(e.href)));
    if (keys.size === 1) {
      return {
        toward: 'pass',
        why: 'The addresses differ only in tracking parameters, an index file, a trailing slash or the scheme, so the links lead to the same page.',
        signals: [{ signal: 'normalized-href-equal', value: true }],
        i18n: { whyKey: 'identicalLinksSamePurpose_lean_why_samePage' }
      };
    }
    const paths = new Set(entries.map((e) => pathKey(e.href)));
    if (GENERIC_NAMES.has(bareName(name)) && paths.size >= 2) {
      return {
        toward: 'fail',
        why: 'The links share a generic name such as "read more" and lead to different pages.',
        signals: [
          { signal: 'generic-link-name', value: bareName(name) },
          { signal: 'distinct-paths', value: paths.size }
        ],
        caution:
          'Different addresses can still be one resource, such as a mirror or a localized copy.',
        i18n: {
          whyKey: 'identicalLinksSamePurpose_lean_why_genericName',
          cautionKey: 'identicalLinksSamePurpose_lean_caution_genericName'
        }
      };
    }
    return null;
  }

  const occurrences = [];

  for (const [name, entries] of groups) {
    const distinctHrefs = new Set(entries.map((e) => e.href));
    if (distinctHrefs.size <= 1) continue;
    const lean = groupLean(name, entries);

    for (const { el, href } of entries) {
      const stableSelector = helpers.buildSelector ? helpers.buildSelector(el) : 'html';
      const html = helpers.getOuterHtmlSnippet
        ? helpers.getOuterHtmlSnippet(el)
        : dom.outerHTML(el) || '';

      const baseOccurrence = {
        ...(lean ? { lean } : {}),
        selector: stableSelector,
        html,
        summary:
          'This link shares an accessible name with other links on the page that lead to a different destination.',
        hint: 'Links with the same text may lead to different addresses when they serve the same purpose, such as one page with different tracking parameters. Otherwise make each link’s text describe its own destination.',
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

  // Only a name shared by two or more links makes the rule apply.
  let sharedNameGroups = 0;
  for (const entries of groups.values()) if (entries.length > 1) sharedNameGroups += 1;
  if (sharedNameGroups === 0) {
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

  // Every shared name leads to one destination.
  // A pass is a claim about the whole page, and a scoped scan saw only part
  // of it (RULE_AUTHORING.md §11.2); what it found inside the scope stands.
  return {
    ruleId: rule.ruleId,
    outcome: helpers.isWholeDocumentScope() ? 'pass' : 'notApplicable',
    severity: 'minor',
    occurrences: []
  };
}

module.exports = { id, meta, runInPage };
