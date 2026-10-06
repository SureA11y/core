/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check link-in-text-block
 * @atomic true
 * @summary Links surrounded by text must be distinguishable from that text by non-color means
 * @standard WCAG 2.2
 * @sc 1.4.1
 * @applicability
 *   Applies to links (`<a href>` and elements whose role attribute resolves
 *   to link: its first known role token, in any case, is `link`) whose
 *   immediate parent element also has at least one direct-child text node
 *   with non-whitespace content (i.e. the link sits inline within a run of
 *   plain text, not as a standalone item, e.g. not the sole content of a
 *   <li> nav item).
 * @expectation
 *   A link inside a text block must be visually distinguishable from the
 *   surrounding text by at least one non-color means:
 *     - text-decoration: underline, OR
 *     - a different font-weight or font-style than the surrounding text, OR
 *     - another visible mark on the link itself: a border, box-shadow or
 *       outline, a background color different from the surrounding one, a
 *       background image, an image or svg inside it, or ::before/::after
 *       content.
 *   A link with none of these is distinguished by color alone. When its
 *   color contrasts with the surrounding text by at least 3:1, technique
 *   G183 is met only if hover and focus also bring a non-color cue, which
 *   a static scan cannot see, so the link is reported as cantTell. Below
 *   3:1, with contrast confidently computable, color is demonstrably the
 *   only cue and the link fails.
 *   Margin (`contrast-ratio`): of the links told apart by color alone that
 *   reach 3:1, the one closest to it, with its ratio unrounded. Those links
 *   are also asked about (the hover and focus cue), so the margin appears on
 *   a cantTell or fail result. `measuredCount` counts the links whose only
 *   cue is color.
 * @reports
 *   - `metrics.ratio` (a link set apart by color only): the contrast
 *     between the link's text color and the surrounding text's, as a ratio
 *     (3 for 3:1), against `metrics.threshold` (3).
 *   - `colors.linkForegroundHex`, `colors.surroundingTextForegroundHex` (a
 *     link set apart by color only): the link's text color and the
 *     surrounding text's, as hex.
 * @implementation-notes
 * - "Surrounding text style" is approximated as the link's immediate
 *   parent element's own computed style, not a full inline-context walk
 *   of the actual adjacent text node(s), a deliberate scope-down, since
 *   plain text nodes inherit their rendering from the parent in the
 *   overwhelming majority of real markup.
 * - A candidate that cannot be evaluated reports cantTell, not pass:
 *   contrast not confidently computable (the blockers `contrast-minimum`/
 *   `contrast-computable` use), or `text-decoration` unreadable in both
 *   the computed style and the CSSOM (see `decorationInfo`). `fail` stays
 *   reserved for deterministic violations; this is the computability gate
 *   RULE_TAXONOMY.md §1.1 allows automatic rules, as in `contrast-minimum`
 *   and `target-size-minimum`.
 * - Reuses the shared `helpers.contrast` subsystem (same
 *   computeEffectiveForeground/Background, getComputabilityBlocker,
 *   contrastRatio helpers as `contrast-minimum`), rather than re-deriving
 *   color math independently.
 * - ::before/::after content is read from the CSSOM only (a DOM emulator
 *   does not compute pseudo-element styles), so content declared in a
 *   cross-origin stylesheet is not seen.
 * - Only the resting state is evaluated. The :hover, :focus and :visited
 *   states are not.
 */

const id = 'link-in-text-block';

