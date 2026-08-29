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
 *   the value attribute and so is invisible to a text-node walk. Text counts
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
 *   a background image or gradient, mix-blend-mode, a filter or
 *   backdrop-filter, a text-shadow (which may add contrast this engine has
 *   no glyph-rendering model to account for), ancestor opacity, a root
 *   background that never becomes opaque, or a color that does not parse,
 *   the result is cantTell naming the blocker. This rule is the one that
 *   reports that uncertainty, which is what lets contrast-minimum and
 *   contrast-enhanced stay silent on the same text instead of guessing at
 *   a ratio.
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
  }
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

  function pushCantTellOccurrence(el, reasonCode, extraDetails) {
    try {
      if (!el || seenFailEls.has(el)) return;
      if (occurrences.length >= MAX_OCCURRENCES) return;
      seenFailEls.add(el);

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

      const details = Object.assign(
        { reasonCode: rc },
        extraDetails && typeof extraDetails === 'object' ? extraDetails : {}
      );

      const occBase = {
        selector: '',
        html: '',
        summary: '',
        hint: '',
        i18n: {
          summaryKey,
          hintKey: '',
          params: Object.assign(
            { reasonCode: rc },
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
              bg && typeof bg.alpha === 'number' ? helpers.contrast.round2(bg.alpha) : ''
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
            hint: '',
            html: '',
            i18n: {
              summaryKey: 'contrastComputable_cantTell_engineFailure',
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
    occurrences: [
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
    ]
  };
}

module.exports = { id, meta, runInPage };
