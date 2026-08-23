/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check css-focus-indicator-suppressed
 * @atomic true
 * @summary CSS must not remove the focus indicator without drawing a replacement
 * @standard WCAG 2.2
 * @sc 2.4.7
 * @applicability
 *   Elements in sequential focus navigation (tabbable and rendered) on a
 *   page whose accessible stylesheets contain at least one `:focus` or
 *   `:focus-visible` rule. With no focus rule anywhere, every element
 *   keeps the user agent's own indicator and there is nothing to check.
 * @expectation
 *   No element is matched by a `:focus`/`:focus-visible` rule that removes
 *   the outline (`outline: none`, `outline: 0`, `outline-color:
 *   transparent`, ...) unless some other focus rule matching it draws a
 *   replacement: a border, box-shadow, background, color change, a
 *   positive outline of its own, or a `::before`/`::after` decoration.
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
 *   replacement: it offsets an outline that is no longer drawn.
 * - Cross-origin stylesheets throw on `.cssRules` access and are skipped,
 *   same limitation as `css-orientation-lock`. A page whose only focus
 *   styles live in one of those is reported as having no focus rules at
 *   all, so it is not flagged.
 * - Selector matching goes through `el.matches()` on the focus pseudo
 *   stripped out of the selector. A selector the engine cannot parse
 *   (vendor pseudo-elements, `:host`, unsupported `:is()` forms) throws
 *   there and is skipped rather than guessed at.
 */

const id = 'css-focus-indicator-suppressed';

