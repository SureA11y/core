'use strict';

/**
 * @check css-orientation-lock
 * @atomic true
 * @summary CSS must not lock the page to a single display orientation via a rotate() hack
 * @standard WCAG 2.2
 * @sc 1.3.4
 * @applicability
 *   Any accessible (same-document, non-cross-origin) stylesheet — inline
 *   `<style>` blocks and same-origin `<link>` stylesheets already loaded
 *   into `document.styleSheets`.
 * @expectation
 *   No `@media (orientation: portrait)` or `@media (orientation:
 *   landscape)` block sets a `transform`/`-webkit-transform`/`rotate`
 *   rotation of approximately 90 degrees (mod 180, i.e. ~90 or ~270) —
 *   the well-known technique for visually forcing one orientation
 *   regardless of the device's actual orientation, which defeats WCAG
 *   1.3.4's requirement that content not restrict its view to a single
 *   display orientation unless that orientation is essential.
 * @implementation-notes
 * - The rotation DEGREE is what makes this the exploit signature, not
 *   merely the presence of a `rotate()` function: a small decorative icon
 *   rotated 45 degrees inside an orientation media query is not a page
 *   lock. Compute the actual rotation angle and only flag ~90/~270 degrees,
 *   excluding ~0/~180 (a no-op or a flip, neither of which changes
 *   portrait<->landscape).
 * - Only `rotate`/`rotateZ` (transform functions) and the standalone CSS
 *   `rotate` property are parsed for degrees, from the two sources
 *   `style.transform`/`style.rotate`; `matrix()`/`matrix3d()`/`rotate3d()`
 *   are not decomposed into an equivalent angle (deliberately deferred as
 *   the same class of higher-complexity/lower-value work deferred elsewhere,
 *   e.g. `table-th-has-data-cells`'s narrower positional-header algorithm).
 * - Cross-origin stylesheets throw on `.cssRules` access (browser
 *   security model) and are skipped — same class of limitation as any
 *   check that can only see same-origin/inspectable content (compare
 *   `iframe-focusable-content`).
 * - Not per-element: this is a whole-document/whole-stylesheet concern,
 *   so occurrences are reported against `document.documentElement`,
 *   matching the "whole-document checks" precedent documented in
 *   `docs/RULE_AUTHORING.md` §11.2 (e.g. `aria-hidden-body`,
 *   `meta-viewport-zoom-enabled`).
 */

const id = 'css-orientation-lock';

const meta = {
  title: 'CSS must not lock the page to a single orientation',
  description:
    'Checks that no @media (orientation: portrait|landscape) rule sets a transform: rotate(...) on the page, a known technique for defeating device orientation.',
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
  const { document, helpers, rule } = ctx;

  const CSS_MEDIA_RULE = 4;
  const CSS_STYLE_RULE = 1;

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

  // Sums the degrees of every rotate()/rotateZ() function found in a
  // transform value (a real transform can legitimately compose more than
  // one, e.g. "translate(-50%) rotate(90deg)").
  function rotateDegreesFromTransform(t) {
    if (!t) return 0;
    let total = 0;
    const re = /rotate(?:Z)?\s*\(([^)]*)\)/gi;
    let m;
    while ((m = re.exec(t)) !== null) {
      total += angleToDegrees(m[1]);
    }
    return total;
  }

  // Whole-page-orientation-lock detection (see @implementation-notes): a
  // rotation near 0 or 180 degrees (mod 180) is a no-op or a flip, neither
  // of which changes portrait<->landscape, so it's NOT a lock; only a
  // rotation near 90 or 270 degrees (mod 90, once the 0/180 case is
  // excluded) is.
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

    const abs = Math.abs(degrees);
    if (Math.abs(abs - 180) % 180 <= 0) return false; // near 0/180: not a lock
    return Math.abs(abs - 90) % 90 <= 0; // near 90/270: a lock
  }

  function isOrientationMedia(mediaText) {
    const m = trim(mediaText).toLowerCase();
    return m.includes('orientation') && (m.includes('portrait') || m.includes('landscape'));
  }

  function scanRuleList(rules, mediaText, findings) {
    if (!rules) return;
    for (const r of rules) {
      if (!r) continue;
      if (r.type === CSS_STYLE_RULE && isLockingRotation(r.style)) {
        findings.push({ mediaText, selectorText: trim(r.selectorText) || '(unknown selector)' });
      }
    }
  }

  const findings = [];
  let sheetCount = 0;

  try {
    const sheets = document.styleSheets || [];
    for (const sheet of sheets) {
      let rules = null;
      try {
        rules = sheet && sheet.cssRules ? sheet.cssRules : null;
      } catch {
        continue; // cross-origin stylesheet, not inspectable
      }
      if (!rules) continue;
      sheetCount += 1;

      for (const rule2 of rules) {
        if (!rule2 || rule2.type !== CSS_MEDIA_RULE) continue;
        const mediaText = rule2.media ? rule2.media.mediaText : '';
        if (!isOrientationMedia(mediaText)) continue;
        scanRuleList(rule2.cssRules, mediaText, findings);
      }
    }
  } catch {
    // no-throw: treat as no accessible stylesheets
  }

  if (sheetCount === 0) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }

  if (!findings.length) {
    return { ruleId: rule.ruleId, outcome: 'pass', severity: 'minor', occurrences: [] };
  }

  const target = document.documentElement || document.body || null;
  const stableSelector = helpers.buildSelector && target ? helpers.buildSelector(target) : 'html';
  const html =
    helpers.getOuterHtmlSnippet && target ? helpers.getOuterHtmlSnippet(target) : '<html>';

  const occurrences = findings.map((f) => ({
    selector: stableSelector,
    html,
    summary: `A "${f.mediaText}" media query rotates "${f.selectorText}", locking the page to one orientation.`,
    hint: 'Remove the rotate() transform from the orientation media query; let the page respond naturally to device orientation instead of forcing a visual rotation.',
    i18n: {
      summaryKey: 'cssOrientationLock_summary_fail',
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
  }));

  return {
    ruleId: rule.ruleId,
    outcome: 'fail',
    severity: rule.defaultSeverity || 'serious',
    occurrences
  };
}

module.exports = { id, meta, runInPage, applicability };
