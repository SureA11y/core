/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check contrast-computable
 * @atomic true
 * @summary Color contrast must be computable from CSS for rendered text
 * @standard WCAG 2.2
 * @sc 1.4.3
 * @sc 1.4.6
 * @applicability
 *   Applies to every visible text node in scope, plus the label of <input
 *   type="button">/[type="submit"]/[type="reset"], which is rendered from
 *   the value attribute and so is invisible to a text-node walk, and the
 *   text a form field shows: the current value of a <textarea> or of an
 *   <input> that shows text (text, search, email, url, tel, password,
 *   number, the date and time types), or, while the value is empty, its
 *   placeholder, in the ::placeholder color, font, opacity and background
 *   (only where the browser computes that style; jsdom does not). The text
 *   of a drop-down <select> (no `multiple`, a size of 1 or none, not
 *   `appearance: base-select`) counts as the select's, drawn by the closed
 *   control in its colours, font and background: its shown option, and any
 *   other option with the select's colours. In a browser, so is the text a
 *   ::before or ::after `content` generates (strings, attr() as the browser
 *   resolves it, counters), and a list item's ::marker text (a number or a
 *   letter, or a string; a bullet or an image isn't text), each judged in
 *   the pseudo-element's colour and font, on its element; jsdom computes no
 *   pseudo-element styles, so there it is left out. Text counts
 *   only when its element is DOM-visible under the run's visibility mode, is
 *   not clipped out of sight by the sr-only technique (clip or clip-path),
 *   and belongs neither to a disabled control nor to the label of one,
 *   WCAG's inactive-user-interface-component exception. Subtrees excluded
 *   via engineOptions.excludeSelectors are skipped, and open shadow roots
 *   are walked as roots in their own right.
 * @expectation
 *   Both sides of the contrast calculation can be established from CSS for
 *   every applicable text node: an effective background resolving to an
 *   opaque color, and a parsable foreground color. Where either cannot be,
 *   a background image or gradient (a gradient of one color is that color,
 *   and a layer that paints nothing under the text, such as a 1px underline,
 *   is left out: docs/LAYOUT_MEASUREMENT.md), mix-blend-mode, a filter
 *   (other than drop-shadow() alone over an opaque background under all of
 *   the text, which hides the shadow) or backdrop-filter, a text-shadow (which may add contrast
 *   this engine has no glyph-rendering model to account for), a
 *   -webkit-text-stroke
 *   outline (drawn in its own colour, often most of the glyph), a
 *   ::first-line or ::first-letter in a colour of its own (which text it
 *   paints depends on line breaks), opacity on an ancestor, or
 *   on the text's own element over a background of its own, that can't be
 *   resolved against what lies behind it, a root
 *   background that never becomes opaque (in a browser, outside a frame,
 *   the canvas painted under the root is read, and text is measured on it),
 *   a color that does not parse, or an option of a drop-down <select>,
 *   other than the shown one, with a color, background or opacity of its
 *   own (SELECT_OPTION_COLOR: it is shown only in the list the select
 *   opens, which the platform draws in those colours or in its own),
 *   the result is cantTell naming the blocker. This rule is the one that
 *   reports that uncertainty, which is what lets contrast-minimum and
 *   contrast-enhanced stay silent on the same text instead of guessing at
 *   a ratio. One exception: text drawn by a stroke or a shadow, every
 *   colour of which, its fill included when seen, is below the AA ratio
 *   against a flat background, fails contrast-minimum and
 *   contrast-enhanced, and is not asked about here.
 * @reports
 *   - `blockerProperty`, `blockerValue` (a CSS effect in the way): the CSS
 *     property that blocks the calculation and its value, for example
 *     `mix-blend-mode`, `filter`, `text-shadow`, `-webkit-text-stroke` or
 *     `opacity`.
 *   - `blockerSelector` (a CSS effect in the way): a selector for the
 *     element that has it, which may be an ancestor of the text.
 *   - `backgroundFillType` (a background image or gradient): `image`,
 *     `gradient`, `imageAndGradient`, or `unknown`.
 *   - `background`, `backgroundAlpha` (a background that never becomes
 *     opaque, or a color that does not parse): the background color as far
 *     as it could be worked out, as an `rgba()` string, and its opacity from
 *     0 to 1.
 *   - `eligibleTextCount` (the pass): how many text nodes were checked.
 *   - `assumptionsCount`, `assumptionsApplied` (the pass): how many text
 *     nodes needed an assumption to get a background, and which ones were
 *     made. Each item is a code; `ROOT_CANVAS_FALLBACK` means a page
 *     background that never becomes opaque was taken to sit on the
 *     configured canvas color, white by default.
 *   - `generatedBy` (generated text that can't be measured): `::before`,
 *     `::after` or `::marker`, the pseudo-element whose text is asked
 *     about; the selector names its element. `GENERATED_TEXT_UNREADABLE`
 *     is content whose text can't be read (a counter in a style of the
 *     page's own), `GENERATED_TEXT_POSITIONED` a pseudo-element taken out
 *     of the flow with no opaque background of its own.
 *   - `forcedColors` (every occurrence, when the colors measured were
 *     forced): `true`, and the hint says to check the page again with
 *     forced colors off. A scan under forced colors measures the page's own
 *     colors, so this is there only where it could not keep the page in
 *     them (docs/LAYOUT_MEASUREMENT.md, "Forced colors").
 */

const id = 'contrast-computable';

const meta = {
  title: 'Color contrast is computable for rendered text',
  description:
    'Determines whether sufficient information is available to compute WCAG color contrast for visible text (e.g., no gradients/images/blend modes that make background indeterminate).',
  i18n: {
    titleKey: 'contrastComputable_title',
    descriptionKey: 'contrastComputable_description'
  },
  helpUrl: null,
  tags: [
    'wcag2aa',
    'wcag2aaa',
    'wcag143',
    'wcag146',
    'contrast',
    'color',
    'structure',
    'atomic',
    'automatic',
    'dom'
  ],
  wcagSc: ['1.4.3', '1.4.6'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.4.3',
      title: 'Contrast (Minimum)',
      conformanceLevel: 'AA'
    },
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.4.6',
      title: 'Contrast (Enhanced)',
      conformanceLevel: 'AAA'
    }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: {
    facetsBySc: {
      '1.4.3': ['contrast-computability-143'],
      '1.4.6': ['contrast-computability-146']
    }
  },
  // Reason codes built at runtime, which scripts/generate-finding-ids.js
  // can't read from the source.
  reasonCodes: [
    'BACKGROUND_NOT_OPAQUE_AT_ROOT',
    'BACKGROUND_OVERLAP',
    'BACKGROUND_UNPARSABLE',
    'FOREGROUND_UNPARSABLE',
    'TEXT_SHADOW',
    'TEXT_STROKE',
    'PSEUDO_ELEMENT_COLOR',
    'SELECT_OPTION_COLOR',
    'GENERATED_TEXT_UNREADABLE',
    'GENERATED_TEXT_POSITIONED'
  ]
};

