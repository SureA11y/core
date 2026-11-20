/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check target-size-enhanced
 * @atomic true
 * @summary Pointer-operable targets should be at least 44×44 CSS px (or meet an exception)
 * @standard WCAG 2.2
 * @sc 2.5.5
 * @applicability
 *   The targets target-size-minimum applies to: <button>, <summary>,
 *   <a href>, <area href>, <input>, <select>, <textarea> and elements whose
 *   role resolves to button or link, that a pointer can reach and hit.
 * @expectation
 *   Each target is at least 44 by 44 CSS pixels, measured as
 *   target-size-minimum measures 24 (the region a pointer can hit, and the
 *   largest square aligned to the page that fits in it), or meets one of
 *   the SC 2.5.5 exceptions this rule can establish: the inline exception
 *   for a target in a sentence, or user-agent sizing (an unstyled native
 *   checkbox or radio). 2.5.5 has no spacing exception, so a target under
 *   44 fails however far it is from others. Where an exception may apply
 *   but cannot be confirmed (two inline links side by side between
 *   separators alone, as in "Edit | Delete", or a target inside an SVG,
 *   canvas or image map that may be essential), the result is cantTell.
 *   The equivalent exception (the same function offered by a target that
 *   is large enough, elsewhere on the page) is not established: a target it
 *   would cover fails.
 *   It is target-size-minimum run with `minSizePx: 44` and
 *   `spacingException: 'none'` (a variant: docs/RULE_AUTHORING.md, "Rule
 *   variants"), so a fix to that rule's measuring reaches this one.
 *   Margin (`target-size-px`): of the targets that are at least 44 by 44,
 *   the smallest, as the side of the largest square that fits in it against
 *   44. Only a target within 6px of 44 (up to 50) counts as close.
 * @reports
 *   - As target-size-minimum's, against 44: `metrics.widthPx`,
 *     `metrics.heightPx`, `metrics.squarePx` against `metrics.minSizePx`
 *     (44), `measured` and `viewport`. No distance to other targets, which
 *     decides nothing here, but for an inline link run (`conflictWith`, the
 *     link beside it).
 * @reason-codes
 *   - `undersized` (fail): a target smaller than 44 by 44 CSS pixels, with
 *     no exception that applies.
 *     Basis: WCAG 2.5.5.
 *   - `undersized-inline-link-run` (cantTell): an undersized inline link
 *     beside another inline link in a run with separators but no words, as
 *     in "Edit | Delete"; whether the inline exception covers it is for a
 *     person to judge.
 *     Basis: WCAG 2.5.5 (exception: inline).
 *   - `undersized-plausibly-essential` (cantTell): an undersized target
 *     inside an SVG, a canvas or an image map, where its size may be
 *     essential.
 *     Basis: WCAG 2.5.5 (exception: essential).
 */

module.exports = {
  id: 'target-size-enhanced',
  from: 'target-size-minimum',
  config: { minSizePx: 44, spacingException: 'none' },
  meta: {
    title: 'Pointer targets must be at least 44x44px large',
    description:
      'Checks that pointer-operable targets have an effective hit region of at least 44 by 44 CSS pixels, or meet an allowed exception (inline, user-agent sizing, essential).',
    i18n: {
      titleKey: 'targetSizeEnhanced_title',
      descriptionKey: 'targetSizeEnhanced_description'
    },
    helpUrl: null,
    tags: [
      'wcag21aaa',
      'wcag255',
      'navigation',
      'operable',
      'pointer',
      'target-size',
      'atomic',
      'automatic',
      'dom'
    ],
    wcagSc: ['2.5.5'],
    normativeMappings: [
      {
        standard: 'WCAG',
        version: '2.2',
        requirement: '2.5.5',
        title: 'Target Size (Enhanced)',
        conformanceLevel: 'AAA'
      }
    ],
    defaultSeverity: 'moderate',
    category: 'operable',
    type: 'automatic',
    defaultConfidence: 'medium',
    coverage: {
      facetsBySc: {
        '2.5.5': ['target-size-enhanced']
      }
    },
    margin: { measure: 'target-size-px', unit: 'px', limit: 'min', band: { absolute: 6 } },
    reasonCodes: ['undersized', 'undersized-inline-link-run', 'undersized-plausibly-essential']
  }
};
