/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check avoid-inline-spacing
 * @atomic true
 * @summary Inline style must not force text spacing below the WCAG metric
 * @standard WCAG 2.2
 * @sc 1.4.12
 * @applicability
 *   Applies to a rendered element with visible text of its own whose style
 *   attribute declares line-height, letter-spacing or word-spacing as
 *   `!important` with a real value. A CSS-wide keyword (inherit, initial,
 *   unset, revert) specifies no spacing of its own and is out of scope.
 * @expectation
 *   Each such declaration already meets WCAG 1.4.12's own metric for that
 *   property, as a multiple of the font size: line-height at least 1.5,
 *   letter-spacing at least 0.12, word-spacing at least 0.16. A forced value
 *   that already satisfies the criterion leaves the user nothing to override.
 * @implementation-notes
 * - Computed style resolves the cascade and the units; the declared value is
 *   only a fallback for environments that do not lay the document out. Spacing
 *   that resolves to neither is left unreported rather than failed.
 * - Within one declaration block, importance outranks order, so the effective
 *   declaration is the last `!important` one for that property.
 * - ACT 78fd32/24afc2/9e45ec additionally require the text to contain a soft
 *   wrap break, which layout would settle and this cannot. Two shapes do
 *   establish that no wrap is possible -- text not allowed to wrap, and a
 *   fixed-width element inside a horizontally scrolling ancestor -- and those
 *   are reported for review rather than failed. Anything else is treated as
 *   wrapping, so a forced value on text that never wraps for some other reason
 *   is still reported.
 */

const id = 'avoid-inline-spacing';

