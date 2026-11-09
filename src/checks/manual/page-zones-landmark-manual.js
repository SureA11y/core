/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check page-zones-landmark
 * @atomic true
 * @summary The page's header, navigation, search and footer are exposed as landmarks
 * @standard Best Practices (no formal WCAG Success Criterion)
 * @applicability
 *   Applies to a whole page, not a fragment, a scoped scan or a document in a
 *   frame, while no modal dialog is open. It looks at the visible blocks that
 *   name themselves a page zone by their id or class (header, masthead,
 *   banner, nav, navigation, menu, footer, and their French, German and
 *   Spanish names), at search forms (a form with a search field, or one
 *   named q, s, search or query), and at the page's first <header> and last
 *   <footer>. A page with none of them is notApplicable.
 * @expectation
 *   Each zone is exposed as the landmark of its nature, by its element or a
 *   role: the header as banner, a navigation as navigation, the search as
 *   search, the footer as contentinfo. A zone inside or around an element
 *   with that role is exposed. The page header and footer are asked about
 *   only when the page exposes no banner, or no contentinfo, at all.
 *   Whether a block is that zone is for a person, so the rule only asks.
 * @reports
 *   - `zone`: banner, navigation, search or contentinfo, the role the zone
 *     would have.
 * @reason-codes
 *   - `BANNER_NOT_EXPOSED` (cantTell): the page exposes no banner, and a
 *     block named as its header is not a <header> and has no role="banner".
 *     Basis: WCAG 1.3.1 (not settled); ARIA11; WAI-ARIA 1.2 banner role (best practice).
 *   - `HEADER_NESTED` (cantTell): the page exposes no banner, and its first
 *     <header> is inside an <article>, <aside>, <main>, <nav> or <section>,
 *     where it is not a banner.
 *     Basis: WCAG 1.3.1 (not settled); ARIA11; HTML-AAM header (best practice).
 *   - `NAVIGATION_NOT_EXPOSED` (cantTell): a block named as a navigation, with
 *     two links or more, is not a <nav> and has no role="navigation".
 *     Basis: WCAG 1.3.1 (not settled); ARIA11; WAI-ARIA 1.2 navigation role (best practice).
 *   - `SEARCH_NOT_EXPOSED` (cantTell): a search form is not in a <search> and
 *     has no role="search".
 *     Basis: WCAG 1.3.1 (not settled); ARIA11; WAI-ARIA 1.2 search role (best practice).
 *   - `CONTENTINFO_NOT_EXPOSED` (cantTell): the page exposes no contentinfo,
 *     and a block named as its footer is not a <footer> and has no
 *     role="contentinfo".
 *     Basis: WCAG 1.3.1 (not settled); ARIA11; WAI-ARIA 1.2 contentinfo role (best practice).
 *   - `FOOTER_NESTED` (cantTell): the page exposes no contentinfo, and its
 *     last <footer> is inside an <article>, <aside>, <main>, <nav> or
 *     <section>, where it is not a contentinfo.
 *     Basis: WCAG 1.3.1 (not settled); ARIA11; HTML-AAM footer (best practice).
 * @implementation-notes
 * - Names are read as whole tokens of the id and class (site-header, menu,
 *   pied-de-page), not as substrings: "headerless" or "menuitem" is no zone.
 * - Landmarks come from helpers.getLandmarkRole, so an implicit role lost by
 *   nesting is lost here too.
 */

const id = 'page-zones-landmark';

