/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check link-in-text-block
 * @atomic true
 * @summary Links surrounded by text must be distinguishable from that text by non-color means
 * @standard WCAG 2.2
 * @sc 1.4.1
 * @applicability
 *   Applies to links (`<a href>` and elements with `role="link"`) whose
 *   immediate parent element also has at least one direct-child text node
 *   with non-whitespace content (i.e. the link sits inline within a run of
 *   plain text, not as a standalone item, e.g. not the sole content of a
 *   <li> nav item).
 * @expectation
 *   A link inside a text block must be visually distinguishable from the
 *   surrounding text by at least one non-color means:
 *     - text-decoration: underline, OR
 *     - a different font-weight or font-style than the surrounding text, OR
 *     - another visible mark on the link itself: a border, box-shadow or
 *       outline, a background color different from the surrounding one, a
 *       background image, an image or svg inside it, or ::before/::after
 *       content.
 *   A link with none of these is distinguished by color alone. When its
 *   color contrasts with the surrounding text by at least 3:1, technique
 *   G183 is met only if hover and focus also bring a non-color cue, which
 *   a static scan cannot see, so the link is reported as cantTell. Below
 *   3:1, with contrast confidently computable, color is demonstrably the
 *   only cue and the link fails.
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
 * - ::before/::after content is read from the CSSOM only (a DOM emulator
 *   does not compute pseudo-element styles), so content declared in a
 *   cross-origin stylesheet is not seen.
 * - Only the resting state is evaluated. The :hover, :focus and :visited
 *   states are not.
 */

const id = 'link-in-text-block';

