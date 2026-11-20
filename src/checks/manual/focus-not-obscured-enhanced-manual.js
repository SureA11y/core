/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * @check focus-not-obscured-enhanced
 * @atomic true
 * @summary No part of a focused element should be hidden behind content the page keeps in place
 * @standard WCAG 2.2
 * @sc 2.4.12
 * @applicability
 *   What focus-not-obscured-minimum applies to: in a browser, the elements
 *   in the tab order that are drawn and scroll with the page, and the
 *   `position: fixed` or `sticky` boxes that draw something over it.
 *   Without a layout (jsdom), notApplicable.
 * @expectation
 *   No element in the tab order can take focus with any part of it hidden
 *   behind such a box, even one it shows through (a semi-transparent or
 *   dimming box obscures it, as WCAG's Understanding 2.4.12 says, where
 *   focus-not-obscured-minimum lets it pass): where a box covers part of
 *   the window the page's `scroll-padding` doesn't take out, an element that
 *   reaches under it and can be scrolled there takes focus partly hidden.
 *   One finding per box,
 *   naming how many elements it can hide entirely and how many in part. A
 *   `scroll-padding` on the page at least as large as the box (C43) clears
 *   it. Content the user opened and can close without moving focus is
 *   allowed, and a script-made modal dialog that leaves the page able to
 *   take focus is reported apart, as in focus-not-obscured-minimum.
 *   It is focus-not-obscured-minimum run with `obscured: 'partly'` (a
 *   variant: docs/RULE_AUTHORING.md, "Rule variants"), so a fix to that
 *   rule's measuring reaches this one.
 * @reports
 *   - As focus-not-obscured-minimum's, with `metrics.partlyCount`: how many
 *     elements can take focus partly hidden, and not entirely.
 * @reason-codes
 *   - `FOCUS_OBSCURED_ENTIRELY` (cantTell): elements in the tab order can
 *     take focus entirely hidden behind a box the page keeps in place over
 *     part of the window it counts as in view. It leans fail: the box covers
 *     them whatever the user does, unless the user opened it and can close it
 *     without moving focus. A box a control marks as opened (`openedByUser`)
 *     gets no lean.
 *     Basis: WCAG 2.4.12; F110; C43.
 *   - `FOCUS_OBSCURED_PARTLY` (cantTell): elements in the tab order can take
 *     focus partly hidden behind such a box, none entirely. It leans fail,
 *     with the same caution, but for a box a control marks as opened.
 *     Basis: WCAG 2.4.12; C43.
 *   - `FOCUS_OBSCURED_BEHIND_MODAL` (cantTell): a script-made modal dialog
 *     is open, but elements outside it still take focus, hidden behind the
 *     dialog or its backdrop. It leans fail.
 *     Basis: WCAG 2.4.12; WAI-ARIA 1.2 aria-modal (not settled); ARIA APG
 *     Dialog (Modal) Pattern (best practice).
 */

module.exports = {
  id: 'focus-not-obscured-enhanced',
  from: 'focus-not-obscured-minimum',
  config: { obscured: 'partly' },
  meta: {
    title: 'No part of a focused element should be hidden',
    description:
      'Checks that no element in the tab order can take focus with any part of it hidden behind content the page keeps in place, such as a sticky header or footer or a cookie banner.',
    i18n: {
      titleKey: 'focusNotObscuredEnhanced_title',
      descriptionKey: 'focusNotObscuredEnhanced_description'
    },
    helpUrl: null,
    tags: ['wcag22aaa', 'wcag2412', 'navigation', 'focus', 'css', 'layout', 'atomic', 'manual'],
    wcagSc: ['2.4.12'],
    normativeMappings: [
      {
        standard: 'WCAG',
        version: '2.2',
        requirement: '2.4.12',
        title: 'Focus Not Obscured (Enhanced)',
        conformanceLevel: 'AAA'
      }
    ],
    defaultSeverity: 'moderate',
    category: 'operable',
    type: 'manual',
    defaultConfidence: 'low',
    coverage: {
      facetsBySc: {
        '2.4.12': ['focus-fully-visible']
      }
    },
    reasonCodes: ['FOCUS_OBSCURED_ENTIRELY', 'FOCUS_OBSCURED_PARTLY', 'FOCUS_OBSCURED_BEHIND_MODAL']
  }
};
