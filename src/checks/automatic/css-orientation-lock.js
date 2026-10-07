/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check css-orientation-lock
 * @atomic true
 * @summary CSS must not lock the page to a single display orientation via a rotate() hack
 * @standard WCAG 2.2
 * @sc 1.3.4
 * @applicability
 *   Any accessible (same-document, non-cross-origin) stylesheet, inline
 *   `<style>` blocks and same-origin `<link>` stylesheets already loaded
 *   into `document.styleSheets`.
 * @expectation
 *   No `@media (orientation: portrait)` or `@media (orientation:
 *   landscape)` block sets a `transform`/`-webkit-transform`/`rotate`
 *   rotation of approximately 90 degrees (mod 180, i.e. ~90 or ~270),
 *   the well-known technique for visually forcing one orientation
 *   regardless of the device's actual orientation, which defeats WCAG
 *   1.3.4's requirement that content not restrict its view to a single
 *   display orientation unless that orientation is essential.
 *   Such a rotation is judged on the visible elements its selector matches
 *   (ACT b33eff), visibility judged without the rotation itself: it fails
 *   where one of them holds the page's content (as defined below for
 *   hidden content), and any other element turned that way is asked about
 *   (cantTell): an arrow pointing to a panel beside it in one orientation
 *   and below it in the other locks nothing. A rule that turns no visible
 *   element, or only a pseudo-element, has nothing to judge.
 *
 *   A second shape is asked about (cantTell): an orientation media block
 *   that hides the page's content with `display: none` or `visibility:
 *   hidden`, the usual form of WCAG F100 (content replaced by a "rotate
 *   your device" message in one orientation). The hidden element counts as
 *   the page's content when it is `html` or `body`, the `main` landmark, an
 *   ancestor of it, or, on a page without a main landmark, an element
 *   holding at least half of the body's text. Whether the orientation is
 *   essential, and whether the page stays usable, is left to a person.
 * @reports
 *   - `mediaText` (a rotation or hidden content): the media query that
 *     holds the rule, such as `(orientation: portrait)`. A rotation of an
 *     element that doesn't hold the page's content is reported against that
 *     element (ORIENTATION_MEDIA_ROTATES_ELEMENT).
 *   - `selectorText` (a rotation or hidden content): the selector of the
 *     style rule that rotates or hides. Empty when it could not be read.
 *   - `unreadableSheetCount` (`STYLESHEETS_NOT_READABLE`): how many style
 *     sheets could not be read, usually because they come from another
 *     origin.
 * @implementation-notes
 * - The rotation DEGREE is what makes this the exploit signature, not
 *   merely the presence of a `rotate()` function: a small decorative icon
 *   rotated 45 degrees inside an orientation media query is not a page
 *   lock. Compute the actual rotation angle and only flag ~90/~270 degrees,
 *   excluding ~0/~180 (a no-op or a flip, neither of which changes
 *   portrait<->landscape).
 * - `rotate`/`rotateZ`, the standalone CSS `rotate` property, and
 *   `rotate3d(x, y, z, angle)`/`matrix()`/`matrix3d()` are all parsed for
 *   degrees. The matrix forms only yield an angle when they resolve to a
 *   pure rotation about the Z axis (no scale, skew, translation, or
 *   rotation combined with another axis). Anything else contributes 0,
 *   same as an unrecognized value, rather than guessing at an angle a
 *   general 3D matrix doesn't uniquely have.
 * - Cross-origin stylesheets throw on `.cssRules` access (browser
 *   security model) and are skipped, same class of limitation as any
 *   check that can only see same-origin/inspectable content (compare
 *   `iframe-focusable-content`).
 * - A rotation lock is not decided per element: this is a
 *   whole-document/whole-stylesheet concern, so its occurrences are
 *   reported against `document.documentElement`,
 *   matching the "whole-document checks" precedent documented in
 *   `docs/RULE_AUTHORING.md` §11.2 (e.g. `aria-hidden-body`,
 *   `meta-viewport-zoom-enabled`). A hidden-content finding is reported
 *   against the hidden element.
 * - The rotation lock stays a failure, as in ACT b33eff, which assumes the
 *   orientation is not essential; a person reviewing an essential lock (a
 *   piano keyboard, a cheque scan) can set that finding aside.
 */

const id = 'css-orientation-lock';

const meta = {
  title: 'CSS must not lock the page to a single orientation',
  description:
    "Checks that no @media (orientation: portrait|landscape) rule sets a transform: rotate(...) on the page, a known technique for defeating device orientation, and asks about any such rule that hides the page's main content.",
  i18n: {
    titleKey: 'cssOrientationLock_title',
    descriptionKey: 'cssOrientationLock_description'
  },
  helpUrl: null,
  tags: ['wcag21aa', 'wcag134', 'structure', 'atomic', 'automatic'],
  wcagSc: ['1.3.4'],
  normativeMappings: [
    {
      standard: 'WCAG',
      version: '2.2',
      requirement: '1.3.4',
      title: 'Orientation',
      conformanceLevel: 'AA'
    }
  ],
  defaultSeverity: 'serious',
  category: 'perceivable',
  type: 'automatic',
  defaultConfidence: 'high',
  coverage: { facetsBySc: { '1.3.4': ['css-orientation-lock'] } }
};

// This check is inherently whole-document (does the PAGE have this
// property?), not evaluable per-subtree -- notApplicable when contextSelector
// scoped this run narrower than the whole document, or when
// engineOptions.fragment:true was set (see helpers.isWholeDocumentScope).
function applicability(ctx) {
  return ctx.helpers.isWholeDocumentScope ? ctx.helpers.isWholeDocumentScope() : true;
}

function runInPage(ctx) {
  const dom = ctx.helpers.dom;
  const { document, helpers, rule } = ctx;

  const CSS_MEDIA_RULE = 4;
  const CSS_STYLE_RULE = 1;
  const CSS_IMPORT_RULE = 3;

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }

  // Converts a rotate()/rotateZ() angle argument (with unit) to degrees.
  // Only deg/grad/rad/turn are recognized; a unitless or unrecognized value
  // contributes 0 (ignored, not treated as a lock -- an unparseable angle
  // isn't a confirmed exploit).
  function angleToDegrees(raw) {
    const m = /(-?[\d.]+)\s*(deg|grad|rad|turn)/i.exec(raw);
    if (!m) return 0;
    const value = parseFloat(m[1]);
    if (!Number.isFinite(value)) return 0;
    const unit = m[2].toLowerCase();
    if (unit === 'rad') return value * (180 / Math.PI);
    if (unit === 'grad') return value * (360 / 400);
    if (unit === 'turn') return value * 360;
    return value; // deg
  }

  function parseNumberList(argsStr) {
    return trim(argsStr)
      .split(',')
      .map((s) => parseFloat(s.trim()));
  }

  // A 2D linear map (a, b, c, d) -- the first four arguments of
  // `matrix(a, b, c, d, e, f)`, or the top-left of `matrix3d`'s 4x4 --
  // is a pure rotation only when its columns are unit length and
  // orthogonal (no scale/skew/reflection): a = cos(theta), b = sin(theta),
  // c = -sin(theta), d = cos(theta). Returns degrees, or null when the
  // map isn't a pure rotation.
  function decomposeMatrix2dRotation(a, b, c, d) {
    const EPS = 1e-3;
    if (Math.abs(a - d) > EPS || Math.abs(b + c) > EPS) return null;
    if (Math.abs(a * a + b * b - 1) > EPS) return null;
    if (Math.abs(a * d - b * c - 1) > EPS) return null;
    return (Math.atan2(b, a) * 180) / Math.PI;
  }

  // The 16 column-major values of `matrix3d(...)` represent a pure Z-axis
  // rotation only when the 3rd/4th columns still match the identity (no
  // translation, perspective, or rotation around another axis) and the
  // top-left 2x2 block is a pure 2D rotation.
  function decomposeMatrix3dZRotation(v) {
    if (v.length !== 16 || !v.every(Number.isFinite)) return null;
    const EPS = 1e-3;
    const near = (x, t) => Math.abs(x - t) < EPS;
    if (!(near(v[2], 0) && near(v[3], 0) && near(v[6], 0) && near(v[7], 0))) return null;
    if (!(near(v[8], 0) && near(v[9], 0) && near(v[10], 1) && near(v[11], 0))) return null;
    if (!(near(v[12], 0) && near(v[13], 0) && near(v[14], 0) && near(v[15], 1))) return null;
    return decomposeMatrix2dRotation(v[0], v[1], v[4], v[5]);
  }

  // Sums the degrees of every rotate()/rotateZ()/rotate3d()/matrix()/
  // matrix3d() function found in a transform value (a real transform can
  // legitimately compose more than one, e.g. "translate(-50%)
  // rotate(90deg)"). The matrix forms only contribute when they decompose
  // to a pure Z rotation; anything else contributes 0, same as no match.
  function rotateDegreesFromTransform(t) {
    if (!t) return 0;
    let total = 0;
    let m;

    const rotateRe = /rotate(?:Z)?\s*\(([^)]*)\)/gi;
    while ((m = rotateRe.exec(t)) !== null) {
      total += angleToDegrees(m[1]);
    }

    const rotate3dRe = /rotate3d\s*\(([^)]*)\)/gi;
    while ((m = rotate3dRe.exec(t)) !== null) {
      const parts = m[1].split(',');
      if (parts.length !== 4) continue;
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      const z = parseFloat(parts[2]);
      const deg = angleToDegrees(parts[3]);
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || !deg) continue;
      const EPS = 1e-3;
      if (Math.abs(x) < EPS && Math.abs(y) < EPS && Math.abs(Math.abs(z) - 1) < EPS) {
        total += z < 0 ? -deg : deg;
      }
    }

    const matrixRe = /matrix\s*\(([^)]*)\)/gi;
    while ((m = matrixRe.exec(t)) !== null) {
      const vals = parseNumberList(m[1]);
      if (vals.length === 6 && vals.every(Number.isFinite)) {
        const deg = decomposeMatrix2dRotation(vals[0], vals[1], vals[2], vals[3]);
        if (deg != null) total += deg;
      }
    }

    const matrix3dRe = /matrix3d\s*\(([^)]*)\)/gi;
    while ((m = matrix3dRe.exec(t)) !== null) {
      const deg = decomposeMatrix3dZRotation(parseNumberList(m[1]));
      if (deg != null) total += deg;
    }

    return total;
  }

  // Whole-page-orientation-lock detection (see @implementation-notes): a
  // rotation near 0 or 180 degrees (mod 180) is a no-op or a flip, neither
  // of which changes portrait<->landscape, so it's NOT a lock; only a
  // rotation near 90 or 270 degrees is. "Near" is a tolerance window, not
  // exact equality: a `rad`/`grad`/`turn` value converts to a 90-degree
  // rotation with floating-point remainder (e.g. `1.5708rad` is
  // 90.0000210...deg, never exactly 90), and ACT's own failed examples
  // include a -inexact 92.5deg, both must still register as a
  // lock, which exact-modulo-equality (`% 90 === 0`) never does.
  const LOCK_TOLERANCE_DEG = 5;
  function isLockingRotation(styleDecl) {
    if (!styleDecl) return false;
    const transformVal =
      trim(styleDecl.transform) ||
      trim(styleDecl.getPropertyValue ? styleDecl.getPropertyValue('-webkit-transform') : '');
    // The standalone CSS `rotate` property (distinct from `transform: rotate()`).
    const rotatePropVal = trim(
      styleDecl.getPropertyValue ? styleDecl.getPropertyValue('rotate') : ''
    );

    let degrees = rotateDegreesFromTransform(transformVal);
    if (!degrees && rotatePropVal) degrees = angleToDegrees(rotatePropVal);

    if (!degrees) return false;

    // Normalize into [0, 180): a rotation and its mirror (rotation + 180)
    // swap the same two axes, so only the position within one half-turn
    // matters. A value near the 90-degree midpoint of that range is near
    // 90 OR 270 in the original full-turn range.
    const normalized = ((degrees % 180) + 180) % 180;
    return Math.abs(normalized - 90) <= LOCK_TOLERANCE_DEG;
  }

  function isOrientationMedia(mediaText) {
    const m = trim(mediaText).toLowerCase();
    return m.includes('orientation') && (m.includes('portrait') || m.includes('landscape'));
  }

  function hidesContent(styleDecl) {
    if (!styleDecl || typeof styleDecl.getPropertyValue !== 'function') return false;
    const display = trim(styleDecl.getPropertyValue('display')).toLowerCase();
    const visibility = trim(styleDecl.getPropertyValue('visibility')).toLowerCase();
    return display === 'none' || visibility === 'hidden' || visibility === 'collapse';
  }

  function judgeStyle(style, selectorText, mediaText, findings, hidings) {
    if (!selectorText) return;
    if (isLockingRotation(style)) findings.push({ mediaText, selectorText });
    if (hidesContent(style)) hidings.push({ mediaText, selectorText });
  }

  // A nested rule's selector, resolved against its parent's: `&` stands for
  // the parent, and a selector without one is a descendant of it.
  function resolveNested(selectorText, parentSelector) {
    const sel = trim(selectorText);
    if (!parentSelector) return sel;
    const parent = ':is(' + parentSelector + ')';
    return sel.includes('&') ? sel.split('&').join(parent) : parent + ' ' + sel;
  }

  // Every style rule a stylesheet applies, with the media conditions it
  // applies under, wherever it sits: inside @media (nested or not),
  // @supports, @layer, @container, an @import, or CSS nesting. A lock is
  // only judged under a condition that names an orientation.
  const MAX_DEPTH = 20;
  // A rule list, or null when it is missing or not readable (cross-origin).
  function readRules(get) {
    try {
      return get() || null;
    } catch {
      return null;
    }
  }
  function walkRules(rules, mediaTexts, parentSelector, depth, findings, hidings) {
    if (!rules || depth > MAX_DEPTH) return;
    for (const r of rules) {
      if (!r) continue;
      const nested = readRules(() => r.cssRules);
      if (r.type === CSS_STYLE_RULE) {
        const selectorText = parentSelector
          ? resolveNested(r.selectorText, parentSelector)
          : trim(r.selectorText);
        const mediaText = mediaTexts.filter(isOrientationMedia).join(' and ');
        if (mediaText) judgeStyle(r.style, selectorText, mediaText, findings, hidings);
        if (nested && nested.length) {
          walkRules(nested, mediaTexts, selectorText, depth + 1, findings, hidings);
        }
        continue;
      }
      // Declarations nested straight inside an at-rule within a style rule
      // (`.x { @media (orientation: portrait) { rotate: 90deg } }`) belong
      // to that style rule's selector.
      if (parentSelector && r.style && !r.selectorText && !nested) {
        const mediaText = mediaTexts.filter(isOrientationMedia).join(' and ');
        if (mediaText) judgeStyle(r.style, parentSelector, mediaText, findings, hidings);
        continue;
      }
      let texts = mediaTexts;
      if (r.type === CSS_MEDIA_RULE && r.media) texts = mediaTexts.concat([r.media.mediaText]);
      if (r.type === CSS_IMPORT_RULE) {
        const imported = readRules(() => r.styleSheet && r.styleSheet.cssRules);
        const importMedia = r.media && r.media.mediaText ? [r.media.mediaText] : [];
        walkRules(
          imported,
          mediaTexts.concat(importMedia),
          parentSelector,
          depth + 1,
          findings,
          hidings
        );
        continue;
      }
      if (nested) walkRules(nested, texts, parentSelector, depth + 1, findings, hidings);
    }
  }

  // Whether an element hidden by an orientation block holds the page's
  // content: the root, the body, the main landmark or an ancestor of it, or,
  // with no main landmark, most of the body's text.
  function textLength(el) {
    return String((el && dom.textContent(el)) || '').replace(/\s+/g, '').length;
  }
  // The main landmark: the first <main>, or element whose role attribute
  // resolves to main. The role attribute is a fallback list matched in any
  // case (the first real role wins: role="foo main" counts, role="region
  // main" doesn't).
  let mainEl = null;
  try {
    const candidates = dom.querySelectorAll(document, 'main, [role~="main" i]') || [];
    for (const el of candidates) {
      const isMain =
        String(dom.localName(el) || '').toLowerCase() === 'main' ||
        helpers.aria.getExplicitRole(el) === 'main';
      if (isMain) {
        mainEl = el;
        break;
      }
    }
  } catch {
    mainEl = null;
  }
  const bodyTextLength = dom.body(document) ? textLength(dom.body(document)) : 0;

  function holdsPageContent(el) {
    if (!el || dom.nodeType(el) !== 1) return false;
    const tag = String(dom.localName(el) || '').toLowerCase();
    if (tag === 'html' || tag === 'body') return true;
    if (mainEl)
      return (
        el === mainEl || (typeof dom.get(el, 'contains') === 'function' && dom.contains(el, mainEl))
      );
    return bodyTextLength > 0 && textLength(el) * 2 >= bodyTextLength;
  }

  // Whether an element is drawn, judged without the rotation itself: a page
  // turned out of view is still the page (#109). Without a layout (jsdom),
  // by its styles alone.
  let hasLayout = null;
  function isVisible(el) {
    try {
      if (helpers.isHiddenContent && helpers.isHiddenContent(el)) return false;
      if (typeof dom.get(el, 'checkVisibility') === 'function' && !dom.checkVisibility(el))
        return false;
      const view = dom.defaultView(document);
      for (
        let a = el, i = 0;
        a && dom.nodeType(a) === 1 && i < 100000;
        a = dom.parentElement(a), i++
      ) {
        const cs = view && view.getComputedStyle ? view.getComputedStyle(a) : null;
        if (cs && cs.display === 'none') return false;
        if (a === el && cs && (cs.visibility === 'hidden' || cs.visibility === 'collapse'))
          return false;
      }
      if (hasLayout === null) {
        const root = dom.documentElement(document);
        hasLayout = !!(root && dom.getClientRects(root).length);
      }
      if (!hasLayout) return true;
      return Array.from(dom.getClientRects(el)).some((r) => r.width > 0 && r.height > 0);
    } catch {
      return true;
    }
  }
  // The visible elements a style rule's selector matches. A selector naming
  // a pseudo-element rotates no element of the page.
  function visibleMatches(selectorText) {
    if (
      /::?(before|after|first-line|first-letter|marker|placeholder|backdrop)\b/i.test(selectorText)
    )
      return [];
    let matched;
    try {
      matched = Array.from(dom.querySelectorAll(document, selectorText));
    } catch {
      return [];
    }
    return matched.filter(isVisible);
  }

  const rotations = [];
  const hidings = [];
  let sheetCount = 0;
  let unreadableSheetCount = 0;

  try {
    const sheets = dom.styleSheets(document) || [];
    for (const sheet of sheets) {
      let rules = null;
      try {
        rules = sheet && sheet.cssRules ? sheet.cssRules : null;
      } catch {
        // Cross-origin, not inspectable. Counted, since a lock could be
        // declared there and a `pass` would claim more than was checked.
        unreadableSheetCount += 1;
        continue;
      }
      if (!rules) continue;
      sheetCount += 1;

      // A <style media="..."> or <link media="..."> applies its whole sheet
      // under that condition.
      const sheetMedia = sheet.media && sheet.media.mediaText ? [sheet.media.mediaText] : [];
      walkRules(rules, sheetMedia, '', 0, rotations, hidings);
    }
  } catch {
    // no-throw: treat as no accessible stylesheets
  }

  const scanTarget = dom.documentElement(document) || dom.body(document) || null;

  // A rotation of about 90 degrees in an orientation block locks the page
  // where the element it turns holds the page's content; another element
  // turned that way (an arrow pointing beside a panel in one orientation
  // and below it in the other) may lock nothing, which a person decides.
  // A rule that turns no visible element has nothing to judge (ACT b33eff).
  const findings = [];
  const rotated = [];
  const seenRotated = new Set();
  for (const r of rotations) {
    const visible = visibleMatches(r.selectorText);
    if (!visible.length) continue;
    if (visible.some(holdsPageContent)) {
      findings.push(r);
      continue;
    }
    const el = visible.find((v) => !seenRotated.has(v));
    if (!el) continue;
    seenRotated.add(el);
    rotated.push({ el, mediaText: r.mediaText, selectorText: r.selectorText });
  }
  const rotatedOccurrences = rotated.map((f) =>
    helpers.reportOccurrence(f.el, {
      occurrenceOutcome: 'cantTell',
      summary: `A "${f.mediaText}" media query turns "${f.selectorText}" a quarter turn. It doesn't hold the page's main content, so it may lock nothing.`,
      hint: 'Check whether the turned element keeps content readable and operable in both orientations, as an arrow that points to a panel beside it or below it does. If it holds content that must be read upright, remove the rotation.',
      i18n: {
        summaryKey: 'cssOrientationLock_summary_cantTell_rotatesElement',
        hintKey: 'cssOrientationLock_hint_cantTell_rotatesElement',
        params: { mediaText: f.mediaText, selectorText: f.selectorText }
      },
      uncertainty: {
        code: 'judgement-required',
        needed: 'Whether turning this element restricts its content to one orientation.',
        evidence: {
          mediaText: f.mediaText,
          selectorText: f.selectorText,
          reasonCode: 'ORIENTATION_MEDIA_ROTATES_ELEMENT'
        }
      },
      data: {
        details: {
          reasonCode: 'ORIENTATION_MEDIA_ROTATES_ELEMENT',
          mediaText: f.mediaText,
          selectorText: f.selectorText
        }
      }
    })
  );

  function unreadableSheetsOccurrence(count) {
    return helpers.reportOccurrence(scanTarget, {
      summary: `${count} stylesheet(s) could not be read, so whether this page locks its orientation could not be determined.`,
      hint: 'Cross-origin stylesheets are not inspectable from the page. Check any third-party CSS for an orientation media query containing a rotate() transform, or re-run the scan with those stylesheets served same-origin.',
      i18n: {
        summaryKey: 'cssOrientationLock_summary_cantTell_unreadableSheets',
        hintKey: 'cssOrientationLock_hint_cantTell_unreadableSheets',
        params: { count: String(count) }
      },
      uncertainty: {
        code: 'not-computable',
        needed: 'The contents of the stylesheets this scan could not read.',
        evidence: { unreadableSheetCount: count, reasonCode: 'STYLESHEETS_NOT_READABLE' }
      },
      data: {
        details: {
          reasonCode: 'STYLESHEETS_NOT_READABLE',
          unreadableSheetCount: count
        }
      }
    });
  }

  // Orientation blocks hiding the page's content (F100): one question per
  // hidden element.
  const hiddenContent = [];
  const seenHidden = new Set();
  for (const h of hidings) {
    let matched;
    try {
      matched = Array.from(dom.querySelectorAll(document, h.selectorText));
    } catch {
      matched = [];
    }
    for (const el of matched) {
      if (seenHidden.has(el) || !holdsPageContent(el)) continue;
      seenHidden.add(el);
      hiddenContent.push({ el, mediaText: h.mediaText, selectorText: h.selectorText });
    }
  }
  const hiddenContentOccurrences = hiddenContent.map((f) =>
    helpers.reportOccurrence(f.el, {
      occurrenceOutcome: 'cantTell',
      summary: `A "${f.mediaText}" media query hides "${f.selectorText}", which holds the page's main content, so the page may not be usable in that orientation.`,
      hint: 'Check that the page can be viewed and operated in both portrait and landscape. If this media query replaces the content with a message asking the user to rotate the device, show the content instead, unless one orientation is essential.',
      i18n: {
        summaryKey: 'cssOrientationLock_summary_cantTell_hidesContent',
        hintKey: 'cssOrientationLock_hint_cantTell_hidesContent',
        params: { mediaText: f.mediaText, selectorText: f.selectorText }
      },
      uncertainty: {
        code: 'judgement-required',
        needed:
          'Whether the page stays usable in that orientation, and whether one orientation is essential.',
        evidence: {
          mediaText: f.mediaText,
          selectorText: f.selectorText,
          reasonCode: 'ORIENTATION_MEDIA_HIDES_CONTENT'
        }
      },
      data: {
        details: {
          reasonCode: 'ORIENTATION_MEDIA_HIDES_CONTENT',
          mediaText: f.mediaText,
          selectorText: f.selectorText
        }
      }
    })
  );

  const questions = hiddenContentOccurrences.concat(rotatedOccurrences);

  // A lock found in a readable sheet is still a lock, so `fail` outranks the
  // uncertainty below.
  if (!findings.length && questions.length) {
    const unreadable =
      unreadableSheetCount > 0 ? [unreadableSheetsOccurrence(unreadableSheetCount)] : [];
    return {
      ruleId: rule.ruleId,
      outcome: 'cantTell',
      severity: rule.defaultSeverity || 'serious',
      confidence: 'low',
      occurrences: questions.concat(unreadable)
    };
  }

  if (!findings.length) {
    if (unreadableSheetCount > 0) {
      return {
        ruleId: rule.ruleId,
        outcome: 'cantTell',
        severity: rule.defaultSeverity || 'serious',
        confidence: 'low',
        occurrences: [unreadableSheetsOccurrence(unreadableSheetCount)]
      };
    }
    if (sheetCount === 0) {
      return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
    }
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  const target = scanTarget;
  const occurrences = findings.map((f) =>
    helpers.reportOccurrence(target, {
      summary: f.selectorText
        ? `A "${f.mediaText}" media query rotates "${f.selectorText}", locking the page to one orientation.`
        : `A "${f.mediaText}" media query rotates an element with no readable selector, locking the page to one orientation.`,
      hint: 'Remove the rotate() transform from the orientation media query; let the page respond naturally to device orientation instead of forcing a visual rotation.',
      i18n: {
        summaryKey: f.selectorText
          ? 'cssOrientationLock_summary_fail'
          : 'cssOrientationLock_summary_fail_unknownSelector',
        hintKey: 'cssOrientationLock_hint_fail',
        params: { mediaText: f.mediaText, selectorText: f.selectorText }
      },
      data: {
        details: {
          reasonCode: 'ORIENTATION_MEDIA_ROTATE_TRANSFORM',
          mediaText: f.mediaText,
          selectorText: f.selectorText
        }
      }
    })
  );

  if (questions.length) {
    // See helpers.resolveTieredOutcome: the lock fails, and the questions
    // are kept beside it.
    return {
      ruleId: rule.ruleId,
      ...helpers.resolveTieredOutcome(occurrences, questions, rule.defaultSeverity || 'serious')
    };
  }

  return {
    ruleId: rule.ruleId,
    outcome: 'fail',
    severity: rule.defaultSeverity || 'serious',
    occurrences
  };
}

module.exports = { id, meta, runInPage, applicability };
