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
 *   Text whose fill draws nothing (transparent, or the colour of its
 *   background), drawn only by a -webkit-text-stroke or a text-shadow, is
 *   left to contrast-computable, except where every colour it is drawn in
 *   is below the ratio against a flat background: no reading of it can then
 *   meet the criterion, and it fails, measured by the best of those colours
 *   (`drawnBy`: `textStroke` or `textShadow`).
 *   Margin (`contrast-ratio`): of the text that reaches its ratio, the
 *   element closest to it, with the ratio unrounded against the one its size
 *   requires; `context.largeText` says which. Only text within 10% of its
 *   ratio counts as close, so text further above it gives no margin.
 *   `measuredCount` counts the elements whose contrast was computed.
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
 *     transform scale. This is the size the large-text threshold is judged
 *     on, as WCAG's "size when the content is delivered".
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
 * @implementation-notes
 * - Its thresholds are settings (`settings` below), so another standard's
 *   contrast requirement is a variant of this rule rather than a copy
 *   (docs/RULE_AUTHORING.md, "Rule variants"). Without settings it is WCAG's.
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
  margin: { measure: 'contrast-ratio', unit: 'ratio', limit: 'min', band: { relative: 0.1 } }
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

      // The size as drawn: CSS zoom and an SVG viewBox scale the text the
      // page delivers (helpers.contrast.renderedTextScale).
      const scale =
        typeof helpers.contrast.renderedTextScale === 'function'
          ? helpers.contrast.renderedTextScale(el)
          : 1;
      const sizePx = Number.isFinite(fontSizePx) ? fontSizePx * scale : 0;
      const isBold = Number.isFinite(fontWeightNum) && fontWeightNum >= 700;
      const isLarge =
        BOLD_LARGE_MIN_PX === null
          ? helpers.contrast.isLargeText(sizePx, fontWeightNum)
          : helpers.contrast.isLargeText(sizePx, fontWeightNum, BOLD_LARGE_MIN_PX);

      const out = {
        fontSizePx: sizePx,
        fontSizePt: helpers.contrast.pxToPt(sizePx),
        fontWeightNum,
        fontWeight: helpers.contrast.fontWeightLabel(fontWeightNum),
        isBold,
        isLarge,
        isLargeText: isLarge
      };

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
  // as in other engines, with a hint that says why they might not be: WCAG
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

      // The background is the only input this rule can fail to resolve; every other
      // reason code here describes a ratio it did compute.
      const uncertainty =
        det.reasonCode === 'BACKGROUND_NOT_COMPUTABLE'
          ? {
              code: 'not-computable',
              needed: 'The effective background colour behind this text.',
              evidence: { reasonCode: det.reasonCode, foreground: det.fg || null }
            }
          : placeholder === 'ask'
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

  // Text drawn only by a stroke or a shadow, whose fill draws nothing: the
  // computability gate asks about it (TEXT_STROKE, TEXT_SHADOW), but where
  // even the best colour it is drawn in is below the ratio against a flat
  // background, no reading of it meets the criterion, so it is measured by
  // that colour (helpers.contrast.measureOutlineOnlyText).
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
      ratioStr: helpers.contrast.round2(m.ratio),
      threshold,
      thresholdStr: `${threshold}`,
      font,
      fgOpaque: m.drawn,
      bgOpaque: m.background,
      drawnBy: m.drawnBy
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
            analysis = outlineOnlyAnalysis(el, blocker) || { computable: false };
          } else {
            let bg = __elBgCache ? __elBgCache.get(el) : null;
            if (!bg) {
              bg = helpers.contrast.computeEffectiveBackground(el, {
                contrast: { mode, rootCanvasFallback },
                collectStack: false
              });
              bg = bg || {
                ok: false,
                reasonCode: 'BACKGROUND_NOT_COMPUTABLE',
                rgba: null,
                alpha: 0
              };
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
            isLargeText: font.isLargeText
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
              isLargeText: !!font.isLargeText
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
  // because Rule 1 (computability) is responsible for cantTell.
  if (computableTextCount === 0) {
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
      'Text of weight 600 to 699, between the bold large-text size and 24px, that reaches largeTextRatio but not normalTextRatio: normal text, as for any weight under 700 (axe and Alfa count bold from 700); or ask (cantTell, SEMIBOLD_BELOW_THRESHOLD) whether it reads as bold.',
    basis: 'WCAG 1.4.3 "large scale" text: WCAG says bold without a number'
  }
};

module.exports = { id, meta, runInPage, settings, settingsInfo };
