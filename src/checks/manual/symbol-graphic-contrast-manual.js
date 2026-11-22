/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check symbol-graphic-contrast
 * @atomic true
 * @summary Symbols drawn as text and used as a graphic should have a contrast of at least 3:1
 * @standard WCAG 2.2
 * @sc 1.4.11
 * @applicability
 *   Elements whose whole visible text is made of symbols, with no letter or
 *   digit at all, such as rating stars (★★★★☆), dots (●○○), arrows (→)
 *   or check marks (✓): text with at least one character of a Unicode
 *   symbol category (Sm, Sc, Sk, So), 40 characters at most, that is a
 *   direct text child of the element, which is rendered and not
 *   screen-reader-only. Only visible text counts: text in a descendant
 *   that is not drawn (display:none), hidden (visibility:hidden), not seen
 *   (opacity:0, font-size:0, a box of no width hiding its overflow) or
 *   visually hidden (a screen-reader-only clip or 1px box) is left out of
 *   the element's text, so ★★★★☆ with a screen-reader-only "4 of 5" is
 *   symbols only; aria-hidden doesn't matter to sight. Left out:
 *   - text with a visible letter or digit anywhere in the element ("4.5 ★",
 *     "Next →"): the text-contrast rules judge it as text, at its own ratio;
 *     letter-free text is the only text they leave out (ACT afw4f7), so the
 *     two never judge the same text;
 *   - a currency sign (Unicode Sc, such as € $ £ ¥) or 〒 whose nearest
 *     visible character on its line, not past a block boundary (a block,
 *     a flex or grid item, a float, an absolutely positioned box), a line
 *     break or a link's text (unless its nearest character is a digit, a
 *     linked amount), is a letter or a digit ("€" in
 *     <span>€</span>45,00): it is read with that text, and
 *     contrast-minimum judges it as text, at 4.5:1 or 3:1 if large. A
 *     separator between links, such as a breadcrumb's ">", stays here;
 *   - emoji drawn in their own colours, and text that is only separators
 *     (`|`, `¦`, `~`, `·`, `•`, `/`, dashes), which decorate;
 *   - symbols in an inactive user interface component (a disabled
 *     control, one in a disabled fieldset, or one with aria-disabled,
 *     set as an attribute or through ElementInternals), which 1.4.11
 *     exempts, as contrast-minimum leaves its text out. aria-disabled
 *     counts only on a user interface component (a widget role, a native
 *     control, a focusable element) or an ancestor of one the symbols are
 *     in: on a plain <span> with no control it exempts nothing;
 *   - text in `<svg>`, `<math>`, form controls (`<select>`, `<option>`,
 *     `<textarea>`) and elements that are not drawn (`<script>`, `<style>`,
 *     `<template>`, `<title>`), and text whose colours can't be measured
 *     (a background image, a gradient, a filter or blending: the reasons
 *     the text-contrast rules give).
 * @expectation
 *   A symbol drawn as text in place of a picture is a graphic under WCAG
 *   1.4.11 when a person needs it to understand the content, as rating
 *   stars or status marks are: its colour against its background reaches
 *   3:1. Below 3:1 it is asked about (cantTell), leaning fail: whether the
 *   symbols carry information, rather than decorate or repeat a text
 *   beside them, is for a person to judge. At 3:1 or more, pass.
 * @reports
 *   - `symbols`: the element's own symbols (its text nodes), with spacing
 *     collapsed, up to 20 characters.
 *   - `ratio`: their contrast against their background, to two decimals.
 *   - `foreground`, `background`: the colours measured, as hex.
 *   - `threshold`: 3.
 * @reason-codes
 *   - `SYMBOLS_BELOW_GRAPHIC_THRESHOLD` (cantTell): symbols drawn as text,
 *     with no letter or digit, are under 3:1 against their background;
 *     whether they carry information a person needs is for a person to
 *     judge. It leans fail: symbols such as rating stars or status marks
 *     usually do.
 *     Basis: WCAG 1.4.11 (not settled); G207.
 * @implementation-notes
 * - The colours are measured with the contrast helpers the text-contrast
 *   rules use (helpers.contrast): the effective foreground, with its
 *   opacity, over the effective background.
 * - Each element is reported for the symbols in its own text nodes, the
 *   innermost element that holds them, as the text-contrast rules report
 *   text: symbols nested in another symbol element are reported once, on
 *   the element that holds them, measured in its colour.
 * - Icon fonts draw their glyphs from the Private Use Area, which is not a
 *   symbol category: they are not seen here.
 */

const id = 'symbol-graphic-contrast';

