/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check orientation-content-parity
 * @atomic true
 * @summary Content must stay the same in portrait and landscape
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to a page whose readable style sheets hold an orientation media
 *   condition (`@media (orientation: portrait)` or `landscape`, at any
 *   depth, or on the `<style>`, `<link>` or `@import` that holds the rule).
 *   A page with none is notApplicable.
 * @expectation
 *   RGAA 13.9.1 asks that « le contenu proposé reste le même quel que soit
 *   le mode d’orientation de l’écran utilisé même si sa présentation et le
 *   moyen d’y accéder peut différer ».
 *   - Where the page has a layout (a browser), it is laid out as portrait
 *     and as landscape, and the text and image alternatives shown in each
 *     are compared. Content shown in one orientation fails when it is
 *     hidden in the other and the same text is not shown anywhere else
 *     there (CONTENT_MISSING), reported on the outermost element hidden.
 *     It is asked about when what is hidden holds the main content (a
 *     "rotate your device" page, which the essential-orientation exception
 *     may allow; MAIN_CONTENT_HIDDEN), and when an element an orientation
 *     rule hides has no text to compare (hiddenInOrientation). The page
 *     passes when every content shown in one orientation is shown in the
 *     other.
 *   - Without a layout (jsdom), each element that a style rule inside an
 *     orientation condition hides with `display: none`, `visibility:
 *     hidden` or `visibility: collapse` is asked about (hiddenInOrientation).
 * @implementation-notes
 * - Transitions are held off while each orientation is read: a style
 *   sheet in a cascade layer declared before any other sets `transition:
 *   none !important` on everything, so what an orientation shows is read at
 *   once, not at the start of the page's own transition toward it. The
 *   media conditions are put back first, then the sheet is removed, so
 *   nothing animates on the way back.
 * - The orientations are emulated: each media list naming an orientation
 *   gets the condition swapped for one that is always true or always
 *   false, for the time of the check, then put back. Width and height
 *   conditions are left as they are, so a breakpoint a real rotation would
 *   cross is not tested, and neither is script that reacts to
 *   `screen.orientation` or `matchMedia`.
 * - Shown means rendered with a size: Element.checkVisibility() with
 *   opacity and visibility, and client rects on the text. Up to 3,000 text
 *   nodes are compared.
 * - WCAG 1.3.4 is about restricting the view to one orientation, and
 *   css-orientation-lock asks only when the hidden element holds the
 *   page's main content. RGAA 13.9.1 also asks that the content stays the
 *   same, so this rule judges any content hidden that way.
 * - Only readable stylesheets are rewritten or scanned. css-orientation-lock
 *   already asks about stylesheets it cannot read (cross-origin), under the
 *   same test.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'orientation-content-parity';

