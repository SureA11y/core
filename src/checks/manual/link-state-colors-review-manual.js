/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check link-state-colors-review
 * @atomic true
 * @summary A text link shown only by color whose states change its color is flagged for review
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to links (<a href> and role="link") inside a run of text (their
 *   parent has text of its own, as for link-in-text-block) that carry no
 *   mark other than color at rest: no underline, no weight or style
 *   difference from the surrounding text, no border, outline, box-shadow,
 *   background image, image or generated content (glossary "Lien dont la
 *   nature n'est pas évidente"). Among those, it flags a link:
 *   - matched by an author style rule for :visited, :active, :hover, :focus
 *     or :focus-visible that sets a color and adds no other mark
 *     (STATE_COLOR_CHANGE);
 *   - an <a href> whose color no author rule sets, so the browser's own
 *     visited color, which differs from its link color, applies
 *     (BROWSER_STATE_COLORS);
 *   - when a style sheet cannot be read, so such a rule cannot be ruled out
 *     (STYLESHEET_UNREADABLE).
 *   A page with no such link is notApplicable.
 * @expectation
 *   RGAA 10.6.1 step 3: the 3:1 contrast between the link color and the
 *   surrounding text must be checked « pour les différents états du lien
 *   s'ils sont présentés au moyen d'une couleur différente : l'état non
 *   visité, l'état visité, l'état activé, l'état au survol et l'état à la
 *   prise de focus ». Each flagged link is asked about, for a person to
 *   check the contrast of each state.
 * @implementation-notes
 * - Manual (cantTell): a static scan cannot put a link in its visited,
 *   active, hovered or focused state, and browsers hide the visited color
 *   from scripts. link-in-text-block judges the resting state.
 * - The resting-state cues are read as link-in-text-block reads them,
 *   including its CSSOM fallback for `text-decoration` under a DOM
 *   emulator. A link whose underline cannot be resolved is treated as
 *   possibly shown by color only.
 * - A state rule is matched by removing the state pseudo-classes from its
 *   selector and matching the rest against the link. A state rule that
 *   also sets a text decoration, border, outline, box-shadow, font weight
 *   or style, or background image marks that state by more than color and
 *   is not flagged.
 * - Opt-in (tag `rgaa`): WCAG 1.4.1 does not single out these states.
 */

const id = 'link-state-colors-review';

const meta = {
  title: 'Link states shown by color alone are reviewed',
  description:
    'Flags links in a run of text, shown only by color, whose visited, active, hover or focus state changes their color, for a person to check the 3:1 contrast of each state with the surrounding text (RGAA 10.6.1).',
  i18n: {
    titleKey: 'linkStateColorsReview_title',
    descriptionKey: 'linkStateColorsReview_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'links', 'color', 'contrast', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'manual',
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
      if (helpers && typeof helpers.computedStyle === 'function') {
        const cs = helpers.computedStyle(el);
        if (cs) return cs;
      }
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

  const MESSAGES = {
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

  const selector = 'a[href], [role="link"]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  const occurrences = [];

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible =
      typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    const parent = el.parentElement;
    if (!hasSurroundingText(el, parent)) continue;
    if (markedByMoreThanColor(el, parent)) continue;

    const states = colorOnlyStates(el);
    let reasonCode = '';
    if (states.length) reasonCode = 'STATE_COLOR_CHANGE';
    else if (uaUnderlines(el) && !authorSetsRestingColor(el)) reasonCode = 'BROWSER_STATE_COLORS';
    else if (unreadableSheet) reasonCode = 'STYLESHEET_UNREADABLE';
    if (!reasonCode) continue;

    const msg = MESSAGES[reasonCode];
    const stateList = states.join(', ');
    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: msg.summary,
        hint: 'Put the link in each state (visited, active, hovered, focused) and check that its color contrasts at least 3:1 with the surrounding text, or give the link a mark other than color, such as an underline.',
        i18n: {
          summaryKey: msg.summaryKey,
          hintKey: 'linkStateColorsReview_hint_cantTell',
          params: { states: stateList }
        },
        uncertainty: {
          code: 'runtime-dependent',
          needed: msg.needed,
          evidence: { reasonCode, states }
        },
        data: {
          details: { reasonCode, states }
        }
      })
    );
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