const meta = {
  title:
    'Links in text blocks must be distinguishable from surrounding text without relying on color alone',
  description:
    'Checks that a link inside a run of text is visually distinguishable from the surrounding text by a non-color cue (underline, font-weight or style, border, background, icon), and asks about links distinguished only by a >=3:1 color difference, which also need a hover and focus cue.',
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

  // The user agent underlines `a[href]`; an element with role="link" has no
  // default decoration.
  function uaUnderlines(el) {
    return (
      String(el.localName || '').toLowerCase() === 'a' &&
      typeof el.hasAttribute === 'function' &&
      el.hasAttribute('href')
    );
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
    return { underlined: uaUnderlines(el), resolved: true };
  }

  // ---- Non-color cues on the link itself ----
  const LINE_STYLES = /^(solid|dashed|dotted|double|groove|ridge|inset|outset|auto)$/;

  function isZeroWidth(v) {
    return /^0(\.0+)?[a-z%]*$/i.test(String(v || '').trim());
  }

  function hasBorder(cs) {
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
      const style = String(cs['border' + side + 'Style'] || '')
        .trim()
        .toLowerCase();
      if (!style || style === 'none' || style === 'hidden') continue;
      if (!isZeroWidth(cs['border' + side + 'Width'])) return true;
    }
    return false;
  }

  // Some environments do not expand the `outline` shorthand into its
  // longhands, so it is read too.
  function hasOutline(cs) {
    const style = String(cs.outlineStyle || '')
      .trim()
      .toLowerCase();
    if (style && style !== 'none' && style !== 'hidden') return !isZeroWidth(cs.outlineWidth);
    const tokens = String((cs.getPropertyValue && cs.getPropertyValue('outline')) || '')
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    return tokens.some((t) => LINE_STYLES.test(t)) && !tokens.some((t) => isZeroWidth(t));
  }

  function hasBoxShadow(cs) {
    const v = String(cs.boxShadow || '')
      .trim()
      .toLowerCase();
    return !!v && v !== 'none';
  }

  function hasBackgroundImage(cs) {
    const v = String(cs.backgroundImage || '')
      .trim()
      .toLowerCase();
    return !!v && v !== 'none';
  }

  function hasVisibleImageChild(el) {
    let imgs;
    try {
      imgs = Array.from(el.querySelectorAll('img, svg, picture, canvas, [role="img"]'));
    } catch {
      return false;
    }
    return imgs.some((img) => {
      if (!helpers.isDomVisibleEligible) return true;
      try {
        const vis = helpers.isDomVisibleEligible(img, ctx, {
          visibilityMode: 'styleOnly',
          disableGeometry: true
        });
        return !(vis && vis.eligible === false);
      } catch {
        return true;
      }
    });
  }

  const EMPTY_CONTENT = ['', 'none', 'normal', '""', "''"];
  let pseudoContentRules = null;
  // Style rules that put content in a ::before/::after box, by the selector
  // of the element that box belongs to.
  function getPseudoContentRules(doc) {
    if (pseudoContentRules) return pseudoContentRules;
    pseudoContentRules = [];
    function consider(cssRule) {
      const style = cssRule.style;
      if (!style || typeof style.getPropertyValue !== 'function') return;
      const content = String(style.getPropertyValue('content') || '').trim();
      if (EMPTY_CONTENT.indexOf(content.toLowerCase()) !== -1) return;
      for (const part of splitSelectorList(cssRule.selectorText)) {
        if (!/::?(before|after)\s*$/i.test(part)) continue;
        if (/:(hover|focus|focus-visible|focus-within|active|target|visited)\b/i.test(part)) {
          continue;
        }
        pseudoContentRules.push(part.replace(/::?(before|after)\s*$/i, '').trim() || '*');
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
      for (const sheet of (doc && doc.styleSheets) || []) {
        let rules = null;
        try {
          rules = sheet && sheet.cssRules ? sheet.cssRules : null;
        } catch {
          continue; // cross-origin, not inspectable
        }
        if (rules) walk(rules, 0);
      }
    } catch {
      // no readable stylesheets
    }
    return pseudoContentRules;
  }

  function hasPseudoContent(el) {
    return getPseudoContentRules(el.ownerDocument).some((base) => {
      try {
        return el.matches(base);
      } catch {
        return false;
      }
    });
  }

  function hasNonColorMark(el, cs) {
    if (cs && (hasBorder(cs) || hasOutline(cs) || hasBoxShadow(cs) || hasBackgroundImage(cs))) {
      return true;
    }
    return hasVisibleImageChild(el) || hasPseudoContent(el);
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

  const selector = 'a[href], [role="link"]';
  const nodes = helpers.queryAllSmart
    ? helpers.queryAllSmart(selector)
    : helpers.queryAll(selector);

  const occurrences = [];
  const undecided = [];
  const contrastOnly = [];
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

    // A border, box-shadow, outline, background image, icon or generated
    // content marks the link without relying on color.
    if (hasNonColorMark(el, linkCs)) {
      decidedCount += 1;
      continue;
    }

    if (!c) {
      markUndecided(el, 'CONTRAST_HELPERS_UNAVAILABLE');
      continue;
    }

    let flagged = false;
    let computed = false;
    let backgroundDiffers = false;
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

          // A background color of the link's own, different from the one
          // behind the surrounding text, marks it like a highlight.
          const ownBg = String((linkCs && linkCs.backgroundColor) || '').replace(/\s+/g, '');
          const transparentBg =
            !ownBg || ownBg === 'transparent' || /^rgba\(\d+,\d+,\d+,0(\.0+)?\)$/.test(ownBg);
          if (!transparentBg && c.rgbToHex) {
            const parentBg = c.computeEffectiveBackground(parent, {
              contrast: { mode, rootCanvasFallback },
              collectStack: false
            });
            if (parentBg && parentBg.ok && parentBg.rgba) {
              backgroundDiffers = c.rgbToHex(parentBg.rgba) !== c.rgbToHex(bg.rgba);
            }
          }
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

    if (backgroundDiffers) {
      decidedCount += 1;
      continue;
    }

    // An underline is the last remaining non-color cue -- and only now does
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

    // Color is the only cue at rest. At 3:1 or more, G183 also needs a
    // non-color cue on hover and focus, which a static scan cannot see.
    if (!flagged) {
      contrastOnly.push({ el, ratio, fgLinkHex, fgParentHex });
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
        hint: 'Add an underline or another non-color cue (a font-weight or style difference, a border, an icon). Raising the color contrast with the surrounding text to 3:1 is enough only if hovering and focusing the link also add a non-color cue.',
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

  const cantTellOccurrences = undecided.map(({ el, reasonCode }) =>
    helpers.reportOccurrence(el, {
      occurrenceOutcome: 'cantTell',
      summary:
        'Whether this link is distinguishable from the surrounding text by non-color means could not be determined.',
      hint: 'Confirm by eye that the link carries an underline, a font-weight or font-style difference or another non-color mark, or at least 3:1 contrast against the surrounding text together with a non-color cue on hover and focus. Running the engine in a real browser rather than a DOM emulator resolves most cases automatically.',
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
  );

  const contrastOnlyOccurrences = contrastOnly.map(({ el, ratio, fgLinkHex, fgParentHex }) => {
    const ratioStr = c && c.round2 ? c.round2(ratio) : String(ratio);
    return helpers.reportOccurrence(el, {
      occurrenceOutcome: 'cantTell',
      summary: `This link in a block of text is distinguished from the surrounding text only by its color (contrast ${ratioStr}:1). That is enough only if hovering and focusing it also show a non-color cue, such as an underline.`,
      hint: 'Hover over the link and move keyboard focus to it: confirm that each state adds a non-color cue (an underline, a border, a weight change). Otherwise underline the link at rest.',
      i18n: {
        summaryKey: 'linkInTextBlock_summary_cantTell_contrastOnly',
        hintKey: 'linkInTextBlock_hint_cantTell_contrastOnly',
        params: { ratio: String(ratioStr), threshold: '3' }
      },
      uncertainty: {
        code: 'runtime-dependent',
        needed: 'Whether hovering and focusing the link add a non-color cue.',
        evidence: { reasonCode: 'LINK_COLOR_CONTRAST_ONLY', ratio }
      },
      data: {
        visibilityFilter: helpers.getEligibilityInfo
          ? helpers.getEligibilityInfo(el, ctx, { targetSet: 'acc' })
          : { targetSet: 'acc', accEligible: null, reasons: [] },
        details: {
          reasonCode: 'LINK_COLOR_CONTRAST_ONLY',
          metrics: { ratio, threshold: 3 },
          colors: { linkForegroundHex: fgLinkHex, surroundingTextForegroundHex: fgParentHex }
        }
      }
    });
  });

  // See helpers.resolveTieredOutcome (src/core/dom-helpers.js): a proven
  // violation outranks an undecided candidate for the rule's own outcome, but
  // never discards it, so an unevaluable link survives a failure elsewhere in
  // the same run.
  if (occurrences.length || cantTellOccurrences.length || contrastOnlyOccurrences.length) {
    const resolved = helpers.resolveTieredOutcome(
      occurrences,
      contrastOnlyOccurrences.concat(cantTellOccurrences),
      rule.defaultSeverity || 'serious'
    );
    return {
      ruleId: rule.ruleId,
      ...resolved,
      ...(resolved.outcome === 'cantTell' ? { confidence: 'low' } : null)
    };
  }

  if (decidedCount > 0) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }
  return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
}

module.exports = { id, meta, runInPage };
