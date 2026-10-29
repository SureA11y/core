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
 *   it removes the indicator in the focused state too (WCAG F78). A rule
 *   that removes it only under `:not(:focus-visible)` keeps it for keyboard
 *   focus and is not counted; nor is the focus-visible polyfill's form of
 *   it, `:not(.focus-visible)` under `.js-focus-visible`, or
 *   `:not([data-focus-visible-added])` under `[data-js-focus-visible]`.
 * @reports
 *   - `suppressingSelectors`: the selector of each style sheet rule that
 *     removes the element's outline, one item per selector.
 * @reason-codes
 *   - `FOCUS_INDICATOR_SUPPRESSED` (cantTell): a style sheet rule removes the
 *     element's focus outline and no focus rule draws a replacement; whether
 *     the page shows focus another way is for a person to check.
 *     It leans fail when every style sheet could be read, no :focus-within
 *     rule around the element draws a change, no inline focus or blur
 *     handler is on it or an ancestor, the removing rule doesn't name
 *     focus-visible, and the listener hook, when it ran, saw no focus
 *     listener for it.
 *     Basis: WCAG 2.4.7 (not settled); F78; ACT oj04fd.
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
 *   stripped out of the selector. A selector the engine cannot parse
 *   (vendor pseudo-elements, `:host`, unsupported `:is()` forms) throws
 *   there and is skipped rather than guessed at.
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
  coverage: { facetsBySc: { '2.4.7': ['focus-indicator-not-suppressed'] } },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    FOCUS_INDICATOR_SUPPRESSED: {
      steps: [
        'Click just before the element the report names, then press Tab until it has focus.',
        'Look at the element, and the area around it, for any visible change when it receives focus.',
        'Press Tab and Shift+Tab to move focus off and back on, comparing the two states.'
      ],
      passWhen:
        'A visible indicator, such as an outline, border, underline, color or background change, shows when the element has focus.',
      failWhen:
        'Nothing visible changes when the element receives focus, which fails WCAG 2.4.7 (F78).'
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

  const suppressors = []; // { selector, base }
  const providers = []; // { base, subject }
  // :focus-within rules that draw something: the compound holding the
  // pseudo, without it. Read only for the lean, never to pass an element.
  const withinProviders = [];
  const FOCUS_WITHIN = /:focus-within(?![-\w])/g;

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
    const provides = providesReplacement(style);
    if (!suppresses && !provides) return;

    for (const part of splitSelectorList(selectorText)) {
      // The polyfill's form is read as native :not(:focus-visible) for the
      // outline it removes; what the same rule draws is read as written.
      const asNative = suppresses ? polyfillAsNative(part) : part;
      if (asNative !== part) {
        collectFromPart(asNative, true, false);
        collectFromPart(part, false, provides);
      } else {
        collectFromPart(part, suppresses, provides);
      }
    }
  }

  function collectFromPart(part, suppresses, provides) {
    // `:not(:focus-visible)` leaves the outline on keyboard focus: what such
    // a rule removes is only the mouse's focus ring, so it is never a
    // suppressor.
    if (suppresses && /:not\(\s*:focus-visible\s*\)/.test(part)) suppresses = false;
    if (provides && /:focus-within(?![-\w])/.test(part)) {
      for (const compound of splitCompounds(part)) {
        if (!/:focus-within(?![-\w])/.test(compound)) continue;
        withinProviders.push(trim(compound.replace(FOCUS_WITHIN, '')) || '*');
      }
    }
    if (!hasFocusPseudo(part)) {
      // A rule with no focus state still applies while the element has
      // focus, and an author declaration beats the user agent's focus
      // outline. Other states (:hover, :active) never match the static
      // element, so el.matches() leaves them out below.
      if (suppresses && !hasPseudoElement(part)) {
        suppressors.push({ selector: trim(part), base: trim(part) });
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
      suppressors.push({ selector: trim(part), base: stripFocusPseudo(part) });
    }

    // A replacement is credited to the element that takes focus, wherever
    // the rule paints it: on the element itself, its pseudo-element, a
    // sibling, or a descendant.
    if (provides) providers.push({ base: focusedBase, subject: isSubject });
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

  let sheetCount = 0;
  let unreadableSheets = 0;
  try {
    const sheets = dom.styleSheets(document) || [];
    for (const sheet of sheets) {
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
      walkRules(rules, 0, '');
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

  const CANDIDATE_SELECTOR =
    'a[href],area[href],button,input,select,textarea,summary,[tabindex],[contenteditable]';
  const candidates = helpers.queryAllSmart
    ? helpers.queryAllSmart(CANDIDATE_SELECTOR)
    : helpers.queryAll(CANDIDATE_SELECTOR);

  const occurrences = [];
  let applicableCount = 0;

  for (const el of candidates) {
    if (!el || dom.nodeType(el) !== 1) continue;
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

    // The lean: nothing the scan can read draws focus another way.
    const inlineHandler = closestSafe(el, INLINE_FOCUS_HANDLERS);
    const focusWithin = withinProviders.some((b) => closestSafe(el, b));
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
