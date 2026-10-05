/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check link-state-colors-review
 * @atomic true
 * @summary A text link shown only by color must keep 3:1 with the surrounding text in each state shown by another color
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to links (<a href> and role="link") inside a run of text (their
 *   parent has text of its own, as for link-in-text-block) that carry no
 *   mark other than color at rest: no underline, no weight or style
 *   difference from the surrounding text, no border, outline, box-shadow,
 *   background image, background color of its own (a highlight, as
 *   link-in-text-block reads it), image or generated content (glossary
 *   "Lien dont la nature n'est pas évidente").
 * @expectation
 *   RGAA 10.6.1 step 3: the 3:1 contrast between the link color and the
 *   surrounding text must be checked « pour les différents états du lien
 *   s'ils sont présentés au moyen d'une couleur différente : l'état non
 *   visité, l'état visité, l'état activé, l'état au survol et l'état à la
 *   prise de focus ».
 *   Where the page has a layout (a browser), each state is put on the link
 *   and its colors are read. A state whose color differs from the resting
 *   one and that adds no other mark fails below 3:1 against the surrounding
 *   text (STATE_CONTRAST_LOW). The link passes when every such state
 *   reaches 3:1. It is asked about when the browser's own visited color
 *   applies (BROWSER_STATE_COLORS) or a style sheet cannot be read
 *   (STYLESHEET_UNREADABLE).
 *   Without a layout (jsdom), the states cannot be put on the link, so it
 *   is asked about when an author rule for :visited, :active, :hover,
 *   :focus or :focus-visible changes only its color (STATE_COLOR_CHANGE),
 *   when the browser's visited color applies, or when a style sheet cannot
 *   be read. A link whose states raise no question is left out there.
 *   A page with no link in scope is notApplicable.
 * @implementation-notes
 * - Transitions are held off while the states are read: a style sheet in
 *   a cascade layer declared before any other sets `transition: none
 *   !important` on everything, so a state's colors are read at once, not at
 *   the start of the page's own transition toward them. The selectors are
 *   put back first, then the sheet is removed, so nothing animates on the
 *   way back.
 * - States in a browser: every readable author rule that names a link state
 *   gets its selector rewritten for the time of the check, `:hover` to
 *   `:is(:hover, [data-surea11y-link-state~="hover"])` and so on, and
 *   `:link` to `:link:where(:not([...~="visited"]))`. Specificity, source
 *   order and @media conditions stay as they were. The attribute is set on
 *   the link for :visited, and on the link and its ancestors for :hover and
 *   :active, which match ancestors too. Focus is real focus (`focusVisible`)
 *   so the browser's own focus ring counts as a mark. The selectors, the
 *   attributes and focus are put back afterwards. Browsers hide the
 *   visited color from scripts, which is why it is emulated rather than
 *   read, and why the browser's own visited color stays a question.
 * - A state adds a mark when it brings an underline, a border, an outline,
 *   a box-shadow, a background image or color, or a weight or style that
 *   differs from the surrounding text.
 * - The resting-state cues are read as link-in-text-block reads them,
 *   including its CSSOM fallback for `text-decoration` under a DOM
 *   emulator. A link whose underline cannot be resolved is treated as
 *   possibly shown by color only.
 * - Without a layout, a state rule is matched by removing the state
 *   pseudo-classes from its selector and matching the rest against the
 *   link. A state rule that also sets a text decoration, border, outline,
 *   box-shadow, font weight or style, or background image marks that state
 *   by more than color and is not flagged.
 * - link-in-text-block judges the resting state.
 * - Opt-in (tag `rgaa`): WCAG 1.4.1 does not single out these states.
 */

const id = 'link-state-colors-review';