function runInPage(ctx) {
  const { helpers, rule, engineOptions } = ctx;

  const __contrastSharedCache =
    helpers && helpers.contrast && helpers.contrast.sharedCache
      ? helpers.contrast.sharedCache
      : null;

  const contrast =
    engineOptions && typeof engineOptions.contrast === 'object' && engineOptions.contrast
      ? engineOptions.contrast
      : {};

  const mode = contrast.mode === 'auditorAssist' ? 'auditorAssist' : 'strictConformance';

  const rootCanvasFallback =
    typeof contrast.rootCanvasFallback === 'string' && contrast.rootCanvasFallback.trim()
      ? contrast.rootCanvasFallback.trim()
      : '#ffffff';

  const MAX_OCCURRENCES = 50;

  const occurrences = [];
  let eligibleTextCount = 0;
  let cantTellCount = 0;
  let assumptionsCount = 0;
  const assumptionsAppliedSet = new Set();

  const seenFailEls = new Set();

  // Defined inside runInPage, which is serialized into the page and cannot
  // reach module scope. English fallbacks for the dictionary keys below.
  const CANT_TELL_HINT_KEYS = {
    background: 'contrastComputable_hint_cantTell_background',
    effect: 'contrastComputable_hint_cantTell_effect',
    rootNotOpaque: 'contrastComputable_hint_cantTell_rootNotOpaque',
    selectOption: 'contrastComputable_hint_cantTell_selectOption',
    generic: 'contrast_hint_cantTell_manual'
  };
  const CANT_TELL_HINTS = {
    background:
      'Measure the contrast by hand on the rendered page, where the background behind the text gives the least contrast. Normal text needs at least 4.5:1 and large text 3:1 (7:1 and 4.5:1 for AAA).',
    effect:
      'Measure the contrast by hand on the rendered page with the effect applied, since the declared CSS colors are not what ends up on screen. Normal text needs at least 4.5:1 and large text 3:1 (7:1 and 4.5:1 for AAA).',
    rootNotOpaque:
      'No element behind this text, up to the root, has a fully opaque background, so the color it sits on depends on where the page is displayed. Set an opaque background color on html or body, or measure the contrast against the background the page is actually shown on.',
    selectOption:
      "Open the list on each platform you support and measure the option's text there. Normal text needs at least 4.5:1 and large text 3:1 (7:1 and 4.5:1 for AAA). An option with the select's own colors is measured as the closed control draws it.",
    generic:
      "Measure this text's contrast by hand on the rendered page. Normal text needs at least 4.5:1 and large text 3:1 (7:1 and 4.5:1 for AAA)."
  };

  // Generated text already reported, per pseudo-element: an element's own
  // text and the text its ::before generates are reported apart.
  const seenGenerated = new Map();

  // extraDetails.generatedBy: the text is what el's ::before, ::after or
  // ::marker generates, and the summary says so.
  function pushCantTellOccurrence(el, reasonCode, extraDetails) {
    try {
      const pseudo =
        extraDetails && typeof extraDetails === 'object' && extraDetails.generatedBy
          ? String(extraDetails.generatedBy)
          : '';
      if (pseudo && !seenGenerated.has(pseudo)) seenGenerated.set(pseudo, new Set());
      const seen = pseudo ? seenGenerated.get(pseudo) : seenFailEls;
      if (!el || seen.has(el)) return;
      if (occurrences.length >= MAX_OCCURRENCES) return;
      seen.add(el);

      const rc = String(reasonCode || 'UNKNOWN');

      // Match test contract: choose a specific summaryKey per computability blocker.
      // Fall back to the generic notComputable key.
      let summaryKey = 'contrastComputable_cantTell_notComputable';
      if (rc === 'BACKGROUND_IMAGE_OR_GRADIENT') {
        const t =
          extraDetails && typeof extraDetails === 'object'
            ? String(extraDetails.backgroundFillType || '')
            : '';

        if (t === 'image') summaryKey = 'contrastComputable_cantTell_bgImage';
        else if (t === 'gradient') summaryKey = 'contrastComputable_cantTell_bgGradient';
        else if (t === 'imageAndGradient')
          summaryKey = 'contrastComputable_cantTell_bgImageAndGradient';
        else summaryKey = 'contrastComputable_cantTell_bgImageOrGradient';
      } else if (rc === 'MIX_BLEND_MODE') summaryKey = 'contrastComputable_cantTell_mixBlendMode';
      else if (rc === 'BACKGROUND_FILTER_OR_BACKDROP_FILTER') {
        const bp =
          extraDetails && typeof extraDetails === 'object'
            ? String(extraDetails.blockerProperty || '')
            : '';
        if (bp === 'filter') summaryKey = 'contrastComputable_cantTell_filter';
        else if (bp === 'backdrop-filter')
          summaryKey = 'contrastComputable_cantTell_backdropFilter';
        else summaryKey = 'contrastComputable_cantTell_filterOrBackdropFilter';
      } else if (rc === 'BACKGROUND_NOT_OPAQUE_AT_ROOT')
        summaryKey = 'contrastComputable_cantTell_rootNotOpaque';
      else if (rc === 'TEXT_SHADOW') summaryKey = 'contrastComputable_cantTell_textShadow';
      else if (rc === 'TEXT_STROKE') summaryKey = 'contrastComputable_cantTell_textStroke';
      else if (rc === 'PSEUDO_ELEMENT_COLOR')
        summaryKey = 'contrastComputable_cantTell_pseudoElementColor';
      else if (rc === 'SELECT_OPTION_COLOR')
        summaryKey = 'contrastComputable_cantTell_selectOption';
      if (pseudo) summaryKey = 'contrastComputable_cantTell_generatedText';

      // Every cantTell leaves a person to measure the contrast, so each one
      // says how, grouped by what blocked the calculation.
      let hintKind = 'generic';
      if (
        rc === 'BACKGROUND_IMAGE_OR_GRADIENT' ||
        rc === 'BACKGROUND_OVERLAP' ||
        rc === 'BACKGROUND_UNPARSABLE' ||
        rc === 'GENERATED_TEXT_POSITIONED'
      )
        hintKind = 'background';
      else if (
        rc === 'MIX_BLEND_MODE' ||
        rc === 'BACKGROUND_FILTER_OR_BACKDROP_FILTER' ||
        rc === 'TEXT_SHADOW' ||
        rc === 'TEXT_STROKE' ||
        rc === 'PSEUDO_ELEMENT_COLOR'
      )
        hintKind = 'effect';
      else if (rc === 'BACKGROUND_NOT_OPAQUE_AT_ROOT') hintKind = 'rootNotOpaque';
      else if (rc === 'SELECT_OPTION_COLOR') hintKind = 'selectOption';

      const details = Object.assign(
        { reasonCode: rc },
        extraDetails && typeof extraDetails === 'object' ? extraDetails : {}
      );

      const occBase = {
        selector: '',
        html: '',
        summary: '',
        hint: CANT_TELL_HINTS[hintKind],
        i18n: {
          summaryKey,
          hintKey: CANT_TELL_HINT_KEYS[hintKind],
          params: Object.assign(
            { reasonCode: rc },
            pseudo ? { pseudo } : {},
            details && typeof details === 'object'
              ? {
                  blockerProperty: details.blockerProperty ? String(details.blockerProperty) : '',
                  blockerValue: details.blockerValue ? String(details.blockerValue) : '',
                  backgroundAlpha:
                    details.backgroundAlpha !== undefined && details.backgroundAlpha !== null
                      ? String(details.backgroundAlpha)
                      : ''
                }
              : {}
          )
        },
        uncertainty: {
          code: 'not-computable',
          needed: 'A contrast ratio for this text, which this page composition blocks.',
          evidence: {
            reasonCode: rc,
            blockerProperty: details.blockerProperty || null,
            blockerValue: details.blockerValue || null,
            backgroundAlpha: details.backgroundAlpha === undefined ? null : details.backgroundAlpha
          }
        },
        data: { details }
      };

      if (helpers && typeof helpers.reportOccurrence === 'function') {
        occurrences.push(helpers.reportOccurrence(el, occBase));
      } else {
        // Never compute selector/snippet in the rule.
        occurrences.push({ ...occBase });
      }
    } catch {
      // no-throw
    }
  }

  // perf: cache per-element analysis so multiple text nodes in same element don't repeat expensive work
  const __elBlockerCache = __contrastSharedCache
    ? __contrastSharedCache.__elBlockerCache ||
      (__contrastSharedCache.__elBlockerCache = new WeakMap())
    : new WeakMap(); // Element -> { ok:boolean, reasonCode, blockerSelector, blockerProperty, blockerValue }
  const __elBgCache = __contrastSharedCache
    ? __contrastSharedCache.__elBgCache || (__contrastSharedCache.__elBgCache = new WeakMap())
    : new WeakMap(); // Element -> { ok, rgba, alpha, reasonCode } (no stack)
  const __elFgCache = __contrastSharedCache
    ? __contrastSharedCache.__elFgCache || (__contrastSharedCache.__elFgCache = new WeakMap())
    : new WeakMap(); // Element -> { rgba, alpha, opacityProduct }

  // perf: fast-path memo for self-opaque background (common) to avoid ancestor walk
  const __elBgSelfOpaqueCache = __contrastSharedCache
    ? __contrastSharedCache.__elBgSelfOpaqueCache ||
      (__contrastSharedCache.__elBgSelfOpaqueCache = new WeakMap())
    : new WeakMap(); // Element -> { ok, rgba, alpha, reasonCode }

  // Shared deterministic text scan (computed once per run and reused across contrast checks)
  let scan;
  try {
    scan =
      helpers && helpers.contrast && typeof helpers.contrast.getTextScan === 'function'
        ? helpers.contrast.getTextScan(ctx, helpers, engineOptions)
        : null;
  } catch {
    scan = null;
  }

  // Walk eligible visible text nodes (counted per text node), but compute blockers/bg/fg once per element.
  if (scan && scan.elements && Array.isArray(scan.elements)) {
    try {
      eligibleTextCount = Number(scan.eligibleTextCount) || 0;

      for (const rec of scan.elements) {
        // If we're already capped on occurrences and already know the final outcome is cantTell,
        // stop scanning to avoid wasting time. Deterministic: we don't randomize; we just stop
        // once further work cannot change the output (cantTell + capped occurrences).
        if (cantTellCount > 0 && occurrences.length >= MAX_OCCURRENCES) break;

        const el = rec && rec.el;
        const textCount = rec && Number(rec.textCount) ? Number(rec.textCount) : 0;
        if (!el || textCount <= 0) continue;

        // 1) Blockers in ancestor chain (blend/filter/bg-image/gradient)
        let blocker = __elBlockerCache.get(el);
        if (!blocker) {
          blocker = helpers.contrast.getComputabilityBlocker(el);
          // Normalize to stable shape
          blocker = blocker || {
            ok: true,
            reasonCode: null,
            blockerSelector: '',
            blockerProperty: '',
            blockerValue: ''
          };
          __elBlockerCache.set(el, blocker);
        }
        // Text drawn by an outline or a shadow below even the AA ratio
        // is failed by contrast-minimum and contrast-enhanced, so it isn't
        // asked about here too (helpers.contrast.measureOutlineOnlyText).
        if (
          blocker &&
          blocker.ok === false &&
          (blocker.reasonCode === 'TEXT_STROKE' || blocker.reasonCode === 'TEXT_SHADOW') &&
          typeof helpers.contrast.measureOutlineOnlyText === 'function'
        ) {
          const m = helpers.contrast.measureOutlineOnlyText(el, {
            contrast: { mode, rootCanvasFallback },
            collectStack: false
          });
          if (m && m.ratio < helpers.contrast.requiredRatio('AA', m.isLargeText)) continue;
        }
        if (blocker && blocker.ok === false) {
          cantTellCount += textCount;
          // occurrence is deduped per element (seenFailEls)
          pushCantTellOccurrence(el, blocker.reasonCode, {
            blockerProperty: blocker.blockerProperty,
            blockerValue: blocker.blockerValue,
            blockerSelector: blocker.blockerSelector,
            backgroundFillType: blocker.backgroundFillType
          });
          continue;
        }

        // 2) Background resolution (CSS-only), strict vs. reference-engine-compatible mode
        let bg = __elBgCache.get(el);
        if (!bg) {
          // 2a) Fast-path: if the element itself paints an opaque background-color and opacity is 1,
          // then the background behind its text is computable without walking ancestors.
          // This is a strict subset of the full algorithm, so it is behavior-preserving:
          // if it doesn't match, we fall back to computeEffectiveBackground.
          let bgSelfOpaque = __elBgSelfOpaqueCache.get(el);
          if (bgSelfOpaque === undefined) {
            bgSelfOpaque = null;
            try {
              if (
                helpers &&
                typeof helpers.getComputedStyle === 'function' &&
                helpers.contrast &&
                typeof helpers.contrast.parseCssColorToRgba === 'function'
              ) {
                const cs = helpers.getComputedStyle(el);
                const op = Number.parseFloat(cs && cs.opacity != null ? cs.opacity : '1');
                // Only treat as self-opaque if opacity is exactly 1 (string '1' or number 1)
                // to avoid float/serialization quirks and preserve determinism.
                if (Number.isFinite(op) && op === 1) {
                  const c = helpers.contrast.parseCssColorToRgba(cs && cs.backgroundColor);
                  if (c && typeof c.a === 'number' && c.a === 1) {
                    bgSelfOpaque = {
                      ok: true,
                      rgba: { r: c.r, g: c.g, b: c.b, a: 1 },
                      alpha: 1,
                      reasonCode: null
                    };
                  }
                }
              }
            } catch {
              bgSelfOpaque = null;
            }
            __elBgSelfOpaqueCache.set(el, bgSelfOpaque);
          }

          if (bgSelfOpaque && bgSelfOpaque.ok === true) {
            bg = bgSelfOpaque;
          } else {
            bg = helpers.contrast.computeEffectiveBackground(el, {
              contrast: { mode, rootCanvasFallback },
              collectStack: false
            });
            bg = bg || { ok: false, reasonCode: 'BACKGROUND_NOT_COMPUTABLE', rgba: null, alpha: 0 };
          }

          __elBgCache.set(el, bg);
        }
        if (!bg || bg.ok === false) {
          cantTellCount += textCount;
          pushCantTellOccurrence(el, (bg && bg.reasonCode) || 'BACKGROUND_NOT_COMPUTABLE', {
            background: bg && bg.rgba ? helpers.contrast.rgbaToString(bg.rgba) : '',
            backgroundAlpha:
              bg && typeof bg.alpha === 'number' ? helpers.contrast.round2(bg.alpha) : '',
            // A background color the engine can't read names the element
            // and the value, as the other blockers do.
            ...(bg && bg.blockerProperty
              ? {
                  blockerSelector: bg.blockerSelector || '',
                  blockerProperty: bg.blockerProperty,
                  blockerValue: bg.blockerValue || ''
                }
              : {})
          });
          continue;
        }

        // Track any explicit assumptions applied by background resolution.
        try {
          if (bg && Array.isArray(bg.assumptionsApplied) && bg.assumptionsApplied.length) {
            assumptionsCount += textCount;
            for (const a of bg.assumptionsApplied) assumptionsAppliedSet.add(String(a));
          }
        } catch {
          /* no-throw */
        }

        // 3) Foreground parsability (computed color should be rgb/rgba)
        let fg = __elFgCache.get(el);
        if (!fg) {
          fg = helpers.contrast.computeEffectiveForeground(el);
          fg = fg || { rgba: null, alpha: 0, opacityProduct: 1 };
          __elFgCache.set(el, fg);
        }
        if (!fg || !fg.rgba) {
          cantTellCount += textCount;
          pushCantTellOccurrence(el, 'FOREGROUND_UNPARSABLE', {
            background: bg && bg.rgba ? helpers.contrast.rgbaToString(bg.rgba) : '',
            backgroundAlpha:
              bg && typeof bg.alpha === 'number' ? helpers.contrast.round2(bg.alpha) : ''
          });
          continue;
        }

        // If we got here, this element's eligible text is computable.
        // (We intentionally do not compute contrast ratio in this gatekeeper rule.)
      }

      // Text a ::before, ::after or ::marker generates (#219), one record
      // per pseudo-element: what stops it being measured
      // (helpers.contrast.measureGeneratedText) is asked about on its
      // element, the summary naming the pseudo-element.
      const generated = Array.isArray(scan.generated) ? scan.generated : [];
      for (const rec of generated) {
        const el = rec && rec.el;
        const pseudo = rec && rec.pseudo ? String(rec.pseudo) : '';
        const textCount = rec && Number(rec.textCount) ? Number(rec.textCount) : 0;
        if (!el || !pseudo || textCount <= 0) continue;
        eligibleTextCount += textCount;
        const m =
          typeof helpers.contrast.measureGeneratedText === 'function'
            ? helpers.contrast.measureGeneratedText(el, pseudo, {
                contrast: { mode, rootCanvasFallback },
                collectStack: false
              })
            : null;
        if (m && m.ok === true) {
          if (Array.isArray(m.assumptionsApplied) && m.assumptionsApplied.length) {
            assumptionsCount += textCount;
            for (const a of m.assumptionsApplied) assumptionsAppliedSet.add(String(a));
          }
          continue;
        }
        cantTellCount += textCount;
        pushCantTellOccurrence(el, (m && m.reasonCode) || 'GENERATED_TEXT_UNREADABLE', {
          generatedBy: pseudo,
          blockerSelector: (m && m.blockerSelector) || '',
          blockerProperty: (m && m.blockerProperty) || '',
          blockerValue: (m && m.blockerValue) || '',
          ...(m && m.backgroundFillType ? { backgroundFillType: m.backgroundFillType } : {}),
          ...(m && m.background !== undefined
            ? { background: m.background, backgroundAlpha: m.backgroundAlpha }
            : {})
        });
      }
    } catch {
      // If scan processing fails unexpectedly, keep determinism: treat as cantTell with one occurrence
      return {
        ruleId: rule.ruleId,
        outcome: 'cantTell',
        severity: rule.defaultSeverity || 'serious',
        confidence: rule.defaultConfidence || 'high',
        occurrences: [
          {
            selector: '',
            summary: '',
            hint: CANT_TELL_HINTS.generic,
            html: '',
            i18n: {
              summaryKey: 'contrastComputable_cantTell_engineFailure',
              hintKey: CANT_TELL_HINT_KEYS.generic,
              params: { reasonCode: 'ENGINE_EXCEPTION' }
            },
            data: { details: { reasonCode: 'ENGINE_EXCEPTION' } }
          }
        ]
      };
    }
  }

  if (eligibleTextCount === 0) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: rule.defaultSeverity || 'serious',
      confidence: rule.defaultConfidence || 'high',
      occurrences: []
    };
  }

  // Where the colors measured were forced, each occurrence says so
  // (contrast-helpers).
  helpers.contrast.noteForcedColors(occurrences);

  if (cantTellCount > 0) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'serious',
      confidence: rule.defaultConfidence || 'high',
      occurrences
    };
  }

  // All eligible text is computable
  return {
    ruleId: rule.ruleId,
    outcome: 'pass',
    severity: rule.defaultSeverity || 'serious',
    confidence: rule.defaultConfidence || 'high',
    occurrences: helpers.contrast.noteForcedColors([
      {
        selector: '',
        summary: '',
        hint: '',
        html: '',
        i18n: {
          summaryKey: 'contrastComputable_pass_allComputable',
          hintKey: '',
          params: {
            eligibleTextCount: String(eligibleTextCount)
          }
        },
        data: {
          details: {
            eligibleTextCount,
            assumptionsCount,
            assumptionsApplied: Array.from(assumptionsAppliedSet).sort()
          }
        }
      }
    ])
  };
}

module.exports = { id, meta, runInPage };
