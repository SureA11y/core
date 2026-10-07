/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check page-zones-reachable
 * @atomic true
 * @summary Each area of the page must be reachable: a landmark, a heading, a skip or quick-access link, or a button to hide it
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a run over a whole document. RGAA 12.6.1 looks at five
 *   areas, where present: header, main navigation, main content, footer and
 *   search engine. An area is found from its landmark (banner, navigation,
 *   main, contentinfo, search), or, without one, from a name that says what
 *   it is: an id or class such as `header`, `nav`, `menu`, `content`,
 *   `footer`, `pied-de-page`, or a form with a search field. The main
 *   content is always present: a page with no main landmark is asked
 *   about. Deciding what counts as an area stays a person's call.
 * @expectation
 *   RGAA 12.6.1: each area has a landmark matching its nature, a heading
 *   that says what it holds, a button just before it that hides it, a skip
 *   link just before it, or a quick-access link to it that is visible, at
 *   least on focus.
 *   - The rule passes when every area it finds has a landmark matching its
 *     nature, and no main content is missing.
 *   - It never fails, since which blocks are areas is a person's call. It
 *     asks about an area found from its name, without a landmark: when a
 *     heading opens it (whether the heading says what it holds,
 *     ZONE_HEADING), a same-page link just before it skips it
 *     (ZONE_SKIP_LINK), a button just before it controls it (ZONE_TOGGLE),
 *     or a same-page link leads to it (whether that link is visible,
 *     ZONE_QUICK_LINK); and when it has none of these (ZONE_NO_MECHANISM).
 *     A page with no main landmark is asked about too (MAIN_NOT_FOUND).
 * @implementation-notes
 * - Landmarks are read with helpers.getLandmarkRole, as core's landmark
 *   rules read them: the role attribute's first token, else the element's
 *   implicit role under HTML-AAM (<header> and <footer> are banner and
 *   contentinfo only outside sectioning content and <main>, <nav> is
 *   navigation, <main> main, <search> search).
 * - An area found from its name inside, or around, a landmark of the same
 *   kind is that landmark, not a second area.
 * - bypass-blocks-present (WCAG 2.4.1) is satisfied by one bypass
 *   mechanism for the page; RGAA asks it of each area, which this rule
 *   reports under 12.6.1.
 * - Opt-in (tag `rgaa`).
 */

const id = 'page-zones-reachable';

