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
  coverage: { facetsBySc: { '1.4.6': ['contrast-enhanced-text'] } }
};

function runInPage(ctx) {
  const { helpers, rule, engineOptions } = ctx;

  function toElement(node) {
    try {
      if (!node) return null;
      if (node.nodeType === 1) return node; // ELEMENT_NODE
      if (node.nodeType === 3) return node.parentElement || null; // TEXT_NODE
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
      if (!el || el.nodeType !== 1) return null;

      // Prefer engine helper (matches checks/engine behavior + may be cached)
      if (helpers && typeof helpers.computedStyle === 'function') {
        const cs = helpers.computedStyle(el);
        if (cs) return cs;
      }

      const view =
        el.ownerDocument && el.ownerDocument.defaultView ? el.ownerDocument.defaultView : null;

      if (view && typeof view.getComputedStyle === 'function') return view.getComputedStyle(el);
    } catch {}
    return null;
  }

  function getFontInfo(el) {
    try {
      if (!el || el.nodeType !== 1) {
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

      const cs = safeComputedStyle(el);
      const fontSizePx = cs ? helpers.contrast.parsePx(cs.fontSize) : null;
      const fontWeightNum = cs ? helpers.contrast.normalizeFontWeight(cs.fontWeight) : 400;

      const sizePx = Number.isFinite(fontSizePx) ? fontSizePx : 0;
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

  const seenFailEls = new Set();

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
            }
          }
        }
      });
    } catch {
      // no-throw
    }
  }

  function pushFailOccurrence(el, params, details) {
    try {
      if (!el || seenFailEls.has(el)) return;
      if (occurrences.length >= MAX_OCCURRENCES) return;

      seenFailEls.add(el);

      const det = details && typeof details === 'object' ? details : { reasonCode: 'UNKNOWN' };

      // The background is the only input this rule can fail to resolve; every other
      // reason code here describes a ratio it did compute.
      const uncertainty =
        det.reasonCode === 'BACKGROUND_NOT_COMPUTABLE'
          ? {
              code: 'not-computable',
              needed: 'The effective background colour behind this text.',
              evidence: { reasonCode: det.reasonCode, foreground: det.fg || null }
            }
          : null;

      const occBase = {
        selector: '',
        html: '',
        summary: '',
        hint: '',
        i18n: {
          summaryKey: 'contrastEnhanced_fail_belowThreshold',
          hintKey: '',
          params: params && typeof params === 'object' ? params : {}
        },
        ...(uncertainty ? { uncertainty } : {}),
        data: { details: det }
      };

      // Bind the occurrence to an element deterministically, but still let the engine
      // attach canonical selector + HTML snippet via reportOccurrence when available.
      let nodeSelector = '';
      try {
        const elementId =
          el && typeof el.getAttribute === 'function' ? el.getAttribute('id') || '' : '';
        if (elementId) nodeSelector = `#${elementId}`;
      } catch {
        // no-throw
      }
      const tagName = el && el.tagName ? String(el.tagName).toLowerCase() : 'element';

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

      occ.selector = occ.selector || nodeSelector || '';

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

  // Walk eligible visible text nodes (counted per text node), but compute expensive analysis once per element.
  if (scan && scan.elements && Array.isArray(scan.elements)) {
    try {
      eligibleTextCount = Number(scan.eligibleTextCount) || 0;

      for (const rec of scan.elements) {
        const el = toElement(rec && rec.el);
        const textCount = rec && Number(rec.textCount) ? Number(rec.textCount) : 0;
        if (!el || textCount <= 0) continue;

        // Computability + contrast analysis (cached per element)
        let analysis = __elAnalysisCache.get(el);
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
            analysis = { computable: false };
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
              const fgOpaque =
                fg.rgba.a != null && fg.rgba.a < 1
                  ? helpers.contrast.compositeRgba(fg.rgba, bg.rgba)
                  : { r: fg.rgba.r, g: fg.rgba.g, b: fg.rgba.b, a: 1 };

              const bgOpaque = { r: bg.rgba.r, g: bg.rgba.g, b: bg.rgba.b, a: 1 };

              const ratio = helpers.contrast.contrastRatio(fgOpaque, bgOpaque);

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
                bgOpaque
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

        if (!(ratio >= threshold)) {
          failCount += textCount;

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
            assumedRootCanvasColor: assumedRootCanvasColor
          };

          pushFailOccurrence(el, params, details);

          if (occurrences.length >= MAX_OCCURRENCES) break;
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
            hint: '',
            html: '',
            i18n: {
              summaryKey: 'contrastEnhanced_cantTell_engineFailure',
              hintKey: '',
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
  if (computableTextCount === 0) {
    return {
      ruleId: rule.ruleId,
      outcome: 'notApplicable',
      severity: rule.defaultSeverity || 'serious',
      confidence: rule.defaultConfidence || 'high',
      occurrences: [
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
      ]
    };
  }

  if (failCount > 0) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'serious',
      confidence: rule.defaultConfidence || 'high',
      occurrences
    };
  }

  // All computable text passed
  if (!occurrences.length) {
    pushPassOccurrence(eligibleTextCount, computableTextCount);
  }

  return {
    ruleId: rule.ruleId,
    outcome: 'pass',
    severity: rule.defaultSeverity || 'serious',
    confidence: rule.defaultConfidence || 'high',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
