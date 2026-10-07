/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check focus-indicator-contrast
 * @atomic true
 * @summary An author focus indicator must have a contrast ratio of at least 3:1 with the colors next to it
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to elements in the tab order that are rendered, whose native
 *   focus outline an author rule replaces or removes: a `:focus` or
 *   `:focus-visible` rule on the element (or a rule with no state, or its
 *   style attribute) sets `outline-style` or `outline-width`, through the
 *   `outline` shorthand or the longhands, and the rule that wins the cascade
 *   is not `outline: auto`. The element must also have an author indicator
 *   to measure: a visible outline, border or box-shadow from a focus rule,
 *   or another focus style. An element that keeps the browser's outline
 *   meets RGAA 10.7.1's first condition and is not checked. An element
 *   whose outline is removed with no replacement at all is left to
 *   css-focus-indicator-suppressed. A page with none is notApplicable.
 * @expectation
 *   RGAA 10.7.1, step 2: the indicator is « suffisamment contrastée (ratio
 *   de contraste égal ou supérieur à 3.0) ». Each outline, border or
 *   box-shadow of the focus style is measured against the two colors it
 *   touches: the background behind the element and the element's own
 *   background (only the latter for an inset shadow). The element passes
 *   when one indicator reaches 3:1 against both. It fails when every
 *   indicator is below 3:1 against both and nothing else changes on focus.
 *   It is asked about (cantTell) otherwise: a color or background the
 *   engine cannot compute (background image, gradient, `var()`, a
 *   translucent page root in strict contrast mode), a blurred shadow, an
 *   indicator that reaches 3:1 against one side only, a focus style made of
 *   other changes (background, text color, underline, a pseudo-element, a
 *   rule that styles another element), or a cascade the engine cannot
 *   settle.
 *   Margin (`contrast-ratio`): of the focus indicators that reach 3:1
 *   against every color next to them, the one closest to it, with its
 *   lowest ratio unrounded; `context.property` names the outline, border or
 *   box-shadow. `measuredCount` counts the elements whose focus style was
 *   judged.
 * @implementation-notes
 * - WCAG 2.4.7 has no contrast requirement (2.4.13 is AAA and not
 *   checked), so css-focus-indicator-suppressed only asks whether some
 *   indicator exists. RGAA 10.7.1 also asks for 3:1, which this rule
 *   checks.
 * - The cascade is worked out per longhand among the matching rules and
 *   the style attribute: !important first, then specificity, then source
 *   order. A selector with :is(), :not(), :where() or :has() gets an
 *   approximate specificity; when that decides between two different
 *   values, the element is asked about.
 * - Rules inside @media apply when window.matchMedia says so, and inside
 *   @supports when CSS.supports says so. Where the condition cannot be
 *   evaluated (no matchMedia in jsdom, a container query), a verdict that
 *   rests on such a rule is asked about instead.
 * - Only the document's readable stylesheets and style attributes are
 *   read: cross-origin sheets and shadow-root styles are not.
 * - Colours are read from the declarations; `currentColor` is the color
 *   of the focused element. Backgrounds are resolved by
 *   helpers.contrast.computeEffectiveBackground with the engine's
 *   contrast options.
 * - Where the page has a layout (a browser), each element is focused as by
 *   the keyboard (`focusVisible`), with transitions switched off, and the
 *   outline, borders and box-shadow that differ from the unfocused computed
 *   style are measured. The computed style settles variables, @media and the
 *   cascade, so those are no longer asked about there. The colors outside
 *   the indicator are read from what is painted on each side
 *   (document.elementsFromPoint), so a positioned layer behind the element
 *   counts; a side outside the viewport falls back to the ancestors'
 *   background. An image or gradient on any side, or an animation started
 *   by focus, is still asked about. Focus and the style attribute are put
 *   back afterwards. jsdom keeps the stylesheet reading described above.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'focus-indicator-contrast';

