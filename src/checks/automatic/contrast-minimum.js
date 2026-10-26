/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check contrast-minimum
 * @atomic true
 * @summary Text must meet the WCAG AA contrast ratio for its size
 * @standard WCAG 2.2
 * @sc 1.4.3
 * @applicability
 *   Applies to the visible text contrast-computable applies to, see that
 *   rule for the eligibility gates, narrowed to text whose background and
 *   foreground are actually computable. Eligible text that is not computable
 *   leaves this rule notApplicable rather than cantTell: reporting that
 *   uncertainty belongs to contrast-computable, so the two never report the
 *   same text twice.
 * @expectation
 *   Every computable text node reaches the ratio SC 1.4.3 requires for its
 *   size: 3:1 for large text, 4.5:1 for everything else. Text is large at
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
 *   contrast-computable decides what to ask about at WCAG's ratios. At
 *   ratios of this rule's own (a variant's settings), text in two colours
 *   that disagree only at those ratios, and text drawn by an outline or a
 *   shadow whose best colour reaches them but not WCAG's AA ratio, are
 *   asked about here (`PSEUDO_ELEMENT_COLOR`, `TEXT_STROKE`,
 *   `TEXT_SHADOW`), since no other rule would. Text drawn by an outline whose best
 *   colour lies between WCAG's AA ratio and a higher ratio of the
 *   variant's fails here and is asked about by contrast-computable too:
 *   two answers to two requirements, the variant's and WCAG 1.4.3.
 *   A field's placeholder below its ratio (`PLACEHOLDER_BELOW_THRESHOLD`)
 *   fails when the page chose its colours: the placeholder's color,
 *   opacity or background, or the field's background, differ from the
 *   browser's own, read in a blank frame. In the browser's own colours it
 *   meets the ratio (WCAG G148), and when that can't be told it is a
 *   `cantTell` occurrence.
 * @reports
 *   - `metrics.ratio` (text below the threshold): the text's contrast
 *     ratio against its background (4.5 for 4.5:1), against
 *     `metrics.threshold`, the ratio its size requires.
 *   - `colors.foregroundHex`, `colors.backgroundHex` (text below the
 *     threshold): the text color (the -webkit-text-fill-color it is
 *     painted in, `color` unless set) and the background color behind it, as
 *     hex, after any transparency is blended in.
 *     `colors.foregroundRgba` and `colors.backgroundRgba` give the same two
 *     colors in `rgba()` form.
 *   - `selectField` (a drop-down select in the browser's own background):
 *     `backgroundHex`, its computed background, and `fieldHex`, the Field
 *     color Chromium paints it in. The text is measured against both and
 *     the lower ratio is reported.
 *   - `typography.fontSizePx`, `typography.fontSizePt` (text below the
 *     threshold): the font size as drawn, in CSS pixels and in points:
 *     the computed size times CSS zoom, or for SVG text its viewBox and
 *     transform scale, and times what font-size-adjust scales the font by
 *     (its adjust value over the font's own aspect, read in a browser).
 *     This is the size the large-text threshold is judged on, as WCAG's
 *     "size when the content is delivered".
 *   - `typography.declaredFontSizePx`, `typography.sizeScaledBy` (text
 *     below the threshold, drawn at another size): the computed font-size,
 *     and what drew it otherwise (`zoom`, `svg`, `font-size-adjust`). Where
 *     that puts the text on the other side of the large-text line, the hint
 *     says so (`contrast_hint_drawnSize`).
 *   - `typography.fontWeight`, `typography.fontWeightLabel` (text below the
 *     threshold): the computed font weight as a number (400, 700) and as
 *     written.
 *   - `typography.isBold`, `typography.isLargeText` (text below the
 *     threshold): whether the text counts as bold, and as large text, the
 *     size that only needs 3:1.
 *   - The ratio, threshold and typography fields above are a stable
 *     contract (API_STABILITY.md), unlike the rest of `data.details`.
 *   - `assumptionsApplied`, `assumedRootCanvasColor` (text below the
 *     threshold): `null` unless the `auditorAssist` contrast mode had to
 *     assume a page background because the page sets none that is opaque.
 *     Then `assumptionsApplied` is `['ROOT_CANVAS_FALLBACK']` and
 *     `assumedRootCanvasColor` is the color assumed (white by default).
 *   - `generatedBy` (generated text below the threshold): `::before`,
 *     `::after` or `::marker`, the pseudo-element whose text is measured;
 *     the selector names its element, and the colours and font are the
 *     pseudo-element's.
 *   - `eligibleTextCount`, `computableTextCount` (the summary when nothing
 *     fails): how many text nodes the rule looked at, and how many of them
 *     had colors it could compute. Repeated under `metrics` on a pass.
 *   - `forcedColors` (every occurrence, when the colors measured were
 *     forced): `true`, and the hint says to check the page again with
 *     forced colors off. A scan under forced colors measures the page's own
 *     colors, so this is there only where it could not keep the page in
 *     them (docs/LAYOUT_MEASUREMENT.md, "Forced colors").
 * @reason-codes
 *   - `ALL_ABOVE_THRESHOLD` (pass): all the computable text reaches the ratio
 *     its size requires.
 *     Basis: WCAG 1.4.3; G18; G145; ACT afw4f7.
 *   - `BELOW_THRESHOLD` (fail): text below the ratio its size requires,
 *     including text drawn by an outline or a shadow every colour of which,
 *     its fill included when seen, is below it.
 *     Basis: WCAG 1.4.3; G18; G145; ACT afw4f7.
 *   - `PLACEHOLDER_BELOW_THRESHOLD` (fail, cantTell): a field's placeholder
 *     below its ratio. It fails when the page chose its colours, and is asked
 *     about when that can't be told; in the browser's own colours it is not
 *     reported.
 *     Basis: WCAG 1.4.3; G148.
 *   - `SYMBOLIC_CHARACTER_BELOW_THRESHOLD` (cantTell): a symbol that is not a
 *     letter or a digit, below the ratio; whether it is text the criterion
 *     covers is for a person.
 *     Basis: WCAG 1.4.3 (not settled).
 *   - `LOGO_TEXT_BELOW_THRESHOLD` (cantTell): text that looks like part of a
 *     logo, below its ratio, asked about with the `logoText: 'ask'` setting:
 *     logo text has no contrast requirement, and whether this is logo text
 *     is for a person. By default such text fails (`BELOW_THRESHOLD`, with a
 *     hint that logo text is exempt).
 *     Basis: WCAG 1.4.3 (exception: logotypes).
 *   - `CONTRAST_SWITCH_OFFERED` (cantTell): text below its ratio on a page
 *     with a control that switches to higher contrast, asked about with the
 *     `contrastSwitch: 'ask'` setting: whether the switch is easy to find and
 *     brings the text to its ratio is for a person. By default such text
 *     fails (`BELOW_THRESHOLD`, with a hint naming the switch).
 *     Basis: WCAG 1.4.3 (not settled); G174.
 *   - `SEMIBOLD_BELOW_THRESHOLD` (cantTell): text of weight 600 to 699,
 *     between the bold large-text size and 24px, that reaches the large-text
 *     ratio but not the other, asked about with the `semiBold: 'ask'`
 *     setting: whether it reads as bold, and so is large text, is for a
 *     person. By default it is normal text and fails (`BELOW_THRESHOLD`).
 *     Basis: WCAG 1.4.3 (not settled).
 *   - `PSEUDO_ELEMENT_COLOR` (cantTell): text part of which a ::first-line
 *     or ::first-letter paints in a colour of its own, one of whose colours
 *     reaches the ratio and the other not, given only at ratios other than
 *     WCAG's (a variant's settings) where the two agree at WCAG's AA and AAA
 *     ratios, so contrast-computable doesn't ask; which words each colour
 *     paints depends on line breaks.
 *     Basis: WCAG 1.4.3 (not settled).
 *   - `TEXT_STROKE` (cantTell): text drawn by a -webkit-text-stroke whose
 *     best colour reaches the ratio, given only at ratios other than WCAG's
 *     where that colour is below WCAG's AA ratio, so contrast-computable
 *     doesn't ask; whether the letters are seen in that colour is for a
 *     person.
 *     Basis: WCAG 1.4.3 (not settled).
 *   - `TEXT_SHADOW` (cantTell): the same for text drawn by a text-shadow.
 *     Basis: WCAG 1.4.3 (not settled).
 *   - `ENGINE_EXCEPTION` (cantTell): the rule stopped on an internal error;
 *     the text is to be measured by hand.
 *     Basis: WCAG 1.4.3 (not settled).
 *   - `UNKNOWN` (fail): text below its ratio whose finding lost its details;
 *     a safeguard, not expected in a normal scan.
 *     Basis: WCAG 1.4.3.
 * @implementation-notes
 * - Its thresholds are settings (`settings` below), so another standard's
 *   contrast requirement is a variant of this rule rather than a copy
 *   (docs/RULE_AUTHORING.md, "Rule variants"). Without settings it is WCAG's.
 * - Text whose background can't be worked out is never measured here, so
 *   this rule has no code for it: contrast-computable asks about that text
 *   (`BACKGROUND_NOT_COMPUTABLE` and its other blockers).
 */

const id = 'contrast-minimum';

const meta = {
  title: 'Text meets minimum color contrast (AA)',
  description:
    'Checks that visible text has a contrast ratio of at least 4.5:1 (normal) or 3:1 (large), when contrast is computable from CSS.',
  i18n: {
    titleKey: 'contrastMinimum_title',
    descriptionKey: 'contrastMinimum_description'
  },
  helpUrl: null,
  tags: ['wcag2aa', 'wcag143', 'contrast', 'color', 'structure', 'atomic', 'automatic', 'dom'],
  wcagSc: ['1.4.3'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.4.3',
      title: 'Contrast (Minimum)',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.4.3': ['contrast-minimum-text'] } },
  margin: { measure: 'contrast-ratio', unit: 'ratio', limit: 'min', band: { relative: 0.1 } },
  // Reason codes picked from a table (SPECIAL, below) under some settings,
  // which scripts/generate-finding-ids.js can't read from the source.
  // Codes given only at ratios other than WCAG's (pushAskOccurrence) too.
  reasonCodes: [
    'CONTRAST_SWITCH_OFFERED',
    'LOGO_TEXT_BELOW_THRESHOLD',
    'PSEUDO_ELEMENT_COLOR',
    'SEMIBOLD_BELOW_THRESHOLD',
    'TEXT_SHADOW',
    'TEXT_STROKE'
  ],
  // How a person checks each undecided finding: shown with it as
  // howToCheck (docs/OUTPUT_SCHEMA.md).
  review: {
    CONTRAST_SWITCH_OFFERED: {
      steps: [
        'Find the contrast switch the report names and check that it is easy to find, near the top of the page or on every page, and reachable by keyboard.',
        'Turn the switch on.',
        "Find the text the report names and use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure it against its background, comparing with 4.5:1 (3:1 for large text: at least 24px, or 18.66px and bold).",
        'Move to another page and check that the setting holds.'
      ],
      passWhen:
        'The switch is easy to find and use, and with it on the text reaches its ratio (G174).',
      failWhen:
        'The switch is hard to find or does not raise this text to its ratio, so the text fails WCAG 1.4.3.'
    },
    ENGINE_EXCEPTION: {
      steps: [
        'Find the text the report names (the check stopped early, so nothing was measured).',
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure the text colour against the background directly behind the letters.",
        'Note the text size and weight and compare the ratio with 4.5:1 (3:1 for large text: at least 24px, or 18.66px and bold).'
      ],
      passWhen: 'The ratio reaches the threshold for its size.',
      failWhen: 'The ratio is below the threshold for its size, which fails WCAG 1.4.3.'
    },
    LOGO_TEXT_BELOW_THRESHOLD: {
      steps: [
        'Find the text the report names (often in the site header or its home link).',
        "Decide whether it is part of a logo or brand name, such as the site's name in its logo treatment, rather than a slogan, menu item or other text.",
        "If it is not logo text, use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure it against its background and compare with 4.5:1 (3:1 for large text: at least 24px, or 18.66px and bold)."
      ],
      passWhen:
        'The text is part of a logo or brand name, which has no contrast requirement, or it reaches its ratio.',
      failWhen:
        'The text is not part of a logo or brand name and is below its ratio, which fails WCAG 1.4.3.'
    },
    PLACEHOLDER_BELOW_THRESHOLD: {
      steps: [
        'Find the field the report names and empty it so the placeholder shows.',
        "In the Styles pane, check whether the page's CSS sets the ::placeholder colour or opacity, or the field's background.",
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure the placeholder text against the field background and compare with 4.5:1 (3:1 for large text: at least 24px, or 18.66px and bold).",
        'Check whether the placeholder holds information needed to fill the field (a format or instruction), rather than just an example.'
      ],
      passWhen:
        "The placeholder reaches 4.5:1 (or 3:1 if large), or it is drawn entirely in the browser's own default colours.",
      failWhen:
        'The page sets the placeholder or field colours and the ratio is below the threshold, which fails WCAG 1.4.3.'
    },
    PSEUDO_ELEMENT_COLOR: {
      steps: [
        'Find the text the report names and note the ::first-line or ::first-letter colour in the Styles pane.',
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure both the element's text colour and the first-line or first-letter colour against the background.",
        'Resize the window to see which words the first-line colour paints at different widths.',
        'Compare each ratio with the one the report gives as needed for that colour.'
      ],
      passWhen: 'Both colours reach the ratio they need.',
      failWhen: 'Either colour gives a ratio below the one it needs, so the text fails the check.'
    },
    SEMIBOLD_BELOW_THRESHOLD: {
      steps: [
        'Find the semi-bold text the report names.',
        'Compare it side by side with bold text (weight 700) of the same size and font on the page or in the developer tools, toggling font-weight.',
        'Decide whether it reads as bold; if it does, it counts as large and needs 3:1, otherwise 4.5:1.'
      ],
      passWhen: 'The text reads as bold, so it is large text and its ratio meets 3:1.',
      failWhen:
        'The text does not read as bold, so it is normal text below 4.5:1, which fails WCAG 1.4.3.'
    },
    SYMBOLIC_CHARACTER_BELOW_THRESHOLD: {
      steps: [
        'Find the character the report names (such as ×, ☰, › or an icon-font glyph).',
        'Decide whether it is text people read (part of words, a number) or an icon standing in for an action, like a close or menu symbol.',
        "If it is text, use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure it against its background and compare with 4.5:1 (3:1 for large text: at least 24px, or 18.66px and bold).",
        'If it is an icon for a control, measure it against its background and compare with 3:1 instead (WCAG 1.4.11).'
      ],
      passWhen:
        'It is text and reaches its ratio, or it is an icon that reaches 3:1 for non-text contrast.',
      failWhen:
        'It is text below 4.5:1, which fails WCAG 1.4.3; or an icon below 3:1, which fails WCAG 1.4.11.'
    },
    TEXT_SHADOW: {
      steps: [
        'Find the text the report names and note its text-shadow.',
        'Zoom in and check whether the shadow forms a solid outline or halo around every letter.',
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure the colour that forms the letters against the background.",
        'Compare the ratio with the one the report gives as needed.'
      ],
      passWhen: 'The colour that forms the letters reaches the ratio needed.',
      failWhen:
        'The colour that forms the letters gives a ratio below the one needed, so the text fails the check.'
    },
    TEXT_STROKE: {
      steps: [
        'Find the text the report names and note its -webkit-text-stroke width and colour.',
        'Zoom in to see which colour forms most of each letter (a thin stroke counts less than the fill).',
        "Use the colour picker in the browser's developer tools, or a contrast calculator with colours picked by an eyedropper, to measure that colour against the background.",
        'Compare the ratio with the one the report gives as needed.'
      ],
      passWhen: 'The colour that forms the letters reaches the ratio needed.',
      failWhen:
        'The colour that forms the letters gives a ratio below the one needed, so the text fails the check.'
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

  // Thresholds (see `settings` below): WCAG 1.4.3's by default. A variant of
  // this rule, another standard's contrast requirement, passes its own in
  // ctx.config (docs/RULE_AUTHORING.md, "Rule variants").
  const cfg = ctx.config && typeof ctx.config === 'object' ? ctx.config : {};
  const setting = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  const BOLD_LARGE_MIN_PX = setting(cfg.boldLargeMinPx, null);
  const LARGE_TEXT_RATIO = setting(cfg.largeTextRatio, 3);
  const NORMAL_TEXT_RATIO = setting(cfg.normalTextRatio, 4.5);
  // Choices (settingsInfo below): what a failure on logo-like text, or on a
  // page with a contrast switch, becomes, and whether weights 600-699 are
  // asked about. They change only how a failure is reported, never a ratio,
  // so the caches don't depend on them.
  const choice = (v, values, d) => (values.includes(v) ? v : d);
  const LOGO_TEXT = choice(cfg.logoText, ['fail', 'ask', 'exempt'], 'fail');
  const CONTRAST_SWITCH = choice(cfg.contrastSwitch, ['fail', 'ask'], 'fail');
  const SEMI_BOLD = choice(cfg.semiBold, ['normal', 'ask'], 'normal');
  // The font and analysis caches hold verdicts that depend on those
  // thresholds, so other thresholds get caches of their own.
  const SETTINGS_KEY =
    BOLD_LARGE_MIN_PX === null && LARGE_TEXT_RATIO === 3 && NORMAL_TEXT_RATIO === 4.5
      ? ''
      : '|' + [BOLD_LARGE_MIN_PX, LARGE_TEXT_RATIO, NORMAL_TEXT_RATIO].join('|');

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

  const FONT_CACHE = '__elFontCache' + SETTINGS_KEY;
  const __elFontCache = __contrastSharedCache
    ? __contrastSharedCache[FONT_CACHE] || (__contrastSharedCache[FONT_CACHE] = new WeakMap())
    : new WeakMap();

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
      const largeAt = (px) =>
        BOLD_LARGE_MIN_PX === null
          ? helpers.contrast.isLargeText(px, fontWeightNum)
          : helpers.contrast.isLargeText(px, fontWeightNum, BOLD_LARGE_MIN_PX);
      const isLarge = largeAt(sizePx);

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
        out.declaredIsLargeText = largeAt(fontSizePx);
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

  function pushPassOccurrence(eligibleCount, computableCount) {
    try {
      occurrences.push({
        selector: '',
        summary: 'All computable text meets the minimum (AA) contrast threshold.',
        hint: '',
        html: '',
        i18n: {
          summaryKey: 'contrastMinimum_pass_allAboveThreshold',
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
            }
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

  // Logo-like text and a page's contrast switch stay failures by default,
  // with a hint that says why they might not be: WCAG
  // 1.4.3 exempts logo text, and a switch to sufficient contrast meets it
  // (G174). A variant may ask about them instead (logoText, contrastSwitch:
  // 'ask'), and ask about semi-bold text that would pass as bold (semiBold).
  const SPECIAL = {
    logo: {
      code: 'LOGO_TEXT_BELOW_THRESHOLD',
      key: 'logo',
      hint: (t) =>
        `If this text is part of a logo or brand name, it has no contrast requirement (WCAG 1.4.3); otherwise change its colors so the ratio reaches ${t}:1.`,
      needed:
        'Whether this text is part of a logo or brand name, which has no contrast requirement.'
    },
    switch: {
      code: 'CONTRAST_SWITCH_OFFERED',
      key: 'contrastSwitch',
      hint: (t, name) =>
        `The page offers a contrast switch ("${name}"). If it is easy to find and turns this text to at least ${t}:1, the page can meet the criterion that way (G174); otherwise change the colors.`,
      needed:
        "Whether the page's contrast switch is easy to find and turns this text to a sufficient ratio."
    },
    semiBold: {
      code: 'SEMIBOLD_BELOW_THRESHOLD',
      key: 'semiBold',
      hint: (t) =>
        `This text is semi-bold. If it reads as bold, it is large and needs only ${LARGE_TEXT_RATIO}:1, which it reaches; if it doesn't, change its colors so the ratio reaches ${t}:1.`,
      needed: 'Whether this semi-bold text reads as bold, which would make it large text.'
    }
  };
  function applySpecial(occ, special, params) {
    const kind = SPECIAL[special.kind];
    if (!kind) return;
    const det = occ.data.details;
    const p = occ.i18n.params;
    p.largeTextRatio = String(LARGE_TEXT_RATIO);
    if (special.switchName) {
      det.contrastSwitch = special.switchName;
      p.switchName = special.switchName;
    }
    if (special.kind === 'logo') det.looksLikeLogo = true;
    occ.hint = kind.hint(params && params.threshold, special.switchName);
    occ.i18n.hintKey = 'contrast_hint_' + kind.key;
    if (special.mode !== 'ask') return;
    det.reasonCode = kind.code;
    p.reasonCode = kind.code;
    occ.i18n.summaryKey = 'contrastMinimum_cantTell_' + kind.key;
    occ.occurrenceOutcome = 'cantTell';
    occ.uncertainty = { code: 'judgement-required', needed: kind.needed };
  }

  // symbol: the text is a lone character standing in for its control's name
  // (symbolicCharacter), asked about rather than failed.
  // special: { kind: 'logo' | 'switch' | 'semiBold', mode: 'fail' | 'ask',
  // switchName } for text that looks like a logo, on a page with a contrast
  // switch, or semi-bold (the settings above); null otherwise.
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
              ? 'contrastMinimum_fail_placeholder'
              : placeholder
                ? 'contrastMinimum_cantTell_placeholder'
                : symbol
                  ? 'contrastMinimum_cantTell_symbol'
                  : pseudo
                    ? 'contrastMinimum_fail_generatedText'
                    : 'contrastMinimum_fail_belowThreshold',
          hintKey:
            placeholder === 'fail'
              ? 'contrast_hint_placeholder_fail'
              : placeholder
                ? 'contrast_hint_placeholder'
                : symbol
                  ? 'contrast_hint_symbol'
                  : 'contrastMinimum_hint_fail',
          params: params && typeof params === 'object' ? params : {}
        },
        ...(uncertainty ? { uncertainty } : {}),
        ...(placeholder === 'ask' || symbol ? { occurrenceOutcome: 'cantTell' } : {}),
        data: { details: det }
      };

      if (params && params.sizeNote && !placeholder && !symbol) {
        occBase.hint = `Its font-size is ${params.declaredFontSizePx}px, but ${params.scaledBy} draws it at ${params.drawnFontSizePx}px, and text is judged by the size it is drawn at: ${params.isLargeText ? 'large text' : 'not large text'}, which needs ${params.threshold}:1. Change the text color, the background color, or both, so the ratio reaches it.`;
        occBase.i18n.hintKey = 'contrast_hint_drawnSize';
      }
      if (special && !placeholder && !symbol) applySpecial(occBase, special, params);

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

      // IMPORTANT: this populates occ.selector and occ.html (snippet) when available
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

  // Text drawn by an outline or a shadow, or painted in part by a
  // ::first-line or ::first-letter, that this rule can't decide at its own
  // ratios and contrast-computable, deciding at WCAG's, leaves to it (ask:
  // from outlineOnlyAnalysis or pseudoColorAnalysis).
  function pushAskOccurrence(el, ask) {
    try {
      if (!el || seenFailEls.has(el) || occurrences.length >= MAX_OCCURRENCES) return;
      seenFailEls.add(el);
      const C = helpers.contrast;
      const hex = (c) => (C.rgbToHex ? C.rgbToHex(c) : '');
      const rc = ask.reasonCode;
      let params;
      let details;
      let summary;
      let hint;
      let summaryKey;
      let hintKey;
      if (rc === 'PSEUDO_ELEMENT_COLOR') {
        const side = (x) => ({
          ratio: x.ratio,
          threshold: x.threshold,
          foregroundHex: hex(x.fg),
          backgroundHex: hex(x.bg),
          isLargeText: !!x.font.isLargeText
        });
        const own = side(ask.own);
        const part = side(ask.pseudo);
        params = {
          reasonCode: rc,
          pseudoElement: ask.pseudoElement,
          ownRatio: C.round2(own.ratio),
          ownThreshold: String(own.threshold),
          ownForegroundHex: own.foregroundHex,
          pseudoRatio: C.round2(part.ratio),
          pseudoThreshold: String(part.threshold),
          pseudoForegroundHex: part.foregroundHex
        };
        details = {
          reasonCode: rc,
          pseudoElementColor: ask.pseudoElement,
          own,
          pseudoElement: part
        };
        summary = `Part of this text is painted by ${params.pseudoElement}, and which part depends on how the lines break. In its own colour (${params.ownForegroundHex}) it has a contrast of ${params.ownRatio}:1, against ${params.ownThreshold}:1 needed; in the ${params.pseudoElement} colour (${params.pseudoForegroundHex}), ${params.pseudoRatio}:1, against ${params.pseudoThreshold}:1. One reaches its ratio and the other does not.`;
        hint = `Resize the window to see which words ${params.pseudoElement} paints, and check that each colour reaches its ratio there; if one falls short, change it.`;
        summaryKey = 'contrastMinimum_cantTell_pseudoElementColor';
        hintKey = 'contrastMinimum_hint_cantTell_pseudoElementColor';
      } else {
        params = {
          reasonCode: rc,
          ratio: C.round2(ask.ratio),
          threshold: String(ask.threshold),
          foregroundHex: hex(ask.fg),
          backgroundHex: hex(ask.bg),
          blockerProperty: ask.blockerProperty,
          blockerValue: ask.blockerValue
        };
        details = {
          reasonCode: rc,
          drawnBy: ask.drawnBy,
          metrics: { ratio: ask.ratio, threshold: ask.threshold },
          colors: { foregroundHex: params.foregroundHex, backgroundHex: params.backgroundHex },
          blockerProperty: ask.blockerProperty,
          blockerValue: ask.blockerValue
        };
        const by = rc === 'TEXT_STROKE' ? 'an outline' : 'a shadow';
        summary = `This text is drawn with ${by} (${params.blockerProperty}=${params.blockerValue}). Its best colour, ${params.foregroundHex}, has a contrast of ${params.ratio}:1 against ${params.backgroundHex}, which reaches ${params.threshold}:1, but whether the letters are seen in that colour depends on how much of them it draws.`;
        hint = `Zoom in and measure the colour that forms most of each letter against the background; it needs ${params.threshold}:1.`;
        summaryKey =
          rc === 'TEXT_STROKE'
            ? 'contrastMinimum_cantTell_textStroke'
            : 'contrastMinimum_cantTell_textShadow';
        hintKey = 'contrastMinimum_hint_cantTell_outline';
      }
      const occBase = {
        selector: '',
        html: '',
        summary,
        hint,
        i18n: { summaryKey, hintKey, params },
        uncertainty: {
          code: 'not-computable',
          needed:
            rc === 'PSEUDO_ELEMENT_COLOR'
              ? 'Which words the pseudo-element paints, and whether each colour reaches its ratio there.'
              : 'Which colour forms the letters, and whether it reaches the ratio.',
          evidence: { reasonCode: rc }
        },
        occurrenceOutcome: 'cantTell',
        data: { details }
      };
      const reported =
        typeof helpers.reportOccurrence === 'function'
          ? helpers.reportOccurrence(el, occBase)
          : occBase;
      occurrences.push(reported && typeof reported === 'object' ? reported : occBase);
    } catch {
      // no-throw
    }
  }

  // perf: per-element analysis cache (per run)
  let __elAnalysisCache = new WeakMap();
  if (__contrastSharedCache) {
    try {
      const ANALYSIS_CACHE = '__elAnalysisCacheAA' + SETTINGS_KEY;
      if (!__contrastSharedCache[ANALYSIS_CACHE])
        __contrastSharedCache[ANALYSIS_CACHE] = new WeakMap();
      __elAnalysisCache = __contrastSharedCache[ANALYSIS_CACHE];
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
    const threshold =
      SETTINGS_KEY === ''
        ? helpers.contrast.requiredRatio('AA', font.isLargeText)
        : font.isLargeText
          ? LARGE_TEXT_RATIO
          : NORMAL_TEXT_RATIO;
    if (!(m.ratio < threshold)) {
      // At ratios of its own (a variant's settings), text whose best colour
      // reaches them but not WCAG's AA ratio is one contrast-computable
      // leaves to this rule and this rule can't decide: it asks.
      if (SETTINGS_KEY !== '' && m.ratio < helpers.contrast.requiredRatio('AA', m.isLargeText)) {
        return {
          computable: false,
          ask: {
            reasonCode: blocker.reasonCode,
            ratio: m.ratio,
            threshold,
            fg: m.drawn,
            bg: m.background,
            drawnBy: m.drawnBy,
            blockerProperty: blocker.blockerProperty || '',
            blockerValue: blocker.blockerValue || ''
          }
        };
      }
      return null;
    }
    return {
      computable: true,
      ratio: m.ratio,
      bgAssumptionsApplied:
        Array.isArray(m.bg.assumptionsApplied) && m.bg.assumptionsApplied.length
          ? m.bg.assumptionsApplied.slice(0)
          : null,
      bgAssumedRootCanvasColor:
        typeof m.bg.assumedRootCanvasColor === 'string' ? m.bg.assumedRootCanvasColor : null,
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
    const thresholdFor = (large) =>
      SETTINGS_KEY === ''
        ? helpers.contrast.requiredRatio('AA', large)
        : large
          ? LARGE_TEXT_RATIO
          : NORMAL_TEXT_RATIO;
    const ownFont = getFontInfo(el);
    const pWeight = m.pseudo.fontWeightNum;
    const pLarge =
      BOLD_LARGE_MIN_PX === null
        ? helpers.contrast.isLargeText(m.pseudo.fontSizePx, pWeight)
        : helpers.contrast.isLargeText(m.pseudo.fontSizePx, pWeight, BOLD_LARGE_MIN_PX);
    const pseudoFont = {
      fontSizePx: m.pseudo.fontSizePx,
      fontSizePt: helpers.contrast.pxToPt(m.pseudo.fontSizePx),
      fontWeightNum: pWeight,
      fontWeight: helpers.contrast.fontWeightLabel(pWeight),
      isBold: Number.isFinite(pWeight) && pWeight >= 700,
      isLarge: pLarge,
      isLargeText: pLarge
    };
    const own = { ...m.own, font: ownFont, threshold: thresholdFor(ownFont.isLargeText) };
    const pseudo = { ...m.pseudo, font: pseudoFont, threshold: thresholdFor(pLarge) };
    const ownPasses = own.ratio >= own.threshold;
    if (ownPasses !== pseudo.ratio >= pseudo.threshold) {
      // contrast-computable asks where the colours disagree at WCAG's AA or
      // AAA ratio. Where they disagree only at ratios of this rule's own (a
      // variant's settings), no one else asks, so this rule does.
      if (SETTINGS_KEY === '') return null;
      const agreeAt = (level) =>
        m.own.ratio >= helpers.contrast.requiredRatio(level, m.own.isLargeText) ===
        m.pseudo.ratio >= helpers.contrast.requiredRatio(level, m.pseudo.isLargeText);
      if (!agreeAt('AA') || !agreeAt('AAA')) return null;
      return {
        computable: false,
        ask: { reasonCode: 'PSEUDO_ELEMENT_COLOR', pseudoElement: m.pseudo.pseudo, own, pseudo }
      };
    }
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
    const isLarge =
      BOLD_LARGE_MIN_PX === null
        ? helpers.contrast.isLargeText(m.fontSizePx, weight)
        : helpers.contrast.isLargeText(m.fontSizePx, weight, BOLD_LARGE_MIN_PX);
    const font = {
      fontSizePx: m.fontSizePx,
      fontSizePt: helpers.contrast.pxToPt(m.fontSizePx),
      fontWeightNum: weight,
      fontWeight: helpers.contrast.fontWeightLabel(weight),
      isBold: Number.isFinite(weight) && weight >= 700,
      isLarge,
      isLargeText: isLarge
    };
    const threshold =
      SETTINGS_KEY === ''
        ? helpers.contrast.requiredRatio('AA', isLarge)
        : isLarge
          ? LARGE_TEXT_RATIO
          : NORMAL_TEXT_RATIO;
    return {
      computable: true,
      ratio: m.ratio,
      bgAssumptionsApplied: m.assumptionsApplied,
      bgAssumedRootCanvasColor: m.assumedRootCanvasColor,
      ratioStr: helpers.contrast.round2(m.ratio),
      threshold,
      thresholdStr: `${threshold}`,
      font,
      fgOpaque: m.fg,
      bgOpaque: m.bg
    };
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
        let analysis = pseudo ? generatedAnalysis(el, pseudo) : __elAnalysisCache.get(el);
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
            analysis = outlineOnlyAnalysis(el, blocker) ||
              pseudoColorAnalysis(el, blocker) || { computable: false };
          } else {
            let bg = __elBgCache ? __elBgCache.get(el) : null;
            if (!bg) {
              bg = helpers.contrast.computeEffectiveBackground(el, {
                contrast: { mode, rootCanvasFallback },
                collectStack: false
              });
              // Not computable: contrast-computable asks about this text.
              bg = bg || { ok: false, rgba: null, alpha: 0 };
              if (__elBgCache) __elBgCache.set(el, bg);
            }

            const bgAssumptionsApplied =
              bg && Array.isArray(bg.assumptionsApplied) && bg.assumptionsApplied.length
                ? bg.assumptionsApplied.slice(0)
                : null;
            const bgAssumedRootCanvasColor =
              bg && typeof bg.assumedRootCanvasColor === 'string'
                ? bg.assumedRootCanvasColor
                : null;

            let fg = __elFgCache ? __elFgCache.get(el) : null;
            if (!fg) {
              fg = helpers.contrast.computeEffectiveForeground(el);
              fg = fg || { rgba: null, alpha: 0, opacityProduct: 1 };
              if (__elFgCache) __elFgCache.set(el, fg);
            }

            if (!bg || bg.ok === false || !bg.rgba || !fg || !fg.rgba) {
              analysis = { computable: false };
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
              const threshold =
                SETTINGS_KEY === ''
                  ? helpers.contrast.requiredRatio('AA', font.isLargeText)
                  : font.isLargeText
                    ? LARGE_TEXT_RATIO
                    : NORMAL_TEXT_RATIO;

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
                selectField
              };
            }
          }
          __elAnalysisCache.set(el, analysis);
        }

        // Text this rule asks about itself (outlineOnlyAnalysis,
        // pseudoColorAnalysis): only under ratios of its own.
        if (analysis && analysis.ask && !pseudo) {
          deferredCount += textCount;
          pushAskOccurrence(el, analysis.ask);
          continue;
        }
        if (!analysis || analysis.computable !== true) continue;

        computableTextCount += textCount;

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
          // Logo-like text, a page with a contrast switch, semi-bold text:
          // reported as the settings say (SPECIAL above).
          let special = null;
          if (!placeholder && !symbol && !pseudo) {
            const fw = Number(font.fontWeightNum);
            const px = font.fontSizePx ? parseFloat(font.fontSizePx) : NaN;
            const boldMin = BOLD_LARGE_MIN_PX === null ? 56 / 3 : BOLD_LARGE_MIN_PX;
            if (
              SEMI_BOLD === 'ask' &&
              fw >= 600 &&
              fw < 700 &&
              px >= boldMin &&
              px < 24 &&
              ratio >= LARGE_TEXT_RATIO
            ) {
              special = { kind: 'semiBold', mode: 'ask' };
            } else if (helpers.contrast.looksLikeLogo && helpers.contrast.looksLikeLogo(el)) {
              if (LOGO_TEXT === 'exempt') continue;
              special = { kind: 'logo', mode: LOGO_TEXT };
            } else {
              const switchName = helpers.contrast.contrastSwitchName
                ? helpers.contrast.contrastSwitchName(ctx.document, helpers, ctx)
                : '';
              if (switchName) special = { kind: 'switch', mode: CONTRAST_SWITCH, switchName };
            }
          }
          if (placeholderMode === 'ask' || symbol || (special && special.mode === 'ask'))
            deferredCount += textCount;
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
          const fwLabel = font.fontWeight || (font.isBold ? 'bold' : 'normal');

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
            ...(pseudo ? { generatedBy: pseudo } : {})
          };

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
              summaryKey: 'contrastMinimum_cantTell_engineFailure',
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

  // If there was eligible text but nothing computable, this rule stays notApplicable
  // because Rule 1 (computability) is responsible for cantTell, unless this
  // rule asked about some itself.
  if (computableTextCount === 0 && deferredCount === 0) {
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
            summaryKey: 'contrastMinimum_notApplicable_noComputableText',
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

// The thresholds a variant may change (docs/RULE_AUTHORING.md, "Rule
// variants"), with WCAG 1.4.3's as defaults: the size from which bold text is
// large (null: WCAG's 14pt), and the ratios large and other text need.
const settings = {
  boldLargeMinPx: null,
  largeTextRatio: 3,
  normalTextRatio: 4.5,
  logoText: 'fail',
  contrastSwitch: 'fail',
  semiBold: 'normal'
};

// What each setting changes, for the catalog and docs/RULE_SETTINGS.md.
const settingsInfo = {
  boldLargeMinPx: {
    description:
      "The size, in CSS pixels, from which bold text counts as large and needs only largeTextRatio. null is WCAG's 14pt (about 18.67px).",
    basis: 'WCAG 1.4.3, "large scale" text'
  },
  largeTextRatio: {
    description: 'The contrast ratio large text needs.',
    basis: 'WCAG 1.4.3: 3:1 (1.4.6: 4.5:1)'
  },
  normalTextRatio: {
    description: 'The contrast ratio other text needs.',
    basis: 'WCAG 1.4.3: 4.5:1 (1.4.6: 7:1)'
  },
  logoText: {
    values: ['fail', 'ask', 'exempt'],
    description:
      "Text that looks like part of a logo (an id or class naming a logo, or the site's brand, on the text, up to two levels above it or on its link; or the banner's first link to the home page, holding an image or the site's name) below its ratio: fail, with a hint that logo text is exempt; ask (cantTell, LOGO_TEXT_BELOW_THRESHOLD); or exempt (not reported).",
    basis:
      'WCAG 1.4.3 exception: "Text that is part of a logo or brand name has no contrast requirement"'
  },
  contrastSwitch: {
    values: ['fail', 'ask'],
    description:
      'Text below its ratio on a page with a control that switches to higher contrast (its name holds "contrast", in any of five languages): fail, with a hint naming the switch; or ask (cantTell, CONTRAST_SWITCH_OFFERED).',
    basis: 'WCAG technique G174, a control that switches to sufficient contrast'
  },
  semiBold: {
    values: ['normal', 'ask'],
    description:
      'Text of weight 600 to 699, between the bold large-text size and 24px, that reaches largeTextRatio but not normalTextRatio: normal text, as for any weight under 700; or ask (cantTell, SEMIBOLD_BELOW_THRESHOLD) whether it reads as bold.',
    basis: 'WCAG 1.4.3 "large scale" text: WCAG says bold without a number'
  }
};

module.exports = { id, meta, runInPage, settings, settingsInfo };