const meta = {
  title: "The page's header, navigation, search and footer are landmarks",
  description:
    "Asks about blocks that name themselves the page's header, a navigation or its footer, and search forms, that are not exposed as the landmark of their nature, and about a page header or footer nested where it loses its landmark.",
  i18n: {
    titleKey: 'pageZonesLandmark_title',
    descriptionKey: 'pageZonesLandmark_description'
  },
  helpUrl: null,
  tags: ['best-practice', 'landmarks', 'structure', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'minor',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

// The page's structure: a fragment, a scoped scan, a framed document or a page
// behind a modal dialog has none of its own to judge.
function applicability(ctx) {
  const h = ctx.helpers;
  return (
    h.isWholeDocumentScope() &&
    h.isTopLevelDocument() &&
    !(typeof h.isModalDialogOpen === 'function' && h.isModalDialogOpen())
  );
}

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const norm = (v) =>
    String(v == null ? '' : v)
      .replace(/\s+/g, ' ')
      .trim();
  const tagOf = (el) => String(dom.localName(el) || '').toLowerCase();
  const roleOf = (el) => {
    try {
      return helpers.getLandmarkRole(el, ctx) || '';
    } catch {
      return '';
    }
  };
  const visible = (el) => {
    try {
      return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
    } catch {
      return true;
    }
  };
  const exposed = (el) => {
    try {
      const r = helpers.isAccTreeEligible(el, ctx);
      return typeof r === 'boolean' ? r : !!(r && r.eligible);
    } catch {
      return true;
    }
  };

  // The zone a block names itself, from the tokens of its id and class.
  const NAMES = {
    banner: [
      'header',
      'masthead',
      'banner',
      'site-header',
      'page-header',
      'en-tete',
      'entete',
      'kopf',
      'kopfzeile',
      'cabecera'
    ],
    navigation: [
      'nav',
      'navigation',
      'navbar',
      'menu',
      'main-menu',
      'primary-menu',
      'site-nav',
      'site-navigation',
      'main-nav',
      'menu-principal',
      'hauptmenu',
      'navegacion'
    ],
    contentinfo: [
      'footer',
      'site-footer',
      'page-footer',
      'pied',
      'pied-de-page',
      'piedpage',
      'fusszeile',
      'pie',
      'pie-de-pagina'
    ]
  };
  function zoneNamed(el) {
    const tokens = norm(
      `${dom.getAttribute(el, 'id') || ''} ${dom.getAttribute(el, 'class') || ''}`
    )
      .toLowerCase()
      .split(' ')
      .filter(Boolean);
    for (const zone of ['banner', 'navigation', 'contentinfo']) {
      if (tokens.some((t) => NAMES[zone].includes(t))) return zone;
    }
    return '';
  }

  const isSearchField = (input) => {
    const type = norm(dom.getAttribute(input, 'type')).toLowerCase();
    const name = norm(dom.getAttribute(input, 'name')).toLowerCase();
    return type === 'search' || ['q', 's', 'search', 'query'].includes(name);
  };

  // An element with the role, the block itself, an ancestor or a descendant.
  function hasRoleAround(el, role) {
    if (roleOf(el) === role) return true;
    for (let a = dom.parentElement(el); a; a = dom.parentElement(a)) {
      if (roleOf(a) === role) return true;
    }
    return [...dom.querySelectorAll(el, helpers.landmarkCandidateSelector)].some(
      (d) => roleOf(d) === role
    );
  }

  const all = [...dom.querySelectorAll(document, helpers.landmarkCandidateSelector)];
  const pageHas = (role) => all.some((el) => roleOf(el) === role && exposed(el));

  const SECTIONING = new Set(['article', 'aside', 'main', 'nav', 'section']);
  function nested(el) {
    for (let a = dom.parentElement(el); a; a = dom.parentElement(a)) {
      if (SECTIONING.has(tagOf(a))) return true;
    }
    return false;
  }

  const MESSAGES = {
    BANNER_NOT_EXPOSED: [
      'This block is named as the page header, but the page has no banner landmark.',
      'If it is the page header, use a <header> outside any section, or give it role="banner".'
    ],
    HEADER_NESTED: [
      'This <header> is inside a section, so it is not a banner landmark, and the page has none.',
      'If it is the page header, move it out of the section, or give it role="banner".'
    ],
    NAVIGATION_NOT_EXPOSED: [
      'This block is named as a navigation, but it is not a navigation landmark.',
      'If it is a navigation of the page, use a <nav>, or give it role="navigation".'
    ],
    SEARCH_NOT_EXPOSED: [
      'This search form is not a search landmark.',
      'If it searches the site, put it in a <search>, or give it role="search".'
    ],
    CONTENTINFO_NOT_EXPOSED: [
      'This block is named as the page footer, but the page has no contentinfo landmark.',
      'If it is the page footer, use a <footer> outside any section, or give it role="contentinfo".'
    ],
    FOOTER_NESTED: [
      'This <footer> is inside a section, so it is not a contentinfo landmark, and the page has none.',
      'If it is the page footer, move it out of the section, or give it role="contentinfo".'
    ]
  };
  const ZONE_OF = {
    BANNER_NOT_EXPOSED: 'banner',
    HEADER_NESTED: 'banner',
    NAVIGATION_NOT_EXPOSED: 'navigation',
    SEARCH_NOT_EXPOSED: 'search',
    CONTENTINFO_NOT_EXPOSED: 'contentinfo',
    FOOTER_NESTED: 'contentinfo'
  };

  const occurrences = [];
  const reported = new Set();
  let applicable = 0;
  function ask(el, code) {
    if (reported.has(el)) return;
    reported.add(el);
    const key = code.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: MESSAGES[code][0],
        hint: MESSAGES[code][1],
        i18n: {
          summaryKey: `pageZonesLandmark_summary_cantTell_${key}`,
          hintKey: `pageZonesLandmark_hint_cantTell_${key}`
        },
        uncertainty: {
          code: 'judgement-required',
          needed: 'Whether the block is that zone of the page.'
        },
        data: {
          details: { reasonCode: code, zone: ZONE_OF[code] },
          visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  const usable = (el) => visible(el) && exposed(el);
  const noBanner = !pageHas('banner');
  const noContentinfo = !pageHas('contentinfo');

  // Blocks that name themselves a zone.
  const named = [...dom.querySelectorAll(document, 'body [id], body [class]')].filter(
    (el) => !['html', 'body'].includes(tagOf(el)) && zoneNamed(el) && usable(el)
  );
  for (const el of named) {
    const zone = zoneNamed(el);
    const tag = tagOf(el);
    if (zone === 'navigation') {
      if (dom.querySelectorAll(el, 'a[href]').length < 2) continue;
      applicable += 1;
      if (!hasRoleAround(el, 'navigation')) ask(el, 'NAVIGATION_NOT_EXPOSED');
      continue;
    }
    // The page header and footer: a <header> or <footer> is judged below.
    if ((zone === 'banner' && tag === 'header') || (zone === 'contentinfo' && tag === 'footer')) {
      continue;
    }
    // Only the outermost block of a zone: a header's inner wrappers name it too.
    const outer = (() => {
      for (let a = dom.parentElement(el); a; a = dom.parentElement(a)) {
        if (named.includes(a) && zoneNamed(a) === zone) return false;
      }
      return true;
    })();
    if (!outer) continue;
    applicable += 1;
    if (zone === 'banner' && noBanner && !hasRoleAround(el, 'banner')) {
      ask(el, 'BANNER_NOT_EXPOSED');
    }
    if (zone === 'contentinfo' && noContentinfo && !hasRoleAround(el, 'contentinfo')) {
      ask(el, 'CONTENTINFO_NOT_EXPOSED');
    }
  }

  // The page's first <header> and last <footer>, where nesting takes their role.
  const headers = [...dom.querySelectorAll(document, 'body header')].filter(usable);
  const footers = [...dom.querySelectorAll(document, 'body footer')].filter(usable);
  // One with a role of its own is judged by it, not by where it sits.
  const plain = (el) => {
    try {
      return !helpers.aria.getExplicitRole(el);
    } catch {
      return true;
    }
  };
  if (headers.length) {
    applicable += 1;
    const first = headers[0];
    if (noBanner && plain(first) && nested(first)) ask(first, 'HEADER_NESTED');
  }
  if (footers.length) {
    applicable += 1;
    const last = footers[footers.length - 1];
    if (noContentinfo && plain(last) && nested(last)) ask(last, 'FOOTER_NESTED');
  }

  // Search forms.
  for (const form of [...dom.querySelectorAll(document, 'form')]) {
    if (!usable(form)) continue;
    if (![...dom.querySelectorAll(form, 'input')].some(isSearchField)) continue;
    applicable += 1;
    if (!hasRoleAround(form, 'search')) ask(form, 'SEARCH_NOT_EXPOSED');
  }

  if (!applicable) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'minor',
    occurrences
  };
}

module.exports = { id, meta, runInPage, applicability };