const meta = {
  title: 'Focus indicator must not be removed without a replacement',
  description:
    'Flags elements in the tab order whose focus outline is removed by a :focus/:focus-visible rule with no replacement indicator (border, box-shadow, background, ...) in any other focus rule matching them.',
  i18n: {
    titleKey: 'cssFocusIndicatorSuppressed_title',
    descriptionKey: 'cssFocusIndicatorSuppressed_description'
  },
  helpUrl: null,
  tags: ['wcag2aa', 'wcag247', 'navigation', 'focus', 'css', 'atomic', 'manual'],
  wcagSc: ['2.4.7'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '2.4.7',
      title: 'Focus Visible',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'serious',
  category: 'operable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: { facetsBySc: { '2.4.7': ['focus-indicator-not-suppressed'] } }
};

function runInPage(ctx) {
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

  // A positive outline counts as a replacement: `*:focus { outline: none }`
  // followed by `a:focus { outline: 2px solid }` leaves links indicated.
  function drawsOutline(style) {
    if (suppressesOutline(style)) return false;
    return !!(
      getProp(style, 'outline') ||
      getProp(style, 'outline-style') ||
      getProp(style, 'outline-width') ||
      getProp(style, 'outline-color')
    );
  }

  function providesReplacement(style) {
    if (drawsOutline(style)) return true;
    for (const prop of REPLACEMENT_PROPS) {
      if (getProp(style, prop)) return true;
    }
    return false;
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

  // :focus and :focus-visible, but never :focus-within: that one fires on
  // an ancestor of the focused element and says nothing about whether the
  // element itself is indicated.
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

  function stripFocusPseudo(compound) {
    const stripped = trim(String(compound).replace(FOCUS_PSEUDO, ''));
    return stripped || '*';
  }

  // A pseudo-element part styles generated content rather than the element,
  // so it can draw a replacement but can never be the thing suppressing the
  // element's own outline.
  function hasPseudoElement(part) {
    return /::[a-z-]+/.test(part) || /:(before|after)\b/.test(part);
  }

  function matchesSafe(el, selector) {
    if (!el || typeof el.matches !== 'function' || !selector) return false;
    try {
      return el.matches(selector);
    } catch {
      return false; // selector this engine cannot parse, skip rather than guess
    }
  }

  function closestSafe(el, selector) {
    if (!el || typeof el.closest !== 'function' || !selector) return false;
    try {
      return !!el.closest(selector);
    } catch {
      return false;
    }
  }

  const suppressors = []; // { selector, base }
  const providers = []; // { base, subject }

  function collectFromStyleRule(cssRule) {
    const style = cssRule.style;
    if (!style) return;

    const suppresses = suppressesOutline(style);
    const provides = providesReplacement(style);
    if (!suppresses && !provides) return;

    for (const part of splitSelectorList(cssRule.selectorText)) {
      if (!hasFocusPseudo(part)) continue;

      const compounds = splitCompounds(part);
      let focusIndex = -1;
      for (let i = 0; i < compounds.length; i++) {
        if (hasFocusPseudo(compounds[i])) {
          focusIndex = i;
          break;
        }
      }
      if (focusIndex === -1) continue;

      const isSubject = focusIndex === compounds.length - 1;
      const focusedBase =
        stripFocusPseudo(compounds[focusIndex]).replace(/::?[a-z-]+$/i, '') || '*';

      if (suppresses && isSubject && !hasPseudoElement(part)) {
        suppressors.push({ selector: trim(part), base: stripFocusPseudo(part) });
      }

      // A replacement is credited to the element that takes focus, wherever
      // the rule paints it: on the element itself, its pseudo-element, a
      // sibling, or a descendant.
      if (provides) providers.push({ base: focusedBase, subject: isSubject });
    }
  }

  function walkRules(rules, depth) {
    if (!rules || depth > MAX_DEPTH) return;
    for (const cssRule of rules) {
      if (!cssRule) continue;
      if (cssRule.type === CSS_STYLE_RULE && cssRule.selectorText) {
        collectFromStyleRule(cssRule);
        continue;
      }
      // @media, @supports, @layer, ...: recurse into grouping rules.
      let nested;
      try {
        nested = cssRule.cssRules || null;
      } catch {
        nested = null;
      }
      if (nested) walkRules(nested, depth + 1);
    }
  }

  let sheetCount = 0;
  try {
    const sheets = document.styleSheets || [];
    for (const sheet of sheets) {
      let rules = null;
      try {
        rules = sheet && sheet.cssRules ? sheet.cssRules : null;
      } catch {
        continue; // cross-origin stylesheet, not inspectable
      }
      if (!rules) continue;
      sheetCount += 1;
      walkRules(rules, 0);
    }
  } catch {
    // no-throw: treat as no accessible stylesheets
  }

  if (sheetCount === 0 || !suppressors.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
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

  const CANDIDATE_SELECTOR =
    'a[href],area[href],button,input,select,textarea,summary,[tabindex],[contenteditable]';
  const candidates = helpers.queryAllSmart
    ? helpers.queryAllSmart(CANDIDATE_SELECTOR)
    : helpers.queryAll(CANDIDATE_SELECTOR);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of candidates) {
    if (!el || el.nodeType !== 1) continue;
    if (!isTabbable(el)) continue;
    if (!isRendered(el)) continue;

    applicableCount += 1;

    const suppressing = suppressors.filter((s) => matchesSafe(el, s.base));
    if (!suppressing.length) continue;

    const indicated = providers.some((p) =>
      p.subject ? matchesSafe(el, p.base) : matchesSafe(el, p.base) || closestSafe(el, p.base)
    );
    if (indicated) continue;

    const selectors = [...new Set(suppressing.map((s) => s.selector))];
    const eligInfo = helpers.getEligibilityInfo
      ? (() => {
          try {
            return helpers.getEligibilityInfo(el, ctx, { targetSet: 'dom' });
          } catch {
            return null;
          }
        })()
      : null;

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This element takes a tab stop, and "${selectors.join(', ')}" removes its focus outline with no replacement indicator in any other focus rule matching it.`,
        hint: 'Draw a replacement indicator in the same rule (a visible outline, border, box-shadow, or background change), or drop the outline reset. If the indicator is applied from script instead, confirm it appears for keyboard users.',
        i18n: {
          summaryKey: 'cssFocusIndicatorSuppressed_summary_cantTell',
          hintKey: 'cssFocusIndicatorSuppressed_hint_cantTell',
          params: { selectors: selectors.join(', ') }
        },
        data: {
          details: {
            reasonCode: 'FOCUS_INDICATOR_SUPPRESSED',
            suppressingSelectors: selectors
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