const meta = {
  title: 'Each area of the page can be reached or skipped',
  description:
    'Checks that the header, main navigation, main content, footer and search areas each have a landmark, and asks about an area found from its name that relies on a heading, a skip or quick-access link, or a button instead (RGAA 12.6.1).',
  i18n: {
    titleKey: 'pageZonesReachable_title',
    descriptionKey: 'pageZonesReachable_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'keyboard', 'navigation', 'structure', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {}
};

// Not applicable while a modal dialog is open either: the rest of the page
// is inert then, so the scan sees the dialog, not the page's own zones and
// links (helpers.isModalDialogOpen, as core's whole-page rules use it).
function applicability(ctx) {
  const { helpers } = ctx;
  if (helpers.isWholeDocumentScope && !helpers.isWholeDocumentScope()) return false;
  return !(helpers.isModalDialogOpen && helpers.isModalDialogOpen());
}

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const FOLLOWING = 4; // Node.DOCUMENT_POSITION_FOLLOWING

  function query(sel) {
    return helpers.queryAllSmart ? helpers.queryAllSmart(sel) : helpers.queryAll(sel);
  }
  function attr(el, name) {
    try {
      return dom.getAttribute(el, name);
    } catch {
      return null;
    }
  }
  function isEligible(el) {
    const r = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    return typeof r === 'boolean' ? r : !!(r && r.eligible);
  }

  // The landmark role an element carries, or ''.
  // The landmark role el exposes, among the five RGAA 12.6.1 names areas
  // after: helpers.getLandmarkRole, as core's landmark rules read it.
  const ZONE_LANDMARKS = ['banner', 'navigation', 'main', 'contentinfo', 'search'];
  function landmarkOf(el) {
    let role;
    try {
      role = helpers.getLandmarkRole ? helpers.getLandmarkRole(el, ctx) : '';
    } catch {
      role = '';
    }
    return ZONE_LANDMARKS.includes(role) ? role : '';
  }

  // The five areas, the landmark that matches each, and the names that
  // point to one without it.
  const ZONES = [
    {
      zone: 'header',
      landmark: 'banner',
      names: /^(site-?|page-?|main-?)?(header|masthead|top-?bar|en-?tete|entete|bandeau)$/
    },
    {
      zone: 'navigation',
      landmark: 'navigation',
      names: /^(main-?|primary-?|site-?|top-?)?(nav|navbar|navigation|menu|menu-?principal)$/
    },
    {
      zone: 'main',
      landmark: 'main',
      names:
        /^(main|main-?content|content|page-?content|site-?content|contenu|contenu-?principal|principal)$/
    },
    {
      zone: 'footer',
      landmark: 'contentinfo',
      names: /^(site-?|page-?|main-?)?(footer|pied|pied-?de-?page)$/
    },
    {
      zone: 'search',
      landmark: 'search',
      names: /^(site-?)?(search|recherche|moteur-?de-?recherche)$/
    }
  ];

  const landmarks = { banner: [], navigation: [], main: [], contentinfo: [], search: [] };
  for (const el of query('header, footer, nav, main, search, [role]')) {
    if (!isEligible(el)) continue;
    const role = landmarkOf(el);
    if (role) landmarks[role].push(el);
  }

  function tokensOf(el) {
    const out = [];
    const idv = String(attr(el, 'id') || '').toLowerCase();
    if (idv) out.push(idv);
    for (const c of String(attr(el, 'class') || '')
      .toLowerCase()
      .split(/\s+/)) {
      if (c) out.push(c);
    }
    return out;
  }

  // Areas found from a name, outside any landmark of the same kind.
  const candidates = [];
  const SEARCH_FIELD =
    'input[type="search"], input[name="q"], input[name="s"], input[name="search"], input[name="recherche"], input[name="query"], [role~="searchbox" i]';
  // role is a fallback list matched in any case: [role~="searchbox" i] also
  // matches role="textbox searchbox", which is a textbox.
  function hasSearchField(el) {
    return Array.from(dom.querySelectorAll(el, SEARCH_FIELD)).some(
      (n) =>
        String(dom.localName(n) || '').toLowerCase() === 'input' ||
        helpers.aria.getExplicitRole(n) === 'searchbox'
    );
  }
  for (const el of query('body *')) {
    if (!el || dom.nodeType(el) !== 1 || !isEligible(el)) continue;
    if (landmarkOf(el)) continue;
    const tag = String(dom.localName(el) || '').toLowerCase();
    if (['script', 'style', 'a', 'button', 'input', 'span', 'li', 'img', 'svg'].includes(tag))
      continue;
    let found = null;
    let hint = '';
    for (const z of ZONES) {
      const t = tokensOf(el).find((tok) => z.names.test(tok));
      if (t) {
        found = z;
        hint = t;
        break;
      }
    }
    if (!found && tag === 'form') {
      try {
        if (hasSearchField(el)) {
          found = ZONES[4];
          hint = 'form';
        }
      } catch {}
    }
    if (!found) continue;
    const same = landmarks[found.landmark];
    if (same.some((l) => dom.contains(l, el) || dom.contains(el, l))) continue;
    // The outermost element carrying the name stands for the area.
    if (candidates.some((c) => c.zone === found.zone && dom.contains(c.el, el))) continue;
    for (let i = candidates.length - 1; i >= 0; i--) {
      if (candidates[i].zone === found.zone && dom.contains(el, candidates[i].el))
        candidates.splice(i, 1);
    }
    candidates.push({ el, zone: found.zone, hint });
  }

  // ---- The mechanisms other than a landmark ----

  function sameDocumentTarget(link) {
    const href = String(attr(link, 'href') || '').trim();
    if (href.charAt(0) !== '#' || href.length < 2) return null;
    let frag = href.slice(1);
    try {
      frag = decodeURIComponent(frag);
    } catch {}
    try {
      // eslint-disable-next-line safe-dom/tree-scoped-ids -- a fragment link's target is looked up in the document (HTML's indicated part of the document)
      return dom.getElementById(document, frag);
    } catch {
      return null;
    }
  }
  const links = query('a[href^="#"]');

  function headingOpens(el) {
    try {
      const h = Array.from(
        dom.querySelectorAll(el, 'h1, h2, h3, h4, h5, h6, [role~="heading" i]')
      ).find(
        (n) =>
          /^h[1-6]$/.test(String(dom.localName(n) || '').toLowerCase()) ||
          helpers.aria.getExplicitRole(n) === 'heading'
      );
      if (!h || !isEligible(h)) return false;
      // The heading comes before any other text of the area.
      const walker = dom.createTreeWalker(document, el, 4);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!/\S/.test(dom.nodeValue(n) || '')) continue;
        return dom.contains(h, n);
      }
    } catch {}
    return false;
  }

  // The last element before el that the keyboard reaches: the candidates
  // core's rules use, kept only when helpers.getFocusableInfo says they are
  // in the tab order (a disabled control, a hidden one, tabindex="-1" not).
  const getFocusable =
    typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;
  function inTabOrder(f) {
    if (!getFocusable) return true;
    try {
      return !!(getFocusable(f, ctx) || {}).tabbable;
    } catch {
      return false;
    }
  }
  function previousFocusable(el) {
    const all = query(
      'a[href],area[href],button,input,select,textarea,summary,iframe,frame,audio[controls],video[controls],[tabindex],[contenteditable]'
    );
    let prev = null;
    for (const f of all) {
      if (dom.contains(el, f)) break;
      let before = false;
      try {
        before = !!(dom.compareDocumentPosition(f, el) & FOLLOWING);
      } catch {}
      if (!before) break;
      if (inTabOrder(f)) prev = f;
    }
    return prev;
  }

  function skipLinkBefore(el) {
    const prev = previousFocusable(el);
    if (!prev || String(dom.localName(prev)) !== 'a') return false;
    const target = sameDocumentTarget(prev);
    if (!target || dom.contains(el, target)) return false;
    try {
      return !!(dom.compareDocumentPosition(el, target) & FOLLOWING);
    } catch {
      return false;
    }
  }

  function toggleBefore(el) {
    const prev = previousFocusable(el);
    if (!prev) return false;
    const isButton = String(dom.localName(prev)) === 'button' || attr(prev, 'role') === 'button';
    if (!isButton) return false;
    const controls = String(attr(prev, 'aria-controls') || '').split(/\s+/);
    const idv = attr(el, 'id');
    return (!!idv && controls.includes(idv)) || attr(prev, 'aria-expanded') != null;
  }

  function quickLinkTo(el) {
    return links.some((l) => {
      if (dom.contains(el, l)) return false;
      const t = sameDocumentTarget(l);
      return !!t && (t === el || dom.contains(el, t));
    });
  }

  // ---- Findings ----

  const MESSAGES = {
    ZONE_HEADING: {
      key: 'heading',
      summary: (p) =>
        `This area ("${p.hint}") has no landmark role. A heading opens it: check that the heading says what the area holds.`,
      needed: 'Whether the heading says what the area holds.'
    },
    ZONE_SKIP_LINK: {
      key: 'skipLink',
      summary: (p) =>
        `This area ("${p.hint}") has no landmark role. A same-page link just before it leads past it: check that it is a skip link for this area.`,
      needed: 'Whether the link just before the area skips it.'
    },
    ZONE_TOGGLE: {
      key: 'toggle',
      summary: (p) =>
        `This area ("${p.hint}") has no landmark role. A button just before it may hide it: check that the button hides this area.`,
      needed: 'Whether the button just before the area hides it.'
    },
    ZONE_QUICK_LINK: {
      key: 'quickLink',
      summary: (p) =>
        `This area ("${p.hint}") has no landmark role. A same-page link leads to it: check that the link is visible, at least when it takes focus.`,
      needed: 'Whether the quick-access link to the area is visible, at least on focus.'
    },
    ZONE_NO_MECHANISM: {
      key: 'none',
      summary: (p) =>
        `This area ("${p.hint}") has no landmark role, no heading opening it, and no link or button to reach, skip or hide it.`,
      needed: 'Whether this block is an area of the page, and if so how it can be reached.'
    },
    MAIN_NOT_FOUND: {
      key: 'mainNotFound',
      summary: () =>
        'The page has no main landmark (<main> or role="main"), so how the main content can be reached could not be checked.',
      needed:
        'Where the main content is, and whether it has a landmark, a heading, or a link to it.'
    }
  };
  const HINT =
    'An area already reachable by a heading that says what it holds, a skip or quick-access link, or a button that hides it meets RGAA 12.6.1 as it is. Otherwise give it the landmark that matches it: <header>, <nav>, <main>, <footer>, or role="search" on the search form.';

  const questions = [];
  function ask(reasonCode, el, hint, zone) {
    const msg = MESSAGES[reasonCode];
    const params = { hint };
    questions.push(
      helpers.reportOccurrence(el, {
        summary: msg.summary(params),
        hint: HINT,
        i18n: {
          summaryKey: `pageZonesReachable_summary_cantTell_${msg.key}`,
          hintKey: 'pageZonesReachable_hint_cantTell',
          params
        },
        uncertainty: {
          code: 'judgement-required',
          needed: msg.needed,
          evidence: { reasonCode, zone }
        },
        data: { details: { reasonCode, zone, hint } }
      })
    );
  }

  for (const c of candidates) {
    const reasonCode = headingOpens(c.el)
      ? 'ZONE_HEADING'
      : skipLinkBefore(c.el)
        ? 'ZONE_SKIP_LINK'
        : toggleBefore(c.el)
          ? 'ZONE_TOGGLE'
          : quickLinkTo(c.el)
            ? 'ZONE_QUICK_LINK'
            : 'ZONE_NO_MECHANISM';
    ask(reasonCode, c.el, c.hint, c.zone);
  }
  if (!landmarks.main.length && !candidates.some((c) => c.zone === 'main')) {
    ask('MAIN_NOT_FOUND', dom.body(document) || dom.documentElement(document), '', 'main');
  }

  if (questions.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'moderate',
      occurrences: questions
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage, applicability };
