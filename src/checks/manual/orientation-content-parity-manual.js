/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check orientation-content-parity
 * @atomic true
 * @summary Content should stay the same in portrait and landscape
 * @standard RGAA 4.1.2 (no WCAG Success Criterion)
 * @applicability
 *   Applies to elements that a style rule inside an orientation media
 *   condition (`@media (orientation: portrait)` or `landscape`, at any
 *   depth, or on the `<style>`, `<link>` or `@import` that holds the rule)
 *   hides with `display: none`, `visibility: hidden` or `visibility:
 *   collapse`. Elements are found whether or not they are hidden in the
 *   current viewport, since that depends on the orientation the scan runs
 *   in. A page where no such rule matches an element is notApplicable.
 * @expectation
 *   Always cantTell on such an element, never pass or fail. RGAA 13.9.1
 *   asks that « le contenu proposé reste le même quel que soit le mode
 *   d’orientation de l’écran utilisé même si sa présentation et le moyen
 *   d’y accéder peut différer ». Hiding an element in one orientation is
 *   allowed when its content stays available there in another form, or
 *   when the orientation is essential (the criterion's particular case),
 *   so a person checks.
 * @implementation-notes
 * - WCAG 1.3.4 is about restricting the view to one orientation, and
 *   css-orientation-lock asks only when the hidden element holds the
 *   page's main content. RGAA 13.9.1 also asks that the content stays the
 *   same, so this rule asks about any element hidden that way.
 * - Only readable stylesheets are scanned. css-orientation-lock already
 *   asks about stylesheets it cannot read (cross-origin), under the same
 *   test.
 * - Content hidden by default and shown only in one orientation is not
 *   found: which rule wins outside the media condition needs the cascade.
 * - Opt-in (tag `rgaa`): the rule runs only under the rgaa-4.1.2 profile,
 *   the `rgaa` tag or its own id.
 */

const id = 'orientation-content-parity';

const meta = {
  title: 'Content stays the same in portrait and landscape',
  description:
    'Flags each element that an orientation media query hides (display: none or visibility: hidden), for a person to check that the same content is offered in both orientations.',
  i18n: {
    titleKey: 'orientationContentParity_title',
    descriptionKey: 'orientationContentParity_description'
  },
  helpUrl: null,
  tags: ['rgaa', 'structure', 'css', 'atomic', 'manual'],
  wcagSc: [],
  normativeMappings: [],
  defaultSeverity: 'moderate',
  category: 'perceivable',
  type: 'manual',
  defaultConfidence: 'medium',
  coverage: {}
};

function runInPage(ctx) {
  const { document, helpers, rule } = ctx;

  const CSS_STYLE_RULE = 1;
  const CSS_IMPORT_RULE = 3;
  const MAX_DEPTH = 10;

  function trim(v) {
    return (v == null ? '' : String(v)).trim();
  }

  function mediaTextOf(list) {
    try {
      return trim(list && list.mediaText);
    } catch {
      return '';
    }
  }

  function isOrientationMedia(mediaText) {
    const m = trim(mediaText).toLowerCase();
    return m.includes('orientation') && (m.includes('portrait') || m.includes('landscape'));
  }

  function hides(style) {
    if (!style || typeof style.getPropertyValue !== 'function') return false;
    const display = trim(style.getPropertyValue('display')).toLowerCase();
    const visibility = trim(style.getPropertyValue('visibility')).toLowerCase();
    return display === 'none' || visibility === 'hidden' || visibility === 'collapse';
  }

  const hidings = []; // { mediaText, selectorText }

  function walk(rules, orientationMedia, depth) {
    if (!rules || depth > MAX_DEPTH) return;
    for (const cssRule of rules) {
      if (!cssRule) continue;
      if (cssRule.type === CSS_STYLE_RULE) {
        if (orientationMedia && cssRule.selectorText && hides(cssRule.style)) {
          hidings.push({ mediaText: orientationMedia, selectorText: trim(cssRule.selectorText) });
        }
        continue;
      }
      const ownMedia = mediaTextOf(cssRule.media);
      const media = isOrientationMedia(ownMedia) ? ownMedia : orientationMedia;
      if (cssRule.type === CSS_IMPORT_RULE) {
        let imported;
        try {
          imported = cssRule.styleSheet ? cssRule.styleSheet.cssRules : null;
        } catch {
          imported = null;
        }
        walk(imported, media, depth + 1);
        continue;
      }
      // @media, @supports, @layer, @container: recurse into grouping rules.
      let nested;
      try {
        nested = cssRule.cssRules || null;
      } catch {
        nested = null;
      }
      if (nested) walk(nested, media, depth + 1);
    }
  }

  try {
    for (const sheet of document.styleSheets || []) {
      let rules = null;
      try {
        rules = sheet && sheet.cssRules ? sheet.cssRules : null;
      } catch {
        continue; // cross-origin: css-orientation-lock asks about it
      }
      const sheetMedia = mediaTextOf(sheet.media);
      walk(rules, isOrientationMedia(sheetMedia) ? sheetMedia : '', 0);
    }
  } catch {
    // no-throw: treat as no readable stylesheets
  }

  const query = helpers.queryAllSource || helpers.queryAllSmart || helpers.queryAll;
  const occurrences = [];
  const seen = new Set();

  for (const h of hidings) {
    let matched;
    try {
      matched = query(h.selectorText) || [];
    } catch {
      matched = []; // a selector the engine cannot parse is skipped, not guessed at
    }
    for (const el of matched) {
      if (!el || el.nodeType !== 1 || seen.has(el)) continue;
      seen.add(el);
      const element = String(el.localName || el.tagName || '').toLowerCase();
      occurrences.push(
        helpers.reportOccurrence(el, {
          summary: `A "${h.mediaText}" media query hides this <${element}> ("${h.selectorText}").`,
          hint: 'Check that the same content is offered in portrait and in landscape, even if it is presented or reached differently (RGAA 13.9.1). This is not required when one orientation is essential.',
          i18n: {
            summaryKey: 'orientationContentParity_summary_cantTell',
            hintKey: 'orientationContentParity_hint_cantTell',
            params: { mediaText: h.mediaText, selectorText: h.selectorText, element }
          },
          data: {
            details: {
              reasonCode: 'hiddenInOrientation',
              mediaText: h.mediaText,
              selectorText: h.selectorText
            },
            visibilityFilter: { targetSet: 'dom', accEligible: null, reasons: [] }
          }
        })
      );
    }
  }

  if (!occurrences.length) {
    return { ruleId: rule.ruleId, outcome: 'notApplicable', severity: 'minor', occurrences: [] };
  }
  return {
    ruleId: rule.ruleId,
    outcome: 'cantTell',
    severity: rule.defaultSeverity || 'moderate',
    occurrences
  };
}

module.exports = { id, meta, runInPage };
