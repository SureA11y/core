/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check css-focus-indicator-suppressed
 * @atomic true
 * @summary CSS must not remove the focus indicator without drawing a replacement
 * @standard WCAG 2.2
 * @sc 1.4.11, 2.4.7, 2.4.13
 * @applicability
 *   Elements in sequential focus navigation (tabbable and rendered) on a
 *   page whose accessible stylesheets contain at least one rule that
 *   removes the outline. With no such rule anywhere, every element keeps
 *   the user agent's own indicator and there is nothing to check.
 * @expectation
 *   No element is matched by a rule that removes the outline (`outline:
 *   none`, `outline: 0`, `outline-color: transparent`, ...) unless some
 *   focus rule matching it draws a replacement: a border, box-shadow,
 *   background, color change, a positive outline of its own, or a
 *   `::before`/`::after` decoration. The removing rule is either a
 *   `:focus`/`:focus-visible` rule, or a rule with no state at all
 *   (`a { outline: none }`, `* { outline: 0 }`): an author declaration
 *   outranks the user agent's focus outline whatever its specificity, so
 *   it removes the indicator in the focused state too (WCAG F78). A
 *   `:focus-within` or `:has(:focus)` state is read the same way, as it
 *   holds while the element has focus: `:focus-within` on the element
 *   itself or on an ancestor (`main:focus-within a`), and `:has()` of a
 *   focus state on an ancestor where the element matches its argument
 *   (`main:has(a:focus) a`). A state on a sibling (`+`, `~`) says nothing
 *   about the element's focus, and `:not(:focus-within)` stops holding once
 *   it has focus: neither counts.
 *   - The page's style sheets and those it adopts are read, and so are
 *     each open shadow root's, adopted ones included, against the elements
 *     in that root only. A rule
 *   that removes it only under `:not(:focus-visible)` keeps it for keyboard
 *   focus and is not counted; nor is the focus-visible polyfill's form of
 *   it, `:not(.focus-visible)` under `.js-focus-visible`, or
 *   `:not([data-focus-visible-added])` under `[data-js-focus-visible]`.
 * @reports
 *   - `suppressingSelectors`: the selector of each style sheet rule that
 *     removes the element's outline, one item per selector.
 *   - `styleSheet` or `styleElementIndex`: when those rules are all in one
 *     style sheet, its href as written, or the position of its <style>
 *     element among the page's, from 1.
 * @reason-codes
 *   - `FOCUS_INDICATOR_SUPPRESSED` (cantTell): a style sheet rule removes the
 *     element's focus outline and no focus rule draws a replacement; whether
 *     the page shows focus another way is for a person to check.
 *     It leans fail when every style sheet could be read, no :focus-within
 *     or :has(:focus) rule around the element draws a change, no inline focus or blur
 *     handler is on it or an ancestor, the removing rule doesn't name
 *     focus-visible, and the listener hook, when it ran, saw no focus
 *     listener for it.
 *     Basis: WCAG 1.4.11 (not settled); WCAG 2.4.7 (not settled); WCAG 2.4.13 (not settled); F78; ACT oj04fd.
 * @implementation-notes
 * - Authored as `type: 'manual'` (cantTell-capped, never fail). CSS is
 *   only one of the ways a page can indicate focus: ACT oj04fd's own
 *   passed examples suppress the outline in CSS and then paint an
 *   indicator from an `onfocus` handler, on a sibling element. Static
 *   markup cannot see that, so a suppressed outline is a strong review
 *   signal rather than a proven failure.
 * - Suppression is only read off the rule's SUBJECT: in `.a:focus .b`,
 *   the declarations apply to `.b` while `.a` has focus, so it says
 *   nothing about `.b`'s own focus indicator. A replacement, by contrast,
 *   is accepted from any rule whose focused compound matches the element:
 *   that's exactly the "focus me, paint something elsewhere" pattern
 *   (`#link:focus + .indicator { background: navy }`), which does give
 *   the user a visible change.
 * - Replacement properties are a curated list of the ones that change
 *   pixels (border, box-shadow, background, color, text-decoration,
 *   filter, opacity, transform, and `content` for a pseudo-element
 *   part), matching this engine's other curated-list checks. A rule
 *   setting only `outline-offset` alongside `outline: none` is not a
 *   replacement: it offsets an outline that is no longer drawn. Nor is a
 *   value that draws nothing (`box-shadow: none`, `background:
 *   transparent`, `border: 0`, `color: inherit` or another CSS-wide
 *   keyword, a box-shadow or text-shadow in a clear color or with no
 *   offset, blur or spread), or one the element already shows unfocused
 *   (`text-decoration: none` on a link with no underline,
 *   `text-decoration: underline` on an underlined one, the same color,
 *   weight or opacity): the focused element looks the same.
 * - An outline is drawn with a style, a width and a color, and a
 *   replacement outline counts only where it gives back each of those the
 *   removing rules took: after `outline: none` or `outline-style: none`,
 *   `outline-color` or `outline-width` alone draws nothing, while after
 *   `outline-color: transparent` an `outline-color` does. A `border-color`
 *   or `border-width` on the element counts only where it has a border,
 *   or the rule gives it a style. A value with var() is read with the
 *   custom property the element has (or the fallback written there): a
 *   `--ring` of `none` draws nothing. One that can't be read counts.
 *   These are read off the element unfocused, as the rest are.
 * - A stylesheet from another origin is read from its text when the scan
 *   is given it (`engineOptions.styleSheetTexts`, which
 *   `preloadStyleSheets()` fills in a browser; helpers.cssRulesOf), as
 *   `css-hidden-focus` and `css-orientation-lock` read it. Otherwise it
 *   throws on `.cssRules` and is skipped: a page whose only focus styles
 *   live in one is reported as having no focus rules at all, so it is not
 *   flagged.
 * - The WICG focus-visible polyfill is recognised by its exact names
 *   only: `.focus-visible` / `.js-focus-visible` and
 *   `[data-focus-visible-added]` / `[data-js-focus-visible]`. A
 *   `:not(.focus-visible)` with no polyfill scope above it is read as an
 *   ordinary class, so the rule is asked about as before (with no lean, as
 *   it names focus-visible).
 * - Selector matching goes through `el.matches()` on the focus pseudo
 *   stripped out of the selector. A focus pseudo inside `:is()`,
 *   `:where()` or `:matches()` counts too: `a:is(:focus, :hover)` is met
 *   by the focused link, so the whole `:is()` goes. A selector the engine cannot parse
 *   (vendor pseudo-elements, `:host`, unsupported `:is()` forms) throws
 *   there and is skipped rather than guessed at. A selector list holding
 *   one selector that can't be parsed (`button:-moz-focusring,
 *   button:focus`) is invalid as a whole, and a browser drops the rule; in
 *   jsdom, which keeps it, the list is tested with a query and the rule
 *   skipped when it throws. Selectors are quoted as browsers
 *   serialize them: `*:focus` reads `:focus`.
 */

const id = 'css-focus-indicator-suppressed';

const meta = {
  title: 'Focus indicator must not be removed without a replacement',
  description:
    'Flags elements in the tab order whose focus outline is removed, by a :focus/:focus-visible rule or by a rule with no state such as a { outline: none }, with no replacement indicator (border, box-shadow, background, ...) in any focus rule matching them.',
  i18n: {
    titleKey: 'cssFocusIndicatorSuppressed_title',
    descriptionKey: 'cssFocusIndicatorSuppressed_description'
  },
  helpUrl: null,
  tags: [
    'wcag2aa',
    'wcag21aa',
    'wcag1411',
    'wcag247',
    'wcag22aaa',
    'wcag2413',
    'navigation',
    'focus',
    'css',
    'atomic',
    'manual'
  ],
  wcagSc: ['1.4.11', '2.4.7', '2.4.13'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.4.11',
      title: 'Non-text Contrast',
      conformanceLevel: 'AA'
    },
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.4.7',
      title: 'Focus Visible',
      conformanceLevel: 'AA'
    },
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.4.13',
      title: 'Focus Appearance',
      conformanceLevel: 'AAA'
    }
  ],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {
    facetsBySc: {
      '1.4.11': ['focus-indicator-not-suppressed'],
      '2.4.7': ['focus-indicator-not-suppressed'],
      '2.4.13': ['focus-indicator-not-suppressed']
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  // Declared inside runInPage; see scripts/build-core.js header
  // ("runInPage MUST be self-contained").
  const CSS_STYLE_RULE = 1;

  // Properties whose presence in a focus rule changes what the user sees.
  // `outline` is handled separately, since the same property is both the
  // suppression and the most common replacement.
  const REPLACEMENT_PROPS = [
    'background',
    'background-color',
    'background-image',
    'border',
    'border-color',
    'border-style',
    'border-width',
    'border-top',
    'border-right',
    'border-bottom',
    'border-left',
    'border-radius',
    'box-shadow',
    'color',
    'content',
    'filter',
    'font-weight',
    'opacity',
    'text-decoration',
    'text-decoration-line',
    'text-decoration-color',
    'text-shadow',
    'transform'
  ];

  const MAX_DEPTH = 10;

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }

  function lower(v) {
    return trim(v).toLowerCase();
  }

  function getProp(style, name) {
    if (!style) return '';
    try {
      if (typeof style.getPropertyValue === 'function') return lower(style.getPropertyValue(name));
    } catch {
      return '';
    }
    return '';
  }

  function isZeroLength(v) {
    return /^0(\.0+)?(px|em|rem|pt|pc|in|cm|mm|ex|ch|vw|vh|vmin|vmax|%)?$/.test(v);
  }

  // outline: none | 0 | transparent, in shorthand or longhand form.
  function suppressesOutline(style) {
    const outlineStyle = getProp(style, 'outline-style');
    if (outlineStyle === 'none' || outlineStyle === 'hidden') return true;

    const outlineWidth = getProp(style, 'outline-width');
    if (outlineWidth && isZeroLength(outlineWidth)) return true;

    if (getProp(style, 'outline-color') === 'transparent') return true;

    const outline = getProp(style, 'outline');
    if (outline) {
      const tokens = outline.split(/\s+/).filter(Boolean);
      for (const token of tokens) {
        if (token === 'none' || token === 'hidden' || token === 'transparent') return true;
        if (isZeroLength(token)) return true;
      }
    }
    return false;
  }

  // An outline is drawn with a style, a width and a color: what a rule
  // takes away of the three, and what one gives back. A rule setting only
  // `outline-color` or `outline-width` draws nothing where the outline's
  // style is still none: after `outline: none`, `a:focus { outline-color:
  // red }` leaves the link without an outline. A shorthand sets all three,
  // and resets the style it leaves out to none. Values as CSSOM gives them:
  // a browser expands a shorthand into its longhands ("initial" for what it
  // leaves out), jsdom keeps only the shorthand.
  const OUTLINE_STYLES = /^(auto|solid|dotted|dashed|double|groove|ridge|inset|outset)$/;
  const OUTLINE_STYLE_GONE = /^(none|hidden|initial|unset)$/;
  function outlineParts(style) {
    const outline = getProp(style, 'outline');
    const tokens = outline && !CSS_WIDE.test(outline) ? valueTokens(outline) : [];
    const styleOf = getProp(style, 'outline-style');
    const width = getProp(style, 'outline-width');
    const color = getProp(style, 'outline-color');
    const kills = new Set();
    const gives = new Set();
    if (
      styleOf
        ? OUTLINE_STYLE_GONE.test(styleOf)
        : outline && !tokens.some((t) => OUTLINE_STYLES.test(t))
    )
      kills.add('style');
    if (styleOf ? OUTLINE_STYLES.test(styleOf) : tokens.some((t) => OUTLINE_STYLES.test(t)))
      gives.add('style');
    if (width ? isZeroLength(width) : tokens.some(isZeroLength)) kills.add('width');
    else if (width || tokens.length) gives.add('width');
    if (color ? isClearColor(color) : tokens.some(isClearColor)) kills.add('color');
    else if (color || tokens.length) gives.add('color');
    return { kills, gives };
  }

  // A positive outline counts as a replacement: `*:focus { outline: none }`
  // followed by `a:focus { outline: 2px solid }` leaves links indicated.
  // Whether it is drawn on a given element depends on what removed that
  // element's outline (outlineParts): see drawingDecls.
  function drawsOutline(style) {
    if (suppressesOutline(style)) return false;
    return !!(
      getProp(style, 'outline') ||
      getProp(style, 'outline-style') ||
      getProp(style, 'outline-width') ||
      getProp(style, 'outline-color')
    );
  }

  // CSS-wide keywords put back a value from elsewhere; they draw nothing of
  // their own a person could tell from the unfocused element.
  const CSS_WIDE = /^(inherit|initial|unset|revert|revert-layer)$/;

  function parseColor(v) {
    const c = helpers.contrast;
    if (!c || typeof c.parseCssColorToRgba !== 'function') return null;
    try {
      return c.parseCssColorToRgba(v) || null;
    } catch {
      return null;
    }
  }

  function isClearColor(v) {
    if (v === 'transparent') return true;
    const parsed = /^(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/.test(v) ? parseColor(v) : null;
    return !!parsed && parsed.a === 0;
  }

  // Splits a value on spaces outside parentheses: "0 0 0 2px rgb(0, 0, 0)".
  function valueTokens(v) {
    const tokens = [];
    let depth = 0;
    let current = '';
    for (const ch of v) {
      if (ch === '(') depth += 1;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (depth === 0 && /\s/.test(ch)) {
        if (current) tokens.push(current);
        current = '';
        continue;
      }
      current += ch;
    }
    if (current) tokens.push(current);
    return tokens;
  }

  // A box-shadow or text-shadow layer draws something when its color isn't
  // clear and it reaches past the box or the glyphs: an offset, a blur or
  // a positive spread. `0 0 0 0 red` and `0 0 0 3px transparent` draw
  // nothing. A layer with var() in it is read where the element is known
  // (drawingDecls).
  function shadowLayerDraws(layer) {
    const tokens = valueTokens(trim(layer));
    if (!tokens.length) return false;
    if (tokens.some((t) => /^var\(/.test(t))) return true;
    if (tokens.some((t) => isClearColor(t))) return false;
    const lengths = tokens
      .filter((t) => /^-?(\d*\.?\d+)([a-z%]*)$/.test(t))
      .map((t) => Number.parseFloat(t));
    if (lengths.length < 2) return true;
    const [x, y, blur = 0, spread = 0] = lengths;
    return x !== 0 || y !== 0 || blur > 0 || spread > 0;
  }

  // Whether a declared value can draw anything at all, whatever the element
  // looked like before: `box-shadow: none`, `background: transparent` and
  // `border: 0` are written as focus styles but paint nothing, so they are
  // no replacement for the outline they sit next to.
  function valueCanDraw(prop, value) {
    if (!value || CSS_WIDE.test(value)) return false;
    const tokens = valueTokens(value.replace(/\s*!important$/, ''));
    if (!tokens.length) return false;
    switch (prop) {
      case 'box-shadow':
      case 'text-shadow':
        return value !== 'none' && splitArgs(value).some(shadowLayerDraws);
      case 'filter':
      case 'transform':
      case 'background-image':
        return value !== 'none';
      case 'content':
        return !/^(none|normal|""|'')$/.test(value);
      case 'background':
      case 'background-color':
        return !tokens.every((t) => t === 'none' || isClearColor(t));
      case 'border-radius':
        return !tokens.every((t) => t === '/' || isZeroLength(t));
      case 'color':
      case 'text-decoration-color':
      case 'border-color':
        return !tokens.every((t) => t === 'currentcolor' || isClearColor(t));
      case 'border':
      case 'border-style':
      case 'border-width':
      case 'border-top':
      case 'border-right':
      case 'border-bottom':
      case 'border-left':
        // No line is drawn without a width and a style, nor in a clear colour.
        return !tokens.some(
          (t) => t === 'none' || t === 'hidden' || isZeroLength(t) || isClearColor(t)
        );
      default:
        return true;
    }
  }

  // The replacement declarations a focus rule makes: those whose value can
  // draw something. A positive outline is one of them.
  function replacementDecls(style) {
    const decls = [];
    if (drawsOutline(style)) {
      decls.push({
        prop: 'outline',
        value: getProp(style, 'outline'),
        gives: outlineParts(style).gives
      });
    }
    // A border needs a width, a style and a colour: when the rule clears any
    // one of them, its other border longhands draw nothing either.
    const borderGone = ['border', 'border-color', 'border-style', 'border-width'].some((prop) => {
      const value = getProp(style, prop);
      return !!value && !CSS_WIDE.test(value) && !valueCanDraw(prop, value);
    });
    for (const prop of REPLACEMENT_PROPS) {
      if (borderGone && /^border-(?!radius)|^border$/.test(prop)) continue;
      const value = getProp(style, prop);
      if (valueCanDraw(prop, value)) decls.push({ prop, value });
    }
    return decls;
  }

  // Splits a selector list on top-level commas only, so a comma inside
  // :not(...)/:is(...) does not break a selector in half.
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
    if (trim(current)) parts.push(current);
    return parts.map(trim).filter(Boolean);
  }

  // :focus and :focus-visible. :focus-within holds on the focused element's
  // ancestors as well, and is read apart (ancestorFocusForm).
  const FOCUS_PSEUDO = /:focus(-visible)?(?![-\w])/g;

  function hasFocusPseudo(part) {
    FOCUS_PSEUDO.lastIndex = 0;
    return FOCUS_PSEUDO.test(part);
  }

  // Splits a complex selector into its compounds, keeping the combinators
  // out: "a:focus + .indicator" -> ["a:focus", ".indicator"]. Descendant
  // combinators inside :not(...)/:is(...) are left alone.
  function splitCompounds(part) {
    const compounds = [];
    let depth = 0;
    let current = '';
    for (const ch of part) {
      if (ch === '(') depth += 1;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (depth === 0 && (ch === ' ' || ch === '>' || ch === '+' || ch === '~')) {
        if (trim(current)) compounds.push(trim(current));
        current = '';
        continue;
      }
      current += ch;
    }
    if (trim(current)) compounds.push(trim(current));
    return compounds;
  }

  // Splits on top-level commas, keeping empty items.
  function splitArgs(text) {
    const args = [];
    let depth = 0;
    let current = '';
    for (const ch of text) {
      if (ch === '(') depth += 1;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (ch === ',' && depth === 0) {
        args.push(current);
        current = '';
        continue;
      }
      current += ch;
    }
    args.push(current);
    return args;
  }

  const MATCHES_ANY = /^:(is|where|matches|-webkit-any)\(/i;

  // The selector with :focus and :focus-visible taken out, as it reads while
  // the element has focus. Inside :is()/:where() (`a:is(:focus, :hover)`), an
  // argument left empty is one the focused element meets, so the whole
  // pseudo-class goes; a non-empty one stays as written.
  function dropFocus(sel) {
    let out = '';
    let rest = '';
    let i = 0;
    while (i < sel.length) {
      const m = sel[i] === ':' ? MATCHES_ANY.exec(sel.slice(i)) : null;
      if (!m) {
        rest += sel[i];
        i += 1;
        continue;
      }
      out += rest.replace(FOCUS_PSEUDO, '');
      rest = '';
      const start = i + m[0].length;
      let depth = 1;
      let j = start;
      for (; j < sel.length && depth; j++) {
        if (sel[j] === '(') depth += 1;
        else if (sel[j] === ')') depth -= 1;
      }
      const inner = sel.slice(start, depth ? j : j - 1);
      let met = false;
      const args = splitArgs(inner).map((arg) => {
        const raw = dropFocus(arg);
        const kept = trim(raw);
        if (trim(arg) && !kept) met = true;
        // `:is(.menu :focus)` keeps its combinator: `.menu *`.
        return kept && /[\s>+~]:focus(-visible)?$/i.test(trim(arg)) ? `${kept} *` : kept;
      });
      if (!met) out += `${m[0]}${args.filter(Boolean).join(', ')})`;
      i = j;
    }
    return out + rest.replace(FOCUS_PSEUDO, '');
  }

  function stripFocusPseudo(compound) {
    const stripped = trim(dropFocus(String(compound)));
    return stripped || '*';
  }

  // A pseudo-element part styles generated content rather than the element,
  // so it can draw a replacement but can never be the thing suppressing the
  // element's own outline.
  function hasPseudoElement(part) {
    return /::[a-z-]+/.test(part) || /:(before|after)\b/.test(part);
  }

  function matchesSafe(el, selector) {
    if (!el || typeof dom.get(el, 'matches') !== 'function' || !selector) return false;
    try {
      return dom.matches(el, selector);
    } catch {
      return false; // selector this engine cannot parse, skip rather than guess
    }
  }

  function closestSafe(el, selector) {
    if (!el || typeof dom.get(el, 'closest') !== 'function' || !selector) return false;
    try {
      return !!dom.closest(el, selector);
    } catch {
      return false;
    }
  }

  const suppressors = []; // { selector, base, also, sheet, kills, scope }
  // The style sheet being read, for the message to say where a rule is.
  let currentSheet = null;
  // The open shadow root whose style sheet is being read, or null for the
  // document's: a shadow root's sheets style only the elements in it.
  let currentScope = null;
  const providers = []; // { base, subject, own, decls, scope }
  // :focus-within and :has(:focus) rules that draw something: the compound
  // holding the pseudo, without it. Read only for the lean, never to pass
  // an element.
  const withinProviders = []; // { base, scope }
  const FOCUS_WITHIN = /:focus-within(?![-\w])/g;
  const HAS_START = /:has\(/gi;

  // The :has() pseudo-classes in a compound whose argument names a focus
  // state (`:has(:focus)`, `:has(> a:focus-visible)`), each as
  // { text, arg }, where arg is the argument as written.
  function focusHasOf(compound) {
    const out = [];
    HAS_START.lastIndex = 0;
    let m;
    while ((m = HAS_START.exec(compound))) {
      const start = m.index + m[0].length;
      let depth = 1;
      let j = start;
      for (; j < compound.length && depth; j++) {
        if (compound[j] === '(') depth += 1;
        else if (compound[j] === ')') depth -= 1;
      }
      const arg = compound.slice(start, depth ? j : j - 1);
      if (hasFocusPseudo(arg) || /:focus-within(?![-\w])/.test(arg))
        out.push({ text: compound.slice(m.index, j), arg });
      HAS_START.lastIndex = j;
    }
    return out;
  }
  const scopeOk = (x, el) => !x.scope || treeOf(el) === x.scope;

  // A rule whose focus state is on an ancestor of its subject
  // (`main:focus-within a`, `main:has(a:focus) a`), or on the subject as
  // :focus-within, read as it applies while the subject has focus: the
  // ancestors the subject is inside are in the focus-within state, and a
  // :has() of a focus state holds when the subject matches its argument.
  // Returns { base, also } (the selector without those states, and the
  // arguments the subject must match), or null. Only states reached
  // through descendant and child combinators are read: a sibling's
  // :focus-within says nothing of the subject's focus.
  function ancestorFocusForm(part) {
    if (!/:focus-within(?![-\w])|:has\(/i.test(part)) return null;
    const pieces = splitWithCombinators(part);
    const also = [];
    let changed = false;
    for (let i = 0; i < pieces.length; i++) {
      let compound = pieces[i].compound;
      const within = /:focus-within(?![-\w])/.test(compound);
      const has = i < pieces.length - 1 ? focusHasOf(compound) : [];
      if (!within && !has.length) continue;
      if (/:not\([^)]*:focus-within/i.test(compound)) return null;
      for (let k = i + 1; k < pieces.length; k++) {
        if (!/^[\s>]+$/.test(pieces[k].comb)) return null;
      }
      FOCUS_WITHIN.lastIndex = 0;
      compound = compound.replace(FOCUS_WITHIN, '');
      for (const h of has) {
        const arg = trim(dropFocus(h.arg).replace(FOCUS_WITHIN, ''));
        if (/^[+~]/.test(arg) || splitArgs(h.arg).length > 1) return null;
        also.push(trim(arg.replace(/^>\s*/, '')) || '*');
        compound = compound.replace(h.text, '');
      }
      pieces[i].compound = trim(compound) || '*';
      changed = true;
    }
    if (!changed) return null;
    return { base: dropFocus(pieces.map((p) => p.comb + p.compound).join('')), also };
  }

  // The focus-visible polyfill (WICG) marks keyboard focus with a class,
  // `.focus-visible`, and the scope it runs in with `.js-focus-visible`
  // (or the attributes `data-focus-visible-added` and
  // `data-js-focus-visible`). Under that scope, `:not(.focus-visible)` says
  // what native `:not(:focus-visible)` says, and is read the same way when
  // it removes the outline. Only those exact names, and only in a compound
  // the scope's own compound contains (descendant or child), count.
  const POLYFILL_FORMS = [
    {
      scope: /\.js-focus-visible(?![-\w])/,
      not: /:not\(\s*\.focus-visible\s*\)/g
    },
    {
      scope: /\[\s*data-js-focus-visible\s*\]/,
      not: /:not\(\s*\[\s*data-focus-visible-added\s*\]\s*\)/g
    }
  ];

  // A selector split into compounds, each with the combinator text before
  // it, so it can be put back together unchanged.
  function splitWithCombinators(part) {
    const pieces = [];
    let depth = 0;
    let comb = '';
    let current = '';
    for (const ch of part) {
      if (ch === '(') depth += 1;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (depth === 0 && (ch === ' ' || ch === '>' || ch === '+' || ch === '~')) {
        if (current) {
          pieces.push({ comb, compound: current });
          comb = '';
          current = '';
        }
        comb += ch;
        continue;
      }
      current += ch;
    }
    if (current) pieces.push({ comb, compound: current });
    return pieces;
  }

  function polyfillAsNative(part) {
    if (!/focus-visible/.test(part)) return part;
    let pieces = null;
    let changed = false;
    for (const form of POLYFILL_FORMS) {
      if (!form.scope.test(part)) continue;
      pieces = pieces || splitWithCombinators(part);
      const scopeAt = pieces.findIndex((p) => form.scope.test(p.compound));
      if (scopeAt === -1 || scopeAt === pieces.length - 1) continue;
      // Under the scope: a descendant or child of it, not a sibling.
      if (!/^[\s>]+$/.test(pieces[scopeAt + 1].comb)) continue;
      for (let i = scopeAt + 1; i < pieces.length; i++) {
        form.not.lastIndex = 0;
        if (!form.not.test(pieces[i].compound)) continue;
        form.not.lastIndex = 0;
        pieces[i].compound = pieces[i].compound.replace(form.not, ':not(:focus-visible)');
        changed = true;
      }
    }
    return changed ? pieces.map((p) => p.comb + p.compound).join('') : part;
  }

  function collectFromStyleRule(style, selectorText) {
    if (!style || !selectorText) return;

    const suppresses = suppressesOutline(style);
    const decls = replacementDecls(style);
    const provides = decls.length ? decls : null;
    if (!suppresses && !provides) return;
    const kills = suppresses ? outlineParts(style).kills : null;

    const parts = splitSelectorList(selectorText);
    // A selector list with one selector the browser can't parse is invalid
    // as a whole, and a browser drops the rule (`button:-moz-focusring,
    // button:focus` in Chromium). jsdom keeps it in its style sheets: test
    // the list as the browser parsed it.
    if (parts.length > 1 && !validSelectorList(selectorText)) return;

    for (const part of parts) {
      // The polyfill's form is read as native :not(:focus-visible) for the
      // outline it removes; what the same rule draws is read as written.
      const asNative = suppresses ? polyfillAsNative(part) : part;
      if (asNative !== part) {
        collectFromPart(asNative, true, false, kills);
        collectFromPart(part, false, provides, kills);
      } else {
        collectFromPart(part, suppresses, provides, kills);
      }
    }
  }

  // A browser has already dropped a rule whose selector list it can't
  // parse, so only a DOM without CSS.supports (jsdom) is tested, by a query
  // that compiles the whole list: jsdom's matches() can return before it
  // reaches the selector it can't parse.
  const validLists = new Map();
  const parsedByBrowser = (() => {
    try {
      const v = dom.defaultView(document);
      // Read directly: an element named CSS can shadow it, which only
      // costs the query below.
      const css = v ? v.CSS : null;
      return !!css && typeof css.supports === 'function';
    } catch {
      return false;
    }
  })();
  function validSelectorList(selectorText) {
    // Only a vendor-prefixed pseudo-class or pseudo-element (`:-moz-…`,
    // `::-webkit-…`) is parsed by one and not the other: a list without one
    // is not queried, which in jsdom walks the whole document.
    if (parsedByBrowser || !/::?-/.test(selectorText)) return true;
    if (validLists.has(selectorText)) return validLists.get(selectorText);
    let valid = true;
    try {
      dom.querySelector(document, selectorText);
    } catch {
      valid = false;
    }
    validLists.set(selectorText, valid);
    return valid;
  }
  // The selector as quoted in the message, serialized as browsers do: a
  // universal selector before another simple selector is left out
  // (`*:focus` reads `:focus`), as Chromium already gives it.
  function quotedSelector(part) {
    return trim(part).replace(/(^|[\s>+~(,])\*(?=[:.#[])/g, '$1');
  }

  function collectFromPart(part, suppresses, provides, kills) {
    // `:not(:focus-visible)` leaves the outline on keyboard focus: what such
    // a rule removes is only the mouse's focus ring, so it is never a
    // suppressor.
    if (suppresses && /:not\(\s*:focus-visible\s*\)/.test(part)) suppresses = false;
    // `:not(:focus-within)` no longer holds once the element inside has
    // focus: the rule removes nothing then.
    if (suppresses && /:not\(\s*:focus-within\s*\)/.test(part)) suppresses = false;
    if (provides && /:focus-within(?![-\w])|:has\(/i.test(part)) {
      for (const compound of splitCompounds(part)) {
        let base = compound;
        const has = focusHasOf(compound);
        if (!/:focus-within(?![-\w])/.test(compound) && !has.length) continue;
        for (const h of has) base = base.replace(h.text, '');
        FOCUS_WITHIN.lastIndex = 0;
        withinProviders.push({
          base: trim(base.replace(FOCUS_WITHIN, '')) || '*',
          scope: currentScope
        });
      }
    }
    // A focus state on an ancestor (or :focus-within on the subject) that
    // removes the subject's outline while it has focus.
    if (suppresses && !hasPseudoElement(part)) {
      const form = ancestorFocusForm(part);
      if (form) {
        suppressors.push({
          selector: quotedSelector(part),
          base: form.base,
          also: form.also,
          sheet: currentSheet,
          kills,
          scope: currentScope
        });
        suppresses = false;
      }
    }
    if (!hasFocusPseudo(part)) {
      // A rule with no focus state still applies while the element has
      // focus, and an author declaration beats the user agent's focus
      // outline. Other states (:hover, :active) never match the static
      // element, so el.matches() leaves them out below.
      if (suppresses && !hasPseudoElement(part)) {
        suppressors.push({
          selector: quotedSelector(part),
          base: trim(part),
          sheet: currentSheet,
          kills,
          scope: currentScope
        });
      }
      return;
    }

    const compounds = splitCompounds(part);
    let focusIndex = -1;
    for (let i = 0; i < compounds.length; i++) {
      if (hasFocusPseudo(compounds[i])) {
        focusIndex = i;
        break;
      }
    }
    if (focusIndex === -1) return;

    const isSubject = focusIndex === compounds.length - 1;
    const focusedBase = stripFocusPseudo(compounds[focusIndex]).replace(/::?[a-z-]+$/i, '') || '*';

    if (suppresses && isSubject && !hasPseudoElement(part)) {
      suppressors.push({
        selector: quotedSelector(part),
        base: stripFocusPseudo(part),
        sheet: currentSheet,
        kills,
        scope: currentScope
      });
    }

    // A replacement is credited to the element that takes focus, wherever
    // the rule paints it: on the element itself, its pseudo-element, a
    // sibling, or a descendant. `own` marks a rule styling the element
    // itself, whose values can be held against how it looks unfocused.
    if (provides) {
      providers.push({
        base: focusedBase,
        subject: isSubject,
        own: isSubject && !hasPseudoElement(part),
        decls: provides,
        scope: currentScope
      });
    }
  }

  // A nested rule's selector, resolved against its parent's: `&` stands for
  // the parent, and a selector without one is a descendant of it.
  function resolveNested(selectorText, parentSelector) {
    const sel = trim(selectorText);
    if (!parentSelector) return sel;
    const parent = ':is(' + parentSelector + ')';
    return sel.includes('&') ? sel.split('&').join(parent) : parent + ' ' + sel;
  }

  function readRules(cssRule) {
    try {
      return cssRule.cssRules || null;
    } catch {
      return null;
    }
  }

  function conditionApplies(x) {
    return typeof helpers.cssConditionApplies === 'function'
      ? helpers.cssConditionApplies(x)
      : true;
  }

  function walkRules(rules, depth, parentSelector) {
    if (!rules || depth > MAX_DEPTH) return;
    for (const cssRule of rules) {
      // @media print and the like style nothing on the screen scanned.
      if (!cssRule || !conditionApplies(cssRule)) continue;
      const nested = readRules(cssRule);
      if (cssRule.type === CSS_STYLE_RULE && cssRule.selectorText) {
        // CSS nesting: `a { &:focus { outline: none } }`.
        const selectorText = resolveNested(cssRule.selectorText, parentSelector);
        collectFromStyleRule(cssRule.style, selectorText);
        if (nested && nested.length) walkRules(nested, depth + 1, selectorText);
        continue;
      }
      // Declarations nested straight inside an at-rule within a style rule
      // (`a:focus { @media (hover) { outline: none } }`) belong to that
      // style rule's selector.
      if (parentSelector && cssRule.style && !cssRule.selectorText && !nested) {
        collectFromStyleRule(cssRule.style, parentSelector);
        continue;
      }
      // @media, @supports, @layer, ...: recurse into grouping rules.
      if (nested) walkRules(nested, depth + 1, parentSelector);
    }
  }

  const CANDIDATE_SELECTOR =
    'a[href],area[href],button,input,select,textarea,summary,[tabindex],[contenteditable]';
  const candidates = helpers.queryAllSmart
    ? helpers.queryAllSmart(CANDIDATE_SELECTOR)
    : helpers.queryAll(CANDIDATE_SELECTOR);

  // The open shadow roots the candidates are in: their style sheets, and
  // the sheets they adopt, style the elements in them (and only those).
  const shadowScopes = [];
  {
    const seen = new Set();
    for (const el of candidates) {
      const tree = el ? treeOf(el) : null;
      if (!tree || seen.has(tree) || dom.nodeType(tree) !== 11) continue;
      seen.add(tree);
      shadowScopes.push(tree);
    }
  }
  // A root's style sheets, then those it adopts. jsdom gives a shadow root
  // no styleSheets list: its <style> elements are read instead.
  const sheetsOf = (root) => {
    const out = [];
    try {
      const list = root === document ? dom.styleSheets(document) : dom.get(root, 'styleSheets');
      if (list) for (const sheet of list) out.push(sheet);
      else
        for (const style of dom.querySelectorAll(root, 'style')) {
          let sheet = style.sheet;
          // Nor does it parse a shadow root's <style> into a sheet: its text
          // is parsed into a constructed one.
          if (!sheet) {
            const view = dom.defaultView(document);
            const Sheet = view ? view.CSSStyleSheet : null;
            if (typeof Sheet === 'function') {
              sheet = new Sheet();
              sheet.replaceSync(String(dom.textContent(style) || ''));
            }
          }
          if (sheet) out.push(sheet);
        }
    } catch {}
    try {
      for (const sheet of dom.get(root, 'adoptedStyleSheets') || []) out.push(sheet);
    } catch {}
    return out;
  };

  let sheetCount = 0;
  let unreadableSheets = 0;
  try {
    const scoped = [];
    for (const sheet of sheetsOf(document)) scoped.push([sheet, null]);
    for (const root of shadowScopes) for (const sheet of sheetsOf(root)) scoped.push([sheet, root]);
    for (const [sheet, scope] of scoped) {
      if (!conditionApplies(sheet)) continue;
      // Another origin's sheet: its text from engineOptions.styleSheetTexts, if
      // given (helpers.cssRulesOf), as css-hidden-focus reads it; otherwise
      // not inspectable.
      let rules = null;
      try {
        rules = helpers.cssRulesOf ? helpers.cssRulesOf(sheet) : sheet && sheet.cssRules;
      } catch {
        unreadableSheets += 1;
        continue;
      }
      if (!rules) {
        unreadableSheets += 1;
        continue;
      }
      sheetCount += 1;
      currentSheet = sheet;
      currentScope = scope;
      walkRules(rules, 0, '');
      currentSheet = null;
      currentScope = null;
    }
  } catch {
    // no-throw: treat as no accessible stylesheets
  }

  if (sheetCount === 0 || !suppressors.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // Where a sheet is, for the message: { href } for a linked or imported
  // sheet, { index } for the page's nth <style> element, or null. Read once
  // per sheet.
  const sheetPlaces = new Map();
  let styleElements = null;
  function sheetPlace(sheet) {
    if (!sheet) return null;
    if (sheetPlaces.has(sheet)) return sheetPlaces.get(sheet);
    let place = null;
    try {
      // A style sheet is no element a page's markup can shadow, so its
      // ownerNode is read as dom-helpers reads it.
      const owner = sheet.ownerNode;
      const tag =
        owner && dom.nodeType(owner) === 1 ? String(dom.localName(owner) || '').toLowerCase() : '';
      if (tag === 'style') {
        if (!styleElements) styleElements = [...dom.querySelectorAll(document, 'style')];
        const index = styleElements.indexOf(owner) + 1;
        if (index > 0) place = { index };
      } else {
        const href = trim(
          (tag === 'link' ? dom.getAttribute(owner, 'href') : '') || dom.get(sheet, 'href') || ''
        );
        if (href) place = { href: href.length > 100 ? `${href.slice(0, 99)}…` : href };
      }
    } catch {
      place = null;
    }
    sheetPlaces.set(sheet, place);
    return place;
  }

  const getFocusableInfo =
    helpers && typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;
  const isDomVisibleEligible =
    helpers && typeof helpers.isDomVisibleEligible === 'function'
      ? helpers.isDomVisibleEligible
      : null;

  function isTabbable(el) {
    if (!getFocusableInfo) return false;
    try {
      const info = getFocusableInfo(el, ctx);
      return !!(info && info.tabbable);
    } catch {
      return false;
    }
  }

  function isRendered(el) {
    if (!isDomVisibleEligible) return true;
    try {
      const vis = isDomVisibleEligible(el, ctx, {
        visibilityMode: 'styleOnly',
        disableGeometry: true
      });
      return !(vis && vis.eligible === false);
    } catch {
      return true;
    }
  }

  // Focus listeners the listener hook saw, on the element, an ancestor, the
  // document or the window: a script may draw the indicator from one.
  const FOCUS_EVENT_TYPES = ['focus', 'focusin', 'blur', 'focusout'];
  function hookInfo(target) {
    try {
      return typeof helpers.getEventListenerInfo === 'function'
        ? helpers.getEventListenerInfo(target, FOCUS_EVENT_TYPES)
        : { hook: 'none', listens: false };
    } catch {
      return { hook: 'none', listens: false };
    }
  }
  const view = dom.defaultView ? dom.defaultView(document) : null;
  const pageFocusListener = hookInfo(document).listens || (view ? hookInfo(view).listens : false);
  function scriptFocusListener(el) {
    if (pageFocusListener) return true;
    for (let a = el, i = 0; a && i < 500; a = dom.parentElement(a), i++) {
      if (hookInfo(a).listens) return true;
    }
    return false;
  }
  const INLINE_FOCUS_HANDLERS = '[onfocus], [onfocusin], [onblur], [onfocusout]';

  // Whether a declared value is what the element already shows unfocused:
  // `a:focus { text-decoration: none }` on a link with no underline changes
  // nothing. Only values that read back plainly are compared; anything else
  // counts as a change, as before.
  function sameAsUnfocused(cs, prop, value) {
    const now = (name) => getProp(cs, name);
    if (prop === 'text-decoration' || prop === 'text-decoration-line') {
      // Some environments only fill in the shorthand, so both are read.
      const line = now('text-decoration-line');
      const LINES = ['underline', 'overline', 'line-through'];
      const shown = LINES.filter((l) =>
        new RegExp(l).test(line && line !== 'none' ? line : now('text-decoration'))
      );
      if (value === 'none') return !shown.length;
      // The lines it already shows, in its own color and solid: `a:focus {
      // text-decoration: underline }` on an underlined link.
      const tokens = valueTokens(value);
      if (!tokens.every((t) => LINES.includes(t))) return false;
      const style = now('text-decoration-style');
      const color = now('text-decoration-color');
      return (
        tokens.length === shown.length &&
        tokens.every((t) => shown.includes(t)) &&
        (!style || style === 'solid') &&
        (!color || color === 'currentcolor' || color === now('color'))
      );
    }
    if (prop === 'font-weight') {
      const weight = (v) => (v === 'normal' ? '400' : v === 'bold' ? '700' : v);
      return weight(value) === weight(now('font-weight'));
    }
    if (prop === 'opacity') {
      return parseFloat(value) === parseFloat(now('opacity') || '1');
    }
    if (prop === 'color' || prop === 'background-color' || prop === 'background') {
      if (prop === 'background' && now('background-image') && now('background-image') !== 'none') {
        return false;
      }
      const declared = parseColor(value);
      const current = parseColor(now(prop === 'color' ? 'color' : 'background-color'));
      return (
        !!declared &&
        !!current &&
        ['r', 'g', 'b', 'a'].every((k) => Math.abs((declared[k] || 0) - (current[k] || 0)) < 0.01)
      );
    }
    return false;
  }

  // A value with var() in it, with each custom property as the element
  // reads it (or the fallback written there); the value as written where
  // one can't be read, since it may still draw.
  function resolveVars(cs, value) {
    if (!cs || !/var\(/.test(value)) return value;
    let out = value;
    for (let i = 0; i < 20 && /var\(/.test(out); i++) {
      const m = /var\(\s*(--[\w-]+)\s*(?:,([^()]*(?:\([^()]*\)[^()]*)*))?\)/.exec(out);
      if (!m) return value;
      const own = getProp(cs, m[1]);
      const fallback = m[2] != null ? trim(m[2]) : '';
      const used = own || fallback;
      if (!used) return value;
      out = out.slice(0, m.index) + used + out.slice(m.index + m[0].length);
    }
    return /var\(/.test(out) ? value : lower(out);
  }

  const BORDER_COLORS = /^border(-(top|right|bottom|left))?-color$|^border-width$/;
  // The declarations of a focus rule that draw something on this element:
  // a var() read as the element reads it; an outline only where it gives
  // back all the element's outline lost (its style, after `outline: none`);
  // on the element itself, a border color or width only where the element
  // has a border, or the rule gives it one.
  function drawingDecls(el, p, killed) {
    let cs = null;
    try {
      cs = typeof helpers.computedStyle === 'function' ? helpers.computedStyle(el) : null;
    } catch {
      cs = null;
    }
    const givesBorderStyle = p.decls.some(
      (d) => d.prop === 'border-style' || /^border(-(top|right|bottom|left))?$/.test(d.prop)
    );
    const hasBorder =
      !cs ||
      ['top', 'right', 'bottom', 'left'].some((side) => {
        const style = getProp(cs, `border-${side}-style`);
        return style && style !== 'none' && style !== 'hidden';
      });
    const out = [];
    for (const d of p.decls) {
      if (d.prop === 'outline') {
        if ([...killed].every((k) => d.gives.has(k))) out.push(d);
        continue;
      }
      const value = resolveVars(cs, d.value);
      if (value !== d.value && !valueCanDraw(d.prop, value)) continue;
      if (p.own && BORDER_COLORS.test(d.prop) && !hasBorder && !givesBorderStyle) continue;
      out.push(value === d.value ? d : { prop: d.prop, value });
    }
    return out;
  }

  const activeElement = (() => {
    try {
      return dom.activeElement(document);
    } catch {
      return null;
    }
  })();

  function changesElement(el, decls) {
    // Focused now, its computed style already holds the focus rule's values.
    if (el === activeElement) return true;
    let cs = null;
    try {
      cs = typeof helpers.computedStyle === 'function' ? helpers.computedStyle(el) : null;
    } catch {
      cs = null;
    }
    if (!cs) return true;
    return decls.some((d) => !sameAsUnfocused(cs, d.prop, d.value));
  }

  // Every suppressor tested against each element costs rules x elements.
  // In a browser, the selectors that parse on their own, and whose text can't run into
  // the next one's (balanced brackets and quotes, no comment, no trailing
  // escape), are tested as one list first: an element none of them matches
  // is tested against the others only. The rules are read one by one only
  // on a hit.
  function standsAlone(sel) {
    if (!sel || sel.includes('/*') || /\\$/.test(sel)) return false;
    let depth = 0;
    let quote = '';
    for (let i = 0; i < sel.length; i++) {
      const ch = sel[i];
      if (ch === '\\') {
        i += 1;
        continue;
      }
      if (quote) {
        if (ch === quote) quote = '';
      } else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === '(' || ch === '[') depth += 1;
      else if (ch === ')' || ch === ']') {
        depth -= 1;
        if (depth < 0) return false;
      }
    }
    return depth === 0 && !quote;
  }
  const probe = document ? dom.documentElement(document) : null;
  // The list and the tree queries run only in a browser (a page with a
  // layout): there, a call with one of hundreds of selectors costs a parse
  // each time. jsdom keeps each selector compiled and walks the tree in
  // script, so a list or one query per selector over the tree costs it more
  // than testing the elements (measured). jsdom also reports a selector it
  // cannot read only when matching reaches it, and can answer a list
  // differently from its selectors one by one.
  let rendered;
  try {
    const box = probe ? dom.getBoundingClientRect(probe) : null;
    rendered = !!box && (box.width > 0 || box.height > 0);
  } catch {
    rendered = false;
  }
  const listed = new Set();
  for (const s of suppressors) {
    if (!rendered) break;
    // :scope, & and :host read differently from a tree's querySelectorAll
    // than from the element's matches(): tested element by element.
    if (
      listed.has(s.base) ||
      !probe ||
      s.scope ||
      (s.also && s.also.length) ||
      !standsAlone(s.base) ||
      /:scope|&|:host/i.test(s.base)
    )
      continue;
    try {
      dom.matches(probe, s.base);
      listed.add(s.base);
    } catch {
      // Unparseable: matchesSafe reads it as matching nothing.
    }
  }
  let suppressorList = listed.size ? [...listed].join(', ') : '';
  if (suppressorList && probe) {
    try {
      dom.matches(probe, suppressorList);
    } catch {
      suppressorList = '';
      listed.clear();
    }
  }
  const unlisted = suppressors.filter(
    (s) => !listed.has(s.base) || s.scope || (s.also && s.also.length)
  );

  // Which candidates the list matches, and how many in each tree. Where
  // many do, each listed selector is run once over the tree
  // (querySelectorAll) rather than once per element, which a browser has
  // to parse again for each of hundreds of selectors.
  const listHits = new Set();
  const listHitsByTree = new Map();
  function treeOf(el) {
    try {
      return dom.getRootNode(el);
    } catch {
      return null;
    }
  }
  if (suppressorList) {
    for (const el of candidates) {
      if (!el || dom.nodeType(el) !== 1) continue;
      let hit;
      try {
        hit = dom.matches(el, suppressorList);
      } catch {
        hit = true; // the list could not be read here: each selector is tested
      }
      if (!hit) continue;
      listHits.add(el);
      const tree = treeOf(el);
      listHitsByTree.set(tree, (listHitsByTree.get(tree) || 0) + 1);
    }
  }
  const TREE_QUERY_MIN_HITS = rendered ? 8 : Infinity;
  const matchesByTree = new Map();
  function listedMatchesIn(tree) {
    if (matchesByTree.has(tree)) return matchesByTree.get(tree);
    let byBase = null;
    const type = tree ? dom.nodeType(tree) : 0;
    if ((type === 9 || type === 11) && listHitsByTree.get(tree) >= TREE_QUERY_MIN_HITS) {
      byBase = new Map();
      for (const base of listed) {
        try {
          byBase.set(base, new Set(dom.querySelectorAll(tree, base)));
        } catch {
          // Tested element by element instead.
        }
      }
    }
    matchesByTree.set(tree, byBase);
    return byBase;
  }

  const occurrences = [];
  let applicableCount = 0;

  for (const el of candidates) {
    if (!el || dom.nodeType(el) !== 1) continue;
    if (!isTabbable(el)) continue;
    if (!isRendered(el)) continue;

    applicableCount += 1;

    // Many rules share a selector (a framework's reset repeated): each one
    // is tested once per element.
    const listHit = listHits.has(el);
    const byBase = listHit ? listedMatchesIn(treeOf(el)) : null;
    const matched = new Map();
    const suppressing = (listHit ? suppressors : unlisted).filter((s) => {
      if (!scopeOk(s, el)) return false;
      if (s.also && !s.also.every((a) => matchesSafe(el, a))) return false;
      let hit = matched.get(s.base);
      if (hit === undefined) {
        const found = byBase && byBase.get(s.base);
        hit = found ? found.has(el) : matchesSafe(el, s.base);
        matched.set(s.base, hit);
      }
      return hit;
    });
    if (!suppressing.length) continue;

    const killed = new Set();
    for (const s of suppressing) for (const k of s.kills || ['style']) killed.add(k);
    const indicated = providers.some((p) => {
      if (!scopeOk(p, el)) return false;
      if (
        !(p.subject ? matchesSafe(el, p.base) : matchesSafe(el, p.base) || closestSafe(el, p.base))
      )
        return false;
      const decls = drawingDecls(el, p, killed);
      return decls.length > 0 && (!p.own || changesElement(el, decls));
    });
    if (indicated) continue;

    const selectors = [...new Set(suppressing.map((s) => s.selector))];
    // The one sheet the removing rules are in, when they are all in one.
    const sheets = [...new Set(suppressing.map((s) => s.sheet))];
    const place = sheets.length === 1 ? sheetPlace(sheets[0]) : null;
    const eligInfo = helpers.getEligibilityInfo
      ? (() => {
          try {
            return helpers.getEligibilityInfo(el, ctx, { targetSet: 'dom' });
          } catch {
            return null;
          }
        })()
      : null;

    // The lean: nothing the scan can read draws focus another way.
    const inlineHandler = closestSafe(el, INLINE_FOCUS_HANDLERS);
    const focusWithin = withinProviders.some((w) => scopeOk(w, el) && closestSafe(el, w.base));
    const namesFocusVisible = selectors.some((sel) => /focus-visible/i.test(sel));
    const scriptListener = scriptFocusListener(el);
    const leans =
      unreadableSheets === 0 &&
      !inlineHandler &&
      !focusWithin &&
      !namesFocusVisible &&
      !scriptListener;

    occurrences.push(
      helpers.reportOccurrence(el, {
        ...(leans
          ? {
              lean: {
                toward: 'fail',
                why: 'Every style sheet was read and none draws a replacement, and no inline focus handler or :focus-within rule shows focus another way.',
                signals: [
                  { signal: 'suppressing-selectors', value: selectors.join(', ') },
                  { signal: 'unreadable-sheets', value: 0 },
                  { signal: 'inline-focus-handler', value: false },
                  { signal: 'focus-within-rule', value: false },
                  { signal: 'listener-hook', value: hookInfo(el).hook }
                ],
                caution:
                  'A focus style added by a script listener or a class a script toggles is not seen when the listener hook did not run.',
                i18n: {
                  whyKey: 'cssFocusIndicatorSuppressed_lean_why',
                  cautionKey: 'cssFocusIndicatorSuppressed_lean_caution'
                }
              }
            }
          : {}),
        summary: !place
          ? `This element takes a tab stop, and "${selectors.join(', ')}" removes its focus outline with no replacement indicator in any other focus rule matching it.`
          : place.href
            ? `This element takes a tab stop, and "${selectors.join(', ')}" in the style sheet ${place.href} removes its focus outline with no replacement indicator in any other focus rule matching it.`
            : `This element takes a tab stop, and "${selectors.join(', ')}" in <style> element ${place.index} of the page removes its focus outline with no replacement indicator in any other focus rule matching it.`,
        hint: 'Draw a replacement indicator in the same rule (a visible outline, border, box-shadow, or background change), or drop the outline reset. If the indicator is applied from script instead, confirm it appears for keyboard users.',
        i18n: {
          summaryKey: !place
            ? 'cssFocusIndicatorSuppressed_summary_cantTell'
            : place.href
              ? 'cssFocusIndicatorSuppressed_summary_cantTell_inSheet'
              : 'cssFocusIndicatorSuppressed_summary_cantTell_inStyle',
          hintKey: 'cssFocusIndicatorSuppressed_hint_cantTell',
          params: { selectors: selectors.join(', '), ...(place || {}) }
        },
        data: {
          details: {
            reasonCode: 'FOCUS_INDICATOR_SUPPRESSED',
            suppressingSelectors: selectors,
            ...(place && place.href ? { styleSheet: place.href } : {}),
            ...(place && place.index ? { styleElementIndex: place.index } : {})
          },
          visibilityFilter: eligInfo || { targetSet: 'dom', accEligible: null, reasons: [] }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'serious',
      occurrences
    };
  }

  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