const meta = {
  title: 'Author focus indicators have a contrast ratio of at least 3:1',
  description:
    'Checks that an outline, border or box-shadow drawn by a :focus or :focus-visible rule in place of the browser outline has a contrast ratio of at least 3:1 with the colors next to it, and asks when it cannot be computed.',
  i18n: {
    titleKey: 'focusIndicatorContrast_title',
    descriptionKey: 'focusIndicatorContrast_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'focus', 'contrast', 'css', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {},
  margin: { measure: 'contrast-ratio', unit: 'ratio', limit: 'min' }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule, engineOptions } = ctx;

  const CSS_STYLE_RULE = 1;
  const CSS_IMPORT_RULE = 3;
  const MAX_DEPTH = 10;
  const MIN_RATIO = 3;
  const SIDES = ['top', 'right', 'bottom', 'left'];

  // Focus styles other than outline, border and box-shadow, which change
  // what the user sees but that this rule does not measure.
  const OTHER_PROPS = [
    'background',
    'background-color',
    'background-image',
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
  const LINE_STYLES = [
    'none',
    'hidden',
    'dotted',
    'dashed',
    'solid',
    'double',
    'groove',
    'ridge',
    'inset',
    'outset',
    'auto'
  ];
  const WIDTH_KEYWORDS = { thin: 1, medium: 3, thick: 5 };

  const contrastOpts =
    engineOptions && typeof engineOptions.contrast === 'object' && engineOptions.contrast
      ? engineOptions.contrast
      : {};
  const bgOpts = {
    contrast: {
      mode: contrastOpts.mode === 'auditorAssist' ? 'auditorAssist' : 'strictConformance',
      rootCanvasFallback:
        typeof contrastOpts.rootCanvasFallback === 'string' &&
        contrastOpts.rootCanvasFallback.trim()
          ? contrastOpts.rootCanvasFallback.trim()
          : '#ffffff'
    },
    collectStack: false
  };

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }
  function lower(v) {
    return trim(v).toLowerCase();
  }
  function getProp(style, name) {
    try {
      return style && typeof style.getPropertyValue === 'function'
        ? lower(style.getPropertyValue(name))
        : '';
    } catch {
      return '';
    }
  }
  function isImportant(style, name) {
    try {
      return !!(
        style &&
        typeof style.getPropertyPriority === 'function' &&
        lower(style.getPropertyPriority(name)) === 'important'
      );
    } catch {
      return false;
    }
  }

  // Splits on a separator at the top level only (not inside parentheses).
  function splitTop(value, sep) {
    const parts = [];
    let depth = 0;
    let cur = '';
    for (const ch of String(value || '')) {
      if (ch === '(') depth += 1;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (depth === 0 && (sep === ' ' ? /\s/.test(ch) : ch === sep)) {
        if (trim(cur)) parts.push(trim(cur));
        cur = '';
        continue;
      }
      cur += ch;
    }
    if (trim(cur)) parts.push(trim(cur));
    return parts;
  }

  function lengthPx(token) {
    const t = lower(token);
    if (t in WIDTH_KEYWORDS) return WIDTH_KEYWORDS[t];
    const m = /^(-?\d*\.?\d+)(px|em|rem|pt|pc|in|cm|mm|ex|ch|vw|vh|vmin|vmax|%)?$/.exec(t);
    if (!m) return null;
    const n = parseFloat(m[1]);
    if (!Number.isFinite(n)) return null;
    // Only the sign and zero matter here, except for pixel values.
    return m[2] === 'pt' ? n * (96 / 72) : n;
  }

  let colorProbe = null;
  function isColorToken(token) {
    const t = lower(token);
    if (!t) return false;
    if (t === 'currentcolor' || t === 'transparent') return true;
    try {
      if (!colorProbe) colorProbe = dom.createElement(document, 'span').style;
      colorProbe.color = '';
      colorProbe.color = t;
      return !!colorProbe.color;
    } catch {
      return false;
    }
  }

  // { value } for a color that can be measured, { unknown: true } for one
  // that cannot (var(), system colors, invert), null for no color token.
  function readColor(token) {
    const t = lower(token);
    if (!t) return null;
    if (t.includes('var(') || t.includes('env(') || t === 'invert' || t[0] === '-') {
      return { unknown: true, raw: t };
    }
    return { value: t };
  }

  // outline shorthand -> { style, width, color } with CSS initial values.
  function parseOutlineShorthand(value) {
    const out = { style: 'none', width: 'medium', color: 'currentcolor' };
    for (const tok of splitTop(value, ' ')) {
      const t = lower(tok);
      if (LINE_STYLES.includes(t)) out.style = t;
      else if (lengthPx(t) != null) out.width = t;
      else out.color = t;
    }
    return out;
  }

  function parseBorderShorthand(value) {
    const out = { style: 'none', width: 'medium', color: 'currentcolor' };
    for (const tok of splitTop(value, ' ')) {
      const t = lower(tok);
      if (LINE_STYLES.includes(t)) out.style = t;
      else if (lengthPx(t) != null) out.width = t;
      else out.color = t;
    }
    return out;
  }

  // CSS-wide keywords: `initial` (and `unset`, none of these properties
  // being inherited but color) becomes the property's initial value; `revert`
  // on outline-style gives the browser's own ring back. Anything else stays
  // as written and is not measured.
  function normalizeKeyword(name, value) {
    const v = lower(value);
    const initialOf = () => {
      if (/-style$/.test(name)) return 'none';
      if (/-width$/.test(name)) return 'medium';
      if (/-color$/.test(name)) return 'currentcolor';
      if (name === 'box-shadow') return 'none';
      return v;
    };
    if (v === 'initial' || (v === 'unset' && name !== 'color')) return initialOf();
    if ((v === 'revert' || v === 'revert-layer') && name === 'outline-style') return 'auto';
    return v;
  }

  // The longhands a declaration block sets, as { name: { value, important } }.
  function longhandsOf(style) {
    const out = {};
    function set(name, value, important) {
      if (value === '' || value == null) return;
      out[name] = { value: normalizeKeyword(name, value), important };
    }
    const outline = getProp(style, 'outline');
    if (outline) {
      const o = parseOutlineShorthand(outline);
      const imp = isImportant(style, 'outline');
      set('outline-style', o.style, imp);
      set('outline-width', o.width, imp);
      set('outline-color', o.color, imp);
    }
    for (const part of ['style', 'width', 'color']) {
      const v = getProp(style, `outline-${part}`);
      if (v) set(`outline-${part}`, v, isImportant(style, `outline-${part}`));
    }
    const border = getProp(style, 'border');
    if (border) {
      const b = parseBorderShorthand(border);
      const imp = isImportant(style, 'border');
      for (const side of SIDES) {
        set(`border-${side}-style`, b.style, imp);
        set(`border-${side}-width`, b.width, imp);
        set(`border-${side}-color`, b.color, imp);
      }
    }
    for (const side of SIDES) {
      const s = getProp(style, `border-${side}`);
      if (s) {
        const b = parseBorderShorthand(s);
        const imp = isImportant(style, `border-${side}`);
        set(`border-${side}-style`, b.style, imp);
        set(`border-${side}-width`, b.width, imp);
        set(`border-${side}-color`, b.color, imp);
      }
    }
    for (const part of ['style', 'width', 'color']) {
      const all = getProp(style, `border-${part}`);
      if (all) {
        const toks = splitTop(all, ' ');
        // top, right, bottom, left from 1 to 4 values.
        const pick = [
          toks[0],
          toks[1] || toks[0],
          toks[2] || toks[0],
          toks[3] || toks[1] || toks[0]
        ];
        SIDES.forEach((side, i) =>
          set(`border-${side}-${part}`, pick[i], isImportant(style, `border-${part}`))
        );
      }
      for (const side of SIDES) {
        const v = getProp(style, `border-${side}-${part}`);
        if (v) set(`border-${side}-${part}`, v, isImportant(style, `border-${side}-${part}`));
      }
    }
    const shadow = getProp(style, 'box-shadow');
    if (shadow) set('box-shadow', shadow, isImportant(style, 'box-shadow'));
    const color = getProp(style, 'color');
    if (color) set('color', color, isImportant(style, 'color'));
    return out;
  }

  function hasOtherStyle(style) {
    return OTHER_PROPS.some((p) => getProp(style, p));
  }

  // Specificity [a, b, c] of one complex selector, and whether it is only
  // approximate (functional pseudo-classes).
  function specificity(part) {
    let s = String(part);
    const approximate = /:(is|not|where|has|nth-child|nth-last-child)\(/i.test(s);
    s = s.replace(/\([^()]*\)/g, '');
    const a = (s.match(/#[\w-]+/g) || []).length;
    const pseudoElements = (s.match(/::[\w-]+|:(before|after|first-line|first-letter)\b/gi) || [])
      .length;
    const b =
      (s.match(/\.[\w-]+/g) || []).length +
      (s.match(/\[[^\]]*\]/g) || []).length +
      (s.match(/(^|[^:]):[\w-]+/g) || []).length -
      (s.match(/(^|[^:]):(before|after|first-line|first-letter)\b/gi) || []).length;
    const c =
      (s.replace(/\[[^\]]*\]/g, '').match(/(^|[\s>+~(])[a-z][\w-]*/gi) || []).length +
      pseudoElements;
    return { spec: [0, a, b, c], approximate };
  }

  function compareSpec(x, y) {
    for (let i = 0; i < 4; i++) {
      if (x[i] !== y[i]) return x[i] - y[i];
    }
    return 0;
  }

  function splitSelectorList(selectorText) {
    return splitTop(selectorText, ',');
  }

  // :focus and :focus-visible, never :focus-within.
  const FOCUS_PSEUDO = /:focus(-visible)?(?![-\w])/g;
  function hasFocusPseudo(part) {
    FOCUS_PSEUDO.lastIndex = 0;
    return FOCUS_PSEUDO.test(part);
  }
  function splitCompounds(part) {
    const compounds = [];
    let depth = 0;
    let cur = '';
    for (const ch of part) {
      if (ch === '(') depth += 1;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (depth === 0 && (ch === ' ' || ch === '>' || ch === '+' || ch === '~')) {
        if (trim(cur)) compounds.push(trim(cur));
        cur = '';
        continue;
      }
      cur += ch;
    }
    if (trim(cur)) compounds.push(trim(cur));
    return compounds;
  }
  function stripFocus(sel) {
    return trim(String(sel).replace(FOCUS_PSEUDO, '')) || '*';
  }
  function hasPseudoElement(part) {
    return /::[a-z-]+/i.test(part) || /:(before|after)\b/i.test(part);
  }
  function matchesSafe(el, selector) {
    try {
      return !!(
        el &&
        typeof dom.get(el, 'matches') === 'function' &&
        selector &&
        dom.matches(el, selector)
      );
    } catch {
      return false;
    }
  }
  function closestSafe(el, selector) {
    try {
      return !!(
        el &&
        typeof dom.get(el, 'closest') === 'function' &&
        selector &&
        dom.closest(el, selector)
      );
    } catch {
      return false;
    }
  }

  const view = dom.defaultView(document) || null;
  const CSS_SUPPORTS_RULE = 12;

  // 'yes', 'no', or 'unknown' when the condition cannot be evaluated here
  // (no matchMedia in jsdom, a container query).
  function conditionApplies(cssRule, isSheet) {
    let text;
    try {
      text = lower(cssRule.media && cssRule.media.mediaText);
    } catch {
      text = '';
    }
    if (cssRule.media) {
      if (!text || text === 'all' || text === 'screen') return 'yes';
      if (!view || typeof view.matchMedia !== 'function') return 'unknown';
      try {
        return dom.get(view.matchMedia(text), 'matches') ? 'yes' : 'no';
      } catch {
        return 'unknown';
      }
    }
    if (isSheet) return 'yes';
    if (cssRule.type === CSS_SUPPORTS_RULE) {
      try {
        const css = view && view.CSS;
        if (css && typeof css.supports === 'function') {
          return css.supports(cssRule.conditionText) ? 'yes' : 'no';
        }
      } catch {}
      return 'unknown';
    }
    // @layer and the like carry no condition; @container does.
    return cssRule.conditionText ? 'unknown' : 'yes';
  }

  // Declarations in source order: { base, focus, longhands, spec,
  // approximate, order, other, conditional }.
  const decls = [];
  // Rules where focus on an element styles something else, or a
  // pseudo-element of it: { base, subject }.
  const indirect = [];
  let order = 0;

  function collect(cssRule, conditional) {
    const style = cssRule.style;
    if (!style) return;
    const longhands = longhandsOf(style);
    const other = hasOtherStyle(style);
    if (!Object.keys(longhands).length && !other) return;
    for (const part of splitSelectorList(cssRule.selectorText)) {
      order += 1;
      const { spec, approximate } = specificity(part);
      if (!hasFocusPseudo(part)) {
        if (hasPseudoElement(part)) continue;
        decls.push({
          base: part,
          focus: false,
          longhands,
          spec,
          approximate,
          order,
          other: false,
          conditional
        });
        continue;
      }
      const compounds = splitCompounds(part);
      const focusIndex = compounds.findIndex((c) => hasFocusPseudo(c));
      const isSubject = focusIndex === compounds.length - 1;
      const focusedBase = stripFocus(compounds[focusIndex]).replace(/::?[a-z-]+$/i, '') || '*';
      if (!isSubject || hasPseudoElement(part)) {
        indirect.push({ base: focusedBase, subject: isSubject });
        continue;
      }
      decls.push({
        base: stripFocus(part),
        focus: true,
        longhands,
        spec,
        approximate,
        order,
        other,
        conditional
      });
    }
  }

  function walk(rules, depth, conditional) {
    if (!rules || depth > MAX_DEPTH) return;
    for (const cssRule of rules) {
      if (!cssRule) continue;
      if (cssRule.type === CSS_STYLE_RULE && cssRule.selectorText) {
        collect(cssRule, conditional);
        continue;
      }
      const applies = conditionApplies(cssRule, false);
      if (applies === 'no') continue;
      const inner = conditional || applies === 'unknown';
      if (cssRule.type === CSS_IMPORT_RULE) {
        let imported;
        try {
          imported = cssRule.styleSheet ? cssRule.styleSheet.cssRules : null;
        } catch {
          imported = null;
        }
        walk(imported, depth + 1, inner);
        continue;
      }
      let nested;
      try {
        nested = cssRule.cssRules || null;
      } catch {
        nested = null;
      }
      if (nested) walk(nested, depth + 1, inner);
    }
  }

  try {
    for (const sheet of dom.styleSheets(document) || []) {
      const applies = sheet ? conditionApplies(sheet, true) : 'yes';
      if (applies === 'no') continue;
      let rules;
      try {
        rules = sheet && sheet.cssRules ? sheet.cssRules : null;
      } catch {
        continue; // cross-origin
      }
      walk(rules, 0, applies === 'unknown');
    }
  } catch {
    // no-throw
  }

  // The winning value of a longhand for a focused element, or
  // { unsettled: true } when approximate specificity decides between two
  // different values. `from` tells whether a focus rule set it.
  function resolve(list, name) {
    let best = null;
    for (const d of list) {
      const v = d.longhands[name];
      if (!v) continue;
      const cand = { value: v.value, important: v.important, d };
      if (!best) {
        best = cand;
        continue;
      }
      if (cand.important !== best.important) {
        if (cand.important) best = cand;
        continue;
      }
      const cmp = compareSpec(cand.d.spec, best.d.spec);
      const approximate = cand.d.approximate || best.d.approximate;
      if (approximate && cand.value !== best.value) {
        return { unsettled: true };
      }
      if (cmp > 0 || (cmp === 0 && cand.d.order > best.d.order)) best = cand;
    }
    return best ? { value: best.value, fromFocus: dom.get(best.d, 'focus') } : null;
  }

  function inlineDecl(el) {
    const style = el.style;
    if (!style) return null;
    const longhands = longhandsOf(style);
    if (!Object.keys(longhands).length) return null;
    return {
      base: '',
      focus: false,
      longhands,
      spec: [1, 0, 0, 0],
      approximate: false,
      order: Number.MAX_SAFE_INTEGER,
      other: false
    };
  }

  function computedStyleOf(el) {
    try {
      return view && view.getComputedStyle ? view.getComputedStyle(el) : null;
    } catch {
      return null;
    }
  }

  function parentOf(el) {
    return helpers.composedParent ? helpers.composedParent(el) : dom.parentElement(el);
  }

  // The color of the background painted at `el` (its own and what shows
  // through), or null when an image or gradient, or a translucent root in
  // strict mode, makes it unknown.
  function backgroundAt(el) {
    if (!el || dom.nodeType(el) !== 1) return null;
    for (let n = el; n && dom.nodeType(n) === 1; n = parentOf(n)) {
      const cs = computedStyleOf(n);
      if (cs && helpers.contrast.hasBackgroundImageOrGradient(cs)) return null;
      const bg = helpers.contrast.parseCssColorToRgba(cs && cs.backgroundColor);
      if (bg && bg.a >= 1) break;
    }
    const res = helpers.contrast.computeEffectiveBackground(el, bgOpts);
    if (!res || res.ok === false || !res.rgba) return null;
    return { r: res.rgba.r, g: res.rgba.g, b: res.rgba.b, a: 1 };
  }

  function toRgba(colorValue, currentColor) {
    const c = readColor(colorValue);
    if (!c || c.unknown) return null;
    if (c.value === 'currentcolor') return currentColor;
    // parseCssColorToRgba falls back to the platform, which reads an invalid
    // value as the inherited color, so the value is checked first.
    if (!isColorToken(c.value)) return null;
    return helpers.contrast.parseCssColorToRgba(c.value);
  }

  // One indicator's contrast against the colors it touches. `over` is the
  // color it is painted on (for translucent colors).
  function measure(rgba, over, sides) {
    if (!rgba || !over || sides.some((s) => !s)) return null;
    const painted =
      rgba.a != null && rgba.a < 1
        ? helpers.contrast.compositeRgba(rgba, over)
        : { r: rgba.r, g: rgba.g, b: rgba.b, a: 1 };
    const ratios = sides.map((s) => helpers.contrast.contrastRatio(painted, s));
    return { ratios, color: helpers.contrast.rgbToHex(painted) };
  }

  function parseShadows(value) {
    if (!value || value === 'none') return [];
    return splitTop(value, ',').map((layer) => {
      const toks = splitTop(layer, ' ');
      let inset = false;
      const lengths = [];
      let color = 'currentcolor';
      for (const tok of toks) {
        const t = lower(tok);
        if (t === 'inset') inset = true;
        else if (lengthPx(t) != null) lengths.push(lengthPx(t));
        else color = t;
      }
      const [x = 0, y = 0, blur = 0, spread = 0] = lengths;
      return { inset, x, y, blur, spread, color };
    });
  }

  const getFocusableInfo =
    typeof helpers.getFocusableInfo === 'function' ? helpers.getFocusableInfo : null;
  const isDomVisibleEligible =
    typeof helpers.isDomVisibleEligible === 'function' ? helpers.isDomVisibleEligible : null;

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

  // Evaluates one element: null (not in scope), or { verdict, reasonCode,
  // details }. A verdict that rests on a rule whose @media or other
  // condition cannot be evaluated here becomes a question.
  function evaluate(el) {
    const own = decls.filter((d) => matchesSafe(el, d.base));
    const res = evaluateWith(el, own);
    if (res && res.verdict !== 'cantTell' && own.some((d) => d.conditional)) {
      return { verdict: 'cantTell', reasonCode: 'notComputable', details: { cause: 'condition' } };
    }
    return res;
  }

  function evaluateWith(el, own) {
    const inline = inlineDecl(el);
    if (inline) own.push(inline);

    const outlineStyle = resolve(own, 'outline-style');
    const outlineWidth = resolve(own, 'outline-width');
    const outlineColor = resolve(own, 'outline-color');
    if (!outlineStyle && !outlineWidth) return null; // native outline kept
    if ([outlineStyle, outlineWidth, outlineColor].some((r) => r && r.unsettled)) {
      return { verdict: 'cantTell', reasonCode: 'notComputable', details: { cause: 'cascade' } };
    }
    if (outlineStyle && outlineStyle.value === 'auto') return null;
    if (!outlineStyle) {
      const w = lengthPx(outlineWidth.value);
      if (w == null || w > 0) return null; // a width change alone keeps the native ring
    }

    const focusColor = resolve(own, 'color');
    const cs = computedStyleOf(el);
    const currentColor =
      focusColor && !focusColor.unsettled && focusColor.fromFocus
        ? toRgba(focusColor.value, null)
        : helpers.contrast.parseCssColorToRgba(cs && cs.color);

    const outer = backgroundAt(parentOf(el));
    const inner = backgroundAt(el);

    const indicators = []; // { property, m, blurred }
    let unmeasured = null; // 'color' or 'background'
    let unsettled = false;

    function add(property, rgba, over, sides, blurred) {
      const m = measure(rgba, over, sides);
      if (m) indicators.push({ property, m, blurred });
      else if (!unmeasured) unmeasured = rgba ? 'background' : 'color';
    }

    // Outline from a focus rule.
    if (outlineStyle && outlineStyle.fromFocus) {
      const style = outlineStyle.value;
      const width = outlineWidth ? lengthPx(outlineWidth.value) : WIDTH_KEYWORDS.medium;
      const colorValue = outlineColor ? outlineColor.value : 'currentcolor';
      const visible =
        !['none', 'hidden'].includes(style) && width !== 0 && colorValue !== 'transparent';
      if (visible) {
        add('outline', toRgba(colorValue, currentColor), outer, [outer, inner], false);
      }
    }

    // Borders from a focus rule, side by side.
    for (const side of SIDES) {
      const bs = resolve(own, `border-${side}-style`);
      const bw = resolve(own, `border-${side}-width`);
      const bc = resolve(own, `border-${side}-color`);
      if ([bs, bw, bc].some((r) => r && r.unsettled)) {
        unsettled = true;
        continue;
      }
      if (![bs, bw, bc].some((r) => r && r.fromFocus)) continue;
      const style = bs ? bs.value : lower(cs && cs.getPropertyValue(`border-${side}-style`));
      const width = bw
        ? lengthPx(bw.value)
        : lengthPx(cs && cs.getPropertyValue(`border-${side}-width`));
      const colorValue = bc
        ? bc.value
        : lower(cs && cs.getPropertyValue(`border-${side}-color`)) || 'currentcolor';
      if (['none', 'hidden', ''].includes(style) || width === 0 || colorValue === 'transparent') {
        continue;
      }
      add(`border-${side}`, toRgba(colorValue, currentColor), inner, [outer, inner], false);
    }

    // Box shadows from a focus rule.
    const shadow = resolve(own, 'box-shadow');
    if (shadow && shadow.unsettled) unsettled = true;
    else if (shadow && shadow.fromFocus) {
      for (const layer of parseShadows(shadow.value)) {
        if (layer.color === 'transparent') continue;
        if (!layer.spread && !dom.get(layer, 'blur') && !layer.x && !layer.y) continue;
        if (layer.spread < 0 && !dom.get(layer, 'blur')) continue;
        const rgba = toRgba(layer.color, currentColor);
        const blurred = dom.get(layer, 'blur') > 0 && layer.spread <= 0;
        if (layer.inset) add('box-shadow (inset)', rgba, inner, [inner], blurred);
        else add('box-shadow', rgba, outer, [outer, inner], blurred);
      }
    }

    // A focus style this rule does not measure: other properties, a rule
    // that styles a pseudo-element or another element, or an inline focus
    // handler that may paint one from script.
    const otherStyle =
      own.some((d) => dom.get(d, 'focus') && d.other) ||
      indirect.some((p) => (p.subject ? matchesSafe(el, p.base) : closestSafe(el, p.base))) ||
      dom.hasAttribute(el, 'onfocus') ||
      dom.hasAttribute(el, 'onfocusin');

    return decide(indicators, unmeasured, unsettled, otherStyle);
  }

  // The verdict from the measured indicators: null when there is nothing to
  // judge (the outline is removed with nothing in its place, which is
  // css-focus-indicator-suppressed's case).
  function decide(indicators, unmeasured, unsettled, otherStyle) {
    if (!indicators.length && !unmeasured && !unsettled && !otherStyle) return null;

    const details = (ind) => ({
      property: ind.property,
      color: ind.m.color,
      // Two decimals, except that a ratio below 3 never reads 3.00.
      ratios: ind.m.ratios.map((r) => {
        const rounded = Number(helpers.contrast.round2(r));
        return r < MIN_RATIO && rounded >= MIN_RATIO ? 2.99 : rounded;
      })
    });

    const full = indicators.find((i) => !i.blurred && i.m.ratios.every((r) => r >= MIN_RATIO));
    if (full) {
      // The lowest of its ratios, unrounded, for the result's margin.
      return { verdict: 'pass', details: details(full), ratio: Math.min(...full.m.ratios) };
    }

    if (unsettled) {
      return { verdict: 'cantTell', reasonCode: 'notComputable', details: { cause: 'cascade' } };
    }
    if (unmeasured) {
      return { verdict: 'cantTell', reasonCode: 'notComputable', details: { cause: unmeasured } };
    }
    const oneSide = indicators.find((i) => i.m.ratios.some((r) => r >= MIN_RATIO));
    if (oneSide) {
      return {
        verdict: 'cantTell',
        reasonCode: oneSide.blurred ? 'notComputable' : 'oneSide',
        details: { ...details(oneSide), ...(oneSide.blurred ? { cause: 'blur' } : {}) }
      };
    }
    if (otherStyle) {
      return {
        verdict: 'cantTell',
        reasonCode: 'notMeasured',
        details: indicators.length ? details(indicators[0]) : {}
      };
    }
    const worst = indicators
      .slice()
      .sort((a, b) => Math.max(...b.m.ratios) - Math.max(...a.m.ratios))[0];
    return { verdict: 'fail', reasonCode: 'lowContrast', details: details(worst) };
  }

  // Where the page has a layout (a browser), the element is focused and what
  // the browser draws is measured: the computed style settles variables,
  // @media and the cascade, and the colors next to the indicator are read
  // from what is painted there. jsdom has no layout and keeps the stylesheet
  // reading above.
  function hasLayout() {
    const probe = dom.documentElement(document) || null;
    if (!probe || typeof dom.get(probe, 'getClientRects') !== 'function') return false;
    if (typeof dom.get(document, 'elementsFromPoint') !== 'function') return false;
    try {
      const rects = dom.getClientRects(probe);
      return !!(rects && rects.length > 0);
    } catch {
      return false;
    }
  }
  const layout = hasLayout();

  const RING_PROPS = ['outline-style', 'outline-width', 'outline-color', 'outline-offset'];
  const BORDER_PROPS = (side) => [
    `border-${side}-style`,
    `border-${side}-width`,
    `border-${side}-color`
  ];
  const RENDERED_OTHER = [
    'background-color',
    'background-image',
    'color',
    'filter',
    'font-weight',
    'opacity',
    'text-decoration-line',
    'text-decoration-color',
    'text-shadow',
    'transform'
  ];
  const PSEUDO_PROPS = [
    'content',
    'display',
    'background-color',
    'background-image',
    'border-top-color',
    'border-top-width',
    'box-shadow',
    'color',
    'opacity',
    'outline-style',
    'transform'
  ];

  function snapshot(el) {
    const out = {};
    const cs = view.getComputedStyle(el);
    for (const p of [
      ...RING_PROPS,
      ...SIDES.flatMap(BORDER_PROPS),
      'box-shadow',
      ...RENDERED_OTHER
    ]) {
      out[p] = cs.getPropertyValue(p);
    }
    for (const pseudo of ['::before', '::after']) {
      const ps = view.getComputedStyle(el, pseudo);
      out[pseudo] = PSEUDO_PROPS.map((p) => ps.getPropertyValue(p)).join('|');
    }
    return out;
  }

  function deepActiveElement() {
    let cur = dom.activeElement(document) || null;
    let guard = 0;
    while (cur && dom.shadowRoot(cur) && dom.activeElement(dom.shadowRoot(cur)) && guard++ < 20) {
      cur = dom.activeElement(dom.shadowRoot(cur));
    }
    return cur;
  }

  // Runs fn(before, after) with the element focused as by the keyboard,
  // transitions switched off so the focused values are read at once, then
  // puts focus and the style attribute back. undefined when the element
  // could not be focused.
  function whileFocused(el, fn) {
    const previous = deepActiveElement();
    const hadStyle = dom.hasAttribute(el, 'style');
    const styleAttr = dom.getAttribute(el, 'style');
    try {
      el.style.setProperty('transition', 'none', 'important');
      if (previous === el) dom.blur(el);
      const before = snapshot(el);
      dom.focus(el, { preventScroll: true, focusVisible: true });
      if (deepActiveElement() !== el) return undefined;
      return fn(before, snapshot(el));
    } catch {
      return undefined;
    } finally {
      try {
        if (
          previous &&
          previous !== dom.body(document) &&
          typeof dom.get(previous, 'focus') === 'function'
        ) {
          if (deepActiveElement() !== previous) dom.focus(previous, { preventScroll: true });
        } else if (deepActiveElement() === el) {
          dom.blur(el);
        }
      } catch {}
      // Reading the attribute first makes Chromium write the inline style
      // back to it; removed before that, it comes back as style="".
      dom.getAttribute(el, 'style');
      if (hadStyle) dom.setAttribute(el, 'style', styleAttr);
      else dom.removeAttribute(el, 'style');
    }
  }

  function px(value) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }

  // The color painted at a point outside the element: the background of the
  // topmost other element there. undefined when the point is outside the
  // viewport, null when an image or gradient makes it unknown.
  function paintedAt(el, x, y) {
    const w = view.innerWidth;
    const h = view.innerHeight;
    if (!(x >= 0 && y >= 0 && x < w && y < h)) return undefined;
    let stack;
    try {
      stack = dom.elementsFromPoint(document, x, y) || [];
    } catch {
      return undefined;
    }
    const top = stack.find((n) => n !== el && !dom.contains(el, n));
    return top && top !== dom.documentElement(document) ? backgroundAt(top) : canvasColor();
  }

  // The canvas: the root's background, or the body's when the root has none,
  // which is what the browser paints there.
  function canvasColor() {
    const root = dom.documentElement(document);
    const cs = root ? computedStyleOf(root) : null;
    const bg = helpers.contrast.parseCssColorToRgba(cs && cs.backgroundColor);
    const rootPainted =
      (bg && bg.a > 0) || (cs && helpers.contrast.hasBackgroundImageOrGradient(cs));
    return backgroundAt(!rootPainted && dom.body(document) ? dom.body(document) : root);
  }

  // The colors next to the element on the given sides, `dist` pixels
  // outside its border box. A side outside the viewport falls back to the
  // background of the element's ancestors.
  function colorsAround(el, rect, dist, sides) {
    const midX = rect.left + rect.width / 2;
    const midY = rect.top + rect.height / 2;
    const points = {
      top: [midX, rect.top - dist],
      right: [rect.right + dist, midY],
      bottom: [midX, rect.bottom + dist],
      left: [rect.left - dist, midY]
    };
    let fallback;
    const colors = [];
    for (const side of sides) {
      let c = paintedAt(el, points[side][0], points[side][1]);
      if (c === undefined) {
        if (fallback === undefined) fallback = backgroundAt(parentOf(el));
        c = fallback;
      }
      if (!c) return null;
      if (!colors.some((k) => k.r === c.r && k.g === c.g && k.b === c.b)) colors.push(c);
    }
    return colors;
  }

  // The element's own background while focused, over what is behind it.
  // What is behind it is read at its center, like the colors around it.
  function focusedBackground(el, rect) {
    const cs = view.getComputedStyle(el);
    if (helpers.contrast.hasBackgroundImageOrGradient(cs)) return null;
    const bg = helpers.contrast.parseCssColorToRgba(cs.backgroundColor);
    if (bg && bg.a >= 1) return { r: bg.r, g: bg.g, b: bg.b, a: 1 };
    let behind = paintedAt(el, rect.left + rect.width / 2, rect.top + rect.height / 2);
    if (behind === undefined) behind = backgroundAt(parentOf(el));
    if (!behind) return null;
    if (!bg || !bg.a) return behind;
    const c = helpers.contrast.compositeRgba(bg, behind);
    return { r: c.r, g: c.g, b: c.b, a: 1 };
  }

  // One indicator against the colors outside it and the element's own
  // background. A translucent indicator is composited over each outside
  // color in turn (over the element's background for a border).
  function measureAround(rgba, outside, inner, overInner) {
    if (!rgba || !outside || !inner) return null;
    const ratios = [];
    let painted = null;
    for (const out of overInner ? [inner] : outside) {
      painted =
        rgba.a != null && rgba.a < 1
          ? helpers.contrast.compositeRgba(rgba, out)
          : { r: rgba.r, g: rgba.g, b: rgba.b, a: 1 };
      for (const side of overInner ? outside : [out]) {
        ratios.push(helpers.contrast.contrastRatio(painted, side));
      }
      ratios.push(helpers.contrast.contrastRatio(painted, inner));
    }
    return { ratios, color: helpers.contrast.rgbToHex(painted) };
  }

  function evaluateRendered(el) {
    return whileFocused(el, (before, after) => {
      if (after['outline-style'] === 'auto') return null; // the browser's outline
      const changed = (props) => props.some((p) => before[p] !== after[p]);
      const visibleColor = (value) => {
        const c = helpers.contrast.parseCssColorToRgba(value);
        return c && c.a > 0 ? c : null;
      };

      if (typeof dom.get(el, 'getAnimations') === 'function' && dom.getAnimations(el).length) {
        return {
          verdict: 'cantTell',
          reasonCode: 'notComputable',
          details: { cause: 'animation' }
        };
      }

      const rect = dom.getBoundingClientRect(el);
      const inner = focusedBackground(el, rect);
      const indicators = [];
      let unmeasured = null;
      function add(property, rgba, outside, overInner, blurred) {
        const m = measureAround(rgba, outside, inner, overInner);
        if (m) indicators.push({ property, m, blurred });
        else if (!unmeasured) unmeasured = 'background';
      }

      // Outline drawn on focus, measured halfway across its width.
      const ow = px(after['outline-width']);
      const outlineColor = visibleColor(after['outline-color']);
      if (
        changed(RING_PROPS) &&
        !['none', 'hidden'].includes(after['outline-style']) &&
        ow > 0 &&
        outlineColor
      ) {
        const dist = Math.max(1, px(after['outline-offset']) + ow / 2);
        add('outline', outlineColor, colorsAround(el, rect, dist, SIDES), false, false);
      }

      // Borders that change on focus, side by side.
      for (const side of SIDES) {
        const props = BORDER_PROPS(side);
        if (!changed(props)) continue;
        const color = visibleColor(after[props[2]]);
        if (['none', 'hidden'].includes(after[props[0]]) || px(after[props[1]]) <= 0 || !color) {
          continue;
        }
        add(`border-${side}`, color, colorsAround(el, rect, 1, [side]), true, false);
      }

      // Box shadows that change on focus.
      if (changed(['box-shadow'])) {
        for (const layer of parseShadows(after['box-shadow'])) {
          const color = visibleColor(layer.color);
          if (!color) continue;
          if (!layer.spread && !dom.get(layer, 'blur') && !layer.x && !layer.y) continue;
          if (layer.spread < 0 && !dom.get(layer, 'blur')) continue;
          const blurred = dom.get(layer, 'blur') > 0 && layer.spread <= 0;
          if (layer.inset) {
            const m = inner ? measure(color, inner, [inner]) : null;
            if (m) indicators.push({ property: 'box-shadow (inset)', m, blurred });
            else if (!unmeasured) unmeasured = 'background';
          } else {
            const dist = Math.max(1, Math.max(layer.spread, dom.get(layer, 'blur')) / 2);
            add('box-shadow', color, colorsAround(el, rect, dist, SIDES), false, blurred);
          }
        }
      }

      const otherStyle =
        changed(RENDERED_OTHER) ||
        changed(['::before', '::after']) ||
        indirect.some((p) => (p.subject ? matchesSafe(el, p.base) : closestSafe(el, p.base))) ||
        dom.hasAttribute(el, 'onfocus') ||
        dom.hasAttribute(el, 'onfocusin');

      return decide(indicators, unmeasured, false, otherStyle);
    });
  }

  const MESSAGES = {
    lowContrast: {
      summary: (p) =>
        `The ${p.property} this element shows on focus (${p.color}) has a contrast ratio of ${p.ratio}:1 with the colors next to it, below 3:1.`,
      hint: 'Give the focus indicator a color with a contrast ratio of at least 3:1 against the background behind the element and against the element itself (RGAA 10.7.1).'
    },
    oneSide: {
      summary: (p) =>
        `The ${p.property} this element shows on focus (${p.color}) reaches 3:1 against only one of the colors next to it (${p.ratio}:1 against the other).`,
      hint: 'Check on the page that the focus indicator is clearly visible, with a contrast ratio of at least 3:1 (RGAA 10.7.1).'
    },
    notComputable: {
      summary: () =>
        "The contrast of this element's focus indicator could not be computed (a background image, a gradient, a blurred shadow, an animation, a CSS variable, a condition such as @media, or rules the engine cannot order).",
      hint: 'Measure the contrast of the focus indicator on the page: it needs a ratio of at least 3:1 with the colors next to it (RGAA 10.7.1).'
    },
    notMeasured: {
      summary: () =>
        "This element's focus style changes something the engine does not measure (background, text color, underline, or another element).",
      hint: 'Check on the page that the focus style is visible, with a contrast ratio of at least 3:1 (RGAA 10.7.1).'
    }
  };

  const CANDIDATES =
    'a[href],area[href],button,input,select,textarea,summary,iframe,frame,audio[controls],video[controls],[tabindex],[contenteditable]';
  const candidates = helpers.queryAllSmart
    ? helpers.queryAllSmart(CANDIDATES)
    : helpers.queryAll(CANDIDATES);

  const failOccurrences = [];
  const cantTellOccurrences = [];
  let passCount = 0;
  // Indicators that reach 3:1, for the result's margin (src/core/margin.js),
  // and how many elements' focus styles were judged.
  const marginCandidates = [];
  let judgedCount = 0;

  for (const el of candidates) {
    if (!el || dom.nodeType(el) !== 1) continue;
    if (!isTabbable(el) || !isRendered(el)) continue;
    let res;
    try {
      res = layout ? evaluateRendered(el) : undefined;
      if (res === undefined) res = evaluate(el);
    } catch {
      res = { verdict: 'cantTell', reasonCode: 'notComputable', details: { cause: 'error' } };
    }
    if (!res) continue;
    judgedCount += 1;
    if (res.verdict === 'pass') {
      passCount += 1;
      if (Number.isFinite(res.ratio)) {
        marginCandidates.push({
          el,
          value: res.ratio,
          threshold: MIN_RATIO,
          context: { property: (res.details && res.details.property) || '' }
        });
      }
      continue;
    }
    const d = res.details || {};
    const ratios = Array.isArray(d.ratios) ? d.ratios : [];
    const ratio = ratios.length
      ? String(res.reasonCode === 'oneSide' ? Math.min(...ratios) : Math.max(...ratios))
      : '';
    const params = { property: d.property || '', color: d.color || '', ratio };
    const msg = MESSAGES[res.reasonCode];
    const uncertainty =
      res.verdict !== 'cantTell'
        ? null
        : res.reasonCode === 'notComputable'
          ? {
              code: 'not-computable',
              needed: 'The rendered color of the focus indicator and of the colors next to it.',
              evidence: { reasonCode: res.reasonCode, cause: d.cause || null }
            }
          : {
              code: 'judgement-required',
              needed: 'Whether the focus style is visible with a contrast ratio of at least 3:1.',
              evidence: { reasonCode: res.reasonCode }
            };
    const occ = helpers.reportOccurrence(el, {
      summary: msg.summary(params),
      hint: msg.hint,
      i18n: {
        summaryKey: `focusIndicatorContrast_summary_${res.verdict}_${res.reasonCode}`,
        hintKey: `focusIndicatorContrast_hint_${res.verdict}_${res.reasonCode}`,
        params
      },
      ...(uncertainty ? { uncertainty } : {}),
      data: {
        details: { reasonCode: res.reasonCode, ...d },
        visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
      }
    });
    (res.verdict === 'fail' ? failOccurrences : cantTellOccurrences).push(occ);
  }

  if (!failOccurrences.length && !cantTellOccurrences.length && !passCount) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    ...helpers.resolveTieredOutcome(
      failOccurrences,
      cantTellOccurrences,
      rule.defaultSeverity || 'serious'
    ),
    marginCandidates,
    measuredCount: judgedCount
  };
}

module.exports = { id, meta, runInPage };
