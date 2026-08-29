/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check link-in-text-block
 * @atomic true
 * @summary Links surrounded by text must be distinguishable from that text by non-color means
 * @standard WCAG 2.2
 * @sc 1.4.1
 * @applicability
 *   Applies to <a href> elements whose immediate parent element also has
 *   at least one direct-child text node with non-whitespace content
 *   (i.e. the link sits inline within a run of plain text, not as a
 *   standalone item, e.g. not the sole content of a <li> nav item).
 * @expectation
 *   A link inside a text block must be visually distinguishable from the
 *   surrounding text by at least one non-color means:
 *     - text-decoration: underline, OR
 *     - a different font-weight than the surrounding text, OR
 *     - a different font-style than the surrounding text, OR
 *     - a contrast ratio of at least 3:1 between the link's text color and
 *       the surrounding text's color (WCAG technique G183's threshold,
 *       sufficient contrast alone is an accepted alternative to underline).
 *   Fails only when none of the above hold AND the color contrast between
 *   link and surrounding text is confidently computable and below 3:1,
 *   i.e. color is demonstrably the only cue.
 * @implementation-notes
 * - "Surrounding text style" is approximated as the link's immediate
 *   parent element's own computed style, not a full inline-context walk
 *   of the actual adjacent text node(s), a deliberate scope-down, since
 *   plain text nodes inherit their rendering from the parent in the
 *   overwhelming majority of real markup.
 * - A candidate that cannot be evaluated reports cantTell, not pass:
 *   contrast not confidently computable (the blockers `contrast-minimum`/
 *   `contrast-computable` use), or `text-decoration` unreadable in both
 *   the computed style and the CSSOM (see `decorationInfo`). `fail` stays
 *   reserved for deterministic violations; this is the computability gate
 *   RULE_TAXONOMY.md §1.1 allows automatic rules, as in `contrast-minimum`
 *   and `target-size-minimum`.
 * - Reuses the shared `helpers.contrast` subsystem (same
 *   computeEffectiveForeground/Background, getComputabilityBlocker,
 *   contrastRatio helpers as `contrast-minimum`), rather than re-deriving
 *   color math independently.
 * - Scoped to `a[href]` only (not `area[href]` or `[role="link"]`),
 *   matches the common real-world shape of this issue (prose links).
 */

const id = 'link-in-text-block';

const meta = {
  title:
    'Links in text blocks must be distinguishable from surrounding text without relying on color alone',
  description:
    'Checks that a link inside a run of text is visually distinguishable from the surrounding text by underline, a font-weight/style difference, or a sufficient (>=3:1) color-contrast difference, not by color alone.',
  i18n: {
    titleKey: 'linkInTextBlock_title',
    descriptionKey: 'linkInTextBlock_description'
  },
  helpUrl: null,
  tags: [
    'wcag2a',
    'wcag141',
    'navigation',
    'color',
    'links',
    'contrast',
    'atomic',
    'automatic',
    'dom'
  ],
  wcagSc: ['1.4.1'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.4.1',
      title: 'Use of Color',
      conformanceLevel: 'A'
    }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.4.1': ['link-in-text-block'] } }
};