const meta = {
  title:
    'Links in text blocks must be distinguishable from surrounding text without relying on color alone',
  description:
    'Checks that a link inside a run of text is visually distinguishable from the surrounding text by a non-color cue (underline, font-weight or style, border, background, icon), and asks about links distinguished only by a >=3:1 color difference, which also need a hover and focus cue.',
  i18n: {
    titleKey: 'linkInTextBlock_title',
    descriptionKey: 'linkInTextBlock_description'
  },
  helpUrl: null,
  tags: [
    'wcag2a',
    'wcag141',
    'navigation',
    'color',
    'links',
    'contrast',
    'atomic',
    'automatic',
    'dom'
  ],
  wcagSc: ['1.4.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.4.1',
      title: 'Use of Color',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.4.1': ['link-in-text-block'] } },
  // Reason codes built at runtime, which scripts/generate-finding-ids.js
  // can't read from the source.
  reasonCodes: [
    'BACKGROUND_OVERLAP',
    'COLOR_NOT_COMPUTABLE',
    'CONTRAST_HELPERS_UNAVAILABLE',
    'ENGINE_EXCEPTION',
    'TEXT_DECORATION_NOT_RESOLVABLE'
  ],
  margin: { measure: 'contrast-ratio', unit: 'ratio', limit: 'min' }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule, engineOptions } = ctx;

  // The element's resolved explicit role: the first known role token of
  // its role attribute, lower-cased, or '' when none names a role.
  function explicitRole(el) {
    try {
      return helpers && helpers.aria && typeof helpers.aria.getExplicitRole === 'function'
        ? helpers.aria.getExplicitRole(el)
        : '';
    } catch {
      return '';
    }
  }

  function safeComputedStyle(el) {
    try {
      if (!el || dom.nodeType(el) !== 1) return null;
      if (helpers && typeof helpers.computedStyle === 'function') {
        const cs = helpers.computedStyle(el);
        if (cs) return cs;
      }
      const view =
        dom.ownerDocument(el) && dom.defaultView(dom.ownerDocument(el))
          ? dom.defaultView(dom.ownerDocument(el))
          : null;
      if (view && typeof view.getComputedStyle === 'function') return view.getComputedStyle(el);
    } catch {}
    return null;
  }

  // Whether the element is underlined, and whether the computed style can be
  // trusted to say so. A conforming CSSOM serialises the `text-decoration`
  // shorthand with the line value first, so it and `text-decoration-line`
  // always agree on whether `underline` is present. jsdom does not cascade
  // the property at all: the shorthand reads back as the UA's "underline"
  // for every <a> whatever the author CSS says, and the longhand as "none"
  // unless the author used the longhand. Either one taken alone is wrong in
  // one direction, so disagreement is the signal to stop trusting both.
  function decorationInfo(cs) {
    if (!cs) return { underlined: false, trustworthy: false };

    const lineRaw = String(cs.textDecorationLine || '')
      .trim()
      .toLowerCase();
    const shortRaw = String(cs.textDecoration || '')
      .trim()
      .toLowerCase();

    const lineTokens = lineRaw.split(/\s+/).filter(Boolean);
    const shortTokens = shortRaw.split(/\s+/).filter(Boolean);

    // Only one of the two exposed: nothing to cross-check against, take it.
    if (!lineTokens.length) {
      return { underlined: shortTokens.includes('underline'), trustworthy: shortTokens.length > 0 };
    }
    if (!shortTokens.length) {
      return { underlined: lineTokens.includes('underline'), trustworthy: true };
    }

    const byLine = lineTokens.includes('underline');
    const byShort = shortTokens.includes('underline');
    return { underlined: byLine, trustworthy: byLine === byShort };
  }

  // Resolves `text-decoration` from the author stylesheets when the computed
  // style is untrustworthy, reading the CSSOM as `css-orientation-lock` and
  // `css-focus-indicator-suppressed` do. Without it the rule could not decide
  // anything under a DOM emulator, which is how the CLI scans static HTML.
  //
  // A narrow cascade is enough: `text-decoration-line` is not inherited, so
  // only declarations matching the element itself and its inline style apply,
  // ordered by specificity. With no author declaration the UA default stands,
  // and for a link that is an underline. Anything that would make the answer a
  // guess yields `resolved: false` and the caller reports cantTell.
  const CSS_STYLE_RULE = 1;
  const MAX_NESTED_DEPTH = 8;

  function splitSelectorList(selectorText) {
    const parts = [];
    let depth = 0;
    let current = '';
    for (const ch of String(selectorText || '')) {
      if (ch === '(') depth += 1;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (ch === ',' && depth === 0) {
        parts.push(current);
        current = '';
        continue;
      }
      current += ch;
    }
    parts.push(current);
    return parts.map((p) => p.trim()).filter(Boolean);
  }

  // Approximate CSS specificity as a single sortable integer. Exactness is
  // not required: this only orders declarations of one property against each
  // other, and near-ties are broken by document order as the cascade does.
  function specificityOf(selector) {
    const s = String(selector || '');
    const ids = (s.match(/#[\w-]+/g) || []).length;
    const classesEtc = (s.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) || []).length;
    const types = (s.match(/(^|[\s>+~])[a-z][\w-]*/gi) || []).length;
    return ids * 10000 + classesEtc * 100 + types;
  }

  // A declaration wins if it is the last one, in (specificity, order), whose
  // selector matches. `!important` outranks everything non-important.
  function underlineFromDeclaration(style) {
    if (!style || typeof style.getPropertyValue !== 'function') return null;
    for (const prop of ['text-decoration-line', 'text-decoration']) {
      const raw = String(style.getPropertyValue(prop) || '')
        .trim()
        .toLowerCase();
      if (!raw) continue;
      const important = String(style.getPropertyPriority(prop) || '') === 'important';
      return { underlined: /\bunderline\b/.test(raw), important };
    }
    return null;
  }

  // The user agent underlines `a[href]`; an element with role="link" has no
  // default decoration.
  function uaUnderlines(el) {
    return (
      String(dom.localName(el) || '').toLowerCase() === 'a' &&
      typeof dom.get(el, 'hasAttribute') === 'function' &&
      dom.hasAttribute(el, 'href')
    );
  }

  function resolveUnderlineFromCssom(el) {
    const doc = el && dom.ownerDocument(el) ? dom.ownerDocument(el) : null;
    if (!doc || typeof dom.get(el, 'matches') !== 'function')
      return { underlined: false, resolved: false };

    let best = null; // { rank, order, underlined }
    let order = 0;
    let unreadableSheet = false;
    let unparsableSelector = false;

    function consider(cssRule) {
      const decl = underlineFromDeclaration(cssRule.style);
      if (!decl) return;
      for (const part of splitSelectorList(cssRule.selectorText)) {
        // A pseudo-element rule paints a box other than the link's own text.
        if (/::[a-z-]+/i.test(part)) continue;
        // A state the static DOM is not in (:hover/:focus/...) does not
        // describe the link's resting appearance, which is what this rule is
        // about.
        if (/:(hover|focus|focus-visible|focus-within|active|target|visited)\b/i.test(part)) {
          continue;
        }
        let matched;
        try {
          matched = dom.matches(el, part);
        } catch {
          unparsableSelector = true;
          continue;
        }
        if (!matched) continue;
        order += 1;
        const rank = (decl.important ? 1e9 : 0) + specificityOf(part);
        if (!best || rank >= best.rank) best = { rank, order, underlined: decl.underlined };
      }
    }

    function walk(rules, depth) {
      if (!rules || depth > MAX_NESTED_DEPTH) return;
      for (const cssRule of rules) {
        if (!cssRule) continue;
        if (cssRule.type === CSS_STYLE_RULE && cssRule.selectorText) {
          consider(cssRule);
          continue;
        }
        let nested;
        try {
          nested = cssRule.cssRules || null;
        } catch {
          nested = null;
        }
        if (nested) walk(nested, depth + 1);
      }
    }

    try {
      for (const sheet of dom.styleSheets(doc) || []) {
        let rules = null;
        try {
          rules = sheet && sheet.cssRules ? sheet.cssRules : null;
        } catch {
          unreadableSheet = true; // cross-origin, not inspectable
          continue;
        }
        if (rules) walk(rules, 0);
      }
    } catch {
      return { underlined: false, resolved: false };
    }

    // The inline style attribute outranks every stylesheet declaration.
    const inline = underlineFromDeclaration(dom.get(el, 'style'));
    if (inline) return { underlined: inline.underlined, resolved: true };

    if (best) return { underlined: best.underlined, resolved: true };

    // No author declaration reached this element. If a sheet or selector was
    // unreadable, one of them might have, so the answer is unknown; otherwise
    // the UA default stands, and for a link that means underlined.
    if (unreadableSheet || unparsableSelector) return { underlined: false, resolved: false };
    return { underlined: uaUnderlines(el), resolved: true };
  }

  // ---- Non-color cues on the link itself ----
  const LINE_STYLES = /^(solid|dashed|dotted|double|groove|ridge|inset|outset|auto)$/;

  function isZeroWidth(v) {
    return /^0(\.0+)?[a-z%]*$/i.test(String(v || '').trim());
  }

  // A color that draws nothing: a line in it is no cue.
  function isTransparentColor(v) {
    const raw = String(v || '').trim();
    if (!raw) return false;
    const parsed =
      c && typeof c.parseCssColorToRgba === 'function' ? c.parseCssColorToRgba(raw) : null;
    if (parsed) return parsed.a === 0;
    return /^transparent$/i.test(raw);
  }

  function hasBorder(cs) {
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
      const style = String(cs['border' + side + 'Style'] || '')
        .trim()
        .toLowerCase();
      if (!style || style === 'none' || style === 'hidden') continue;
      if (isTransparentColor(cs['border' + side + 'Color'])) continue;
      if (!isZeroWidth(cs['border' + side + 'Width'])) return true;
    }
    return false;
  }

  // Some environments do not expand the `outline` shorthand into its
  // longhands, so it is read too.
  function hasOutline(cs) {
    const style = String(cs.outlineStyle || '')
      .trim()
      .toLowerCase();
    if (style && style !== 'none' && style !== 'hidden') return !isZeroWidth(cs.outlineWidth);
    const tokens = String((cs.getPropertyValue && cs.getPropertyValue('outline')) || '')
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    return tokens.some((t) => LINE_STYLES.test(t)) && !tokens.some((t) => isZeroWidth(t));
  }

  function hasBoxShadow(cs) {
    const v = String(cs.boxShadow || '')
      .trim()
      .toLowerCase();
    return !!v && v !== 'none';
  }

  function hasBackgroundImage(cs) {
    const v = String(cs.backgroundImage || '')
      .trim()
      .toLowerCase();
    return !!v && v !== 'none';
  }

  function hasVisibleImageChild(el) {
    let imgs;
    try {
      imgs = Array.from(
        dom.querySelectorAll(el, 'img, svg, picture, canvas, [role~="img" i]')
      ).filter((img) => {
        const name = String(dom.localName(img) || '').toLowerCase();
        if (['img', 'svg', 'picture', 'canvas'].includes(name)) return true;
        return explicitRole(img) === 'img';
      });
    } catch {
      return false;
    }
    return imgs.some((img) => {
      if (!helpers.isDomVisibleEligible) return true;
      try {
        const vis = helpers.isDomVisibleEligible(img, ctx, {
          visibilityMode: 'styleOnly',
          disableGeometry: true
        });
        return !(vis && vis.eligible === false);
      } catch {
        return true;
      }
    });
  }

  const EMPTY_CONTENT = ['', 'none', 'normal', '""', "''"];
  let pseudoContentRules = null;
  // Style rules that put content in a ::before/::after box, by the selector
  // of the element that box belongs to.
  function getPseudoContentRules(doc) {
    if (pseudoContentRules) return pseudoContentRules;
    pseudoContentRules = [];
    function consider(cssRule) {
      const style = cssRule.style;
      if (!style || typeof style.getPropertyValue !== 'function') return;
      const content = String(style.getPropertyValue('content') || '').trim();
      if (EMPTY_CONTENT.indexOf(content.toLowerCase()) !== -1) return;
      for (const part of splitSelectorList(cssRule.selectorText)) {
        if (!/::?(before|after)\s*$/i.test(part)) continue;
        if (/:(hover|focus|focus-visible|focus-within|active|target|visited)\b/i.test(part)) {
          continue;
        }
        pseudoContentRules.push(part.replace(/::?(before|after)\s*$/i, '').trim() || '*');
      }
    }
    function walk(rules, depth) {
      if (!rules || depth > MAX_NESTED_DEPTH) return;
      for (const cssRule of rules) {
        if (!cssRule) continue;
        if (cssRule.type === CSS_STYLE_RULE && cssRule.selectorText) {
          consider(cssRule);
          continue;
        }
        let nested;
        try {
          nested = cssRule.cssRules || null;
        } catch {
          nested = null;
        }
        if (nested) walk(nested, depth + 1);
      }
    }
    try {
      for (const sheet of (doc && dom.styleSheets(doc)) || []) {
        let rules = null;
        try {
          rules = sheet && sheet.cssRules ? sheet.cssRules : null;
        } catch {
          continue; // cross-origin, not inspectable
        }
        if (rules) walk(rules, 0);
      }
    } catch {
      // no readable stylesheets
    }
    return pseudoContentRules;
  }

  function hasPseudoContent(el) {
    return getPseudoContentRules(dom.ownerDocument(el)).some((base) => {
      try {
        return dom.matches(el, base);
      } catch {
        return false;
      }
    });
  }

  function hasNonColorMark(el, cs) {
    if (cs && (hasBorder(cs) || hasOutline(cs) || hasBoxShadow(cs) || hasBackgroundImage(cs))) {
      return true;
    }
    return hasVisibleImageChild(el) || hasPseudoContent(el);
  }

  // Whether the link's parent holds text of its own beside it. The link is
  // an element, so that is a property of the parent alone, and it is read
  // once per parent: scanning every sibling for every link made a parent
  // with thousands of links take seconds, quadratic in the links.
  const parentHasText = new Map();
  function hasSurroundingText(el, parent) {
    if (!parent) return false;
    if (parentHasText.has(parent)) return parentHasText.get(parent);
    let found = false;
    for (let n = dom.firstChild(parent); n; n = dom.nextSibling(n)) {
      if (dom.nodeType(n) === 3 && dom.nodeValue(n) && dom.nodeValue(n).trim().length > 0) {
        found = true;
        break;
      }
    }
    parentHasText.set(parent, found);
    return found;
  }

  const contrastOpts =
    engineOptions && typeof engineOptions.contrast === 'object' && engineOptions.contrast
      ? engineOptions.contrast
      : {};
  const mode = contrastOpts.mode === 'auditorAssist' ? 'auditorAssist' : 'strictConformance';
  const rootCanvasFallback =
    typeof contrastOpts.rootCanvasFallback === 'string' && contrastOpts.rootCanvasFallback.trim()
      ? contrastOpts.rootCanvasFallback.trim()
      : '#ffffff';

  const c = helpers && helpers.contrast ? helpers.contrast : null;

  // `[role~="link" i]` also matches a fallback list whose first known role
  // is something else (role="button link" is a button), so a role-only
  // candidate is kept only when its resolved explicit role is link.
  const selector = 'a[href], [role~="link" i]';
  const nodes = (
    helpers.queryAllSmart ? helpers.queryAllSmart(selector) : helpers.queryAll(selector)
  ).filter((el) => {
    if (uaUnderlines(el)) return true;
    return explicitRole(el) === 'link';
  });

  const occurrences = [];
  const undecided = [];
  const contrastOnly = [];
  let applicableCount = 0;
  let decidedCount = 0;
  // Links whose only cue is color, compared with the surrounding text.
  let colorCompared = 0;

  // Applicable, but not evaluable. Held separately so the outcome below can
  // tell "checked and sound" apart from "never decided".
  function markUndecided(el, reasonCode) {
    undecided.push({ el, reasonCode });
  }

  // An inline element that holds nothing but the link (<span><a>...</a></span>,
  // as frameworks often wrap one) is part of the link as far as the text
  // around it goes: the surrounding text is its parent's.
  function wrapperHasCue(wrapper, cs) {
    const outerCs = safeComputedStyle(dom.parentElement(wrapper));
    if (
      c &&
      outerCs &&
      c.normalizeFontWeight(cs.fontWeight) !== c.normalizeFontWeight(outerCs.fontWeight)
    ) {
      return true;
    }
    if (outerCs && (cs.fontStyle || 'normal') !== (outerCs.fontStyle || 'normal')) return true;
    if (hasBorder(cs)) return true;
    const deco = decorationInfo(cs);
    return deco.trustworthy && deco.underlined && !isTransparentColor(cs.textDecorationColor);
  }

  function textParentOf(el) {
    let child = el;
    let parent = dom.parentElement(el);
    for (let depth = 0; parent && depth < 5; depth++) {
      if (hasSurroundingText(child, parent)) break;
      if (dom.firstElementChild(parent) !== child || dom.lastElementChild(parent) !== child) break;
      const wcs = safeComputedStyle(parent) || {};
      const display = String(wcs.display || '');
      if (!display.startsWith('inline') || display === 'inline-block') break;
      // A wrapper that sets the link apart itself is not transparent: a
      // footnote marker raised by <sup>, or a bold or underlined wrapper.
      const valign = String(wcs.verticalAlign || 'baseline');
      if (valign !== 'baseline' || wrapperHasCue(parent, wcs)) break;
      child = parent;
      parent = dom.parentElement(parent);
    }
    return parent;
  }

  // Whether the cue that sets a link apart can sit on an element inside it:
  // every piece of the link's text is inside an element, between the text
  // and the link, that is bold, italic, underlined or bordered where the
  // surrounding text is not (<a><strong>guide</strong></a>).
  function cueOnContent(el, parentCs) {
    const parentWeight = c && parentCs ? c.normalizeFontWeight(parentCs.fontWeight) : 400;
    const parentStyle = (parentCs && parentCs.fontStyle) || 'normal';
    const hasCue = (node) => {
      const cs = safeComputedStyle(node);
      if (!cs) return false;
      if (c && c.normalizeFontWeight(cs.fontWeight) !== parentWeight) return true;
      if ((cs.fontStyle || 'normal') !== parentStyle) return true;
      if (hasBorder(cs)) return true;
      const deco = decorationInfo(cs);
      return deco.trustworthy && deco.underlined && !isTransparentColor(cs.textDecorationColor);
    };
    let sawText = false;
    const doc = dom.ownerDocument(el);
    const walker =
      doc && dom.get(doc, 'createTreeWalker') ? dom.createTreeWalker(doc, el, 4) : null;
    if (!walker) return false;
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!dom.nodeValue(n) || !dom.nodeValue(n).trim()) continue;
      sawText = true;
      let cued = false;
      // Bounded as a safety net only: a walk up a real tree always ends.
      for (
        let a = dom.parentElement(n), i = 0;
        a && a !== el && i < 100000;
        a = dom.parentElement(a), i++
      ) {
        if (hasCue(a)) {
          cued = true;
          break;
        }
      }
      if (!cued) return false;
    }
    return sawText;
  }

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible =
      typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    const parent = textParentOf(el);
    if (!hasSurroundingText(el, parent)) continue;

    applicableCount += 1;

    const linkCs = safeComputedStyle(el);
    const parentCs = safeComputedStyle(parent);

    // Cues that do not depend on `text-decoration` come first, so a link
    // carrying one is decided even where decoration is unreadable.
    const linkWeight = c && linkCs ? c.normalizeFontWeight(linkCs.fontWeight) : 400;
    const parentWeight = c && parentCs ? c.normalizeFontWeight(parentCs.fontWeight) : 400;
    if (linkWeight !== parentWeight) {
      decidedCount += 1;
      continue;
    }

    const linkStyle = (linkCs && linkCs.fontStyle) || 'normal';
    const parentStyle = (parentCs && parentCs.fontStyle) || 'normal';
    if (linkStyle !== parentStyle) {
      decidedCount += 1;
      continue;
    }

    // A border, box-shadow, outline, background image, icon or generated
    // content marks the link without relying on color.
    if (hasNonColorMark(el, linkCs) || cueOnContent(el, parentCs)) {
      decidedCount += 1;
      continue;
    }

    if (!c) {
      markUndecided(el, 'CONTRAST_HELPERS_UNAVAILABLE');
      continue;
    }

    // An underline is a non-color cue: once it is found, the colors do not
    // matter, so it is looked for before them. Otherwise an underlined link
    // on a page whose background cannot be computed (no background set,
    // which strict mode does not assume is white) was left undecided, while
    // a bold one passed. null: this environment cannot tell.
    let underlined = null;
    const decoration = decorationInfo(linkCs);
    if (decoration.trustworthy) {
      // An underline drawn in a transparent color shows nothing.
      underlined =
        decoration.underlined && !isTransparentColor(linkCs && linkCs.textDecorationColor);
    } else {
      const fromCssom = resolveUnderlineFromCssom(el);
      if (fromCssom.resolved) underlined = fromCssom.underlined;
    }
    if (underlined === true) {
      decidedCount += 1;
      continue;
    }

    let flagged = false;
    let computed = false;
    let backgroundDiffers = false;
    let ratio = null;
    let fgLinkHex = '';
    let fgParentHex = '';
    let undecidedReason = 'COLOR_NOT_COMPUTABLE';

    try {
      const blocker = c.getComputabilityBlocker(el);
      // Paint under the text that is not an ancestor's leaves the link's
      // color and the surrounding text's as they are: only a translucent
      // one depends on what is behind it, checked below.
      const overlapOnly =
        !!blocker && blocker.ok === false && blocker.reasonCode === 'BACKGROUND_OVERLAP';
      if (blocker && blocker.ok === false && !overlapOnly) {
        // Not confidently computable: recorded below rather than skipped, so
        // it cannot be mistaken for a clean result.
        if (blocker.reasonCode) undecidedReason = String(blocker.reasonCode);
      } else {
        const bg = c.computeEffectiveBackground(el, {
          contrast: { mode, rootCanvasFallback },
          collectStack: false
        });
        const fgLink = c.computeEffectiveForeground(el);
        const fgParent = c.computeEffectiveForeground(parent);

        if (
          overlapOnly &&
          fgLink &&
          fgLink.rgba &&
          fgParent &&
          fgParent.rgba &&
          (fgLink.rgba.a < 1 || fgParent.rgba.a < 1)
        ) {
          undecidedReason = 'BACKGROUND_OVERLAP';
        } else if (bg && bg.ok && bg.rgba && fgLink && fgLink.rgba && fgParent && fgParent.rgba) {
          const fgLinkOpaque =
            fgLink.rgba.a < 1
              ? c.compositeRgba(fgLink.rgba, bg.rgba)
              : { r: fgLink.rgba.r, g: fgLink.rgba.g, b: fgLink.rgba.b, a: 1 };
          const fgParentOpaque =
            fgParent.rgba.a < 1
              ? c.compositeRgba(fgParent.rgba, bg.rgba)
              : { r: fgParent.rgba.r, g: fgParent.rgba.g, b: fgParent.rgba.b, a: 1 };

          ratio = c.contrastRatio(fgLinkOpaque, fgParentOpaque);
          fgLinkHex = c.rgbToHex ? c.rgbToHex(fgLinkOpaque) : '';
          fgParentHex = c.rgbToHex ? c.rgbToHex(fgParentOpaque) : '';

          computed = true;
          if (!(ratio >= 3)) flagged = true;

          // A background color of the link's own, different from the one
          // behind the surrounding text, marks it like a highlight.
          const ownBg = String((linkCs && linkCs.backgroundColor) || '').replace(/\s+/g, '');
          const transparentBg =
            !ownBg || ownBg === 'transparent' || /^rgba\(\d+,\d+,\d+,0(\.0+)?\)$/.test(ownBg);
          if (!transparentBg && c.rgbToHex) {
            const parentBg = c.computeEffectiveBackground(parent, {
              contrast: { mode, rootCanvasFallback },
              collectStack: false
            });
            if (parentBg && parentBg.ok && parentBg.rgba) {
              backgroundDiffers = c.rgbToHex(parentBg.rgba) !== c.rgbToHex(bg.rgba);
            }
          }
        }
        // else: not confidently computable, recorded below.
      }
    } catch {
      // No-throw: treat as not computable and record it.
      undecidedReason = 'ENGINE_EXCEPTION';
    }

    if (!computed) {
      markUndecided(el, undecidedReason);
      continue;
    }

    if (backgroundDiffers) {
      decidedCount += 1;
      continue;
    }

    // No underline was found. If this environment could not tell, the
    // colors cannot settle it either.
    if (underlined === null) {
      markUndecided(el, 'TEXT_DECORATION_NOT_RESOLVABLE');
      continue;
    }

    // Color is the only cue at rest. At 3:1 or more, G183 also needs a
    // non-color cue on hover and focus, which a static scan cannot see.
    colorCompared += 1;
    if (!flagged) {
      contrastOnly.push({ el, ratio, fgLinkHex, fgParentHex });
      continue;
    }

    decidedCount += 1;

    const eligInfo = helpers.getEligibilityInfo
      ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
      : null;
    const tag = (dom.tagName(el) || '').toLowerCase();
    const ratioStr = c.round2 ? c.round2(ratio) : String(ratio);

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary:
          'This link in a block of text relies on color alone to be distinguished from the surrounding text.',
        hint: 'Add an underline or another non-color cue (a font-weight or style difference, a border, an icon). Raising the color contrast with the surrounding text to 3:1 is enough only if hovering and focusing the link also add a non-color cue.',
        i18n: {
          summaryKey: 'linkInTextBlock_summary_fail',
          hintKey: 'linkInTextBlock_hint_fail',
          params: { element: tag, ratio: String(ratioStr), threshold: '3' }
        },
        data: {
          visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
          details: {
            reasonCode: 'COLOR_ONLY_DIFFERENTIATION',
            metrics: { ratio, threshold: 3 },
            colors: { linkForegroundHex: fgLinkHex, surroundingTextForegroundHex: fgParentHex }
          }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const cantTellOccurrences = undecided.map(({ el, reasonCode }) =>
    helpers.reportOccurrence(el, {
      occurrenceOutcome: 'cantTell',
      summary:
        'Whether this link is distinguishable from the surrounding text by non-color means could not be determined.',
      hint: 'Confirm by eye that the link carries an underline, a font-weight or font-style difference or another non-color mark, or at least 3:1 contrast against the surrounding text together with a non-color cue on hover and focus. Running the engine in a real browser rather than a DOM emulator resolves most cases automatically.',
      i18n: {
        summaryKey: 'linkInTextBlock_summary_cantTell',
        hintKey: 'linkInTextBlock_hint_cantTell'
      },
      uncertainty: {
        code: 'not-computable',
        needed:
          'Whether the link carries an underline, weight or style difference, or 3:1 contrast against its surrounding text.',
        evidence: { reasonCode }
      },
      data: {
        visibilityFilter: helpers.getEligibilityInfo
          ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
          : { targetSet: 'acc', accEligible: null, reasons: [] },
        details: { reasonCode }
      }
    })
  );

  const contrastOnlyOccurrences = contrastOnly.map(({ el, ratio, fgLinkHex, fgParentHex }) => {
    const ratioStr = c && c.round2 ? c.round2(ratio) : String(ratio);
    return helpers.reportOccurrence(el, {
      occurrenceOutcome: 'cantTell',
      summary: `This link in a block of text is distinguished from the surrounding text only by its color (contrast ${ratioStr}:1). That is enough only if hovering and focusing it also show a non-color cue, such as an underline.`,
      hint: 'Hover over the link and move keyboard focus to it: confirm that each state adds a non-color cue (an underline, a border, a weight change). Otherwise underline the link at rest.',
      i18n: {
        summaryKey: 'linkInTextBlock_summary_cantTell_contrastOnly',
        hintKey: 'linkInTextBlock_hint_cantTell_contrastOnly',
        params: { ratio: String(ratioStr), threshold: '3' }
      },
      uncertainty: {
        code: 'runtime-dependent',
        needed: 'Whether hovering and focusing the link add a non-color cue.',
        evidence: { reasonCode: 'LINK_COLOR_CONTRAST_ONLY', ratio }
      },
      data: {
        visibilityFilter: helpers.getEligibilityInfo
          ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
          : { targetSet: 'acc', accEligible: null, reasons: [] },
        details: {
          reasonCode: 'LINK_COLOR_CONTRAST_ONLY',
          metrics: { ratio, threshold: 3 },
          colors: { linkForegroundHex: fgLinkHex, surroundingTextForegroundHex: fgParentHex }
        }
      }
    });
  });

  // Links told apart by color alone that reach 3:1 against the surrounding
  // text: the closest is the result's margin (src/core/margin.js).
  const margin = {
    marginCandidates: contrastOnly.map(({ el, ratio }) => ({ el, value: ratio, threshold: 3 })),
    measuredCount: colorCompared
  };

  // See helpers.resolveTieredOutcome (src/core/dom-helpers.js): a proven
  // violation outranks an undecided candidate for the rule's own outcome, but
  // never discards it, so an unevaluable link survives a failure elsewhere in
  // the same run.
  if (occurrences.length || cantTellOccurrences.length || contrastOnlyOccurrences.length) {
    const resolved = helpers.resolveTieredOutcome(
      occurrences,
      contrastOnlyOccurrences.concat(cantTellOccurrences),
      rule.defaultSeverity || 'serious'
    );
    return {
      ruleId: rule.ruleId,
      ...resolved,
      ...(resolved.outcome === 'cantTell' ? { confidence: 'low' } : null),
      ...margin
    };
  }

  if (decidedCount > 0) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