const meta = {
  title: 'Link states shown by color alone contrast 3:1 with the surrounding text',
  description:
    'Checks that a link in a run of text, shown only by color, keeps a contrast of 3:1 with the surrounding text in each visited, active, hover or focus state shown by another color, and asks when the states cannot be put on the link (RGAA 10.6.1).',
  i18n: {
    titleKey: 'linkStateColorsReview_title',
    descriptionKey: 'linkStateColorsReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'links', 'color', 'contrast', 'atomic', 'automatic'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const CSS_STYLE_RULE = 1;
  const MAX_NESTED_DEPTH = 8;
  const STATE_RE = /:(visited|active|hover|focus-visible|focus)(?![\w-])/gi;
  const ALL_STATES_RE =
    /:(link|visited|active|hover|focus-visible|focus|focus-within|target)(?![\w-])/i;

  function safeComputedStyle(el) {
    try {
      if (!el || el.nodeType !== 1) return null;
      const view = el.ownerDocument && el.ownerDocument.defaultView;
      if (view && typeof view.getComputedStyle === 'function') return view.getComputedStyle(el);
    } catch {
      // no computed style available
    }
    return null;
  }

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

  function specificityOf(selector) {
    const s = String(selector || '');
    const ids = (s.match(/#[\w-]+/g) || []).length;
    const classesEtc = (s.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) || []).length;
    const types = (s.match(/(^|[\s>+~])[a-z][\w-]*/gi) || []).length;
    return ids * 10000 + classesEtc * 100 + types;
  }

  // Every author style rule, in order, and whether a sheet was unreadable.
  let styleRules = null;
  let unreadableSheet = false;
  function getStyleRules(doc) {
    if (styleRules) return styleRules;
    styleRules = [];
    function walk(rules, depth) {
      if (!rules || depth > MAX_NESTED_DEPTH) return;
      for (const cssRule of rules) {
        if (!cssRule) continue;
        if (cssRule.type === CSS_STYLE_RULE && cssRule.selectorText) {
          styleRules.push(cssRule);
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
      for (const sheet of (doc && doc.styleSheets) || []) {
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
      unreadableSheet = true;
    }
    return styleRules;
  }

  function matches(el, selector) {
    try {
      return el.matches(selector);
    } catch {
      return false;
    }
  }

  function declared(style, prop) {
    if (!style || typeof style.getPropertyValue !== 'function') return '';
    return String(style.getPropertyValue(prop) || '')
      .trim()
      .toLowerCase();
  }

  // ---- Resting state: is the link marked by anything but color? ----

  function uaUnderlines(el) {
    return (
      String(el.localName || '').toLowerCase() === 'a' &&
      typeof el.hasAttribute === 'function' &&
      el.hasAttribute('href')
    );
  }

  function decorationInfo(cs) {
    if (!cs) return { underlined: false, trustworthy: false };
    const lineTokens = String(cs.textDecorationLine || '')
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    const shortTokens = String(cs.textDecoration || '')
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    if (!lineTokens.length) {
      return { underlined: shortTokens.includes('underline'), trustworthy: shortTokens.length > 0 };
    }
    if (!shortTokens.length) {
      return { underlined: lineTokens.includes('underline'), trustworthy: true };
    }
    const byLine = lineTokens.includes('underline');
    return { underlined: byLine, trustworthy: byLine === shortTokens.includes('underline') };
  }

  // The resting underline from the CSSOM, when the computed style cannot be
  // trusted (a DOM emulator does not cascade text-decoration). Returns
  // true, false, or null when it cannot be resolved.
  function underlineFromCssom(el) {
    const doc = el.ownerDocument;
    let best = null;
    for (const cssRule of getStyleRules(doc)) {
      let value = '';
      let important = false;
      for (const prop of ['text-decoration-line', 'text-decoration']) {
        value = declared(cssRule.style, prop);
        if (value) {
          important = String(cssRule.style.getPropertyPriority(prop) || '') === 'important';
          break;
        }
      }
      if (!value) continue;
      for (const part of splitSelectorList(cssRule.selectorText)) {
        if (/::[a-z-]+/i.test(part) || ALL_STATES_RE.test(part)) continue;
        if (!matches(el, part)) continue;
        const rank = (important ? 1e9 : 0) + specificityOf(part);
        if (!best || rank >= best.rank) best = { rank, underlined: /\bunderline\b/.test(value) };
      }
    }
    const inline =
      declared(el.style, 'text-decoration-line') || declared(el.style, 'text-decoration');
    if (inline) return /\bunderline\b/.test(inline);
    if (best) return best.underlined;
    if (unreadableSheet) return null;
    return uaUnderlines(el);
  }

  function isZeroWidth(v) {
    return /^0(\.0+)?[a-z%]*$/i.test(String(v || '').trim());
  }

  function hasBorder(cs) {
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
      const style = String(cs['border' + side + 'Style'] || '')
        .trim()
        .toLowerCase();
      if (!style || style === 'none' || style === 'hidden') continue;
      if (!isZeroWidth(cs['border' + side + 'Width'])) return true;
    }
    return false;
  }

  function hasOutline(cs) {
    const style = String(cs.outlineStyle || '')
      .trim()
      .toLowerCase();
    return !!style && style !== 'none' && style !== 'hidden' && !isZeroWidth(cs.outlineWidth);
  }

  function hasValue(v) {
    const s = String(v || '')
      .trim()
      .toLowerCase();
    return !!s && s !== 'none';
  }

  function hasImageChild(el) {
    try {
      return !!el.querySelector('img, svg, picture, canvas, [role="img"]');
    } catch {
      return false;
    }
  }

  function hasPseudoContent(el) {
    for (const cssRule of getStyleRules(el.ownerDocument)) {
      const content = declared(cssRule.style, 'content');
      if (!content || ['none', 'normal', '""', "''"].includes(content)) continue;
      for (const part of splitSelectorList(cssRule.selectorText)) {
        if (!/::?(before|after)\s*$/i.test(part) || ALL_STATES_RE.test(part)) continue;
        if (matches(el, part.replace(/::?(before|after)\s*$/i, '').trim() || '*')) return true;
      }
    }
    return false;
  }

  function hasSurroundingText(el, parent) {
    if (!parent || !parent.childNodes) return false;
    for (let i = 0; i < parent.childNodes.length; i++) {
      const n = parent.childNodes[i];
      if (n === el) continue;
      if (n.nodeType === 3 && n.nodeValue && n.nodeValue.trim().length > 0) return true;
    }
    return false;
  }

  // A background color of the link's own, different from the one behind
  // the surrounding text, marks it like a highlight, as in link-in-text-block.
  function highlighted(el, parent, cs) {
    const c = helpers.contrast || null;
    if (!c) return false;
    const own = c.parseCssColorToRgba(cs.backgroundColor);
    if (!own || !own.a) return false;
    try {
      const opts = { contrast: { mode: 'auditorAssist', rootCanvasFallback: '#ffffff' } };
      const behindLink = c.computeEffectiveBackground(el, opts);
      const behindText = c.computeEffectiveBackground(parent, opts);
      if (!behindLink || !behindLink.ok || !behindText || !behindText.ok) return false;
      return c.rgbToHex(behindLink.rgba) !== c.rgbToHex(behindText.rgba);
    } catch {
      return false;
    }
  }

  function markedByMoreThanColor(el, parent) {
    const cs = safeComputedStyle(el);
    const parentCs = safeComputedStyle(parent);
    const c = helpers.contrast || null;
    if (cs && parentCs) {
      const weight = c ? c.normalizeFontWeight(cs.fontWeight) : cs.fontWeight;
      const parentWeight = c ? c.normalizeFontWeight(parentCs.fontWeight) : parentCs.fontWeight;
      if (String(weight) !== String(parentWeight)) return true;
      if ((cs.fontStyle || 'normal') !== (parentCs.fontStyle || 'normal')) return true;
    }
    if (
      cs &&
      (hasBorder(cs) || hasOutline(cs) || hasValue(cs.boxShadow) || hasValue(cs.backgroundImage))
    ) {
      return true;
    }
    if (hasImageChild(el) || hasPseudoContent(el)) return true;
    if (cs && highlighted(el, parent, cs)) return true;
    const decoration = decorationInfo(cs);
    const underlined = decoration.trustworthy ? decoration.underlined : underlineFromCssom(el);
    return underlined === true;
  }

  // ---- States ----

  const NON_COLOR_MARKS = [
    'text-decoration',
    'text-decoration-line',
    'border',
    'border-bottom',
    'border-top',
    'border-left',
    'border-right',
    'border-width',
    'border-style',
    'border-bottom-style',
    'outline',
    'outline-style',
    'box-shadow',
    'font-weight',
    'font-style',
    'background-image'
  ];

  function addsNonColorMark(style) {
    return NON_COLOR_MARKS.some((prop) => {
      const v = declared(style, prop);
      return !!v && v !== 'none' && !/^0(\.0+)?[a-z%]*$/.test(v) && v !== 'normal';
    });
  }

  // States whose author rule changes only the link's color.
  function colorOnlyStates(el) {
    const states = [];
    for (const cssRule of getStyleRules(el.ownerDocument)) {
      if (!declared(cssRule.style, 'color')) continue;
      if (addsNonColorMark(cssRule.style)) continue;
      for (const part of splitSelectorList(cssRule.selectorText)) {
        if (/::[a-z-]+/i.test(part)) continue;
        const found = part.match(STATE_RE);
        if (!found) continue;
        const base = part.replace(STATE_RE, '').trim() || '*';
        if (!matches(el, base)) continue;
        for (const s of found) {
          const name = s.slice(1).toLowerCase();
          if (!states.includes(name)) states.push(name);
        }
      }
    }
    return states;
  }

  // Whether an author declaration sets the link's color at rest, which then
  // applies to its visited state too.
  function authorSetsRestingColor(el) {
    if (declared(el.style, 'color')) return true;
    for (const cssRule of getStyleRules(el.ownerDocument)) {
      if (!declared(cssRule.style, 'color')) continue;
      for (const part of splitSelectorList(cssRule.selectorText)) {
        if (/::[a-z-]+/i.test(part) || ALL_STATES_RE.test(part)) continue;
        if (matches(el, part)) return true;
      }
    }
    return false;
  }

  const CANTTELL_HINT =
    'Put the link in each state (visited, active, hovered, focused) and check that its color contrasts at least 3:1 with the surrounding text, or give the link a mark other than color, such as an underline.';

  const MESSAGES = {
    STATE_CONTRAST_LOW: {
      reasonCode: 'STATE_CONTRAST_LOW',
      summaryKey: 'linkStateColorsReview_summary_fail_lowContrast',
      hintKey: 'linkStateColorsReview_hint_fail_lowContrast',
      summary: (p) =>
        `This link in a run of text is shown only by its color, and in these states that color contrasts below 3:1 with the surrounding text: ${p.states} (lowest ${p.ratio}:1, ${p.color} against ${p.textColor}).`,
      hint: 'Give the link a color with a contrast ratio of at least 3:1 with the surrounding text in each state, or mark it in those states by more than color, such as an underline (RGAA 10.6.1).'
    },
    STATE_COLOR_CHANGE: {
      reasonCode: 'STATE_COLOR_CHANGE',
      summaryKey: 'linkStateColorsReview_summary_cantTell_stateColor',
      summary:
        'This link in a run of text is shown only by its color, and a style rule changes that color in some of its states.',
      needed: 'Whether the link color in each listed state contrasts 3:1 with the surrounding text.'
    },
    BROWSER_STATE_COLORS: {
      reasonCode: 'BROWSER_STATE_COLORS',
      summaryKey: 'linkStateColorsReview_summary_cantTell_browserColors',
      summary:
        "This link in a run of text is shown only by its color, and no style rule sets that color, so the browser's own visited color, a different one, applies.",
      needed: 'Whether the visited link color contrasts 3:1 with the surrounding text.'
    },
    STYLESHEET_UNREADABLE: {
      reasonCode: 'STYLESHEET_UNREADABLE',
      summaryKey: 'linkStateColorsReview_summary_cantTell_unreadable',
      summary:
        'This link in a run of text is shown only by its color, and a style sheet that could not be read may change that color in some of its states.',
      needed:
        'Whether the link color changes in its visited, active, hover or focus state, and if so contrasts 3:1 with the surrounding text.'
    }
  };

  // ---- States put on the link, where the page has a layout ----

  function hasLayout(doc) {
    const probe = doc && doc.documentElement;
    if (!probe || typeof probe.getClientRects !== 'function') return false;
    try {
      const rects = probe.getClientRects();
      return !!(rects && rects.length > 0);
    } catch {
      return false;
    }
  }

  const STATE_ATTR = 'data-surea11y-link-state';
  const STATE_NAME_RE = /:(visited|active|hover|focus-visible|focus)(?![\w-])/gi;
  const LINK_RE = /:link(?![\w-])/gi;

  // Rewrites every readable author rule that names a link state so the
  // state also matches STATE_ATTR, keeping its specificity, order and
  // conditions. Returns a function that puts the selectors back, or null
  // when a selector could not be rewritten.
  function emulateStates(doc) {
    const changed = [];
    function restore() {
      for (let i = changed.length - 1; i >= 0; i--) {
        try {
          changed[i][0].selectorText = changed[i][1];
        } catch {
          // left as rewritten; the attribute it needs is never set
        }
      }
    }
    for (const cssRule of getStyleRules(doc)) {
      const before = cssRule.selectorText;
      STATE_NAME_RE.lastIndex = 0;
      LINK_RE.lastIndex = 0;
      if (!STATE_NAME_RE.test(before) && !LINK_RE.test(before)) continue;
      const after = splitSelectorList(before)
        .map((part) =>
          part
            .replace(STATE_NAME_RE, (m, name) => {
              const state = name.toLowerCase() === 'focus-visible' ? 'focus' : name.toLowerCase();
              return `:is(${m}, [${STATE_ATTR}~="${state}"])`;
            })
            .replace(LINK_RE, `:link:where(:not([${STATE_ATTR}~="visited"]))`)
        )
        .join(', ');
      try {
        cssRule.selectorText = after;
      } catch {
        // checked below
      }
      if (cssRule.selectorText === before) {
        restore();
        return null;
      }
      changed.push([cssRule, before]);
    }
    return restore;
  }

  function deepActiveElement(doc) {
    let cur = doc.activeElement || null;
    let guard = 0;
    while (cur && cur.shadowRoot && cur.shadowRoot.activeElement && guard++ < 20) {
      cur = cur.shadowRoot.activeElement;
    }
    return cur;
  }

  // Runs fn with the link in one state, then takes the state off.
  function inState(el, state, fn) {
    const doc = el.ownerDocument;
    if (state === 'focus') {
      if (typeof el.focus !== 'function') return null;
      const previous = deepActiveElement(doc);
      try {
        el.focus({ preventScroll: true, focusVisible: true });
        if (deepActiveElement(doc) !== el) return null;
        return fn();
      } catch {
        return null;
      } finally {
        try {
          if (previous && previous !== doc.body && typeof previous.focus === 'function') {
            if (deepActiveElement(doc) !== previous) previous.focus({ preventScroll: true });
          } else if (deepActiveElement(doc) === el) {
            el.blur();
          }
        } catch {}
      }
    }
    const targets = [el];
    if (state === 'hover' || state === 'active') {
      for (let n = el.parentElement; n; n = n.parentElement) targets.push(n);
    }
    const saved = targets.map((t) =>
      t.hasAttribute(STATE_ATTR) ? t.getAttribute(STATE_ATTR) : null
    );
    try {
      targets.forEach((t, i) =>
        t.setAttribute(STATE_ATTR, ((saved[i] || '') + ' ' + state).trim())
      );
      return fn();
    } catch {
      return null;
    } finally {
      targets.forEach((t, i) => {
        if (saved[i] == null) t.removeAttribute(STATE_ATTR);
        else t.setAttribute(STATE_ATTR, saved[i]);
      });
    }
  }

  // What the link looks like now: its color, the color of the surrounding
  // text, and whether anything but color marks it.
  function lookOf(el, parent, rest) {
    const cs = safeComputedStyle(el);
    const parentCs = safeComputedStyle(parent);
    if (!cs || !parentCs) return null;
    const c = helpers.contrast;
    const marked =
      decorationInfo(cs).underlined ||
      hasBorder(cs) ||
      hasOutline(cs) ||
      hasValue(cs.boxShadow) ||
      hasValue(cs.backgroundImage) ||
      String(c.normalizeFontWeight(cs.fontWeight)) !==
        String(c.normalizeFontWeight(parentCs.fontWeight)) ||
      (cs.fontStyle || 'normal') !== (parentCs.fontStyle || 'normal') ||
      (rest ? cs.backgroundColor !== rest.backgroundColor : false);
    return {
      color: cs.color,
      parentColor: parentCs.color,
      backgroundColor: cs.backgroundColor,
      marked
    };
  }

  // Contrast between the link color and the surrounding text, both over the
  // background behind the link. null when it cannot be computed.
  function ratioOf(el, look, bgOpts) {
    const c = helpers.contrast;
    try {
      const bg = c.computeEffectiveBackground(el, bgOpts);
      if (!bg || !bg.ok || !bg.rgba) return null;
      const opaque = (value) => {
        const rgba = c.parseCssColorToRgba(value);
        if (!rgba) return null;
        return rgba.a < 1
          ? c.compositeRgba(rgba, bg.rgba)
          : { r: rgba.r, g: rgba.g, b: rgba.b, a: 1 };
      };
      const link = opaque(look.color);
      const text = opaque(look.parentColor);
      if (!link || !text) return null;
      return {
        ratio: c.contrastRatio(link, text),
        color: c.rgbToHex(link),
        textColor: c.rgbToHex(text)
      };
    } catch {
      return null;
    }
  }

  const STATES = ['visited', 'hover', 'active', 'focus'];

  // Rounded to two decimals, except that a ratio below 3 never reads 3.00.
  function shownRatio(r) {
    const rounded = Number(helpers.contrast.round2(r));
    return r < 3 && rounded >= 3 ? 2.99 : rounded;
  }

  // What every link looks like in one state. Visited, hover and active are
  // put on all the links at once, so the page's styles are worked out once
  // per state rather than once per link; focus is real focus, link by link.
  function looksInState(list, state) {
    const looks = new Map();
    if (state === 'focus') {
      for (const [el, parent, rest] of list) {
        looks.set(
          el,
          inState(el, 'focus', () => lookOf(el, parent, rest))
        );
      }
      return looks;
    }
    const targets = new Set();
    for (const [el] of list) {
      targets.add(el);
      if (state === 'hover' || state === 'active') {
        for (let n = el.parentElement; n; n = n.parentElement) targets.add(n);
      }
    }
    const saved = new Map();
    try {
      for (const t of targets) {
        const before = t.hasAttribute(STATE_ATTR) ? t.getAttribute(STATE_ATTR) : null;
        saved.set(t, before);
        t.setAttribute(STATE_ATTR, ((before || '') + ' ' + state).trim());
      }
      for (const [el, parent, rest] of list) looks.set(el, lookOf(el, parent, rest));
    } catch {
      // the states left unread are not judged
    } finally {
      for (const [t, before] of saved) {
        if (before == null) t.removeAttribute(STATE_ATTR);
        else t.setAttribute(STATE_ATTR, before);
      }
    }
    return looks;
  }

  // For each link: { failing: [{ state, ratio, color, textColor }],
  // visitedUnknown, uncomputable }.
  function judgeAll(pairs, bgOpts) {
    const list = [];
    for (const [el, parent] of pairs) {
      const rest = lookOf(el, parent, null);
      if (rest) list.push([el, parent, rest]);
    }
    const verdicts = new Map(
      list.map(([el]) => [el, { failing: [], uncomputable: [], visitedSame: false }])
    );
    for (const state of STATES) {
      const looks = looksInState(list, state);
      for (const [el, , rest] of list) {
        const look = looks.get(el);
        const v = verdicts.get(el);
        if (!look) continue; // a link that cannot take focus has no focus state
        if (look.color === rest.color && look.parentColor === rest.parentColor) {
          if (state === 'visited') v.visitedSame = true;
          continue;
        }
        if (look.marked) continue;
        const m = ratioOf(el, look, bgOpts);
        if (!m) v.uncomputable.push(state);
        else if (m.ratio < 3) v.failing.push({ state, ...m });
      }
    }
    for (const [el, v] of verdicts) {
      v.visitedUnknown = v.visitedSame && uaUnderlines(el) && !authorSetsRestingColor(el);
    }
    return verdicts;
  }

  const selector = 'a[href], [role="link"]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  const failOccurrences = [];
  const occurrences = [];
  let passCount = 0;

  const doc = ctx.document || (nodes[0] && nodes[0].ownerDocument) || null;
  const contrastOpts =
    ctx.engineOptions &&
    typeof ctx.engineOptions.contrast === 'object' &&
    ctx.engineOptions.contrast
      ? ctx.engineOptions.contrast
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

  const inScope = [];
  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible =
      typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    const parent = el.parentElement;
    if (!hasSurroundingText(el, parent)) continue;
    if (markedByMoreThanColor(el, parent)) continue;
    inScope.push([el, parent]);
  }

  // Transitions held off for the time of the check, so a state put on the
  // page is read at once rather than at the start of its transition. The
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

  // Each link's states, read in one pass while the selectors are rewritten.
  const judged = new Map();
  if (inScope.length && doc && hasLayout(doc)) {
    getStyleRules(doc);
    const restore = unreadableSheet ? null : emulateStates(doc);
    if (restore) {
      const unfreeze = freezeTransitions(doc);
      try {
        for (const [el, verdict] of judgeAll(inScope, bgOpts)) judged.set(el, verdict);
      } finally {
        restore();
        unfreeze();
      }
    }
  }

  function report(el, reasonCode, params, extra) {
    const msg = MESSAGES[reasonCode];
    return helpers.reportOccurrence(el, {
      summary: typeof msg.summary === 'function' ? msg.summary(params) : msg.summary,
      hint: msg.hint || CANTTELL_HINT,
      i18n: {
        summaryKey: msg.summaryKey,
        hintKey: msg.hintKey || 'linkStateColorsReview_hint_cantTell',
        params
      },
      ...(msg.needed
        ? {
            uncertainty: {
              code: 'runtime-dependent',
              needed: msg.needed,
              evidence: { reasonCode, states: extra.states }
            }
          }
        : {}),
      data: { details: { reasonCode, ...extra } }
    });
  }

  for (const [el] of inScope) {
    const verdict = judged.get(el);
    if (verdict) {
      if (verdict.failing.length) {
        const worst = verdict.failing.slice().sort((a, b) => a.ratio - b.ratio)[0];
        const states = verdict.failing.map((f) => f.state);
        failOccurrences.push(
          report(
            el,
            'STATE_CONTRAST_LOW',
            {
              states: states.join(', '),
              color: worst.color,
              textColor: worst.textColor,
              ratio: String(shownRatio(worst.ratio))
            },
            {
              states,
              ratios: verdict.failing.map((f) => ({
                state: f.state,
                color: f.color,
                textColor: f.textColor,
                ratio: shownRatio(f.ratio)
              }))
            }
          )
        );
      } else if (verdict.visitedUnknown) {
        occurrences.push(report(el, 'BROWSER_STATE_COLORS', { states: '' }, { states: [] }));
      } else if (verdict.uncomputable.length) {
        const states = verdict.uncomputable;
        occurrences.push(
          report(el, 'STATE_COLOR_CHANGE', { states: states.join(', ') }, { states })
        );
      } else {
        passCount += 1;
      }
      continue;
    }

    const states = colorOnlyStates(el);
    let reasonCode = '';
    if (states.length) reasonCode = 'STATE_COLOR_CHANGE';
    else if (uaUnderlines(el) && !authorSetsRestingColor(el)) reasonCode = 'BROWSER_STATE_COLORS';
    else if (unreadableSheet) reasonCode = 'STYLESHEET_UNREADABLE';
    if (!reasonCode) continue;
    occurrences.push(report(el, reasonCode, { states: states.join(', ') }, { states }));
  }

  if (!failOccurrences.length && !occurrences.length) {
    return passCount
      ? { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] }
      : { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    ...helpers.resolveTieredOutcome(
      failOccurrences,
      occurrences,
      rule.defaultSeverity || 'moderate'
    )
  };
}

module.exports = { id, meta, runInPage };
