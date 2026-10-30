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
 *   to link: its first known role token, in any case, is `link`) that draw
 *   text (text other than white space in the link's flat tree and, where the
 *   page has a layout, a box with some area) and whose immediate parent
 *   element also has text with a letter or a digit beside
 *   it: a direct-child text node, or text in an inline element on the same
 *   line that is not a link, is not drawn invisibly, and is not an item of
 *   a flex or grid parent (i.e. the link sits inline within a run of
 *   plain text, not as a standalone item, e.g. not the sole content of a
 *   <li> nav item, nor one of a row of links separated by "|" or "·").
 *   A custom element whose ElementInternals give it the link role
 *   (this.attachInternals().role), with no role attribute naming another,
 *   counts as a native element with that role does.
 * @expectation
 *   A link inside a text block must be visually distinguishable from the
 *   surrounding text by at least one non-color means:
 *     - text-decoration: underline, OR
 *     - a different font-weight or font-style than the surrounding text, OR
 *     - another visible mark on the link itself: a border, box-shadow or
 *       outline, a background color different from the surrounding one, a
 *       background image, an image or svg inside it, or a ::before/::after
 *       that draws something (content of its own, or an empty box painting
 *       a background, border, outline or shadow, as an underline drawn
 *       that way does), OR
 *     - a mark on all of its content: bold, italic, underlined, bordered,
 *       a background unlike the surrounding text's (a code chip, <mark>),
 *       or raised or lowered (a footnote's <sup>).
 *   A link with none of these is distinguished by color alone. When its
 *   color contrasts with the surrounding text by at least 3:1, technique
 *   G183 is met only if hover and focus also bring a non-color cue, which
 *   a static scan cannot see, so the link is reported as cantTell. Below
 *   3:1, with contrast confidently computable, color is demonstrably the
 *   only cue and the link fails. The ratio between the link's color and the
 *   text's needs no background, so where only the background, or an effect
 *   applied alike to both, keeps it from being measured, two opaque text
 *   colors still decide it.
 *   Margin (`contrast-ratio`): of the links told apart by color alone that
 *   reach 3:1, the one closest to it, with its ratio unrounded. Those links
 *   are also asked about (the hover and focus cue), so the margin appears on
 *   a cantTell or fail result. Only a link within 10% of 3:1 (up to 3.3:1)
 *   counts as close. `measuredCount` counts the links whose only cue is
 *   color.
 * @reports
 *   - `metrics.ratio` (a link set apart by color only): the contrast
 *     between the link's text color and the surrounding text's, as a ratio
 *     (3 for 3:1), against `metrics.threshold` (3).
 *   - `metrics.ratioBeforeOpacity` (a link set apart by color only, under
 *     `ANCESTOR_OPACITY`): that ratio before an ancestor's opacity fades the
 *     link and the text alike, in place of `metrics.ratio`. The fading brings
 *     the two colors closer, so the ratio drawn may be lower: below 3:1 the
 *     link fails all the same, at 3:1 or more it is asked about with no lean
 *     toward pass, and it gives no margin.
 *   - `colors.linkForegroundHex`, `colors.surroundingTextForegroundHex` (a
 *     link set apart by color only): the link's text color and the
 *     surrounding text's, as hex.
 *   - `colorScheme` (a link with a background color of its own, on the
 *     canvas of a page that supports light and dark): `'light'` or
 *     `'dark'`, the scheme in which that background doesn't set it apart
 *     from the canvas around it, where it does in the other; the ratio and
 *     colors are that scheme's. Absent where it falls short in every scheme
 *     measured.
 *   - `colorSchemesChecked` (the same link): the schemes it was compared in,
 *     where the page supports both and one could not be measured (its
 *     colors or the backgrounds around it may change with the scheme).
 *     A binding can scan again with the browser in the other scheme.
 * @reason-codes
 *   - `COLOR_ONLY_DIFFERENTIATION` (fail): a link in a block of text is told
 *     apart from the surrounding text by color alone, with less than 3:1
 *     contrast between the two.
 *     Basis: WCAG 1.4.1; F73; G183.
 *   - `LINK_COLOR_CONTRAST_ONLY` (cantTell): a link in a block of text is
 *     told apart by color alone at 3:1 or more; whether hover and focus add
 *     a non-color cue is for a person to check.
 *     It leans pass when the style sheets give it a non-color cue on :hover and
 *     on :focus (not where an ancestor's opacity fades it, whose ratio as
 *     drawn may be below 3:1), and fail when every sheet could be read and none gives it one
 *     on :hover.
 *     Basis: WCAG 1.4.1 (not settled); G183 (not settled).
 *   - `TEXT_DECORATION_NOT_RESOLVABLE` (cantTell): whether the link is
 *     underlined could not be read, so whether color is its only cue is
 *     unknown.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `COLOR_NOT_COMPUTABLE` (cantTell): the colors of the link or of the
 *     surrounding text could not be worked out. Where the link is not
 *     underlined, has no background of its own, and it and the text are drawn
 *     in opaque colors, which compare without the background, it is decided
 *     from those colors instead (`COLOR_ONLY_DIFFERENTIATION` below 3:1,
 *     `LINK_COLOR_CONTRAST_ONLY` at 3:1 or more), unless what can't be worked
 *     out is their colors in the color scheme the page is drawn in, as in an
 *     emulator such as jsdom (`contrast-computable`'s
 *     `COLOR_SCHEME_NOT_RENDERED`).
 *     It leans fail when such a link is drawn in the same translucent color as
 *     the surrounding text; it leans pass when it has an opaque background of
 *     its own unlike the one around it; neither where its colors in the
 *     page's color scheme are unknown.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `BACKGROUND_IMAGE_OR_GRADIENT` (cantTell): a background image or
 *     gradient lies behind the link, so its colors could not be compared.
 *     Where the same image lies behind the surrounding text, and the link is
 *     not underlined, has no background of its own, and it and the text are
 *     drawn in opaque colors, it is decided from those colors instead, as for
 *     `COLOR_NOT_COMPUTABLE`.
 *     It leans fail when such a link is drawn in the same translucent color as
 *     the surrounding text; it leans pass when it has an opaque background of
 *     its own unlike the one around it.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `BACKGROUND_NOT_OPAQUE_AT_ROOT` (cantTell): the link has an opaque
 *     background color of its own and otherwise less than 3:1 from the
 *     surrounding text, but nothing behind that text, up to the root, has an
 *     opaque background, and the canvas there can't be known: in a frame,
 *     where the page around it may show through, or under forced colors. A
 *     `contrast.rootCanvasFallback` the run names, or the `auditorAssist`
 *     mode, decides it on that canvas. Elsewhere the link is decided on the
 *     canvas the page's color scheme gives it, as the contrast rules measure
 *     text there, in each scheme the page supports (`colorScheme`,
 *     `colorSchemesChecked`).
 *     Basis: WCAG 1.4.1 (not settled); F73 (not settled).
 *   - `BACKGROUND_OVERLAP` (cantTell): another element paints under a link
 *     or text drawn in a translucent color, so the colors could not be
 *     compared.
 *     It leans fail when the link is not underlined, has no background of its
 *     own, and is drawn in the surrounding text's color, under the same paint;
 *     it leans pass when it has an opaque background of its own unlike the one
 *     around it.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `BACKGROUND_FILTER_OR_BACKDROP_FILTER` (cantTell): a filter or
 *     backdrop-filter changes the colors drawn, so the declared colors of the
 *     link and the text are not what is on screen.
 *     It leans fail when the link is not underlined, has no background of its
 *     own, and is drawn in the surrounding text's color, the same filter
 *     applying to both; it leans pass when it has an opaque background of its
 *     own unlike the one around it.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `MIX_BLEND_MODE` (cantTell): a mix-blend-mode blends the link or the text
 *     with what is behind it, so the colors on screen could not be compared.
 *     It leans fail when the link is not underlined, has no background of its
 *     own, and is drawn in the surrounding text's color, the same blend
 *     applying to both; it leans pass when it has an opaque background of its
 *     own unlike the one around it.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `ANCESTOR_OPACITY` (cantTell): an ancestor with opacity below 1 fades the
 *     link and its background together, in a way that could not be resolved.
 *     Where the same ancestor fades the surrounding text, and the link is not
 *     underlined, has no background of its own, and it and the text are drawn
 *     in opaque colors, it is decided from those colors instead, as for
 *     `COLOR_NOT_COMPUTABLE` (the fading brings two colors closer, never
 *     further apart, so a link below 3:1 before the fading is below it as
 *     drawn, and fails); either way that ratio is reported as
 *     `metrics.ratioBeforeOpacity`, since the ratio drawn may be lower, and
 *     at 3:1 or more `LINK_COLOR_CONTRAST_ONLY` does not lean pass.
 *     It leans fail when such a link is drawn in the same translucent color as
 *     the surrounding text; it leans pass when it has an opaque background of
 *     its own unlike the one around it.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `ELEMENT_OPACITY` (cantTell): the link's own element has opacity below 1
 *     over a background of its own, which could not be resolved.
 *     It leans pass when that background is opaque and unlike the one around
 *     it.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `TEXT_SHADOW` (cantTell): a text-shadow changes how the link or the text
 *     looks, so their colors alone don't tell whether they stand apart. With
 *     the same shadow on both, where the link is not underlined, has no
 *     background of its own, and it and the text are drawn in opaque colors
 *     less than 3:1 apart, it fails (`COLOR_ONLY_DIFFERENTIATION`): the same
 *     shadow makes them no less alike.
 *     It leans fail when such a link is drawn in the same translucent color as
 *     the surrounding text; it leans pass when it has an opaque background of
 *     its own unlike the one around it.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `TEXT_STROKE` (cantTell): a -webkit-text-stroke draws the link or the
 *     text in a color of its own, so the colors could not be compared. With
 *     the same stroke on both, where the link is not underlined, has no
 *     background of its own, and it and the text are drawn in opaque colors
 *     less than 3:1 apart, it fails (`COLOR_ONLY_DIFFERENTIATION`).
 *     It leans fail when such a link is drawn in the same translucent color as
 *     the surrounding text; it leans pass when it has an opaque background of
 *     its own unlike the one around it.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `PSEUDO_ELEMENT_COLOR` (cantTell): a ::first-line or ::first-letter has a
 *     color of its own, and which text it paints depends on line breaks: the
 *     link's own, or the ::first-line of the block the surrounding text is in
 *     or of an ancestor whose first line that block opens (div::first-line
 *     for a <p> that is the div's first child; the inner one wins), named in
 *     `details.pseudoElement`, which paints that text on the first line.
 *     Where nothing else is in the way, the link's pseudo-element paints
 *     no background or weight of its own, the block's changes only the color
 *     of its first line, and the link is on the same side of 3:1 from the
 *     surrounding text in every pair of colors, it is decided as any link is
 *     (by the closest ratio when all reach 3:1, the best one when all fall
 *     short); it is asked about where they disagree. Only a browser computes
 *     pseudo-element styles.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `SELECT_OPTION_COLOR` (cantTell): the text is a drop-down option drawn
 *     only in the list the platform opens, with colors of its own.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `CONTRAST_HELPERS_UNAVAILABLE` (cantTell): the color helpers were not
 *     available in this run, so the link could not be checked.
 *     Basis: WCAG 1.4.1 (not settled).
 *   - `ENGINE_EXCEPTION` (cantTell): the rule stopped on an internal error
 *     for this link; it is to be checked by hand.
 *     Basis: WCAG 1.4.1 (not settled).
 * @implementation-notes
 * - "Surrounding text style" is approximated as the link's immediate
 *   parent element's own computed style, not a full inline-context walk
 *   of the actual adjacent text node(s), a deliberate scope-down, since
 *   plain text nodes inherit their rendering from the parent in the
 *   overwhelming majority of real markup.
 * - A candidate that cannot be evaluated reports cantTell, not pass:
 *   contrast not confidently computable (the blockers `contrast-minimum`/
 *   `contrast-computable` use) where the two text colors don't settle it
 *   (see `knownFromTextColors`), or `text-decoration` unreadable in both
 *   the computed style and the CSSOM (see `decorationInfo`). `fail` stays
 *   reserved for deterministic violations; this is the computability gate
 *   RULE_TAXONOMY.md §1.1 allows automatic rules, as in `contrast-minimum`
 *   and `target-size-minimum`.
 * - Reuses the shared `helpers.contrast` subsystem (same
 *   computeEffectiveForeground/Background, getComputabilityBlocker,
 *   contrastRatio helpers as `contrast-minimum`), rather than re-deriving
 *   color math independently.
 * - What ::before/::after draws is read from their computed style in a
 *   browser. A DOM emulator computes no pseudo-element styles, so there it
 *   is read from the CSSOM, where content declared in a cross-origin
 *   stylesheet is not seen.
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
  // can't read from the source; those of the contrast helpers' computability
  // blocker are passed on as they are.
  reasonCodes: [
    'ANCESTOR_OPACITY',
    'BACKGROUND_FILTER_OR_BACKDROP_FILTER',
    'BACKGROUND_NOT_OPAQUE_AT_ROOT',
    'BACKGROUND_OVERLAP',
    'COLOR_NOT_COMPUTABLE',
    'CONTRAST_HELPERS_UNAVAILABLE',
    'ELEMENT_OPACITY',
    'ENGINE_EXCEPTION',
    'MIX_BLEND_MODE',
    'PSEUDO_ELEMENT_COLOR',
    'SELECT_OPTION_COLOR',
    'TEXT_DECORATION_NOT_RESOLVABLE',
    'TEXT_SHADOW',
    'TEXT_STROKE'
  ],
  margin: { measure: 'contrast-ratio', unit: 'ratio', limit: 'min', band: { relative: 0.1 } }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule, engineOptions } = ctx;

  // The element's resolved role: the first known role token of its role
  // attribute, lower-cased, else the role a custom element's internals give
  // it, or '' for neither.
  function explicitRole(el) {
    try {
      return helpers && helpers.aria && typeof helpers.aria.getAuthorRole === 'function'
        ? helpers.aria.getAuthorRole(el)
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

  // A sheet or a group rule whose media or @supports condition doesn't hold
  // now (@media print on a screen scan) styles nothing the scan sees.
  function cssConditionApplies(x) {
    return typeof helpers.cssConditionApplies === 'function'
      ? helpers.cssConditionApplies(x)
      : true;
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
        if (!cssRule || !cssConditionApplies(cssRule)) continue;
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
        if (!cssConditionApplies(sheet)) continue;
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

  // Whether a background-image layer draws something seen behind el's text:
  // `none`, a layer sized to nothing, a transparent gradient and a solid one
  // in the color already behind it draw nothing.
  function hasBackgroundImage(cs, el) {
    const contrast = helpers.contrast;
    if (contrast && typeof contrast.backgroundLayerKinds === 'function') {
      const kinds = contrast.backgroundLayerKinds(cs);
      return (
        !!kinds &&
        kinds.some(
          (k) =>
            k.kind !== 'none' &&
            !(k.color && el && sameAsBackground(el, contrast.rgbaToString({ ...k.color, a: 1 })))
        )
      );
    }
    if (contrast && typeof contrast.paintsBackgroundLayer === 'function') {
      return contrast.paintsBackgroundLayer(cs);
    }
    const v = String(cs.backgroundImage || '')
      .trim()
      .toLowerCase();
    if (!v || v === 'none') return false;
    return v.split(',').some((layer) => layer.trim() !== 'none');
  }

  function hasVisibleImageChild(el) {
    let imgs;
    try {
      imgs = Array.from(
        dom.querySelectorAll(el, 'img, svg, picture, canvas, [role~="img" i], [role~="image" i]')
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

  const NO_BOX = ['', 'none', 'normal'];
  const EMPTY_STRING = ['""', "''"];
  // Whether a declaration block paints a box: a background, a border, an
  // outline or a shadow. An empty-content ::before/::after drawing an
  // underline this way is a mark (#107).
  function declaresPaint(style) {
    const get = (prop) =>
      String(style.getPropertyValue(prop) || '')
        .trim()
        .toLowerCase();
    const bg = get('background-color');
    if (bg && !isTransparentColor(bg)) return true;
    const image = get('background-image');
    const contrast = helpers.contrast;
    if (
      image &&
      (contrast
        ? contrast.hasBackgroundImageOrGradient({ backgroundImage: image })
        : image !== 'none')
    )
      return true;
    for (const side of ['top', 'right', 'bottom', 'left']) {
      const line = get('border-' + side + '-style');
      if (!line || line === 'none' || line === 'hidden') continue;
      if (!isZeroWidth(get('border-' + side + '-width') || 'medium')) return true;
    }
    const outline = get('outline-style');
    if (outline && outline !== 'none') return true;
    const shadow = get('box-shadow');
    return !!shadow && shadow !== 'none';
  }
  let pseudoContentRules = null;
  // Style rules that put content in a ::before/::after box, by the selector
  // of the element that box belongs to: content of its own, or an empty
  // string with something painted.
  function getPseudoContentRules(doc) {
    if (pseudoContentRules) return pseudoContentRules;
    pseudoContentRules = [];
    function consider(cssRule) {
      const style = cssRule.style;
      if (!style || typeof style.getPropertyValue !== 'function') return;
      const content = String(style.getPropertyValue('content') || '')
        .trim()
        .toLowerCase();
      if (NO_BOX.indexOf(content) !== -1) return;
      if (EMPTY_STRING.indexOf(content) !== -1 && !declaresPaint(style)) return;
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
        if (!cssRule || !cssConditionApplies(cssRule)) continue;
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
        if (!cssConditionApplies(sheet)) continue;
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

  // Whether the page has a layout, and so computes pseudo-element styles:
  // a browser lays out the root element; jsdom gives it no boxes.
  let layout = null;
  function hasLayout() {
    if (layout === null) {
      try {
        const root = dom.documentElement(ctx.document);
        layout = !!(root && dom.getClientRects(root).length);
      } catch {
        layout = false;
      }
    }
    return layout;
  }

  // Whether el's ::before or ::after draws something: content of its own,
  // or, with an empty string, a box that paints a background, a border, an
  // outline or a shadow with a size that shows it, in a color other than
  // the link's background.
  function pseudoPaints(el, which) {
    let cs;
    try {
      const view = dom.defaultView(dom.ownerDocument(el));
      cs = view.getComputedStyle(el, which);
    } catch {
      return false;
    }
    if (!cs) return false;
    const content = String(cs.content || '').trim();
    if (NO_BOX.indexOf(content.toLowerCase()) !== -1) return false;
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    if (Number.parseFloat(cs.opacity) === 0) return false;
    if (EMPTY_STRING.indexOf(content) === -1) return true;
    const size = (v) => {
      const n = Number.parseFloat(v);
      return Number.isFinite(n) && n > 0 ? n : 0;
    };
    const w = size(cs.width);
    const h = size(cs.height);
    const shows = (color) => !isTransparentColor(color) && !sameAsBackground(el, color);
    if (w && h && shows(cs.backgroundColor)) return true;
    if (w && h && hasBackgroundImage(cs, el)) return true;
    for (const [side, along] of [
      ['Top', w],
      ['Bottom', w],
      ['Left', h],
      ['Right', h]
    ]) {
      const style = String(cs['border' + side + 'Style'] || '').toLowerCase();
      if (!style || style === 'none' || style === 'hidden') continue;
      if (along && size(cs['border' + side + 'Width']) && shows(cs['border' + side + 'Color']))
        return true;
    }
    if (hasOutline(cs) && shows(cs.outlineColor)) return true;
    if (hasBoxShadow(cs)) {
      // A shadow of an empty box shows only with blur or spread.
      const lengths = String(cs.boxShadow).match(/-?[\d.]+px/g) || [];
      if ((w && h) || lengths.slice(2, 4).some((v) => size(v))) return true;
    }
    return false;
  }
  // Whether a color is the one behind the link, so a mark in it is unseen.
  const linkBackgrounds = new Map();
  function sameAsBackground(el, color) {
    if (!c || !c.parseCssColorToRgba || !c.rgbToHex) return false;
    const parsed = c.parseCssColorToRgba(String(color || ''));
    if (!parsed || parsed.a < 1) return false;
    if (!linkBackgrounds.has(el)) {
      let hex = null;
      try {
        const bg = c.computeEffectiveBackground(el, {
          contrast: { mode, rootCanvasFallback },
          collectStack: false
        });
        if (bg && bg.ok && bg.rgba) hex = c.rgbToHex(bg.rgba);
      } catch {}
      linkBackgrounds.set(el, hex);
    }
    const hex = linkBackgrounds.get(el);
    return !!hex && hex === c.rgbToHex(parsed);
  }

  function hasPseudoContent(el) {
    if (hasLayout()) return pseudoPaints(el, '::before') || pseudoPaints(el, '::after');
    return getPseudoContentRules(dom.ownerDocument(el)).some((base) => {
      try {
        return dom.matches(el, base);
      } catch {
        return false;
      }
    });
  }

  function hasNonColorMark(el, cs) {
    if (cs && (hasBorder(cs) || hasOutline(cs) || hasBoxShadow(cs) || hasBackgroundImage(cs, el))) {
      return true;
    }
    return hasVisibleImageChild(el) || hasPseudoContent(el);
  }

  // Whether the link's parent holds text beside it. The link is an element,
  // so that is a property of the parent alone, and it is read once per
  // parent: scanning every sibling for every link made a parent with
  // thousands of links take seconds, quadratic in the links.
  // Text is what has a letter or a digit, as in the contrast text scan: the
  // "|" or "·" between a row of links makes no block of text for them to
  // sit in, and a row of links is navigation (WCAG 1.4.1, G183).
  const TEXT = /[\p{L}\p{N}]/u;
  // Text in an inline element beside the link is on the same line too: a
  // sentence split into spans ("<span>Please read our</span> <a>terms</a>").
  // Not in another link, which is no text around this one, nor in an
  // element drawn invisibly (a screen-reader-only label), nor in one laid
  // out as a box of its own (inline-block, a flex or grid item). Read
  // through at most INLINE_NODES nodes of each element.
  const INLINE_NODES = 200;
  function isLinkElement(n) {
    return uaUnderlines(n) || explicitRole(n) === 'link';
  }
  function isHiddenText(n) {
    try {
      return typeof helpers.isVisuallyHidden === 'function' && helpers.isVisuallyHidden(n);
    } catch {
      return false;
    }
  }
  // The element whose text it is: the inline element holding the first
  // text found in root, or null when root has none.
  function inlineTextElement(root) {
    const stack = [root];
    let seen = 0;
    while (stack.length && seen < INLINE_NODES) {
      const n = stack.pop();
      seen += 1;
      const type = dom.nodeType(n);
      if (type === 3) {
        if (TEXT.test(dom.nodeValue(n) || '')) return dom.parentElement(n);
        continue;
      }
      if (type !== 1 || isLinkElement(n)) continue;
      const cs = safeComputedStyle(n);
      if (!cs || String(cs.display || '') !== 'inline' || isHiddenText(n)) continue;
      const kids = [];
      for (let c = dom.firstChild(n); c; c = dom.nextSibling(c)) kids.push(c);
      for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]);
    }
    return null;
  }
  // The element whose style is the surrounding text's, for the parent: the
  // parent itself when text sits in it directly, else the inline element
  // beside the link that holds it, else null (no text around the link).
  const surroundingTextElement = new Map();
  function textElementOf(parent) {
    if (!parent) return null;
    if (surroundingTextElement.has(parent)) return surroundingTextElement.get(parent);
    let found = null;
    for (let n = dom.firstChild(parent); n; n = dom.nextSibling(n)) {
      if (dom.nodeType(n) === 3 && TEXT.test(dom.nodeValue(n) || '')) {
        found = parent;
        break;
      }
    }
    if (!found && !/flex|grid/.test(String((safeComputedStyle(parent) || {}).display || ''))) {
      for (let n = dom.firstElementChild(parent); n && !found; n = dom.nextElementSibling(n)) {
        found = inlineTextElement(n);
      }
    }
    surroundingTextElement.set(parent, found);
    return found;
  }
  function hasSurroundingText(el, parent) {
    return !!textElementOf(parent);
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
  // Whether the run names the canvas (the runner marks a given
  // rootCanvasFallback), rather than taking the default white.
  const rootCanvasSet = contrastOpts.rootCanvasFallbackSet === true;

  const c = helpers && helpers.contrast ? helpers.contrast : null;

  // `[role~="link" i]` also matches a fallback list whose first known role
  // is something else (role="button link" is a button), so a role-only
  // candidate is kept only when its resolved explicit role is link.
  const selector = 'a[href], [role~="link" i]';
  const nodes = (
    helpers.queryAllSmart
      ? helpers.queryAllSmart(selector, { internalsRoles: true })
      : helpers.queryAll(selector)
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
  function markUndecided(el, reasonCode, lean, detail) {
    undecided.push({ el, reasonCode, lean: lean || null, detail: detail || null });
  }

  // The link's colors against the surrounding text's, every pair: where
  // all reach 3:1 the closest pair stands ('reach'), where all fall short
  // the best one ('short'); 'mixed' where they disagree.
  function compareTextColors(linkFgs, textFgs) {
    let best = null;
    let reach = 0;
    let total = 0;
    for (const link of linkFgs) {
      for (const text of textFgs) {
        const ratio = c.contrastRatio(link, text);
        if (!Number.isFinite(ratio)) return { verdict: 'mixed' };
        total += 1;
        if (ratio >= 3) reach += 1;
        if (!best || (ratio >= 3 ? ratio < best.ratio : ratio > best.ratio)) {
          best = { ratio, link, text };
        }
      }
    }
    if (!best || (reach && reach !== total)) return { verdict: 'mixed' };
    return { verdict: reach ? 'reach' : 'short', ...best };
  }

  // The ::first-line of the block the surrounding text is in, where it
  // paints that text in a color of its own: { color, selector, otherCue },
  // otherCue where it also changes the weight, style, decoration or shadow
  // of the first line. Only a browser computes pseudo-element styles, so
  // under a DOM emulator this is null. Text in an inline element of a
  // color other than the block's keeps its color on the first line.
  const BLOCK_DISPLAY =
    /^(block|list-item|flow-root|inline-block|table-cell|table-caption)\b|\bflow-root\b/;
  const firstLineByBlock = new Map();
  const firstLineByRoot = new Map();
  function sheetsNameFirstLine(node) {
    let root;
    try {
      root = dom.getRootNode(node);
    } catch {
      return true;
    }
    if (firstLineByRoot.has(root)) return firstLineByRoot.get(root);
    let found = false;
    const walk = (rules, depth) => {
      if (!rules || depth > MAX_NESTED_DEPTH || found) return;
      for (const cssRule of rules) {
        if (!cssRule) continue;
        if (typeof cssRule.selectorText === 'string' && /first-line/i.test(cssRule.selectorText)) {
          found = true;
          return;
        }
        let nested;
        try {
          nested = cssRule.cssRules || null;
        } catch {
          nested = null;
        }
        if (nested && nested.length) walk(nested, depth + 1);
      }
    };
    try {
      const sheets = Array.from(dom.get(root, 'styleSheets') || []).concat(
        Array.from(dom.get(root, 'adoptedStyleSheets') || [])
      );
      for (const sheet of sheets) {
        let rules;
        try {
          rules = sheet.cssRules || [];
        } catch {
          found = true; // another origin's: it may name one
          break;
        }
        walk(rules, 0);
        if (found) break;
      }
    } catch {
      found = true;
    }
    firstLineByRoot.set(root, found);
    return found;
  }
  // Whether a block's first line is its parent's first line too: it is a
  // block-level box in the normal flow of a block container, and nothing
  // in that flow comes before it (white space, an element not shown, a
  // float or an absolutely positioned box aside). A block's ::first-line
  // then paints it (CSS Pseudo-Elements, "first formatted line").
  const FIRST_LINE_CONTAINER =
    /^(block|list-item|flow-root|inline-block|table-cell|table-caption)\b/;
  const outOfFlow = (cs) =>
    String(cs.display || '') === 'none' ||
    /^(absolute|fixed)$/.test(String(cs.position || '')) ||
    String(cs.cssFloat || cs.float || 'none') !== 'none';
  function opensParentFirstLine(child, childCs, parent) {
    const parentCs = safeComputedStyle(parent);
    if (!parentCs || !FIRST_LINE_CONTAINER.test(String(parentCs.display || ''))) return false;
    if (!/^(block|list-item|flow-root)\b/.test(String(childCs.display || ''))) return false;
    if (outOfFlow(childCs)) return false;
    for (
      let n = dom.firstChild(parent), i = 0;
      n && n !== child && i < 200;
      n = dom.nextSibling(n), i++
    ) {
      const type = dom.nodeType(n);
      if (type === 3) {
        if (/\S/.test(dom.nodeValue(n) || '')) return false;
        continue;
      }
      if (type !== 1) continue;
      const cs = safeComputedStyle(n);
      if (!cs || !outOfFlow(cs)) return false;
    }
    return true;
  }
  // The element whose ::first-line gives a block's first line the color
  // read from the block's own: an ancestor's reaches the block's first line
  // where the block opens the ancestor's (div::first-line paints the first
  // line of the <p> that opens the div), and the browser computes the
  // block's ::first-line with it. The nearest ancestor so reached whose
  // ::first-line has a color of its own, where that is the color read; the
  // block itself where it has another (the inner one wins) or there is none.
  function firstLineSource(block, color, view) {
    try {
      let cur = block;
      let curCs = safeComputedStyle(block);
      for (let d = 0; cur && curCs && d < 50; d++) {
        const up = dom.parentElement(cur);
        if (!up || !opensParentFirstLine(cur, curCs, up)) break;
        const upCs = safeComputedStyle(up);
        if (!upCs) break;
        const upLine = fillOf(view.getComputedStyle(up, '::first-line'));
        if (upLine && !sameRgba(upLine, fillOf(upCs, up)))
          return sameRgba(upLine, color) ? up : block;
        cur = up;
        curCs = upCs;
      }
    } catch {}
    return block;
  }
  function blockFirstLine(textEl, textCs) {
    try {
      if (!textEl || !textCs || !hasLayout() || !sheetsNameFirstLine(textEl)) return null;
      let block = textEl;
      let blockCs = textCs;
      for (let d = 0; block && d < 50; d++) {
        if (BLOCK_DISPLAY.test(String(blockCs.display || ''))) break;
        block = dom.parentElement(block);
        blockCs = block ? safeComputedStyle(block) : null;
        if (!blockCs) return null;
      }
      if (!block || !blockCs) return null;
      if (block !== textEl && !sameRgba(fillOf(textCs, textEl), fillOf(blockCs, block)))
        return null;
      if (firstLineByBlock.has(block)) return firstLineByBlock.get(block);
      let out = null;
      const view = dom.defaultView(dom.ownerDocument(block));
      const ps = view ? view.getComputedStyle(block, '::first-line') : null;
      const color = ps ? fillOf(ps) : null;
      const own = fillOf(blockCs, block);
      if (color && own && !sameRgba(color, own)) {
        const source = firstLineSource(block, color, view);
        const blockId = dom.getAttribute(source, 'id');
        const cls = String(dom.getAttribute(source, 'class') || '')
          .trim()
          .split(/\s+/)[0];
        const name = String(dom.localName(source) || '').toLowerCase();
        out = {
          color,
          selector: name + (blockId ? '#' + blockId : cls ? '.' + cls : '') + '::first-line',
          otherCue:
            c.normalizeFontWeight(ps.fontWeight) !== c.normalizeFontWeight(blockCs.fontWeight) ||
            String(ps.fontStyle || '') !== String(blockCs.fontStyle || '') ||
            String(ps.textDecorationLine || '') !== String(blockCs.textDecorationLine || '') ||
            String(ps.textShadow || '') !== String(blockCs.textShadow || '')
        };
      }
      firstLineByBlock.set(block, out);
      return out;
    } catch {
      return null;
    }
  }

  // ---- Leans (docs/LEANS.md) ----

  // The color a style paints text in: -webkit-text-fill-color, else color.
  // For an element's own style, given el, read as the contrast helpers read
  // it (textFillColor): under jsdom, the color of text in a link comes
  // from the page's rules, not jsdom's own link color; null where it
  // can't be worked out.
  function fillOf(cs, el) {
    if (!cs || !c) return null;
    if (el && typeof c.textFillColor === 'function') {
      return c.parseCssColorToRgba(String(c.textFillColor(el) || ''));
    }
    return (
      c.parseCssColorToRgba(String(cs.webkitTextFillColor || '')) ||
      c.parseCssColorToRgba(String(cs.color || ''))
    );
  }

  function sameRgba(a, b) {
    return !!a && !!b && a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
  }

  // The effects that stopped the colors being measured where two equal
  // colors stay equal under them, applied alike to the link and the text:
  // the same blocker, or the same shadow or stroke on both.
  const SAME_COLOR = new Set([
    'COLOR_NOT_COMPUTABLE',
    'BACKGROUND_IMAGE_OR_GRADIENT',
    'BACKGROUND_OVERLAP',
    'BACKGROUND_FILTER_OR_BACKDROP_FILTER',
    'MIX_BLEND_MODE',
    'ANCESTOR_OPACITY',
    'TEXT_SHADOW',
    'TEXT_STROKE'
  ]);
  // Those where the link's ratio to the surrounding text is known exactly
  // when both are drawn in opaque colors: the ratio of the two text colors,
  // which no background enters (an unknown background, an image or a
  // gradient behind both, an ancestor fading both). Filters and blend modes
  // change the colors themselves.
  const KNOWN_FROM_TEXT = new Set([
    'COLOR_NOT_COMPUTABLE',
    'BACKGROUND_IMAGE_OR_GRADIENT',
    'ANCESTOR_OPACITY'
  ]);
  // Those decided only below 3:1: the same shadow or stroke drawn on both
  // can only make them look more alike.
  const KNOWN_BELOW_THREE = new Set(['TEXT_SHADOW', 'TEXT_STROKE']);
  const OWN_BACKGROUND = new Set([
    'COLOR_NOT_COMPUTABLE',
    'BACKGROUND_IMAGE_OR_GRADIENT',
    'BACKGROUND_OVERLAP',
    'BACKGROUND_FILTER_OR_BACKDROP_FILTER',
    'MIX_BLEND_MODE',
    'ANCESTOR_OPACITY',
    'ELEMENT_OPACITY',
    'TEXT_SHADOW',
    'TEXT_STROKE'
  ]);

  function strokeOf(cs) {
    if (!cs || typeof cs.getPropertyValue !== 'function') return '';
    return (
      String(cs.getPropertyValue('-webkit-text-stroke-width') || '').trim() +
      ' ' +
      String(cs.getPropertyValue('-webkit-text-stroke-color') || '').trim()
    );
  }

  // Whether what stopped the link's colors being measured is the same for
  // the text around it: the same blocker, on the same element, or the same
  // shadow or outline on both.
  function effectShared(reasonCode, blocker, linkCs, textEl, parentCs) {
    if (reasonCode === 'COLOR_NOT_COMPUTABLE') return true;
    if (reasonCode === 'TEXT_SHADOW')
      return String(linkCs.textShadow || '') === String(parentCs.textShadow || '');
    if (reasonCode === 'TEXT_STROKE') return strokeOf(linkCs) === strokeOf(parentCs);
    if (!blocker || !textEl) return false;
    const other = c.getComputabilityBlocker(textEl);
    return (
      !!other &&
      other.ok === false &&
      other.reasonCode === blocker.reasonCode &&
      other.blockerSelector === blocker.blockerSelector &&
      other.blockerValue === blocker.blockerValue
    );
  }

  // The first background-color above el that paints, or null.
  function backgroundAround(el) {
    for (
      let cur = dom.parentElement(el), d = 0;
      cur && d < 200;
      cur = dom.parentElement(cur), d++
    ) {
      const bg = c.parseCssColorToRgba(
        String((safeComputedStyle(cur) || {}).backgroundColor || '')
      );
      if (bg && bg.a > 0) return bg;
    }
    return null;
  }

  // Which way a link left undecided because its colors could not be
  // measured points. A link with no underline and no other mark, drawn in
  // the same color as the text around it, or one less than 3:1 from it
  // where the effect in the way applies to both alike, has color as its
  // only cue, and too little of it. A link with an opaque background of
  // its own, unlike the one around it, is marked like a highlight.
  function undecidedLean(reasonCode, info) {
    try {
      if (!c || !info || !info.linkCs || !info.parentCs) return null;
      const { el, linkCs, textEl, parentCs, blocker, underlined } = info;
      if (!OWN_BACKGROUND.has(reasonCode)) return null;
      const ownBg = c.parseCssColorToRgba(String(linkCs.backgroundColor || ''));
      if (ownBg && ownBg.a === 1) {
        const around = backgroundAround(el);
        if (!around || (around.r === ownBg.r && around.g === ownBg.g && around.b === ownBg.b))
          return null;
        return {
          toward: 'pass',
          why: 'The link has an opaque background color of its own, unlike the one around it, which marks it without relying on its text color.',
          signals: [
            { signal: 'link-own-background', value: c.rgbToHex(ownBg) },
            { signal: 'background-around', value: c.rgbToHex(around) }
          ],
          caution: 'A background color close to the one around it may not be noticed.',
          i18n: {
            whyKey: 'linkInTextBlock_lean_why_ownBackground',
            cautionKey: 'linkInTextBlock_lean_caution_ownBackground'
          }
        };
      }
      if (underlined !== false) return null;
      if (ownBg && ownBg.a > 0) return null;
      if (!SAME_COLOR.has(reasonCode)) return null;
      const linkFill = fillOf(linkCs, el);
      const textFill = fillOf(parentCs, textEl);
      if (!linkFill || !textFill) return null;
      if (c.computeOpacityProduct(el) !== c.computeOpacityProduct(textEl)) return null;
      if (!effectShared(reasonCode, blocker, linkCs, textEl, parentCs)) return null;
      // In opaque colors the link is decided (knownFromTextColors); in the
      // same translucent one it points to a failure.
      if (!sameRgba(linkFill, textFill)) return null;
      const effect = reasonCode !== 'COLOR_NOT_COMPUTABLE';
      return {
        toward: 'fail',
        why: 'The link is drawn in the same color as the text around it, with no underline or other mark, so nothing sets it apart.',
        signals: [
          { signal: 'underline-absent', value: true },
          { signal: 'link-text-same-color', value: true },
          { signal: 'link-text-ratio', value: 1 },
          { signal: 'blocked-by', value: reasonCode }
        ],
        ...(effect
          ? {
              caution:
                'The effect that kept the colors from being measured applies to the link and the text alike, but how it draws them is not modeled.'
            }
          : {}),
        i18n: {
          whyKey: 'linkInTextBlock_lean_why_sameColor',
          ...(effect ? { cautionKey: 'linkInTextBlock_lean_caution_effect' } : {}),
          params: {}
        }
      };
    } catch {
      return null;
    }
  }

  // A link whose colors could not be measured, but whose ratio to the
  // surrounding text is known all the same: it has no underline and no
  // background of its own, it and the text are drawn in opaque colors, and
  // what kept them from being measured is the background, or an effect
  // applied alike to both. The ratio of the two text colors (against the
  // block's ::first-line color too, where it has one) is then the ratio
  // the link is judged by. { ratio, link, text }, or null where it stays
  // undecided: a translucent color, a filter, a blend mode, paint under
  // the text, or the same shadow or stroke at 3:1 or more.
  function knownFromTextColors(reasonCode, info) {
    try {
      if (!c || !info || !info.linkCs || !info.parentCs) return null;
      const { el, linkCs, textEl, parentCs, blocker, underlined } = info;
      if (!KNOWN_FROM_TEXT.has(reasonCode) && !KNOWN_BELOW_THREE.has(reasonCode)) return null;
      if (underlined !== false) return null;
      // The link's own ::first-line or ::first-letter gives it a second color.
      if (blocker && blocker.reasonCode === 'PSEUDO_ELEMENT_COLOR') return null;
      const ownBgValue = String(linkCs.backgroundColor || '').trim();
      const ownBg = ownBgValue ? c.parseCssColorToRgba(ownBgValue) : null;
      if (ownBgValue && !(ownBg && ownBg.a === 0)) return null;
      const linkFill = fillOf(linkCs, el);
      const textFill = fillOf(parentCs, textEl);
      if (!linkFill || !textFill || linkFill.a !== 1 || textFill.a !== 1) return null;
      if (c.computeOpacityProduct(el) !== c.computeOpacityProduct(textEl)) return null;
      if (!effectShared(reasonCode, blocker, linkCs, textEl, parentCs)) return null;
      const textFgs = [textFill];
      const firstLine = blockFirstLine(textEl, parentCs);
      if (firstLine) {
        if (firstLine.color.a !== 1) return null;
        textFgs.push(firstLine.color);
      }
      const compared = compareTextColors([linkFill], textFgs);
      if (compared.verdict === 'mixed') return null;
      if (compared.verdict === 'short' && firstLine && firstLine.otherCue) return null;
      if (compared.verdict === 'reach' && KNOWN_BELOW_THREE.has(reasonCode)) return null;
      return { ratio: compared.ratio, link: compared.link, text: compared.text };
    } catch {
      return null;
    }
  }

  // Whether a highlight differs from the background around it on the
  // canvas the run names: true or false, null where it can't be told.
  function highlightDiffersOnCanvas(highlight, around) {
    try {
      const canvas = c.parseCssColorToRgba(rootCanvasFallback);
      if (!canvas || canvas.a !== 1) return null;
      const surround = { ...c.compositeRgba(around, canvas), a: 1 };
      return c.rgbToHex(highlight) !== c.rgbToHex(surround);
    } catch {
      return null;
    }
  }

  // A link whose own highlight is compared with the page's canvas around it
  // (parentBg.canvas), on a page that supports two color schemes: compared
  // in the scheme the page is drawn in (`current`: { differs, ratio,
  // fgLinkHex, fgParentHex }) and, where `others` and the colors of the
  // link and the text around it can't change with the scheme
  // (helpers.contrast.colorSchemeMeasurable), in the other, with the
  // link's and the text's colors there. The highlight sets the link apart
  // where it does in each scheme measured; where it doesn't in one, the
  // link is judged there by its color, failing below 3:1. detail:
  // colorScheme, the scheme it falls short in where it doesn't in the
  // other, and colorSchemesChecked, the schemes measured where one wasn't.
  // { differs, ratio, fgLinkHex, fgParentHex, detail }, or null on a page
  // with one scheme or a canvas the run names.
  function highlightAcrossSchemes(nodes, current, others) {
    const { el, textEl, parent, parentBg } = nodes;
    const canvas = parentBg && parentBg.canvas;
    if (!canvas || !canvas.scheme || !Array.isArray(canvas.supported)) return null;
    if (canvas.supported.length < 2) return null;
    const all = [{ scheme: canvas.scheme, ...current }];
    for (const scheme of canvas.supported) {
      if (scheme === canvas.scheme || !others) continue;
      if (typeof c.colorSchemeMeasurable !== 'function') continue;
      if (![el, textEl, parent].every((n) => c.colorSchemeMeasurable(n, scheme))) continue;
      const opts = {
        contrast: { mode, rootCanvasFallback, colorScheme: scheme },
        collectStack: false
      };
      const own = c.computeEffectiveBackground(el, opts);
      const around = c.computeEffectiveBackground(parent, opts);
      const textBg = c.computeEffectiveBackground(textEl, opts);
      const fgLink = c.computeEffectiveForeground(el, opts);
      const fgText = c.computeEffectiveForeground(textEl, opts);
      if (!own || !own.ok || !around || !around.ok || !textBg || !textBg.ok) continue;
      if (!around.canvas || around.canvas.scheme !== scheme) continue;
      if (!fgLink || !fgLink.rgba || !fgText || !fgText.rgba) continue;
      const opaque = (fg, back) =>
        fg.rgba.a < 1 ? { ...c.compositeRgba(fg.rgba, back.rgba), a: 1 } : { ...fg.rgba, a: 1 };
      const linkFg = opaque(fgLink, own);
      const textFg = opaque(fgText, textBg);
      all.push({
        scheme,
        differs: c.rgbToHex(own.rgba) !== c.rgbToHex(around.rgba),
        ratio: c.contrastRatio(linkFg, textFg),
        fgLinkHex: c.rgbToHex(linkFg),
        fgParentHex: c.rgbToHex(textFg)
      });
    }
    const verdict = (r) => (r.differs ? 'pass' : r.ratio >= 3 ? 'ask' : 'fail');
    const fails = all.filter((r) => verdict(r) === 'fail');
    const asks = all.filter((r) => verdict(r) === 'ask');
    const short = fails.length ? fails : asks;
    const pick = short.length ? short[0] : all[0];
    const detail = {};
    if (short.length && short.length < all.length) detail.colorScheme = short[0].scheme;
    const checked = canvas.supported.filter((s) => all.some((r) => r.scheme === s));
    if (checked.length < canvas.supported.length) detail.colorSchemesChecked = checked;
    return {
      differs: !short.length,
      ratio: pick.ratio,
      fgLinkHex: pick.fgLinkHex,
      fgParentHex: pick.fgParentHex,
      detail
    };
  }

  // Whether the page's style sheets give the link a non-color cue on hover
  // and on focus, as G183 asks of a link told apart by color at 3:1 or
  // more: a :hover or :focus rule matching it (with the state taken out)
  // that underlines it, gives it a border, outline, shadow or background,
  // changes its weight or style, or gives its ::before or ::after content.
  // { onHover, onFocus, readable }: readable is false when a sheet, a selector
  // or the link's own tree (a shadow root, adopted sheets) can't be read.
  const STATE_RE = /:(hover|focus-visible|focus-within|focus)\b/gi;
  function declaresCue(style, onPseudo) {
    if (!style || typeof style.getPropertyValue !== 'function') return false;
    const n = Number(style.length) || 0;
    for (let i = 0; i < n; i++) {
      const prop = String(style[i] || '').toLowerCase();
      const value = String(style.getPropertyValue(prop) || '')
        .trim()
        .toLowerCase();
      if (!value) continue;
      if (prop.startsWith('text-decoration')) {
        if (/\b(underline|overline|line-through)\b/.test(value)) return true;
      } else if (prop.startsWith('border') || prop.startsWith('outline')) {
        if (prop.endsWith('-color') || prop.endsWith('-offset') || prop.endsWith('-radius'))
          continue;
        if (!/^(none|hidden|0|0px|initial|unset)$/.test(value)) return true;
      } else if (prop === 'box-shadow') {
        if (value !== 'none') return true;
      } else if (prop === 'background-color' || prop === 'background') {
        if (!isTransparentColor(value) && value !== 'none') return true;
      } else if (prop === 'background-image') {
        if (value !== 'none') return true;
      } else if (prop === 'font-weight' || prop === 'font-style') {
        return true;
      } else if (prop === 'content' && onPseudo) {
        if (!['none', 'normal', '""', "''"].includes(value)) return true;
      }
    }
    return false;
  }

  function hoverFocusCues(el) {
    const out = { onHover: false, onFocus: false, readable: true };
    const doc = el && dom.ownerDocument(el) ? dom.ownerDocument(el) : null;
    if (!doc || typeof dom.get(el, 'matches') !== 'function') return { ...out, readable: false };
    try {
      const root = dom.get(el, 'getRootNode') ? dom.getRootNode(el) : null;
      if (root && root !== doc) return { ...out, readable: false };
      const adopted = dom.get(doc, 'adoptedStyleSheets');
      if (adopted && adopted.length) out.readable = false;
    } catch {
      out.readable = false;
    }
    const consider = (cssRule, selectorText) => {
      for (const part of splitSelectorList(selectorText)) {
        if (!/:(hover|focus|focus-visible|focus-within)\b/i.test(part)) continue;
        const hover = /:hover\b/i.test(part);
        const focus = /:focus(-visible|-within)?\b/i.test(part);
        let base = part.replace(STATE_RE, '');
        const onPseudo = /::?(before|after)\b/i.test(base);
        base = base.replace(/::?(before|after)\b/gi, '');
        if (/::[a-z-]+/i.test(base)) continue;
        base = base.trim() || '*';
        if (/[>+~]$/.test(base)) base += ' *';
        let matched;
        try {
          matched = dom.matches(el, base);
        } catch {
          out.readable = false;
          continue;
        }
        if (!matched || !declaresCue(cssRule.style, onPseudo)) continue;
        if (hover) out.onHover = true;
        if (focus) out.onFocus = true;
      }
    };
    // A nested rule's selector, resolved against its parent's: `&` stands
    // for the parent, and a selector without one is a descendant of it, so
    // `nav a { &:hover {} }` reaches only the links in a nav.
    const nestedSelector = (selector, parent) =>
      !parent
        ? selector
        : splitSelectorList(selector)
            .map((part) =>
              part.indexOf('&') !== -1
                ? part.split('&').join(':is(' + parent + ')')
                : ':is(' + parent + ') ' + part.trim()
            )
            .join(', ');
    const walk = (rules, depth, parent) => {
      if (!rules || depth > MAX_NESTED_DEPTH) return;
      for (const cssRule of rules) {
        if (!cssRule || !cssConditionApplies(cssRule)) continue;
        let selector = parent;
        if (cssRule.type === CSS_STYLE_RULE && cssRule.selectorText) {
          selector = nestedSelector(String(cssRule.selectorText), parent);
          consider(cssRule, selector);
        } else if (parent && cssRule.style && !cssRule.selectorText) {
          // Declarations straight inside an at-rule within a style rule.
          consider(cssRule, parent);
        }
        let nested;
        try {
          nested = cssRule.cssRules || null;
        } catch {
          nested = null;
        }
        if (nested && nested.length) walk(nested, depth + 1, selector);
      }
    };
    try {
      for (const sheet of dom.styleSheets(doc) || []) {
        if (!cssConditionApplies(sheet)) continue;
        let rules = null;
        try {
          rules = sheet && sheet.cssRules ? sheet.cssRules : null;
        } catch {
          out.readable = false;
          continue;
        }
        if (rules) walk(rules, 0, '');
      }
    } catch {
      out.readable = false;
    }
    return out;
  }

  // A link told apart by color alone at 3:1 or more: it leans pass where
  // the style sheets add a non-color cue on hover and on focus, and fail
  // where every sheet could be read and none adds one on hover.
  function contrastOnlyLean(el, ratio, beforeOpacity) {
    try {
      const cues = hoverFocusCues(el);
      const handlers = ['onmouseover', 'onmouseenter', 'onfocus', 'onfocusin'].some(
        (a) => dom.getAttribute(el, a) != null
      );
      const signals = [
        { signal: 'hover-cue-rule', value: cues.onHover },
        { signal: 'focus-cue-rule', value: cues.onFocus },
        { signal: 'stylesheets-readable', value: cues.readable },
        {
          signal: beforeOpacity ? 'ratio-before-opacity' : 'contrast-ratio',
          value: Number(c.round2(ratio))
        }
      ];
      // A ratio before an ancestor's opacity may be below 3:1 as drawn,
      // where hover and focus cues don't make up for it: no pass lean. The
      // fail lean stands: with no hover cue the link fails either way, by
      // its color at rest below 3:1 or by G183's missing cue at 3:1 or more.
      if (cues.onHover && cues.onFocus && !beforeOpacity) {
        return {
          toward: 'pass',
          why: "The page's style sheets give this link an underline or another non-color cue when it is hovered and when it is focused.",
          signals,
          caution: 'A later or more specific rule can undo the cue; check that it shows.',
          i18n: {
            whyKey: 'linkInTextBlock_lean_why_hoverFocusCue',
            cautionKey: 'linkInTextBlock_lean_caution_hoverFocusCue'
          }
        };
      }
      if (!cues.onHover && cues.readable && !handlers) {
        return {
          toward: 'fail',
          why: "No rule in the page's style sheets adds an underline or another non-color cue when this link is hovered, so its color stays its only cue.",
          signals,
          caution: 'A cue a script adds is not in the style sheets.',
          i18n: {
            whyKey: 'linkInTextBlock_lean_why_noHoverCue',
            cautionKey: 'linkInTextBlock_lean_caution_noHoverCue'
          }
        };
      }
    } catch {}
    return null;
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
  // surrounding text is not (<a><strong>guide</strong></a>), or that has a
  // background of its own unlike the surrounding text's, as a code chip or
  // <mark> does, or is raised or lowered, as a footnote's <sup> is (#107).
  function cueOnContent(el, parent, parentCs) {
    let parentBgHex;
    const backgroundHex = (node) => {
      try {
        const bg = c.computeEffectiveBackground(node, {
          contrast: { mode, rootCanvasFallback },
          collectStack: false
        });
        return bg && bg.ok && bg.rgba ? c.rgbToHex(bg.rgba) : null;
      } catch {
        return null;
      }
    };
    const ownBackground = (node, cs) => {
      if (!c || !c.rgbToHex || isTransparentColor(cs.backgroundColor || 'transparent'))
        return false;
      if (parentBgHex === undefined) parentBgHex = backgroundHex(parent);
      const hex = backgroundHex(node);
      return !!hex && !!parentBgHex && hex !== parentBgHex;
    };
    const parentWeight = c && parentCs ? c.normalizeFontWeight(parentCs.fontWeight) : 400;
    const parentStyle = (parentCs && parentCs.fontStyle) || 'normal';
    const hasCue = (node) => {
      const cs = safeComputedStyle(node);
      if (!cs) return false;
      if (c && c.normalizeFontWeight(cs.fontWeight) !== parentWeight) return true;
      if ((cs.fontStyle || 'normal') !== parentStyle) return true;
      if (hasBorder(cs)) return true;
      if (String(cs.verticalAlign || 'baseline') !== 'baseline') return true;
      if (hasBackgroundImage(cs, node) || ownBackground(node, cs)) return true;
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

  // Whether the link draws text: a text node with something other than
  // white space in its flat tree (its shadow tree's, with what is slotted
  // into it), and, where the page has a layout, a box of some area. A link
  // that draws no text can't be told from the text around it by its color,
  // and has no name, which link-name-present reports.
  let pageHasLayout;
  function drawsText(el) {
    let found = false;
    let budget = 20000;
    const visit = (node, depth) => {
      if (found || budget-- <= 0 || depth > 200) return;
      const type = dom.nodeType(node);
      if (type === 3) {
        if (/\S/.test(dom.nodeValue(node) || '')) found = true;
        return;
      }
      if (type !== 1 && type !== 11) return;
      let kids = null;
      if (type === 1) {
        const name = String(dom.localName(node) || '').toLowerCase();
        if (name === 'script' || name === 'style' || name === 'template') return;
        let root;
        try {
          root = dom.shadowRoot(node);
        } catch {
          root = null;
        }
        if (root) kids = dom.childNodes(root);
        else if (name === 'slot') {
          try {
            const assigned = dom.assignedNodes(node, { flatten: true });
            if (assigned && assigned.length) kids = assigned;
          } catch {
            // No slotting here: its fallback content stands.
          }
        }
      }
      if (!kids) kids = dom.childNodes(node);
      for (let i = 0; kids && i < kids.length && !found; i++) visit(kids[i], depth + 1);
    };
    try {
      visit(el, 0);
    } catch {
      return true;
    }
    if (!found) return false;
    try {
      if (pageHasLayout === undefined) {
        const root = dom.documentElement(dom.ownerDocument(el));
        const r = root && dom.getBoundingClientRect(root);
        pageHasLayout = !!r && (r.width > 0 || r.height > 0);
      }
      if (!pageHasLayout) return true;
      const cs = safeComputedStyle(el);
      // A display: contents link has no box of its own; its text has.
      if (cs && cs.display === 'contents') return true;
      const rects = dom.getClientRects(el);
      if (!rects) return true;
      for (let i = 0; i < rects.length; i++) {
        if (rects[i] && rects[i].width > 0 && rects[i].height > 0) return true;
      }
      return false;
    } catch {
      return true;
    }
  }

  for (const el of nodes) {
    if (!el || !dom.get(el, 'getAttribute')) continue;

    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible =
      typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    if (!drawsText(el)) continue;

    const parent = textParentOf(el);
    if (!hasSurroundingText(el, parent)) continue;

    applicableCount += 1;

    const linkCs = safeComputedStyle(el);
    // The surrounding text's style: the parent's, or the inline element's
    // beside the link that holds the text.
    const textEl = textElementOf(parent);
    const parentCs = safeComputedStyle(textEl);

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

    // An underline the computed style vouches for settles the link before
    // the costlier marks are looked for (what a ::before or ::after draws).
    const shown = decorationInfo(linkCs);
    if (
      shown.trustworthy &&
      shown.underlined &&
      !isTransparentColor(linkCs && linkCs.textDecorationColor)
    ) {
      decidedCount += 1;
      continue;
    }

    // A border, box-shadow, outline, background image, icon or generated
    // content marks the link without relying on color.
    if (hasNonColorMark(el, linkCs) || cueOnContent(el, parent, parentCs)) {
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

    // The colors of the link or of the text around it in the color scheme
    // the page is drawn in can't be read (an emulator:
    // helpers.contrast.colorSchemeUnread), so nothing they would decide is
    // known, and no lean either.
    if (
      typeof c.colorSchemeUnread === 'function' &&
      (c.colorSchemeUnread(el) || c.colorSchemeUnread(textEl))
    ) {
      markUndecided(el, 'COLOR_NOT_COMPUTABLE');
      continue;
    }

    let flagged = false;
    let computed = false;
    let backgroundDiffers = false;
    let ratio = null;
    let fgLinkHex = '';
    let fgParentHex = '';
    let undecidedReason = 'COLOR_NOT_COMPUTABLE';
    // Details the undecided finding carries beyond its reason code.
    let undecidedDetail = null;
    let lastBlocker = null;
    // A highlight of the link's own over a page with no background of its
    // own: { highlight, around }, the background around it before the canvas.
    let rootUnknown = null;
    // On the canvas of a page with two color schemes: the scheme in which the
    // highlight doesn't set the link apart, and the schemes measured
    // (highlightAcrossSchemes).
    let schemeDetail = null;
    // Whether the ratio is that of the colors before an ancestor's opacity
    // fades them, which can only bring them closer: not the ratio drawn.
    let beforeOpacity = false;

    try {
      const blocker = c.getComputabilityBlocker(el);
      // Paint under the text that is not an ancestor's leaves the link's
      // color and the surrounding text's as they are: only a translucent
      // one depends on what is behind it, checked below.
      const overlapOnly =
        !!blocker && blocker.ok === false && blocker.reasonCode === 'BACKGROUND_OVERLAP';
      // A ::first-line or ::first-letter of the link's own in a color of
      // its own, with nothing else in the way: the link is compared with
      // the text around it in both colors, below (#2 in measurePseudoElementText).
      const pseudo =
        !!blocker &&
        blocker.ok === false &&
        blocker.reasonCode === 'PSEUDO_ELEMENT_COLOR' &&
        !!blocker.pseudoColors &&
        blocker.pseudoColors.background.a === 0 &&
        blocker.pseudoColors.fontWeightNum === linkWeight &&
        typeof c.measurePseudoElementText === 'function';
      if (blocker && blocker.ok === false) lastBlocker = blocker;
      if (blocker && blocker.ok === false && !overlapOnly && !pseudo) {
        // Not confidently computable: recorded below rather than skipped, so
        // it cannot be mistaken for a clean result.
        if (blocker.reasonCode) undecidedReason = String(blocker.reasonCode);
      } else {
        const bg = c.computeEffectiveBackground(el, {
          contrast: { mode, rootCanvasFallback },
          collectStack: false
        });
        const fgLink = c.computeEffectiveForeground(el);
        const fgParent = c.computeEffectiveForeground(textEl);

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
          // In the pseudo-element's color too: where both reach 3:1, or
          // both fall short, which text it paints doesn't change the
          // answer, which is taken from the closer one when both reach it
          // and from the better one when both fall short. Where they
          // disagree it is asked about. The link's own ::first-line or
          // ::first-letter gives the link a second color, the block's
          // ::first-line the surrounding text one.
          const linkFgs = [fgLinkOpaque];
          const textFgs = [fgParentOpaque];
          if (pseudo) {
            const m = c.measurePseudoElementText(el, {
              contrast: { mode, rootCanvasFallback },
              collectStack: false
            });
            if (m && m.pseudo && m.pseudo.fg) linkFgs.push(m.pseudo.fg);
            else {
              computed = false;
              undecidedReason = 'PSEUDO_ELEMENT_COLOR';
            }
          }
          const firstLine = computed ? blockFirstLine(textEl, parentCs) : null;
          if (firstLine) {
            textFgs.push(
              firstLine.color.a < 1
                ? { ...c.compositeRgba(firstLine.color, bg.rgba), a: 1 }
                : { ...firstLine.color, a: 1 }
            );
          }
          const compared =
            computed && linkFgs.length + textFgs.length > 2
              ? compareTextColors(linkFgs, textFgs)
              : null;
          if (compared && compared.verdict === 'short' && firstLine && firstLine.otherCue) {
            // The first line's text differs from the rest by more than its
            // color, which may set the link apart there.
            computed = false;
            undecidedReason = 'PSEUDO_ELEMENT_COLOR';
            undecidedDetail = { pseudoElement: firstLine.selector };
          } else if (compared && compared.verdict === 'mixed') {
            computed = false;
            undecidedReason = 'PSEUDO_ELEMENT_COLOR';
            // Named when the block's first line is what the two disagree on.
            if (firstLine && compareTextColors(linkFgs, [fgParentOpaque]).verdict !== 'mixed') {
              undecidedDetail = { pseudoElement: firstLine.selector };
            }
          } else if (compared) {
            ratio = compared.ratio;
            fgLinkHex = c.rgbToHex ? c.rgbToHex(compared.link) : '';
            fgParentHex = c.rgbToHex ? c.rgbToHex(compared.text) : '';
          }
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
              // Around it is the page's canvas, in the scheme the page is
              // drawn in: in the other the page supports, it is measured
              // too, as the contrast rules measure text there.
              const across = highlightAcrossSchemes(
                { el, textEl, parent, parentBg },
                { differs: backgroundDiffers, ratio, fgLinkHex, fgParentHex },
                !pseudo && !firstLine
              );
              if (across) {
                backgroundDiffers = across.differs;
                if (!across.differs) {
                  ratio = across.ratio;
                  fgLinkHex = across.fgLinkHex;
                  fgParentHex = across.fgParentHex;
                  flagged = !(ratio >= 3);
                }
                if (Object.keys(across.detail).length) schemeDetail = across.detail;
              }
            } else if (
              parentBg &&
              parentBg.reasonCode === 'BACKGROUND_NOT_OPAQUE_AT_ROOT' &&
              parentBg.rgba
            ) {
              // The background around the link is the canvas, which strict
              // mode doesn't assume: an opaque highlight of the link's own
              // may or may not stand out from it.
              const own = c.parseCssColorToRgba(String(linkCs.backgroundColor || ''));
              if (own && own.a === 1) rootUnknown = { highlight: bg.rgba, around: parentBg.rgba };
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
      const info = { el, linkCs, textEl, parentCs, blocker: lastBlocker, underlined };
      const known = knownFromTextColors(undecidedReason, info);
      if (!known) {
        markUndecided(el, undecidedReason, undecidedLean(undecidedReason, info), undecidedDetail);
        continue;
      }
      ratio = known.ratio;
      beforeOpacity = undecidedReason === 'ANCESTOR_OPACITY';
      fgLinkHex = c.rgbToHex ? c.rgbToHex(known.link) : '';
      fgParentHex = c.rgbToHex ? c.rgbToHex(known.text) : '';
      flagged = !(ratio >= 3);
    }

    // A canvas the run names is the background around a highlight on a page
    // with none: the link is decided by it as by a background that is known.
    if (rootUnknown && rootCanvasSet) {
      const differs = highlightDiffersOnCanvas(rootUnknown.highlight, rootUnknown.around);
      if (differs !== null) {
        backgroundDiffers = differs;
        rootUnknown = null;
      }
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

    // Below 3:1, a highlight of the link's own would set it apart, but
    // whether it differs from the canvas the page is drawn on is unknown.
    if (flagged && rootUnknown) {
      markUndecided(el, 'BACKGROUND_NOT_OPAQUE_AT_ROOT');
      continue;
    }

    // Color is the only cue at rest. At 3:1 or more, G183 also needs a
    // non-color cue on hover and focus, which a static scan cannot see.
    colorCompared += 1;
    if (!flagged) {
      contrastOnly.push({ el, ratio, fgLinkHex, fgParentHex, beforeOpacity, schemeDetail });
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
            // Faded with the text by an ancestor's opacity, the ratio is the
            // one before the fading, which can only lower it: below 3:1
            // before, it is below 3:1 as drawn, but not that ratio.
            metrics: beforeOpacity
              ? { ratioBeforeOpacity: ratio, threshold: 3 }
              : { ratio, threshold: 3 },
            colors: { linkForegroundHex: fgLinkHex, surroundingTextForegroundHex: fgParentHex },
            ...(schemeDetail || {})
          }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  const cantTellOccurrences = undecided.map(({ el, reasonCode, lean, detail }) =>
    helpers.reportOccurrence(el, {
      occurrenceOutcome: 'cantTell',
      ...(lean ? { lean } : {}),
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
        details: { reasonCode, ...(detail || {}) }
      }
    })
  );

  // A link faded with the text by an ancestor's opacity reports the ratio
  // of the colors before the fading as metrics.ratioBeforeOpacity, with no
  // metrics.ratio: the fading brings them closer, so the ratio drawn may be
  // lower, and below 3:1.
  const contrastOnlyOccurrences = contrastOnly.map(
    ({ el, ratio, fgLinkHex, fgParentHex, beforeOpacity, schemeDetail }) => {
      const ratioStr = c && c.round2 ? c.round2(ratio) : String(ratio);
      const lean = contrastOnlyLean(el, ratio, beforeOpacity);
      return helpers.reportOccurrence(el, {
        occurrenceOutcome: 'cantTell',
        ...(lean ? { lean } : {}),
        summary: beforeOpacity
          ? `This link in a block of text is distinguished from the surrounding text only by its color, at ${ratioStr}:1 before an ancestor's opacity fades both, which brings them closer. That is enough only if the colors as drawn still reach 3:1 and hovering and focusing the link also show a non-color cue, such as an underline.`
          : `This link in a block of text is distinguished from the surrounding text only by its color (contrast ${ratioStr}:1). That is enough only if hovering and focusing it also show a non-color cue, such as an underline.`,
        hint: 'Hover over the link and move keyboard focus to it: confirm that each state adds a non-color cue (an underline, a border, a weight change). Otherwise underline the link at rest.',
        i18n: {
          summaryKey: beforeOpacity
            ? 'linkInTextBlock_summary_cantTell_contrastOnlyBeforeOpacity'
            : 'linkInTextBlock_summary_cantTell_contrastOnly',
          hintKey: 'linkInTextBlock_hint_cantTell_contrastOnly',
          params: { ratio: String(ratioStr), threshold: '3' }
        },
        uncertainty: {
          code: 'runtime-dependent',
          needed: 'Whether hovering and focusing the link add a non-color cue.',
          evidence: beforeOpacity
            ? { reasonCode: 'LINK_COLOR_CONTRAST_ONLY', ratioBeforeOpacity: ratio }
            : { reasonCode: 'LINK_COLOR_CONTRAST_ONLY', ratio }
        },
        data: {
          visibilityFilter: helpers.getEligibilityInfo
            ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
            : { targetSet: 'acc', accEligible: null, reasons: [] },
          details: {
            reasonCode: 'LINK_COLOR_CONTRAST_ONLY',
            metrics: beforeOpacity
              ? { ratioBeforeOpacity: ratio, threshold: 3 }
              : { ratio, threshold: 3 },
            colors: { linkForegroundHex: fgLinkHex, surroundingTextForegroundHex: fgParentHex },
            ...(schemeDetail || {})
          }
        }
      });
    }
  );

  // Links told apart by color alone that reach 3:1 against the surrounding
  // text: the closest is the result's margin (src/core/margin.js).
  const margin = {
    // A ratio before an ancestor's opacity is not the one drawn, so no margin.
    marginCandidates: contrastOnly
      .filter(({ beforeOpacity }) => !beforeOpacity)
      .map(({ el, ratio }) => ({ el, value: ratio, threshold: 3 })),
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