const meta = {
  title: 'Content stays the same in portrait and landscape',
  description:
    'Lays the page out as portrait and as landscape and fails content shown in one orientation and missing from the other, and asks about elements an orientation media query hides when the page cannot be laid out (RGAA 13.9.1).',
  i18n: {
    titleKey: 'orientationContentParity_title',
    descriptionKey: 'orientationContentParity_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'structure', 'css', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const CSS_STYLE_RULE = 1;
  const CSS_IMPORT_RULE = 3;
  const MAX_DEPTH = 10;

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }

  function mediaTextOf(list) {
    try {
      return trim(list && list.mediaText);
    } catch {
      return '';
    }
  }

  function isOrientationMedia(mediaText) {
    const m = trim(mediaText).toLowerCase();
    return m.includes('orientation') && (m.includes('portrait') || m.includes('landscape'));
  }

  function hides(style) {
    if (!style || typeof style.getPropertyValue !== 'function') return false;
    const display = trim(style.getPropertyValue('display')).toLowerCase();
    const visibility = trim(style.getPropertyValue('visibility')).toLowerCase();
    return display === 'none' || visibility === 'hidden' || visibility === 'collapse';
  }

  const hidings = []; // { mediaText, selectorText }
  const mediaLists = []; // MediaList objects naming an orientation
  function noteMedia(list) {
    if (list && isOrientationMedia(mediaTextOf(list)) && !mediaLists.includes(list)) {
      mediaLists.push(list);
    }
  }

  function walk(rules, orientationMedia, depth) {
    if (!rules || depth > MAX_DEPTH) return;
    for (const cssRule of rules) {
      if (!cssRule) continue;
      if (cssRule.type === CSS_STYLE_RULE) {
        if (orientationMedia && cssRule.selectorText && hides(cssRule.style)) {
          hidings.push({ mediaText: orientationMedia, selectorText: trim(cssRule.selectorText) });
        }
        continue;
      }
      const ownMedia = mediaTextOf(cssRule.media);
      noteMedia(cssRule.media);
      const media = isOrientationMedia(ownMedia) ? ownMedia : orientationMedia;
      if (cssRule.type === CSS_IMPORT_RULE) {
        let imported;
        try {
          imported = cssRule.styleSheet ? cssRule.styleSheet.cssRules : null;
        } catch {
          imported = null;
        }
        walk(imported, media, depth + 1);
        continue;
      }
      // @media, @supports, @layer, @container: recurse into grouping rules.
      let nested;
      try {
        nested = cssRule.cssRules || null;
      } catch {
        nested = null;
      }
      if (nested) walk(nested, media, depth + 1);
    }
  }

  try {
    for (const sheet of document.styleSheets || []) {
      let rules = null;
      try {
        rules = sheet && sheet.cssRules ? sheet.cssRules : null;
      } catch {
        continue; // cross-origin: css-orientation-lock asks about it
      }
      const sheetMedia = mediaTextOf(sheet.media);
      noteMedia(sheet.media);
      walk(rules, isOrientationMedia(sheetMedia) ? sheetMedia : '', 0);
    }
  } catch {
    // no-throw: treat as no readable stylesheets
  }

  // ---- Portrait and landscape, where the page has a layout ----

  const view = document.defaultView || null;
  function hasLayout() {
    const probe = document.documentElement || null;
    if (!view || !probe || typeof probe.getClientRects !== 'function') return false;
    if (typeof probe.checkVisibility !== 'function') return false;
    try {
      const rects = probe.getClientRects();
      return !!(rects && rects.length > 0);
    } catch {
      return false;
    }
  }

  const ORIENTATION_RE = /\(\s*orientation\s*:\s*(portrait|landscape)\s*\)/gi;
  // Always true, and always false: no viewport is narrower than 0px.
  const TRUE_FEATURE = '(min-width: 0px)';
  const FALSE_FEATURE = '(max-width: -1px)';

  function shown(el) {
    try {
      return el.checkVisibility({ opacityProperty: true, visibilityProperty: true });
    } catch {
      return true;
    }
  }
  function norm(t) {
    return String(t || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  // The content items of the page: text nodes and image alternatives.
  function contentItems() {
    const SKIP = new Set(['script', 'style', 'noscript', 'template']);
    const items = [];
    if (!document.body) return items;
    const walker = document.createTreeWalker(document.body, 4);
    for (let n = walker.nextNode(); n && items.length < 3000; n = walker.nextNode()) {
      const text = norm(n.nodeValue);
      if (!/[\p{L}\p{N}]/u.test(text)) continue;
      const parent = n.parentElement;
      if (!parent || SKIP.has(String(parent.localName))) continue;
      items.push({
        node: n,
        el: parent,
        text,
        display: String(n.nodeValue).replace(/\s+/g, ' ').trim()
      });
    }
    for (const img of document.body.querySelectorAll('img[alt]')) {
      const text = norm(img.getAttribute('alt'));
      if (text) {
        const display = String(img.getAttribute('alt')).replace(/\s+/g, ' ').trim();
        items.push({ node: img, el: img, text, display });
      }
    }
    return items;
  }

  function isShownItem(item) {
    if (!shown(item.el)) return false;
    try {
      if (item.node.nodeType === 3) {
        const range = document.createRange();
        range.selectNodeContents(item.node);
        return Array.from(range.getClientRects()).some((r) => r.width > 0 && r.height > 0);
      }
      const r = item.node.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    } catch {
      return true;
    }
  }

  // The outermost element, below <body>, that is not shown.
  function hiddenRoot(el) {
    let root = el;
    for (let a = el; a && a !== document.body && a.nodeType === 1; a = a.parentElement) {
      if (!shown(a)) root = a;
    }
    return root;
  }

  // Each item's state in one orientation: { shown, root }, and the shown text.
  function look(items) {
    const states = items.map((item) => {
      const visible = isShownItem(item);
      return { shown: visible, root: visible ? null : hiddenRoot(item.el) };
    });
    const joined = items
      .filter((_, i) => states[i].shown)
      .map((item) => item.text)
      .join(' \n ');
    return { states, joined };
  }

  function emulate(orientation) {
    for (const entry of saved) {
      const text = entry.original.replace(ORIENTATION_RE, (m, o) =>
        o.toLowerCase() === orientation ? TRUE_FEATURE : FALSE_FEATURE
      );
      try {
        entry.list.mediaText = text;
      } catch {}
    }
  }
  // Transitions held off for the time of the check, so an orientation put on
  // the page is read at once rather than at the start of its transition. The
  // sheet is a cascade layer declared before any other, which wins over the
  // page's own !important as a user style sheet would. The page's state is
  // put back before the sheet goes, so nothing animates on the way back.
  function freezeTransitions(doc) {
    let sheet = null;
    try {
      sheet = doc.createElement('style');
      sheet.textContent =
        '@layer surea11y-no-transitions{*,*::before,*::after{transition:none!important}}';
      const host = doc.head || doc.documentElement;
      host.insertBefore(sheet, host.firstChild);
    } catch {
      sheet = null;
    }
    return () => {
      try {
        if (sheet && sheet.parentNode) sheet.parentNode.removeChild(sheet);
      } catch {}
    };
  }

  const saved = mediaLists.map((list) => ({ list, original: mediaTextOf(list) }));

  const main = (() => {
    // Unfiltered: in the orientation the scan runs in, <main> may be the
    // very thing hidden.
    const q = helpers.queryAllSource || helpers.queryAllSmart || helpers.queryAll;
    try {
      return q('main')[0] || q('[role="main"]')[0] || null;
    } catch {
      return null;
    }
  })();

  const fails = [];
  const questions = [];
  let decided = false;
  const judged = new Set(); // elements whose content the comparison settled

  if (saved.length && hasLayout()) {
    const items = contentItems();
    let portrait;
    let landscape;
    const unfreeze = freezeTransitions(document);
    try {
      emulate('portrait');
      portrait = look(items);
      emulate('landscape');
      landscape = look(items);
    } catch {
      // left undecided: the elements found in the style sheets are asked about
    } finally {
      for (const entry of saved) {
        try {
          entry.list.mediaText = entry.original;
        } catch {}
      }
      unfreeze();
    }
    decided = !!(portrait && landscape);

    const missing = new Map(); // root -> { orientation, texts[] }
    const pairs = decided
      ? [
          [portrait, landscape, 'landscape'],
          [landscape, portrait, 'portrait']
        ]
      : [];
    for (const [from, to, hiddenIn] of pairs) {
      items.forEach((item, i) => {
        if (!from.states[i].shown || to.states[i].shown) return;
        const root = to.states[i].root || item.el;
        judged.add(root);
        // The same text shown elsewhere in that orientation is the same content.
        if (to.joined.includes(item.text)) return;
        if (!missing.has(root)) missing.set(root, { orientation: hiddenIn, texts: [] });
        missing.get(root).texts.push(item.display);
      });
    }

    const holdsMain = (root) => !!(main && (root === main || root.contains(main)));
    // An orientation that hides the main content is a lock, asked about
    // once. What only that orientation shows (a "rotate your device"
    // message) is part of the lock, not content missing from the other one.
    const locked = new Set();
    for (const [root, m] of missing) if (holdsMain(root)) locked.add(m.orientation);
    const other = (o) => (o === 'portrait' ? 'landscape' : 'portrait');

    for (const [root, m] of missing) {
      if (!holdsMain(root) && locked.has(other(m.orientation))) continue;
      const element = String(root.localName || '').toLowerCase();
      const text = m.texts.join(' ').slice(0, 80);
      if (holdsMain(root)) {
        questions.push(
          helpers.reportOccurrence(root, {
            summary: `In ${m.orientation}, this <${element}> is hidden, and with it the main content of the page.`,
            hint: 'Check that the page can be used in both orientations, unless one orientation is essential to it (RGAA 13.9.1).',
            i18n: {
              summaryKey: `orientationContentParity_summary_cantTell_mainContent_${m.orientation}`,
              hintKey: 'orientationContentParity_hint_cantTell_mainContent',
              params: { orientation: m.orientation, element }
            },
            uncertainty: {
              code: 'judgement-required',
              needed: 'Whether the orientation is essential to the page.',
              evidence: { reasonCode: 'MAIN_CONTENT_HIDDEN', orientation: m.orientation }
            },
            data: { details: { reasonCode: 'MAIN_CONTENT_HIDDEN', orientation: m.orientation } }
          })
        );
        continue;
      }
      fails.push(
        helpers.reportOccurrence(root, {
          summary: `In ${m.orientation}, this <${element}> is hidden and its content ("${text}") is not shown anywhere else.`,
          hint: 'Offer the same content in both orientations. Its presentation may change, but it must stay available (RGAA 13.9.1).',
          i18n: {
            summaryKey: `orientationContentParity_summary_fail_missing_${m.orientation}`,
            hintKey: 'orientationContentParity_hint_fail_missing',
            params: { orientation: m.orientation, element, text }
          },
          data: {
            details: { reasonCode: 'CONTENT_MISSING', orientation: m.orientation, texts: m.texts }
          }
        })
      );
    }
  }

  const query = helpers.queryAllSource || helpers.queryAllSmart || helpers.queryAll;
  const seen = new Set();

  for (const h of hidings) {
    let matched;
    try {
      matched = query(h.selectorText) || [];
    } catch {
      matched = []; // a selector the engine cannot parse is skipped, not guessed at
    }
    for (const el of matched) {
      if (!el || el.nodeType !== 1 || seen.has(el)) continue;
      seen.add(el);
      // The comparison settled what this element shows.
      if (decided && (judged.has(el) || norm(el.textContent) || el.querySelector('img[alt]'))) {
        continue;
      }
      const element = String(el.localName || el.tagName || '').toLowerCase();
      questions.push(
        helpers.reportOccurrence(el, {
          summary: `A "${h.mediaText}" media query hides this <${element}> ("${h.selectorText}").`,
          hint: 'Check that the same content is offered in portrait and in landscape, even if it is presented or reached differently (RGAA 13.9.1). This is not required when one orientation is essential.',
          i18n: {
            summaryKey: 'orientationContentParity_summary_cantTell',
            hintKey: 'orientationContentParity_hint_cantTell',
            params: { mediaText: h.mediaText, selectorText: h.selectorText, element }
          },
          uncertainty: {
            code: decided ? 'judgement-required' : 'runtime-dependent',
            needed: 'Whether the same content is offered in both orientations.',
            evidence: { reasonCode: 'hiddenInOrientation' }
          },
          data: {
            details: {
              reasonCode: 'hiddenInOrientation',
              mediaText: h.mediaText,
              selectorText: h.selectorText
            },
            visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
          }
        })
      );
    }
  }

  if (fails.length || questions.length) {
    return {
      ruleId: rule.ruleId,
      ...helpers.resolveTieredOutcome(fails, questions, rule.defaultSeverity || 'moderate')
    };
  }
  if (decided) return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