const meta = {
  title: 'Symbols used as a graphic should have a contrast of at least 3:1',
  description:
    'Asks about symbols drawn as text with no letter or digit, such as rating stars, dots, arrows or check marks, whose contrast against their background is under the 3:1 a graphic needed to understand the content must reach.',
  i18n: {
    titleKey: 'symbolGraphicContrast_title',
    descriptionKey: 'symbolGraphicContrast_description'
  },
  helpUrl: null,
  tags: ['wcag21aa', 'wcag1411', 'nontext', 'contrast', 'color', 'atomic', 'manual'],
  wcagSc: ['1.4.11'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.4.11',
      title: 'Non-text Contrast',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '1.4.11': ['symbol-graphic-contrast-evidence'] } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule } = ctx;
  const c = helpers.contrast;

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }

  const notApplicable = {
    ruleId: rule.ruleId,
    outcome: 'notApplicable',
    severity: 'minor',
    occurrences: []
  };
  if (
    !c ||
    typeof c.computeEffectiveForeground !== 'function' ||
    typeof c.computeEffectiveBackground !== 'function'
  ) {
    return notApplicable;
  }

  const SKIP =
    'script,style,noscript,template,title,select,option,optgroup,datalist,textarea,svg,math';
  const SYMBOL = /\p{S}/u;
  const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;
  // Emoji drawn in their own colours: the text colour doesn't paint them.
  const EMOJI = /\p{Emoji_Presentation}|️/u;
  // Characters that separate or decorate, as a breadcrumb's "|" does.
  const SEPARATORS = /[\s|¦‖∣~∼·•/\\\-‐‑‒–—―]/gu;
  const RENDER_OPTS = { visibilityMode: 'styleOnly', disableGeometry: true, ignoreOpacity: true };

  function shown(el) {
    try {
      if (typeof helpers.isDomVisibleEligible === 'function') {
        const vis = helpers.isDomVisibleEligible(el, null, RENDER_OPTS);
        if (vis && vis.eligible === false) return false;
      }
      if (
        typeof helpers.isVisuallyHidden === 'function' &&
        helpers.isVisuallyHidden(el, { ignoreOpacity: true })
      ) {
        return false;
      }
    } catch {}
    return true;
  }

  // An element whose content is not seen though it is drawn (round 12,
  // C12-11): fully transparent (opacity: 0), or a box of no width that
  // hides its overflow (width: 0; overflow: hidden, with text-indent:
  // -9999px or not).
  function unseen(n) {
    let cs = null;
    try {
      cs = helpers.computedStyle ? helpers.computedStyle(n) : null;
    } catch {}
    if (!cs) return false;
    if (trim(cs.opacity) && Number.parseFloat(cs.opacity) === 0) return true;
    const clips = /^(hidden|clip)$/.test(trim(cs.overflowX || cs.overflow));
    const inline = trim(cs.display) === 'inline' || trim(cs.display) === 'contents';
    return clips && !inline && Number.parseFloat(cs.width) === 0;
  }

  // The text el shows: its text nodes, less those in an element that is not
  // drawn (display:none, a closed <details>), not seen (unseen, or a font
  // size of 0), hidden (visibility:hidden) or
  // visually hidden (a screen-reader-only clip or 1px box). aria-hidden
  // doesn't matter to sight. Read through at most 400 nodes.
  function visibleTextOf(el) {
    let out = '';
    let budget = 400;
    const walk = (node) => {
      for (let n = dom.firstChild(node); n && budget > 0; n = dom.nextSibling(n)) {
        budget -= 1;
        const type = dom.nodeType(n);
        if (type === 3) {
          let cs = null;
          try {
            cs = helpers.computedStyle ? helpers.computedStyle(node) : null;
          } catch {}
          const vis = trim(cs && cs.visibility);
          // Text at a font size of 0 draws nothing (round 12, C12-11).
          const drawn = !cs || !cs.fontSize || Number.parseFloat(cs.fontSize) !== 0;
          if ((!vis || vis === 'visible') && drawn) out += String(dom.nodeValue(n) || '');
        } else if (type === 1 && shown(n) && !unseen(n)) {
          walk(n);
        }
      }
    };
    walk(el);
    return out;
  }

  // The element's own symbol text: its direct text children, holding a
  // symbol, with the whole of its text free of letters and digits. Only
  // the element's own text is its, as the text-contrast rules report text:
  // <span>★<b>★★</b></span> gives “★” on the span and “★★” on the <b>,
  // each measured in its own colour, so no symbol is reported twice.
  // The parents of the text nodes holding a symbol other than a separator,
  // found with one walk over the text of each tree (document or shadow
  // root): an element no such text node is a child of has no symbol text,
  // so its children are not read one by one (round 12, P12-2).
  const symbolParents = new Set();
  // Each tree: true once walked, false where the walk failed.
  const walkedTrees = new Map();
  function mayHaveSymbolText(el) {
    let tree;
    try {
      tree = dom.getRootNode(el);
    } catch {
      return true;
    }
    if (!walkedTrees.has(tree)) {
      let ok = true;
      try {
        const walker = dom.createTreeWalker(dom.ownerDocument(el) || tree, tree, 4);
        for (let t = walker.nextNode(); t; t = walker.nextNode()) {
          const v = String(dom.nodeValue(t) || '');
          if (SYMBOL.test(v.replace(SEPARATORS, ''))) symbolParents.add(dom.parentNode(t));
        }
      } catch {
        ok = false;
      }
      walkedTrees.set(tree, ok);
    }
    return !walkedTrees.get(tree) || symbolParents.has(el);
  }

  function symbolTextOf(el) {
    if (!mayHaveSymbolText(el)) return '';
    let own = '';
    for (let n = dom.firstChild(el); n; n = dom.nextSibling(n)) {
      if (dom.nodeType(n) === 3) own += String(dom.nodeValue(n) || '');
    }
    own = trim(own).replace(/\s+/g, ' ');
    if (!own || !SYMBOL.test(own.replace(SEPARATORS, ''))) return '';
    const text = trim(visibleTextOf(el)).replace(/\s+/g, ' ');
    if (!text || [...text].length > 40) return '';
    if (LETTER_OR_DIGIT.test(text) || EMOJI.test(text)) return '';
    if (!SYMBOL.test(text.replace(SEPARATORS, ''))) return '';
    return own;
  }

  const round2 = (n) => Math.round(n * 100) / 100;
  const nodes = helpers.queryAllSmart ? helpers.queryAllSmart('body *') : helpers.queryAll('*');
  const occurrences = [];
  let applicableCount = 0;

  for (const el of nodes) {
    if (!el || dom.nodeType(el) !== 1) continue;
    const text = symbolTextOf(el);
    if (!text) continue;
    try {
      if (dom.matches(el, SKIP) || dom.closest(el, SKIP)) continue;
    } catch {
      continue;
    }
    if (!shown(el)) continue;
    // A currency sign or 〒 beside letters or digits on its line ("€45,00")
    // is part of that text: contrast-minimum judges it, at the text ratio.
    try {
      if (typeof c.isSignInTextRun === 'function' && c.isSignInTextRun(el)) continue;
    } catch {}
    // Part of an inactive user interface component (disabled, in a
    // disabled fieldset, aria-disabled, or disabled through its
    // ElementInternals): 1.4.11 asks nothing of it, as contrast-minimum
    // leaves its text out.
    try {
      if (typeof c.isInactiveUiComponent === 'function' && c.isInactiveUiComponent(el)) continue;
    } catch {}

    let ratio;
    let fgHex;
    let bgHex;
    try {
      const blocker =
        typeof c.getComputabilityBlocker === 'function' ? c.getComputabilityBlocker(el) : null;
      if (blocker && blocker.ok === false) continue;
      const fg = c.computeEffectiveForeground(el);
      const bg = c.computeEffectiveBackground(el, {
        contrast: { mode: 'strictConformance' },
        collectStack: false
      });
      if (!fg || !fg.rgba || !bg || !bg.ok || !bg.rgba) continue;
      const under = { r: bg.rgba.r, g: bg.rgba.g, b: bg.rgba.b, a: 1 };
      const drawn = c.compositeRgba(fg.rgba, under);
      ratio = c.contrastRatio(drawn, under);
      fgHex = c.rgbToHex(drawn);
      bgHex = c.rgbToHex(under);
    } catch {
      continue;
    }
    if (typeof ratio !== 'number' || !Number.isFinite(ratio)) continue;
    applicableCount += 1;
    if (ratio >= 3) continue;

    const symbols = [...text].length > 20 ? `${[...text].slice(0, 19).join('')}…` : text;
    const shownRatio = round2(ratio);
    const occ = {
      summary: `These symbols, “${symbols}”, have a contrast of ${shownRatio}:1 against their background, under the 3:1 a graphic needed to understand the content must reach.`,
      hint: 'If the symbols show information, such as a rating or a status, give them a colour that reaches 3:1 against their background. If they only decorate, or a text beside them says the same, they need not.',
      i18n: {
        summaryKey: 'symbolGraphicContrast_summary_cantTell',
        hintKey: 'symbolGraphicContrast_hint_cantTell',
        params: { symbols, ratio: shownRatio, foreground: fgHex, background: bgHex }
      },
      lean: {
        toward: 'fail',
        why: 'Symbols such as rating stars or status marks usually carry information, and these are under 3:1 against their background.',
        signals: [
          { signal: 'symbol-only-text', value: true },
          { signal: 'contrast-ratio', value: shownRatio }
        ],
        caution: 'The symbols may only decorate, or a text beside them may say the same.',
        i18n: {
          whyKey: 'symbolGraphicContrast_lean_why',
          cautionKey: 'symbolGraphicContrast_lean_caution'
        }
      },
      data: {
        details: {
          reasonCode: 'SYMBOLS_BELOW_GRAPHIC_THRESHOLD',
          symbols,
          ratio: shownRatio,
          foreground: fgHex,
          background: bgHex,
          threshold: 3
        }
      }
    };
    occurrences.push(
      typeof helpers.reportOccurrence === 'function' ? helpers.reportOccurrence(el, occ) : occ
    );
  }

  if (applicableCount === 0) return notApplicable;
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
