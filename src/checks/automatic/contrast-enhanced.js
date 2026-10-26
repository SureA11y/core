/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check contrast-enhanced
 * @atomic true
 * @summary Text must meet the WCAG AAA contrast ratio for its size
 * @standard WCAG 2.2
 * @sc 1.4.6
 * @applicability
 *   Applies to the visible text contrast-computable applies to, see that
 *   rule for the eligibility gates, narrowed to text whose background and
 *   foreground are actually computable. Eligible text that is not computable
 *   leaves this rule notApplicable rather than cantTell: reporting that
 *   uncertainty belongs to contrast-computable, so the two never report the
 *   same text twice.
 * @expectation
 *   Every computable text node reaches the ratio SC 1.4.6 requires for its
 *   size: 4.5:1 for large text, 7:1 for everything else. Text is large at
 *   24px or more, or at 14pt (about 18.667px) or more when the computed font
 *   weight is 700 or higher.
 *   Text drawn by a -webkit-text-stroke or a text-shadow is left to
 *   contrast-computable, except where every colour it is drawn in, its
 *   fill among them unless the fill draws nothing (transparent, or the
 *   colour of its background), is below the ratio against a flat
 *   background: no reading of it can then meet the criterion, and it
 *   fails, measured by the best of those colours (`drawnBy`: `textStroke`
 *   or `textShadow`).
 *   Margin (`contrast-ratio`): of the text that reaches its ratio, the
 *   element closest to it, with the ratio unrounded against the one its size
 *   requires; `context.largeText` says which. Only text within 10% of its
 *   ratio counts as close, so text further above it gives no margin.
 *   `measuredCount` counts the elements whose contrast was computed.
 *   Text part of which a ::first-line or ::first-letter paints in a colour
 *   of its own is measured in both colours: where both reach their ratio it
 *   passes, where both fall short it fails (`pseudoElementColor` names the
 *   pseudo-element), and where they disagree it is left to
 *   contrast-computable.
 *   Text with no opaque background behind it, up to the root, is measured
 *   on the canvas the browser paints under the page, in the color scheme
 *   the page is drawn in, and, on a page that supports light and dark, in
 *   the other where its colours can't change with the scheme, as
 *   contrast-minimum describes.
 *   Normal-size text whose background can't be worked out still fails when
 *   its colour can't reach 7:1 on any background
 *   (`CONTRAST_UNREACHABLE_ANY_BACKGROUND`, `metrics.bestRatio`: its ratio
 *   against white or black, whichever is higher).
 *   A field's placeholder below its ratio (`PLACEHOLDER_BELOW_THRESHOLD`)
 *   fails when the page chose its colours: the placeholder's color,
 *   opacity or background, or the field's background, differ from the
 *   browser's own, read in a blank frame. In the browser's own colours it
 *   meets the ratio (WCAG G148), and when that can't be told it is a
 *   `cantTell` occurrence.
 * @reports
 *   - `metrics.ratio` (a FAIL): the text's contrast ratio, for example 4.5
 *     for 4.5:1, unrounded, against `metrics.threshold` (7, or 4.5 for
 *     large text).
 *   - `colors.foregroundHex`, `colors.backgroundHex` (a FAIL): the text and
 *     background colors the ratio was computed from, as hex (the text in the
 *     -webkit-text-fill-color it is painted in, `color` unless set). A
 *     semi-transparent text color is first blended onto the background.
 *   - `selectField` (a drop-down select in the browser's own background):
 *     `backgroundHex`, its computed background, and `fieldHex`, the Field
 *     color Chromium paints it in. The text is measured against both and
 *     the lower ratio is reported.
 *   - `colors.foregroundRgba`, `colors.backgroundRgba` (a FAIL): the same
 *     colors as `rgba()` strings.
 *   - `typography.fontSizePx`, `typography.fontSizePt` (a FAIL): the
 *     font size as drawn (the computed size times CSS zoom, or for SVG
 *     text its viewBox and transform scale, and times what
 *     font-size-adjust scales the font by), in CSS pixels and in points.
 *   - `typography.declaredFontSizePx`, `typography.sizeScaledBy` (a FAIL
 *     drawn at another size): the computed font-size, and what drew it
 *     otherwise (`zoom`, `svg`, `font-size-adjust`). Where that puts the
 *     text on the other side of the large-text line, the hint says so
 *     (`contrast_hint_drawnSize`).
 *   - `typography.fontWeight`, `typography.fontWeightLabel`,
 *     `typography.isBold` (a FAIL): the computed font weight as a number,
 *     `bold` (700 or more) or `normal`, and whether it counts as bold.
 *   - `typography.isLargeText` (a FAIL): whether the text counts as large,
 *     which sets the threshold.
 *   - The ratio, threshold and typography fields above are a stable
 *     contract (API_STABILITY.md), unlike the rest of `data.details`.
 *   - `assumptionsApplied`, `assumedRootCanvasColor` (a FAIL): `null` unless
 *     the page background never became opaque and was taken to sit on a
 *     canvas color: one the scan names (`contrast.rootCanvasFallback`), or,
 *     with the `auditorAssist` mode where the page's own canvas can't be
 *     known (in a frame, under forced colors), the fallback. Then
 *     `assumptionsApplied` is `["ROOT_CANVAS_FALLBACK"]` and
 *     `assumedRootCanvasColor` is that color. Text on the canvas the page's
 *     color scheme gives it is measured on that canvas, with neither.
 *   - `colorScheme` (a FAIL on the canvas of a page that supports light and
 *     dark): `'light'` or `'dark'`, the scheme in which the text falls short,
 *     where it passes in the other; absent where it falls short in every
 *     scheme measured.
 *   - `colorSchemesChecked` (a FAIL, and the pass): the schemes the text on
 *     the canvas was measured in, where the page supports both and one
 *     could not be measured.
 *   - `generatedBy` (a FAIL on generated text): `::before`, `::after` or
 *     `::marker`, the pseudo-element whose text is measured; the selector
 *     names its element, and the colours and font are the pseudo-element's.
 *   - `eligibleTextCount`, `computableTextCount` (the pass, and the
 *     notApplicable result when no text was computable): how many text
 *     nodes were in scope, and how many of those had colors that could be
 *     worked out. The pass repeats both under `metrics`.
 *   - `forcedColors` (every occurrence, when the colors measured were
 *     forced): `true`, and the hint says to check the page again with
 *     forced colors off. A scan under forced colors measures the page's own
 *     colors, so this is there only where it could not keep the page in
 *     them (docs/LAYOUT_MEASUREMENT.md, "Forced colors").
 * @reason-codes
 *   - `ALL_ABOVE_THRESHOLD` (pass): all the computable text reaches the
 *     enhanced ratio its size requires.
 *     Basis: WCAG 1.4.6; G17; G18; ACT 09o5cg.
 *   - `BELOW_THRESHOLD` (fail): text below the enhanced ratio its size
 *     requires, including text drawn by an outline or a shadow every colour
 *     of which, its fill included when seen, is below it.
 *     Basis: WCAG 1.4.6; G17; G18; ACT 09o5cg.
 *   - `PLACEHOLDER_BELOW_THRESHOLD` (fail, cantTell): a field's placeholder
 *     below its ratio. It fails when the page chose its colours, and is asked
 *     about when that can't be told; in the browser's own colours it is not
 *     reported.
 *     Basis: WCAG 1.4.6; G148.
 *   - `SYMBOLIC_CHARACTER_BELOW_THRESHOLD` (cantTell): a symbol that is not a
 *     letter or a digit, below the ratio; whether it is text the criterion
 *     covers is for a person.
 *     Basis: WCAG 1.4.6 (not settled).
 *   - `CONTRAST_UNREACHABLE_ANY_BACKGROUND` (fail): normal-size text whose
 *     background could not be worked out (an image or gradient, other paint
 *     under it, or no opaque background where the page's canvas can't be
 *     known, as in a frame), in a colour that cannot reach 7:1
 *     against any background: even white or black, the best there are, give
 *     it less (relative luminance between 0.1 and 0.3). Large text never
 *     gives it, since every colour reaches 4.5:1 against one of them.
 *     Basis: WCAG 1.4.6; G17; ACT 09o5cg.
 *   - `ENGINE_EXCEPTION` (cantTell): the rule stopped on an internal error;
 *     the text is to be measured by hand.
 *     Basis: WCAG 1.4.6 (not settled).
 *   - `UNKNOWN` (fail): text below its ratio whose finding lost its details;
 *     a safeguard, not expected in a normal scan.
 *     Basis: WCAG 1.4.6.
 * @implementation-notes
 * - Text whose background can't be worked out is measured here only for
 *   `CONTRAST_UNREACHABLE_ANY_BACKGROUND`; otherwise contrast-computable asks
 *   about it (`BACKGROUND_NOT_COMPUTABLE` and its other blockers), so this
 *   rule has no code of its own for it.
 */

const id = 'contrast-enhanced';

const meta = {
  title: 'Text meets enhanced color contrast (AAA)',
  description:
    'Checks that visible text has a contrast ratio of at least 7:1 (normal) or 4.5:1 (large), when contrast is computable from CSS.',
  i18n: {
    titleKey: 'contrastEnhanced_title',
    descriptionKey: 'contrastEnhanced_description'
  },
  helpUrl: null,
  tags: ['wcag2aaa', 'wcag146', 'contrast', 'color', 'structure', 'atomic', 'automatic', 'dom'],
  wcagSc: ['1.4.6'],
  normativeMappings: [
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
  coverage: { facetsBySc: { '1.4.6': ['contrast-enhanced-text'] } },
  margin: { measure: 'contrast-ratio', unit: 'ratio', limit: 'min', band: { relative: 0.1 } },
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    CONTRAST_UNREACHABLE_ANY_BACKGROUND: {
      steps: [
        'Find the text the report names and note its colour, which the report gives.',
        'With a contrast calculator, measure that colour against white and against black.',
        'Compare the higher of the two ratios with 7:1.'
      ],
      passWhen:
        'Against white or black the text colour reaches 7:1, so some background can bring it to the ratio; measure it then against its own background.',
      failWhen:
        'Against both white and black the text colour stays below 7:1, so no background brings it to the ratio, which fails WCAG 1.4.6.'
    },
    ENGINE_EXCEPTION: {
      steps: [
        'Find the text the report names (the check stopped early, so nothing was measured).',
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure the text colour against the background directly behind the letters.",
        'Note the text size and weight and compare the ratio with 7:1 (4.5:1 for large text: at least 24px, or 18.66px and bold).'
      ],
      passWhen: 'The ratio reaches the threshold for its size.',
      failWhen: 'The ratio is below the threshold for its size, which fails WCAG 1.4.6.'
    },
    PLACEHOLDER_BELOW_THRESHOLD: {
      steps: [
        'Find the field the report names and empty it so the placeholder shows.',
        "In the Styles pane, check whether the page's CSS sets the ::placeholder colour or opacity, or the field's background.",
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure the placeholder text against the field background and compare with 7:1 (4.5:1 for large text: at least 24px, or 18.66px and bold).",
        'Check whether the placeholder holds information needed to fill the field (a format or instruction), rather than just an example.'
      ],
      passWhen:
        "The placeholder reaches 7:1 (or 4.5:1 if large), or it is drawn entirely in the browser's own default colours.",
      failWhen:
        'The page sets the placeholder or field colours and the ratio is below the threshold, which fails WCAG 1.4.6.'
    },
    SYMBOLIC_CHARACTER_BELOW_THRESHOLD: {
      steps: [
        'Find the character the report names (such as ×, ☰, › or an icon-font glyph).',
        'Decide whether it is text people read (part of words, a number) or an icon standing in for an action, like a close or menu symbol.',
        "If it is text, use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure it against its background and compare with 7:1 (4.5:1 for large text: at least 24px, or 18.66px and bold).",
        'If it is an icon for a control, measure it against its background and compare with 3:1 instead (WCAG 1.4.11).'
      ],
      passWhen:
        'It is text and reaches its ratio, or it is an icon that reaches 3:1 for non-text contrast.',
      failWhen:
        'It is text below 7:1, which fails WCAG 1.4.6; or an icon below 3:1, which fails WCAG 1.4.11.'
    }
  }
};

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { helpers, rule, engineOptions } = ctx;

  function toElement(node) {
    try {
      if (!node) return null;
      if (dom.nodeType(node) === 1) return node; // ELEMENT_NODE
      if (dom.nodeType(node) === 3) return dom.parentElement(node) || null; // TEXT_NODE
      return null;
    } catch {
      return null;
    }
  }

  const __contrastSharedCache =
    helpers && helpers.contrast && helpers.contrast.sharedCache
      ? helpers.contrast.sharedCache
      : null;
  const __elBlockerCache = __contrastSharedCache
    ? __contrastSharedCache.__elBlockerCache ||
      (__contrastSharedCache.__elBlockerCache = new WeakMap())
    : null;

  const __elBgCache = __contrastSharedCache
    ? __contrastSharedCache.__elBgCache || (__contrastSharedCache.__elBgCache = new WeakMap())
    : null;

  const __elFgCache = __contrastSharedCache
    ? __contrastSharedCache.__elFgCache || (__contrastSharedCache.__elFgCache = new WeakMap())
    : null;

  const __elFontCache = __contrastSharedCache
    ? __contrastSharedCache.__elFontCache || (__contrastSharedCache.__elFontCache = new WeakMap())
    : new WeakMap();

  function safeComputedStyle(el) {
    try {
      if (!el || dom.nodeType(el) !== 1) return null;

      // Prefer engine helper (matches checks/engine behavior + may be cached)
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

  function getFontInfo(el) {
    try {
      if (!el || dom.nodeType(el) !== 1) {
        return {
          fontSizePx: 0,
          fontSizePt: '',
          fontWeightNum: 400,
          fontWeight: 'normal',
          isBold: false,
          isLarge: false,
          isLargeText: false
        };
      }

      const cached = __elFontCache.get(el);
      if (cached) return cached;

      // A field's placeholder has the ::placeholder font.
      const cs =
        helpers.contrast && typeof helpers.contrast.textStyleOf === 'function'
          ? helpers.contrast.textStyleOf(el)
          : safeComputedStyle(el);
      const fontSizePx = cs ? helpers.contrast.parsePx(cs.fontSize) : null;
      const fontWeightNum = cs ? helpers.contrast.normalizeFontWeight(cs.fontWeight) : 400;

      // The size as drawn: CSS zoom, an SVG viewBox and font-size-adjust
      // scale the text the page delivers (helpers.contrast.renderedTextSize).
      const drawn =
        typeof helpers.contrast.renderedTextSize === 'function'
          ? helpers.contrast.renderedTextSize(el, cs)
          : { scale: 1, by: [] };
      const sizePx = Number.isFinite(fontSizePx) ? fontSizePx * drawn.scale : 0;
      const isBold = Number.isFinite(fontWeightNum) && fontWeightNum >= 700;
      const isLarge = helpers.contrast.isLargeText(sizePx, fontWeightNum);

      const out = {
        fontSizePx: sizePx,
        fontSizePt: helpers.contrast.pxToPt(sizePx),
        fontWeightNum,
        fontWeight: helpers.contrast.fontWeightLabel(fontWeightNum),
        isBold,
        isLarge,
        isLargeText: isLarge
      };
      // What the page drew it at, where that isn't its font-size.
      if (drawn.by.length && Number.isFinite(fontSizePx)) {
        out.declaredFontSizePx = fontSizePx;
        out.sizeScaledBy = drawn.by;
        out.declaredIsLargeText = helpers.contrast.isLargeText(fontSizePx, fontWeightNum);
      }

      __elFontCache.set(el, out);
      return out;
    } catch {
      return {
        fontSizePx: 0,
        fontSizePt: '',
        fontWeightNum: 400,
        fontWeight: 'normal',
        isBold: false,
        isLarge: false,
        isLargeText: false
      };
    }
  }

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
  let computableTextCount = 0;
  let failCount = 0;
  // Placeholder text below the ratio, asked about rather than failed.
  let deferredCount = 0;
  // Text that reached its ratio, for the result's margin (src/core/margin.js),
  // and how many elements were compared.
  const marginCandidates = [];
  let measuredElements = 0;

  const seenFailEls = new Set();
  // The color schemes text on the page's canvas was measured in, where the
  // page supports one it wasn't (acrossSchemes), for the pass's evidence.
  let schemesChecked = null;

  function pushPassOccurrence(eligibleCount, computableCount) {
    try {
      occurrences.push({
        selector: '',
        summary: 'All computable text meets the enhanced (AAA) contrast threshold.',
        hint: '',
        html: '',
        i18n: {
          summaryKey: 'contrastEnhanced_pass_allAboveThreshold',
          hintKey: '',
          params: {
            eligibleTextCount: String(Number(eligibleCount) || 0),
            computableTextCount: String(Number(computableCount) || 0)
          }
        },
        data: {
          details: {
            reasonCode: 'ALL_ABOVE_THRESHOLD',
            eligibleTextCount: Number(eligibleCount) || 0,
            computableTextCount: Number(computableCount) || 0,
            metrics: {
              eligibleTextCount: Number(eligibleCount) || 0,
              computableTextCount: Number(computableCount) || 0
            },
            ...(schemesChecked ? { colorSchemesChecked: schemesChecked.slice(0) } : {})
          }
        }
      });
    } catch {
      // no-throw
    }
  }

  // Generated text already reported, per pseudo-element: an element's own
  // text and the text its ::before generates are reported apart.
  const seenGenerated = new Map();

  // placeholder: 'fail' or 'ask' for a field's placeholder, by whose colours
  // they are (docs/LIMITATIONS.md). pseudo: the text is what el's
  // ::before, ::after or ::marker generates.
  // A lone character standing in for the name of the control it labels, as
  // "X" does in a button named "Close": ACT (afw4f7, 09o5cg) leaves text that
  // expresses nothing in human language out of the text-contrast expectation,
  // and whether it is an icon, held instead to 1.4.11's 3:1 for graphics, or a
  // letter meant to be read is not something markup settles. Such text below
  // its ratio is asked about rather than failed, as label-in-name does with
  // the same shape.
  function symbolicCharacter(el) {
    try {
      const own = String(dom.textContent(el) || '').trim();
      if (Array.from(own).length !== 1) return '';
      for (let node = el, depth = 0; node && depth < 8; depth += 1) {
        if (
          dom.getAttribute(node, 'aria-label') != null ||
          dom.getAttribute(node, 'aria-labelledby') != null
        ) {
          const content = String(dom.textContent(node) || '').trim();
          if (content !== own) return '';
          const info = helpers.getAccessibleNameInfo
            ? helpers.getAccessibleNameInfo(node, ctx, { maxRefs: 8 })
            : null;
          const name = info && info.present ? String(info.value || '').toLowerCase() : '';
          return name && !name.includes(own.toLowerCase()) ? own : '';
        }
        node = dom.parentElement(node);
      }
    } catch {}
    return '';
  }

  // symbol: the text is a lone character standing in for its control's name
  // (symbolicCharacter), asked about rather than failed.
  // Logo-like text and a page's contrast switch still fail, with a hint
  // that says why they might not: WCAG 1.4.6 exempts logo text as 1.4.3
  // does, and a switch to sufficient contrast meets it (G174).
  // special: { kind: 'logo' } or { kind: 'switch', switchName }, or null.
  // What scaled the text, as CSS names it.
  const SCALED_BY_LABEL = {
    zoom: 'zoom',
    svg: 'SVG transform',
    'font-size-adjust': 'font-size-adjust'
  };

  // The params of a finding whose drawn size puts it on the other side of the
  // large-text line from its font-size, so its threshold isn't the one its
  // CSS suggests; {} for any other.
  function drawnSizeNote(font) {
    if (!font || !font.sizeScaledBy || font.declaredIsLargeText === font.isLargeText) return {};
    return {
      sizeNote: true,
      declaredFontSizePx: String(Math.round(font.declaredFontSizePx * 100) / 100),
      drawnFontSizePx: String(Math.round(font.fontSizePx * 100) / 100),
      scaledBy: font.sizeScaledBy.map((b) => SCALED_BY_LABEL[b] || b).join(' + ')
    };
  }

  function pushFailOccurrence(el, params, details, placeholder, pseudo, symbol, special) {
    try {
      if (pseudo && !seenGenerated.has(pseudo)) seenGenerated.set(pseudo, new Set());
      const seen = pseudo ? seenGenerated.get(pseudo) : seenFailEls;
      if (!el || seen.has(el)) return;
      if (occurrences.length >= MAX_OCCURRENCES) return;

      seen.add(el);

      let det = details && typeof details === 'object' ? details : { reasonCode: 'UNKNOWN' };
      // placeholder is 'ask' (whose colours they are can't be told) or
      // 'fail' (the page chose them).
      if (placeholder) {
        det = { ...det, reasonCode: 'PLACEHOLDER_BELOW_THRESHOLD' };
        params = { ...(params || {}), reasonCode: 'PLACEHOLDER_BELOW_THRESHOLD' };
      } else if (symbol) {
        det = { ...det, reasonCode: 'SYMBOLIC_CHARACTER_BELOW_THRESHOLD', character: symbol };
        params = {
          ...(params || {}),
          reasonCode: 'SYMBOLIC_CHARACTER_BELOW_THRESHOLD',
          character: symbol
        };
      }

      // Every reason code here describes a ratio the rule computed: text
      // whose colours can't be worked out is left to contrast-computable.
      const uncertainty =
        placeholder === 'ask'
          ? {
              code: 'judgement-required',
              needed:
                'Whether this placeholder is held to the contrast ratio, and whether the page chose its colours.'
            }
          : symbol
            ? {
                code: 'judgement-required',
                needed:
                  'Whether this character is text to read, held to the text ratio, or an icon, held to 3:1 as a graphic (1.4.11).',
                evidence: { character: symbol }
              }
            : null;

      const occBase = {
        selector: '',
        html: '',
        summary: '',
        hint:
          placeholder === 'fail'
            ? `Give ::placeholder a color that reaches ${params && params.threshold}:1 against the field's background.`
            : placeholder
              ? `Check the placeholder text against ${params && params.threshold}:1, and if it falls short, give ::placeholder a color that reaches it.`
              : symbol
                ? `If this character is an icon, check it reaches 3:1 against what is next to it; if it is text, change its colors so the ratio reaches ${params && params.threshold}:1.`
                : `Change the text color, the background color, or both, so the contrast ratio reaches at least ${params && params.threshold}:1.`,
        i18n: {
          summaryKey:
            placeholder === 'fail'
              ? 'contrastEnhanced_fail_placeholder'
              : placeholder
                ? 'contrastEnhanced_cantTell_placeholder'
                : symbol
                  ? 'contrastEnhanced_cantTell_symbol'
                  : pseudo
                    ? 'contrastEnhanced_fail_generatedText'
                    : 'contrastEnhanced_fail_belowThreshold',
          hintKey:
            placeholder === 'fail'
              ? 'contrast_hint_placeholder_fail'
              : placeholder
                ? 'contrast_hint_placeholder'
                : symbol
                  ? 'contrast_hint_symbol'
                  : 'contrastEnhanced_hint_fail',
          params: params && typeof params === 'object' ? params : {}
        },
        ...(uncertainty ? { uncertainty } : {}),
        ...(placeholder === 'ask' || symbol ? { occurrenceOutcome: 'cantTell' } : {}),
        data: { details: det }
      };

      // Text whose own colour can't reach the ratio on any background
      // (unreachableOnAnyBackground): it fails whatever lies behind it.
      if (det.reasonCode === 'CONTRAST_UNREACHABLE_ANY_BACKGROUND') {
        occBase.i18n.summaryKey = 'contrastEnhanced_fail_unreachable';
        occBase.i18n.hintKey = 'contrastEnhanced_hint_unreachable';
        occBase.hint = `Even on white or black, the best backgrounds there are, this text color reaches only ${params && params.bestRatio}:1. Make the text darker or lighter so it can reach ${params && params.threshold}:1 against its background.`;
      }

      if (params && params.sizeNote && !placeholder && !symbol) {
        occBase.hint = `Its font-size is ${params.declaredFontSizePx}px, but ${params.scaledBy} draws it at ${params.drawnFontSizePx}px, and text is judged by the size it is drawn at: ${params.isLargeText ? 'large text' : 'not large text'}, which needs ${params.threshold}:1. Change the text color, the background color, or both, so the ratio reaches it.`;
        occBase.i18n.hintKey = 'contrast_hint_drawnSize';
      }

      // Text that falls short in one of the two color schemes the page
      // supports, on its canvas: the hint names the scheme.
      if (
        det.colorScheme &&
        !placeholder &&
        !symbol &&
        (occBase.i18n.hintKey === 'contrastEnhanced_hint_fail' ||
          occBase.i18n.hintKey === 'contrast_hint_drawnSize')
      ) {
        const scheme = det.colorScheme === 'dark' ? 'dark' : 'light';
        occBase.hint = `In the page's ${scheme} color scheme, this text has a contrast ratio of ${params.ratio}:1 against ${params.backgroundHex}, below ${params.threshold}:1. Change its colors in that scheme so the ratio reaches it.`;
        occBase.i18n.hintKey = `contrast_hint_colorScheme_${scheme}`;
      }

      if (special && !placeholder && !symbol) {
        const t = params && params.threshold;
        if (special.kind === 'logo') {
          occBase.data.details.looksLikeLogo = true;
          occBase.hint = `If this text is part of a logo or brand name, it has no contrast requirement (WCAG 1.4.3); otherwise change its colors so the ratio reaches ${t}:1.`;
          occBase.i18n.hintKey = 'contrast_hint_logo';
        } else if (special.kind === 'switch') {
          occBase.data.details.contrastSwitch = special.switchName;
          occBase.i18n.params.switchName = special.switchName;
          occBase.hint = `The page offers a contrast switch ("${special.switchName}"). If it is easy to find and turns this text to at least ${t}:1, the page can meet the criterion that way (G174); otherwise change the colors.`;
          occBase.i18n.hintKey = 'contrast_hint_contrastSwitch';
        }
      }

      // Bind the occurrence to an element deterministically, but still let the engine
      // attach canonical selector + HTML snippet via reportOccurrence when available.
      let nodeSelector = '';
      try {
        const elementId =
          el && typeof dom.get(el, 'getAttribute') === 'function'
            ? dom.getAttribute(el, 'id') || ''
            : '';
        if (elementId) nodeSelector = `#${elementId}`;
      } catch {
        // no-throw
      }
      const tagName = el && dom.tagName(el) ? String(dom.tagName(el)).toLowerCase() : 'element';

      let occ = { ...occBase };

      // IMPORTANT: this is what populates occ.selector and occ.html (snippet)
      if (helpers && typeof helpers.reportOccurrence === 'function') {
        try {
          const reported = helpers.reportOccurrence(el, occBase);
          if (reported && typeof reported === 'object') occ = reported;
        } catch {
          // no-throw
        }
      }

      // The engine builds the selector from the element (__node), checking it
      // names that element alone; the raw '#id' is only for an occurrence with
      // no element. A duplicated id made '#id' name another element.
      occ.selector = occ.selector || (occ.__node ? '' : nodeSelector) || '';

      occ.data = occ.data || {};
      occ.data.details = occ.data.details || {};
      occ.data.details.node = { selector: nodeSelector, tagName };

      occurrences.push(occ);
    } catch {
      // no-throw
    }
  }

  // perf: per-element analysis cache (per run)
  let __elAnalysisCache = new WeakMap();
  if (__contrastSharedCache) {
    try {
      if (!__contrastSharedCache.__elAnalysisCacheAAA)
        __contrastSharedCache.__elAnalysisCacheAAA = new WeakMap();
      __elAnalysisCache = __contrastSharedCache.__elAnalysisCacheAAA;
    } catch {
      __elAnalysisCache = new WeakMap();
    }
  }

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

  // Text drawn by a stroke or a shadow: the computability gate asks about
  // it (TEXT_STROKE, TEXT_SHADOW), but where even the best colour it is
  // drawn in, its fill included when seen, is below the ratio against a
  // flat background, no reading of it meets the criterion, so it is
  // measured by that colour (helpers.contrast.measureOutlineOnlyText).
  function outlineOnlyAnalysis(el, blocker) {
    if (!blocker || (blocker.reasonCode !== 'TEXT_STROKE' && blocker.reasonCode !== 'TEXT_SHADOW'))
      return null;
    if (typeof helpers.contrast.measureOutlineOnlyText !== 'function') return null;
    const m = helpers.contrast.measureOutlineOnlyText(el, {
      contrast: { mode, rootCanvasFallback },
      collectStack: false
    });
    if (!m) return null;
    const font = getFontInfo(el);
    const threshold = helpers.contrast.requiredRatio('AAA', font.isLargeText);
    if (!(m.ratio < threshold)) return null;
    return {
      computable: true,
      ratio: m.ratio,
      bgAssumptionsApplied:
        Array.isArray(m.bg.assumptionsApplied) && m.bg.assumptionsApplied.length
          ? m.bg.assumptionsApplied.slice(0)
          : null,
      bgAssumedRootCanvasColor:
        typeof m.bg.assumedRootCanvasColor === 'string' ? m.bg.assumedRootCanvasColor : null,
      canvas: m.bg.canvas || null,
      ratioStr: helpers.contrast.round2(m.ratio),
      threshold,
      thresholdStr: `${threshold}`,
      font,
      fgOpaque: m.drawn,
      bgOpaque: m.background,
      drawnBy: m.drawnBy
    };
  }

  // Text part of which a ::first-line or ::first-letter paints in a colour
  // of its own (PSEUDO_ELEMENT_COLOR): which part depends on line breaks,
  // but where its own colours and the pseudo-element's both reach their
  // ratio, or both fall short of it, every reading of the text does too
  // (helpers.contrast.measurePseudoElementText). It is measured then by the
  // colours closest to their ratio when both reach it, and by the best when
  // both fall short; where they disagree it is left to contrast-computable.
  function pseudoColorAnalysis(el, blocker) {
    if (!blocker || blocker.reasonCode !== 'PSEUDO_ELEMENT_COLOR' || !blocker.pseudoColors)
      return null;
    if (typeof helpers.contrast.measurePseudoElementText !== 'function') return null;
    const m = helpers.contrast.measurePseudoElementText(el, {
      contrast: { mode, rootCanvasFallback },
      collectStack: false
    });
    if (!m) return null;
    const ownFont = getFontInfo(el);
    const pWeight = m.pseudo.fontWeightNum;
    const pLarge = helpers.contrast.isLargeText(m.pseudo.fontSizePx, pWeight);
    const pseudoFont = {
      fontSizePx: m.pseudo.fontSizePx,
      fontSizePt: helpers.contrast.pxToPt(m.pseudo.fontSizePx),
      fontWeightNum: pWeight,
      fontWeight: helpers.contrast.fontWeightLabel(pWeight),
      isBold: Number.isFinite(pWeight) && pWeight >= 700,
      isLarge: pLarge,
      isLargeText: pLarge
    };
    const own = {
      ...m.own,
      font: ownFont,
      threshold: helpers.contrast.requiredRatio('AAA', ownFont.isLargeText)
    };
    const pseudo = {
      ...m.pseudo,
      font: pseudoFont,
      threshold: helpers.contrast.requiredRatio('AAA', pLarge)
    };
    const ownPasses = own.ratio >= own.threshold;
    if (ownPasses !== pseudo.ratio >= pseudo.threshold) return null;
    const share = (x) => x.ratio / x.threshold;
    const pick = ownPasses
      ? share(pseudo) < share(own)
        ? pseudo
        : own
      : share(pseudo) > share(own)
        ? pseudo
        : own;
    return {
      computable: true,
      ratio: pick.ratio,
      bgAssumptionsApplied: m.assumptionsApplied,
      bgAssumedRootCanvasColor: m.assumedRootCanvasColor,
      canvas: m.canvas || null,
      ratioStr: helpers.contrast.round2(pick.ratio),
      threshold: pick.threshold,
      thresholdStr: `${pick.threshold}`,
      font: pick.font,
      fgOpaque: pick.fg,
      bgOpaque: pick.bg,
      pseudoElementColor: m.pseudo.pseudo
    };
  }

  // Text a ::before, ::after or ::marker generates (#219), measured in the
  // pseudo-element's colour and font against what lies behind it
  // (helpers.contrast.measureGeneratedText). What can't be measured is left
  // to contrast-computable, as for an element's own text.
  function generatedAnalysis(el, pseudo) {
    const m =
      typeof helpers.contrast.measureGeneratedText === 'function'
        ? helpers.contrast.measureGeneratedText(el, pseudo, {
            contrast: { mode, rootCanvasFallback },
            collectStack: false
          })
        : null;
    if (!m || m.ok !== true) return { computable: false };
    const weight = m.fontWeightNum;
    const isLarge = helpers.contrast.isLargeText(m.fontSizePx, weight);
    const font = {
      fontSizePx: m.fontSizePx,
      fontSizePt: helpers.contrast.pxToPt(m.fontSizePx),
      fontWeightNum: weight,
      fontWeight: helpers.contrast.fontWeightLabel(weight),
      isBold: Number.isFinite(weight) && weight >= 700,
      isLarge,
      isLargeText: isLarge
    };
    const threshold = helpers.contrast.requiredRatio('AAA', isLarge);
    return {
      computable: true,
      ratio: m.ratio,
      bgAssumptionsApplied: m.assumptionsApplied,
      bgAssumedRootCanvasColor: m.assumedRootCanvasColor,
      canvas: m.canvas || null,
      ratioStr: helpers.contrast.round2(m.ratio),
      threshold,
      thresholdStr: `${threshold}`,
      font,
      fgOpaque: m.fg,
      bgOpaque: m.bg
    };
  }

  // Text whose background can't be worked out, but whose own colour rules
  // out the ratio on every background: the best background for a colour is
  // white or black, and a colour of relative luminance L reaches at most
  // max(1.05 / (L + 0.05), (L + 0.05) / 0.05) against them, below 7:1 for
  // L between 0.1 and 0.3. Normal text in such a colour fails 1.4.6
  // whatever lies behind it (CONTRAST_UNREACHABLE_ANY_BACKGROUND). Large
  // text never does: every colour reaches about 4.58:1 against white or
  // black, above its 4.5:1. Only where nothing but the background is
  // unknown: an opaque text colour, no blend mode or filter on the text or
  // around it, and not a placeholder, which is judged by whose colours it
  // has. backgroundCode: what stopped the background being worked out.
  // { bestRatio, threshold, fg, font, backgroundCode }, or null.
  const BACKGROUND_ONLY_BLOCKERS = new Set(['BACKGROUND_IMAGE_OR_GRADIENT', 'BACKGROUND_OVERLAP']);
  function unreachableOnAnyBackground(el, backgroundCode) {
    try {
      if (helpers.contrast.isPlaceholderText && helpers.contrast.isPlaceholderText(el)) return null;
      const font = getFontInfo(el);
      if (font.isLargeText) return null;
      const threshold = helpers.contrast.requiredRatio('AAA', false);
      let fg = __elFgCache ? __elFgCache.get(el) : null;
      if (!fg) {
        fg = helpers.contrast.computeEffectiveForeground(el);
        if (fg && __elFgCache) __elFgCache.set(el, fg);
      }
      if (!fg || !fg.rgba || fg.rgba.a !== 1) return null;
      // The colour the text is painted in, as declared: a transparent fill
      // (text cut out of a background) is drawn in that background.
      const cs = safeComputedStyle(el);
      const fill =
        cs &&
        (helpers.contrast.parseCssColorToRgba(cs.webkitTextFillColor || '') ||
          helpers.contrast.parseCssColorToRgba(cs.color));
      if (!fill || fill.a !== 1) return null;
      for (let cur = el, depth = 0; cur && depth < 200; depth += 1) {
        if (dom.nodeType(cur) === 1) {
          const ccs = safeComputedStyle(cur);
          if (!ccs || helpers.contrast.hasBlendMode(ccs) || helpers.contrast.hasFilter(ccs))
            return null;
        }
        let next = dom.parentElement(cur);
        if (!next) {
          const root = dom.get(cur, 'getRootNode') ? dom.getRootNode(cur) : null;
          next = root && root !== cur && dom.get(root, 'host') ? dom.get(root, 'host') : null;
        }
        cur = next;
      }
      const opaque = { r: fg.rgba.r, g: fg.rgba.g, b: fg.rgba.b, a: 1 };
      const bestRatio = Math.max(
        helpers.contrast.contrastRatio(opaque, { r: 255, g: 255, b: 255, a: 1 }),
        helpers.contrast.contrastRatio(opaque, { r: 0, g: 0, b: 0, a: 1 })
      );
      if (!(bestRatio < threshold)) return null;
      return { bestRatio, threshold, fg: opaque, font, backgroundCode };
    } catch {
      return null;
    }
  }

  function pushUnreachableOccurrence(el, unreachable) {
    const { bestRatio, threshold, fg, font } = unreachable;
    const fgHex = helpers.contrast.rgbToHex(fg);
    const fgRgba = helpers.contrast.rgbaToString(fg);
    const fwNum = Number(font.fontWeightNum);
    const fwLabel = helpers.contrast.fontWeightLabel
      ? helpers.contrast.fontWeightLabel(fwNum)
      : 'normal';
    const fontPxNum = font.fontSizePx ? parseFloat(font.fontSizePx) : NaN;
    let special = null;
    if (helpers.contrast.looksLikeLogo && helpers.contrast.looksLikeLogo(el)) {
      special = { kind: 'logo' };
    } else {
      const switchName = helpers.contrast.contrastSwitchName
        ? helpers.contrast.contrastSwitchName(ctx.document, helpers, ctx)
        : '';
      if (switchName) special = { kind: 'switch', switchName };
    }
    pushFailOccurrence(
      el,
      {
        reasonCode: 'CONTRAST_UNREACHABLE_ANY_BACKGROUND',
        foreground: fgRgba,
        foregroundHex: fgHex,
        bestRatio: helpers.contrast.round2(bestRatio),
        threshold: `${threshold}`,
        fontSizePx: font.fontSizePx,
        fontWeightLabel: fwLabel,
        isLargeText: false
      },
      {
        reasonCode: 'CONTRAST_UNREACHABLE_ANY_BACKGROUND',
        metrics: { bestRatio, threshold },
        typography: {
          fontSizePx: Number.isFinite(fontPxNum) ? fontPxNum : null,
          fontSizePt: Number.isFinite(fontPxNum) ? fontPxNum * 0.75 : null,
          fontWeight: Number.isFinite(fwNum) ? fwNum : null,
          fontWeightLabel: fwLabel,
          isBold: !!font.isBold,
          isLargeText: false
        },
        colors: { foregroundHex: fgHex, foregroundRgba: fgRgba },
        backgroundNotComputable: unreachable.backgroundCode
      },
      '',
      '',
      '',
      special
    );
  }

  // Text measured against its background: bg and fg as computed, in
  // `scheme` where given (a color scheme the page supports and isn't drawn
  // in now, on its canvas: helpers.contrast.colorSchemeMeasurable), else as
  // the page is drawn. { computable, ratio, threshold, ..., canvas }.
  function mainAnalysis(el, scheme) {
    let analysis;
    // The caches hold the scheme the page is drawn in.
    const bgCache = scheme ? null : __elBgCache;
    const fgCache = scheme ? null : __elFgCache;
    let bg = bgCache ? bgCache.get(el) : null;
    if (!bg) {
      bg = helpers.contrast.computeEffectiveBackground(el, {
        contrast: { mode, rootCanvasFallback, ...(scheme ? { colorScheme: scheme } : {}) },
        collectStack: false
      });
      // Not computable: contrast-computable asks about this text.
      bg = bg || { ok: false, rgba: null, alpha: 0 };
      if (bgCache) bgCache.set(el, bg);
    }

    const bgAssumptionsApplied =
      bg && Array.isArray(bg.assumptionsApplied) && bg.assumptionsApplied.length
        ? bg.assumptionsApplied.slice(0)
        : null;
    const bgAssumedRootCanvasColor =
      bg && typeof bg.assumedRootCanvasColor === 'string' ? bg.assumedRootCanvasColor : null;

    let fg = fgCache ? fgCache.get(el) : null;
    if (!fg) {
      fg = scheme
        ? helpers.contrast.computeEffectiveForeground(el, { contrast: { colorScheme: scheme } })
        : helpers.contrast.computeEffectiveForeground(el);
      fg = fg || { rgba: null, alpha: 0, opacityProduct: 1 };
      if (fgCache) fgCache.set(el, fg);
    }

    if (!bg || bg.ok === false || !bg.rgba || !fg || !fg.rgba) {
      analysis = { computable: false };
      // Not where the text's own colour in the page's color scheme
      // is what can't be read (bg.textColorUnknown).
      if ((!bg || bg.ok === false || !bg.rgba) && !(bg && bg.textColorUnknown)) {
        analysis.unreachable = unreachableOnAnyBackground(
          el,
          (bg && bg.reasonCode) || 'BACKGROUND_NOT_COMPUTABLE'
        );
      }
    } else {
      // Compose FG over BG if FG has alpha (effective fg may be < 1 due to opacity chain)
      let fgOpaque =
        fg.rgba.a != null && fg.rgba.a < 1
          ? helpers.contrast.compositeRgba(fg.rgba, bg.rgba)
          : { r: fg.rgba.r, g: fg.rgba.g, b: fg.rgba.b, a: 1 };

      let bgOpaque = { r: bg.rgba.r, g: bg.rgba.g, b: bg.rgba.b, a: 1 };

      let ratio = helpers.contrast.contrastRatio(fgOpaque, bgOpaque);

      // A drop-down select in the browser's own background is drawn
      // on the Field colour in some browsers and on its computed
      // background in others: text that fails on either fails, so
      // the lower ratio counts.
      const field =
        typeof helpers.contrast.nativeSelectField === 'function'
          ? helpers.contrast.nativeSelectField(el)
          : null;
      let selectField = null;
      if (field) {
        const fgOnField =
          fg.rgba.a != null && fg.rgba.a < 1
            ? helpers.contrast.compositeRgba(fg.rgba, field)
            : fgOpaque;
        const onField = helpers.contrast.contrastRatio(fgOnField, field);
        selectField = {
          backgroundHex: helpers.contrast.rgbToHex(bgOpaque),
          fieldHex: helpers.contrast.rgbToHex(field)
        };
        if (onField < ratio) {
          fgOpaque = fgOnField;
          bgOpaque = field;
          ratio = onField;
        }
      }

      const font = getFontInfo(el);
      const threshold = helpers.contrast.requiredRatio('AAA', font.isLargeText);

      analysis = {
        computable: true,
        ratio,
        bgAssumptionsApplied,
        bgAssumedRootCanvasColor,
        ratioStr: helpers.contrast.round2(ratio),
        threshold,
        thresholdStr: `${threshold}`,
        font,
        fgOpaque,
        bgOpaque,
        selectField,
        canvas: bg.canvas || null
      };
    }
    return analysis;
  }

  // Text on the page's canvas (analysis.canvas), on a page that supports
  // two color schemes: measured in the one the page is drawn in, and in the
  // other where its colours can't change with the scheme (measureIn,
  // helpers.contrast.colorSchemeMeasurable). It fails where it fails in a
  // scheme measured, by its ratio there, and colorScheme names that scheme
  // where the other passes (failing in both, it is reported in the scheme
  // the page is drawn in, naming none); it passes where it passes in each,
  // by the ratio closest to its threshold.
  // colorSchemesChecked lists the schemes measured where one wasn't.
  function acrossSchemes(el, analysis, measureIn) {
    const canvas = analysis && analysis.computable === true ? analysis.canvas : null;
    if (!canvas || !canvas.scheme || !Array.isArray(canvas.supported)) return analysis;
    if (canvas.supported.length < 2) return analysis;
    const measured = [{ scheme: canvas.scheme, a: analysis }];
    for (const scheme of canvas.supported) {
      if (scheme === canvas.scheme || !measureIn) continue;
      if (typeof helpers.contrast.colorSchemeMeasurable !== 'function') continue;
      if (!helpers.contrast.colorSchemeMeasurable(el, scheme)) continue;
      const other = measureIn(scheme);
      if (other && other.computable === true && other.canvas && other.canvas.scheme === scheme)
        measured.push({ scheme, a: other });
    }
    const share = (m) => m.a.ratio / m.a.threshold;
    const failing = measured.filter((m) => !(m.a.ratio >= m.a.threshold));
    // Failing in every scheme measured, it is reported as the page is drawn.
    const pick =
      failing.length === measured.length
        ? measured[0]
        : (failing.length ? failing : measured).reduce((best, m) =>
            share(m) < share(best) ? m : best
          );
    const out = { ...pick.a };
    if (failing.length && failing.length < measured.length) out.colorScheme = failing[0].scheme;
    const checked = canvas.supported.filter((s) => measured.some((m) => m.scheme === s));
    if (checked.length < canvas.supported.length) out.colorSchemesChecked = checked;
    return out;
  }

  // Walk eligible visible text nodes (counted per text node), but compute expensive analysis once per element.
  if (scan && scan.elements && Array.isArray(scan.elements)) {
    try {
      // Text a ::before, ::after or ::marker generates (#219) follows the
      // elements' own, one record per pseudo-element.
      const generated = Array.isArray(scan.generated) ? scan.generated : [];
      eligibleTextCount = Number(scan.eligibleTextCount) || 0;
      for (const rec of generated) eligibleTextCount += Number(rec && rec.textCount) || 0;

      for (const rec of scan.elements.concat(generated)) {
        const el = toElement(rec && rec.el);
        const pseudo = rec && rec.pseudo ? String(rec.pseudo) : '';
        const textCount = rec && Number(rec.textCount) ? Number(rec.textCount) : 0;
        if (!el || textCount <= 0) continue;

        // Computability + contrast analysis (cached per element)
        let analysis = pseudo
          ? acrossSchemes(el, generatedAnalysis(el, pseudo), null)
          : __elAnalysisCache.get(el);
        if (!analysis) {
          // Computability gate (do NOT emit cantTell here; Rule 1 is responsible for that)
          let blocker = __elBlockerCache ? __elBlockerCache.get(el) : null;
          if (!blocker) {
            blocker = helpers.contrast.getComputabilityBlocker(el);
            blocker = blocker || {
              ok: true,
              reasonCode: null,
              blockerSelector: '',
              blockerProperty: '',
              blockerValue: ''
            };
            if (__elBlockerCache) __elBlockerCache.set(el, blocker);
          }

          if (blocker && blocker.ok === false) {
            analysis = acrossSchemes(
              el,
              outlineOnlyAnalysis(el, blocker) ||
                pseudoColorAnalysis(el, blocker) || { computable: false },
              null
            );
            if (analysis.computable !== true && BACKGROUND_ONLY_BLOCKERS.has(blocker.reasonCode)) {
              analysis.unreachable = unreachableOnAnyBackground(el, blocker.reasonCode);
            }
          } else {
            analysis = acrossSchemes(el, mainAnalysis(el, null), (scheme) =>
              mainAnalysis(el, scheme)
            );
          }
          __elAnalysisCache.set(el, analysis);
        }

        if (analysis && analysis.unreachable && !pseudo && !symbolicCharacter(el)) {
          failCount += textCount;
          if (occurrences.length < MAX_OCCURRENCES)
            pushUnreachableOccurrence(el, analysis.unreachable);
          continue;
        }
        if (!analysis || analysis.computable !== true) continue;

        computableTextCount += textCount;
        // Text on the canvas measured in only some of the page's color schemes.
        if (analysis.colorSchemesChecked && !schemesChecked)
          schemesChecked = analysis.colorSchemesChecked;

        const ratio = analysis.ratio;
        const font = analysis.font;
        const threshold = analysis.threshold;
        const ratioStr = analysis.ratioStr;
        const thresholdStr = analysis.thresholdStr;
        const fgOpaque = analysis.fgOpaque;
        const bgOpaque = analysis.bgOpaque;

        measuredElements += 1;
        if (ratio >= threshold) {
          marginCandidates.push({
            el,
            value: ratio,
            threshold,
            context: { largeText: !!font.isLargeText }
          });
        }

        if (!(ratio >= threshold)) {
          const placeholder = !!(
            !pseudo &&
            helpers.contrast &&
            typeof helpers.contrast.isPlaceholderText === 'function' &&
            helpers.contrast.isPlaceholderText(el)
          );
          // A placeholder in colours the page chose fails; in the browser's
          // own (G148) it meets the ratio; when that can't be told it is
          // asked about.
          const placeholderSource =
            placeholder && typeof helpers.contrast.placeholderColourSource === 'function'
              ? helpers.contrast.placeholderColourSource(el)
              : '';
          if (placeholderSource === 'browser') continue;
          const placeholderMode = placeholder
            ? placeholderSource === 'page'
              ? 'fail'
              : 'ask'
            : '';
          const symbol = placeholder || pseudo ? '' : symbolicCharacter(el);
          if (placeholderMode === 'ask' || symbol) deferredCount += textCount;
          else failCount += textCount;
          // Past the occurrence cap a failure is only counted. The loop goes
          // on, so text further down the page still counts toward the margin
          // and measuredCount: stopping here made both depend on where the
          // 50th failure fell.
          if (occurrences.length >= MAX_OCCURRENCES) continue;

          const fgHex = helpers.contrast.rgbToHex ? helpers.contrast.rgbToHex(fgOpaque) : '';

          const bgHex = helpers.contrast.rgbToHex ? helpers.contrast.rgbToHex(bgOpaque) : '';

          const fontPxNum = font.fontSizePx ? parseFloat(font.fontSizePx) : NaN;

          const fontPtStr =
            helpers.contrast.pxToPt && Number.isFinite(fontPxNum)
              ? helpers.contrast.pxToPt(fontPxNum)
              : '';

          const fwNum = Number(font.fontWeightNum);
          const fwLabel = helpers.contrast.fontWeightLabel
            ? helpers.contrast.fontWeightLabel(fwNum)
            : font.isBold
              ? 'bold'
              : 'normal';

          const fgRgbaStr = helpers.contrast.rgbaToString(fgOpaque);
          const bgRgbaStr = helpers.contrast.rgbaToString(bgOpaque);

          const params = {
            reasonCode: 'BELOW_THRESHOLD',
            ...(pseudo ? { pseudo } : {}),

            foreground: fgRgbaStr,
            background: bgRgbaStr,

            foregroundHex: fgHex,
            backgroundHex: bgHex,
            fontSizePt: fontPtStr,
            fontWeightLabel: fwLabel,

            ratio: ratioStr,
            threshold: thresholdStr,

            fontSizePx: font.fontSizePx,
            fontWeight: font.fontWeight,
            isBold: font.isBold,
            isLargeText: font.isLargeText,
            // The drawn size put the text on the other side of the large-text
            // line from its font-size: the hint says why (drawnSizeNote).
            ...drawnSizeNote(font)
          };

          const assumptionsApplied =
            analysis &&
            Array.isArray(analysis.bgAssumptionsApplied) &&
            analysis.bgAssumptionsApplied.length
              ? analysis.bgAssumptionsApplied.slice(0)
              : null;
          const assumedRootCanvasColor =
            analysis && typeof analysis.bgAssumedRootCanvasColor === 'string'
              ? analysis.bgAssumedRootCanvasColor
              : null;

          const details = {
            reasonCode: 'BELOW_THRESHOLD',
            metrics: { ratio, threshold },
            typography: {
              fontSizePx: Number.isFinite(fontPxNum) ? fontPxNum : null,
              fontSizePt: Number.isFinite(fontPxNum) ? fontPxNum * 0.75 : null,
              fontWeight: Number.isFinite(fwNum) ? fwNum : null,
              fontWeightLabel: fwLabel,
              isBold: !!font.isBold,
              isLargeText: !!font.isLargeText,
              ...(font.sizeScaledBy
                ? { declaredFontSizePx: font.declaredFontSizePx, sizeScaledBy: font.sizeScaledBy }
                : {})
            },
            colors: {
              foregroundHex: fgHex,
              backgroundHex: bgHex,
              foregroundRgba: fgRgbaStr,
              backgroundRgba: bgRgbaStr
            },
            assumptionsApplied: assumptionsApplied,
            assumedRootCanvasColor: assumedRootCanvasColor,
            ...(analysis.drawnBy ? { drawnBy: analysis.drawnBy } : {}),
            ...(analysis.pseudoElementColor
              ? { pseudoElementColor: analysis.pseudoElementColor }
              : {}),
            ...(analysis.selectField ? { selectField: analysis.selectField } : {}),
            ...(pseudo ? { generatedBy: pseudo } : {}),
            // On the canvas of a page with two color schemes: the one it
            // fails in, where it passes in the other, and those measured,
            // where one wasn't (acrossSchemes).
            ...(analysis.colorScheme ? { colorScheme: analysis.colorScheme } : {}),
            ...(analysis.colorSchemesChecked
              ? { colorSchemesChecked: analysis.colorSchemesChecked.slice(0) }
              : {})
          };

          let special = null;
          if (!placeholder && !symbol && !pseudo) {
            if (helpers.contrast.looksLikeLogo && helpers.contrast.looksLikeLogo(el)) {
              special = { kind: 'logo' };
            } else {
              const switchName = helpers.contrast.contrastSwitchName
                ? helpers.contrast.contrastSwitchName(ctx.document, helpers, ctx)
                : '';
              if (switchName) special = { kind: 'switch', switchName };
            }
          }
          pushFailOccurrence(el, params, details, placeholderMode, pseudo, symbol, special);
        }
      }
    } catch {
      // No-throw: deterministic cantTell on internal failure
      return {
        ruleId: rule.ruleId,
        outcome: 'cantTell',
        severity: rule.defaultSeverity || 'serious',
        confidence: rule.defaultConfidence || 'high',
        occurrences: [
          {
            selector: '',
            summary: '',
            hint: "Measure this text's contrast by hand on the rendered page. Normal text needs at least 4.5:1 and large text 3:1 (7:1 and 4.5:1 for AAA).",
            html: '',
            i18n: {
              summaryKey: 'contrastEnhanced_cantTell_engineFailure',
              hintKey: 'contrast_hint_cantTell_manual',
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

  // If eligible text exists but none is computable, stay notApplicable; Rule 1 reports cantTell.
  // Text no background can bring to the ratio fails all the same.
  if (computableTextCount === 0 && failCount === 0) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: rule.defaultSeverity || 'serious',
      confidence: rule.defaultConfidence || 'high',
      occurrences: helpers.contrast.noteForcedColors([
        {
          selector: '',
          summary: '',
          hint: '',
          html: '',
          i18n: {
            summaryKey: 'contrastEnhanced_notApplicable_noComputableText',
            hintKey: '',
            params: { eligibleTextCount: String(eligibleTextCount) }
          },
          data: { details: { eligibleTextCount, computableTextCount } }
        }
      ])
    };
  }

  // Where the colors measured were forced, each occurrence says so
  // (contrast-helpers).
  helpers.contrast.noteForcedColors(occurrences);

  if (failCount > 0 || deferredCount > 0) {
    return {
      ruleId: rule.ruleId,
      outcome: failCount > 0 ? 'fail' : 'cantTell',
      severity: rule.defaultSeverity || 'serious',
      confidence: rule.defaultConfidence || 'high',
      occurrences,
      marginCandidates,
      measuredCount: measuredElements
    };
  }

  // All computable text passed
  if (!occurrences.length) {
    pushPassOccurrence(eligibleTextCount, computableTextCount);
    helpers.contrast.noteForcedColors(occurrences);
  }

  return {
    ruleId: rule.ruleId,
    outcome: 'pass',
    severity: rule.defaultSeverity || 'serious',
    confidence: rule.defaultConfidence || 'high',
    occurrences,
    marginCandidates,
    measuredCount: measuredElements
  };
}

module.exports = { id, meta, runInPage };