const meta = {
  title: 'Inline style must not force text spacing below the WCAG metric',
  description:
    'Checks that where inline style forces line-height, letter-spacing or word-spacing with !important, the value already meets WCAG 1.4.12, so the user has nothing left to override.',
  i18n: {
    titleKey: 'avoidInlineSpacing_title',
    descriptionKey: 'avoidInlineSpacing_description'
  },
  helpUrl: null,
  tags: ['wcag21aa', 'wcag1412', 'structure', 'atomic', 'automatic'],
  wcagSc: ['1.4.12'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.4.12',
      title: 'Text Spacing',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.4.12': ['avoid-inline-spacing'] } }
};

function runInPage(ctx) {
  const { helpers, rule } = ctx;

  const SPACING_PROPS = ['line-height', 'letter-spacing', 'word-spacing'];
  // WCAG 1.4.12's own metrics, as multiples of the font size.
  const MIN_RATIO = { 'line-height': 1.5, 'letter-spacing': 0.12, 'word-spacing': 0.16 };
  // Only these two take the value from the parent, leaving this declaration
  // specifying no spacing of its own. `initial` and `revert` resolve to a
  // concrete value (`normal` for all three properties), so they stay in scope.
  const INHERITED_KEYWORDS = ['inherit', 'unset'];
  // No user agent's `normal` line height reaches 1.5, so a forced `normal`
  // always falls short of the metric.
  const NORMAL_LINE_HEIGHT_RATIO = 1.2;
  const CAMEL = {
    'line-height': 'lineHeight',
    'letter-spacing': 'letterSpacing',
    'word-spacing': 'wordSpacing'
  };

  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart('[style]')
    : helpers.queryAll('[style]');

  const occurrences = [];
  let applicableCount = 0;
  const undecided = [];
  const noWrap = [];

  // Within one declaration block, importance wins over order, so the last
  // important declaration is the one that takes effect. Passed Example 5 of ACT
  // 78fd32 turns on this and Passed Example 6 on the non-important half.
  function effectiveDeclaration(raw, prop) {
    const re = new RegExp('(?:^|;)\\s*' + prop + '\\s*:\\s*([^;]*)', 'gi');
    let chosen = null;
    let m;
    while ((m = re.exec(raw))) {
      const value = String(m[1] || '').trim();
      const important = /!\s*important\s*$/i.test(value);
      const clean = value.replace(/!\s*important\s*$/i, '').trim();
      if (!clean) continue;
      if (!chosen || important || !chosen.important) {
        if (chosen && chosen.important && !important) continue;
        chosen = { value: clean, important };
      }
    }
    return chosen;
  }

  function hasVisibleTextChild(el) {
    let kids;
    try {
      kids = el.childNodes ? Array.from(el.childNodes) : [];
    } catch {
      return false;
    }
    return kids.some((n) => n && n.nodeType === 3 && String(n.nodeValue || '').trim() !== '');
  }

  function isRendered(el) {
    if (helpers.isDomVisibleEligible) {
      try {
        return !!helpers.isDomVisibleEligible(el, ctx, { targetSet: 'dom' }).eligible;
      } catch {
        return true;
      }
    }
    return true;
  }

  const px = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) && /px\s*$/.test(String(v)) ? n : null;
  };

  function computedStyleOf(el) {
    if (helpers && typeof helpers.computedStyle === 'function') {
      try {
        const cs = helpers.computedStyle(el);
        if (cs) return cs;
      } catch {
        // fall through to the realm's own view
      }
    }
    try {
      const view = el.ownerDocument && el.ownerDocument.defaultView;
      if (view && typeof view.getComputedStyle === 'function') return view.getComputedStyle(el);
    } catch {
      // no computed style available
    }
    return null;
  }

  // ACT 78fd32/24afc2/9e45ec apply only to text that contains a soft wrap
  // break. Layout settles that; short of it, two shapes establish that no wrap
  // can happen -- text not allowed to wrap, and a fixed-width element inside a
  // horizontally scrolling ancestor, which narrowing the viewport cannot reach.
  function cannotSoftWrap(el) {
    const cs = computedStyleOf(el);
    const whiteSpace = cs ? String(cs.whiteSpace || '').toLowerCase() : '';
    if (whiteSpace === 'nowrap' || whiteSpace === 'pre') return true;

    if (!/(^|;)\s*width\s*:/i.test(String(el.getAttribute('style') || ''))) return false;

    const chain =
      helpers && typeof helpers.ancestorsIncludingSelf === 'function'
        ? helpers.ancestorsIncludingSelf(el)
        : null;
    const ancestors = chain || [];
    if (!chain) {
      for (let a = el.parentElement; a; a = a.parentElement) ancestors.push(a);
    }

    for (const ancestor of ancestors) {
      if (ancestor === el) continue;
      const acs = computedStyleOf(ancestor);
      if (!acs) continue;
      const overflowX = String(acs.overflowX || acs.overflow || '').toLowerCase();
      if (overflowX === 'scroll' || overflowX === 'auto') return true;
    }
    return false;
  }

  // ACT scopes these rules to text visible on screen, and text pushed far off
  // canvas is the one hidden shape the shared eligibility check keeps eligible.
  function isOffScreen(el) {
    if (!helpers.getVisibilityHintsInfo) return false;
    try {
      const info = helpers.getVisibilityHintsInfo(el, ctx, {});
      return !!(info && Array.isArray(info.hints) && info.hints.indexOf('offscreen') !== -1);
    } catch {
      return false;
    }
  }

  // A realm that does not lay the document out reports font-size as the CSS
  // absolute-size keyword rather than a length. Resolving those keeps px-valued
  // spacing checkable there, and cannot manufacture a failure: a font size
  // larger than assumed only makes a px ratio smaller.
  const ABSOLUTE_FONT_SIZES = {
    'xx-small': 9,
    'x-small': 10,
    small: 13,
    medium: 16,
    large: 18,
    'x-large': 24,
    'xx-large': 32
  };

  function fontSizeOf(cs) {
    if (!cs) return null;
    const direct = px(cs.fontSize);
    if (direct !== null) return direct;
    const keyword = String(cs.fontSize || '')
      .trim()
      .toLowerCase();
    return ABSOLUTE_FONT_SIZES[keyword] || null;
  }

  /**
   * The spacing as a multiple of the font size, or null when it cannot be
   * resolved. Computed style is preferred because it already applies the
   * cascade and unit resolution; the declared value is only a fallback for
   * environments that do not lay the document out.
   */
  function spacingRatio(el, prop, declared) {
    const cs = computedStyleOf(el);
    const fontSize = fontSizeOf(cs);
    if (cs && fontSize) {
      const used = px(cs[CAMEL[prop]]);
      if (used !== null) return used / fontSize;
    }

    const v = String(declared || '')
      .trim()
      .toLowerCase();
    // `normal`, and the keywords that resolve to it, add nothing for the two
    // spacing properties and stay under the metric for line height.
    if (v === 'normal' || v === 'initial' || v === 'revert' || v === 'revert-layer') {
      return prop === 'line-height' ? NORMAL_LINE_HEIGHT_RATIO : 0;
    }
    if (/^[0-9.]+$/.test(v)) return parseFloat(v);
    if (/em$/.test(v)) return parseFloat(v);
    if (/%$/.test(v)) return parseFloat(v) / 100;
    const asPx = px(v);
    if (asPx !== null && fontSize) return asPx / fontSize;
    return null;
  }

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;
    const raw = String(el.getAttribute('style') || '');
    if (!raw.trim()) continue;

    const lower = raw.toLowerCase();
    const hasAnySpacingProp = SPACING_PROPS.some((p) => lower.includes(p));
    if (!hasAnySpacingProp) continue;

    // The rule is about text the user needs to re-space, so an element with no
    // text of its own, or none that renders, is not a target.
    if (!hasVisibleTextChild(el) || !isRendered(el) || isOffScreen(el)) continue;

    const flagged = [];
    const unresolved = [];
    let inScope = false;
    for (const prop of SPACING_PROPS) {
      const decl = effectiveDeclaration(raw, prop);
      if (!decl || !decl.important) continue;
      if (INHERITED_KEYWORDS.indexOf(decl.value.toLowerCase()) !== -1) continue;
      inScope = true;
      const ratio = spacingRatio(el, prop, decl.value);
      // Not flagged, since `fail` needs a measured value -- but recorded, so
      // the element does not fall through to `pass` unmeasured.
      if (ratio === null) {
        unresolved.push(prop);
        continue;
      }
      if (ratio < MIN_RATIO[prop]) flagged.push(prop);
    }

    if (inScope) applicableCount += 1;
    if (!flagged.length) {
      if (unresolved.length) undecided.push({ el, props: unresolved.slice() });
      continue;
    }

    // A forced value on text that cannot wrap is outside these ACT rules'
    // applicability, and whether it wraps is not decidable here, so it is
    // reported for review rather than failed.
    if (cannotSoftWrap(el)) {
      noWrap.push({ el, props: flagged.slice() });
      continue;
    }

    const tag = el.tagName.toLowerCase();

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary: `This element's inline style forces ${flagged.join(', ')} with !important below the WCAG text-spacing metric, so the user cannot raise it.`,
        hint: 'Remove !important from line-height/letter-spacing/word-spacing in inline styles, or set a value that already meets the metric (line-height 1.5, letter-spacing 0.12em, word-spacing 0.16em).',
        i18n: {
          summaryKey: 'avoidInlineSpacing_summary_fail',
          hintKey: 'avoidInlineSpacing_hint_fail',
          params: { element: tag, properties: flagged.join(', ') }
        },
        data: {
          details: { reasonCode: 'INLINE_SPACING_IMPORTANT', element: tag, properties: flagged }
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
      outcome: 'fail',
      severity: rule.defaultSeverity || 'moderate',
      occurrences
    };
  }
  if (noWrap.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'moderate',
      confidence: 'low',
      occurrences: noWrap.map(({ el, props }) =>
        helpers.reportOccurrence(el, {
          summary: `This element's inline style forces ${props.join(', ')} with !important, but its text does not appear able to wrap, so the text-spacing criterion may not apply to it.`,
          hint: 'Confirm whether this text ever wraps. If it cannot, the criterion does not apply; if it can, remove !important or set a value that already meets the metric.',
          i18n: {
            summaryKey: 'avoidInlineSpacing_summary_cantTell_noSoftWrap',
            hintKey: 'avoidInlineSpacing_hint_cantTell_noSoftWrap',
            params: {
              element: (el.tagName || '').toLowerCase(),
              properties: props.join(', ')
            }
          },
          uncertainty: {
            code: 'not-computable',
            needed: 'Whether this text ever contains a soft wrap break, which needs layout.',
            evidence: {
              element: (el.tagName || '').toLowerCase(),
              properties: props,
              reasonCode: 'INLINE_SPACING_NO_SOFT_WRAP'
            }
          },
          data: {
            details: {
              reasonCode: 'INLINE_SPACING_NO_SOFT_WRAP',
              element: (el.tagName || '').toLowerCase(),
              properties: props
            }
          }
        })
      )
    };
  }
  if (undecided.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'moderate',
      confidence: 'low',
      occurrences: undecided.map(({ el, props }) =>
        helpers.reportOccurrence(el, {
          summary: `This element's inline style sets ${props.join(', ')} with !important, but the value could not be resolved, so whether it meets the WCAG text-spacing metric could not be determined.`,
          hint: 'Check this value by hand against the metric (line-height 1.5, letter-spacing 0.12em, word-spacing 0.16em), or express it in a unit the engine can resolve against the element’s computed font size.',
          i18n: {
            summaryKey: 'avoidInlineSpacing_summary_cantTell',
            hintKey: 'avoidInlineSpacing_hint_cantTell',
            params: {
              element: (el.tagName || '').toLowerCase(),
              properties: props.join(', ')
            }
          },
          uncertainty: {
            code: 'not-computable',
            needed: 'A resolved value for the spacing declarations marked !important.',
            evidence: {
              element: (el.tagName || '').toLowerCase(),
              properties: props,
              reasonCode: 'INLINE_SPACING_NOT_RESOLVABLE'
            }
          },
          data: {
            details: {
              reasonCode: 'INLINE_SPACING_NOT_RESOLVABLE',
              element: (el.tagName || '').toLowerCase(),
              properties: props
            }
          }
        })
      )
    };
  }
  return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