function runInPage(ctx) {
  const { helpers, rule, engineOptions } = ctx;

  function safeComputedStyle(el) {
    try {
      if (!el || el.nodeType !== 1) return null;
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

  // Whether the element is underlined, and whether the computed style can be
  // trusted to say so. A conforming CSSOM serialises the `text-decoration`
  // shorthand with the line value first, so it and `text-decoration-line`
  // always agree on whether `underline` is present. jsdom does not cascade
  // the property at all: the shorthand reads back as the UA's "underline"
  // for every <a> whatever the author CSS says, and the longhand as "none"
  // unless the author used the longhand. Either one taken alone is wrong in
  // one direction, so disagreement is the signal to stop trusting both.
  function decorationInfo(cs) {
    if (!cs) return { underlined: false, trustworthy: false };

    const lineRaw = String(cs.textDecorationLine || '')
      .trim()
      .toLowerCase();
    const shortRaw = String(cs.textDecoration || '')
      .trim()
      .toLowerCase();

    const lineTokens = lineRaw.split(/\s+/).filter(Boolean);
    const shortTokens = shortRaw.split(/\s+/).filter(Boolean);

    // Only one of the two exposed: nothing to cross-check against, take it.
    if (!lineTokens.length) {
      return { underlined: shortTokens.includes('underline'), trustworthy: shortTokens.length > 0 };
    }
    if (!shortTokens.length) {
      return { underlined: lineTokens.includes('underline'), trustworthy: true };
    }

    const byLine = lineTokens.includes('underline');
    const byShort = shortTokens.includes('underline');
    return { underlined: byLine, trustworthy: byLine === byShort };
  }

  // Resolves `text-decoration` from the author stylesheets when the computed
  // style is untrustworthy, reading the CSSOM as `css-orientation-lock` and
  // `css-focus-indicator-suppressed` do. Without it the rule could not decide
  // anything under a DOM emulator, which is how the CLI scans static HTML.
  //
  // A narrow cascade is enough: `text-decoration-line` is not inherited, so
  // only declarations matching the element itself and its inline style apply,
  // ordered by specificity. With no author declaration the UA default stands,
  // and for a link that is an underline. Anything that would make the answer a
  // guess yields `resolved: false` and the caller reports cantTell.
  const CSS_STYLE_RULE = 1;
  const MAX_NESTED_DEPTH = 8;

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

  // Approximate CSS specificity as a single sortable integer. Exactness is
  // not required: this only orders declarations of one property against each
  // other, and near-ties are broken by document order as the cascade does.
  function specificityOf(selector) {
    const s = String(selector || '');
    const ids = (s.match(/#[\w-]+/g) || []).length;
    const classesEtc = (s.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) || []).length;
    const types = (s.match(/(^|[\s>+~])[a-z][\w-]*/gi) || []).length;
    return ids * 10000 + classesEtc * 100 + types;
  }

  // A declaration wins if it is the last one, in (specificity, order), whose
  // selector matches. `!important` outranks everything non-important.
  function underlineFromDeclaration(style) {
    if (!style || typeof style.getPropertyValue !== 'function') return null;
    for (const prop of ['text-decoration-line', 'text-decoration']) {
      const raw = String(style.getPropertyValue(prop) || '')
        .trim()
        .toLowerCase();
      if (!raw) continue;
      const important = String(style.getPropertyPriority(prop) || '') === 'important';
      return { underlined: /\bunderline\b/.test(raw), important };
    }
    return null;
  }

  function resolveUnderlineFromCssom(el) {
    const doc = el && el.ownerDocument ? el.ownerDocument : null;
    if (!doc || typeof el.matches !== 'function') return { underlined: false, resolved: false };

    let best = null; // { rank, order, underlined }
    let order = 0;
    let unreadableSheet = false;
    let unparsableSelector = false;

    function consider(cssRule) {
      const decl = underlineFromDeclaration(cssRule.style);
      if (!decl) return;
      for (const part of splitSelectorList(cssRule.selectorText)) {
        // A pseudo-element rule paints a box other than the link's own text.
        if (/::[a-z-]+/i.test(part)) continue;
        // A state the static DOM is not in (:hover/:focus/...) does not
        // describe the link's resting appearance, which is what this rule is
        // about.
        if (/:(hover|focus|focus-visible|focus-within|active|target|visited)\b/i.test(part)) {
          continue;
        }
        let matched;
        try {
          matched = el.matches(part);
        } catch {
          unparsableSelector = true;
          continue;
        }
        if (!matched) continue;
        order += 1;
        const rank = (decl.important ? 1e9 : 0) + specificityOf(part);
        if (!best || rank >= best.rank) best = { rank, order, underlined: decl.underlined };
      }
    }

    function walk(rules, depth) {
      if (!rules || depth > MAX_NESTED_DEPTH) return;
      for (const cssRule of rules) {
        if (!cssRule) continue;
        if (cssRule.type === CSS_STYLE_RULE && cssRule.selectorText) {
          consider(cssRule);
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
      for (const sheet of doc.styleSheets || []) {
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
      return { underlined: false, resolved: false };
    }

    // The inline style attribute outranks every stylesheet declaration.
    const inline = underlineFromDeclaration(el.style);
    if (inline) return { underlined: inline.underlined, resolved: true };

    if (best) return { underlined: best.underlined, resolved: true };

    // No author declaration reached this element. If a sheet or selector was
    // unreadable, one of them might have, so the answer is unknown; otherwise
    // the UA default stands, and for a link that means underlined.
    if (unreadableSheet || unparsableSelector) return { underlined: false, resolved: false };
    return { underlined: true, resolved: true };
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

  const contrastOpts =
    engineOptions && typeof engineOptions.contrast === 'object' && engineOptions.contrast
      ? engineOptions.contrast
      : {};
  const mode = contrastOpts.mode === 'auditorAssist' ? 'auditorAssist' : 'strictConformance';
  const rootCanvasFallback =
    typeof contrastOpts.rootCanvasFallback === 'string' && contrastOpts.rootCanvasFallback.trim()
      ? contrastOpts.rootCanvasFallback.trim()
      : '#ffffff';

  const c = helpers && helpers.contrast ? helpers.contrast : null;

  const selector = 'a[href]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  const occurrences = [];
  const undecided = [];
  let applicableCount = 0;
  let decidedCount = 0;

  // Applicable, but not evaluable. Held separately so the outcome below can
  // tell "checked and sound" apart from "never decided".
  function markUndecided(el, reasonCode) {
    undecided.push({ el, reasonCode });
  }

  for (const el of nodes) {
    if (!el || !el.getAttribute) continue;

    const eligResult = helpers.isAccTreeEligible ? helpers.isAccTreeEligible(el, ctx) : true;
    const eligible =
      typeof eligResult === 'boolean' ? eligResult : !!(eligResult && eligResult.eligible);
    if (!eligible) continue;

    const parent = el.parentElement;
    if (!hasSurroundingText(el, parent)) continue;

    applicableCount += 1;

    const linkCs = safeComputedStyle(el);
    const parentCs = safeComputedStyle(parent);

    // Cues that do not depend on `text-decoration` come first, so a link
    // carrying one is decided even where decoration is unreadable.
    const linkWeight = c && linkCs ? c.normalizeFontWeight(linkCs.fontWeight) : 400;
    const parentWeight = c && parentCs ? c.normalizeFontWeight(parentCs.fontWeight) : 400;
    if (linkWeight !== parentWeight) {
      decidedCount += 1;
      continue;
    }

    const linkStyle = (linkCs && linkCs.fontStyle) || 'normal';
    const parentStyle = (parentCs && parentCs.fontStyle) || 'normal';
    if (linkStyle !== parentStyle) {
      decidedCount += 1;
      continue;
    }

    if (!c) {
      markUndecided(el, 'CONTRAST_HELPERS_UNAVAILABLE');
      continue;
    }

    let flagged = false;
    let computed = false;
    let ratio = null;
    let fgLinkHex = '';
    let fgParentHex = '';
    let undecidedReason = 'COLOR_NOT_COMPUTABLE';

    try {
      const blocker = c.getComputabilityBlocker(el);
      if (blocker && blocker.ok === false) {
        // Not confidently computable: recorded below rather than skipped, so
        // it cannot be mistaken for a clean result.
        if (blocker.reasonCode) undecidedReason = String(blocker.reasonCode);
      } else {
        const bg = c.computeEffectiveBackground(el, {
          contrast: { mode, rootCanvasFallback },
          collectStack: false
        });
        const fgLink = c.computeEffectiveForeground(el);
        const fgParent = c.computeEffectiveForeground(parent);

        if (bg && bg.ok && bg.rgba && fgLink && fgLink.rgba && fgParent && fgParent.rgba) {
          const fgLinkOpaque =
            fgLink.rgba.a < 1
              ? c.compositeRgba(fgLink.rgba, bg.rgba)
              : { r: fgLink.rgba.r, g: fgLink.rgba.g, b: fgLink.rgba.b, a: 1 };
          const fgParentOpaque =
            fgParent.rgba.a < 1
              ? c.compositeRgba(fgParent.rgba, bg.rgba)
              : { r: fgParent.rgba.r, g: fgParent.rgba.g, b: fgParent.rgba.b, a: 1 };

          ratio = c.contrastRatio(fgLinkOpaque, fgParentOpaque);
          fgLinkHex = c.rgbToHex ? c.rgbToHex(fgLinkOpaque) : '';
          fgParentHex = c.rgbToHex ? c.rgbToHex(fgParentOpaque) : '';

          computed = true;
          if (!(ratio >= 3)) flagged = true;
        }
        // else: not confidently computable, recorded below.
      }
    } catch {
      // No-throw: treat as not computable and record it.
      undecidedReason = 'ENGINE_EXCEPTION';
    }

    if (!computed) {
      markUndecided(el, undecidedReason);
      continue;
    }

    // Contrast alone is an accepted alternative to an underline (G183), so a
    // link clearing 3:1 is distinguishable regardless of decoration.
    if (!flagged) {
      decidedCount += 1;
      continue;
    }

    // Below 3:1, an underline is the last remaining cue -- and only now does
    // it matter whether this environment can actually report one.
    const decoration = decorationInfo(linkCs);
    let underlined;
    if (decoration.trustworthy) {
      underlined = decoration.underlined;
    } else {
      const fromCssom = resolveUnderlineFromCssom(el);
      if (!fromCssom.resolved) {
        markUndecided(el, 'TEXT_DECORATION_NOT_RESOLVABLE');
        continue;
      }
      underlined = fromCssom.underlined;
    }

    if (underlined) {
      decidedCount += 1;
      continue;
    }

    decidedCount += 1;

    const eligInfo = helpers.getEligibilityInfo
      ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
      : null;
    const tag = (el.tagName || '').toLowerCase();
    const ratioStr = c.round2 ? c.round2(ratio) : String(ratio);

    occurrences.push(
      helpers.reportOccurrence(el, {
        summary:
          'This link in a block of text relies on color alone to be distinguished from the surrounding text.',
        hint: 'Add an underline, a font-weight/style difference, or increase the color contrast between the link and surrounding text to at least 3:1.',
        i18n: {
          summaryKey: 'linkInTextBlock_summary_fail',
          hintKey: 'linkInTextBlock_hint_fail',
          params: { element: tag, ratio: String(ratioStr), threshold: '3' }
        },
        data: {
          visibilityFilter: eligInfo || { targetSet: 'acc', accEligible: null, reasons: [] },
          details: {
            reasonCode: 'COLOR_ONLY_DIFFERENTIATION',
            metrics: { ratio, threshold: 3 },
            colors: { linkForegroundHex: fgLinkHex, surroundingTextForegroundHex: fgParentHex }
          }
        }
      })
    );
  }

  if (applicableCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  // A proven violation outranks an undecided candidate, which outranks a clean
  // one. The middle step keeps an unevaluable link out of `pass`.
  if (occurrences.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'fail',
      severity: rule.defaultSeverity || 'serious',
      occurrences
    };
  }

  if (undecided.length) {
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'serious',
      confidence: 'low',
      occurrences: undecided.map(({ el, reasonCode }) =>
        helpers.reportOccurrence(el, {
          summary:
            'Whether this link is distinguishable from the surrounding text by non-color means could not be determined.',
          hint: 'Confirm by eye that the link carries an underline, a font-weight or font-style difference, or at least 3:1 contrast against the surrounding text. Running the engine in a real browser rather than a DOM emulator resolves most cases automatically.',
          i18n: {
            summaryKey: 'linkInTextBlock_summary_cantTell',
            hintKey: 'linkInTextBlock_hint_cantTell'
          },
          uncertainty: {
            code: 'not-computable',
            needed:
              'Whether the link carries an underline, weight or style difference, or 3:1 contrast against its surrounding text.',
            evidence: { reasonCode }
          },
          data: {
            visibilityFilter: helpers.getEligibilityInfo
              ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
              : { targetSet: 'acc', accEligible: null, reasons: [] },
            details: { reasonCode }
          }
        })
      )
    };
  }

  if (decidedCount > 0) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
