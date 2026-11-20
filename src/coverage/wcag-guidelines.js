/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * WCAG 2's principles and guidelines, as WCAG 2.2 titles them, by number: the
 * groups a list of procedures puts the criteria in (src/procedures-core.js).
 * A criterion's guideline is its number's first two parts ('1.4' for
 * 1.4.3), and a guideline's principle its first ('1').
 */

const WCAG_PRINCIPLES = Object.freeze({
  1: 'Perceivable',
  2: 'Operable',
  3: 'Understandable',
  4: 'Robust'
});

const WCAG_GUIDELINES = Object.freeze({
  1.1: 'Text Alternatives',
  1.2: 'Time-based Media',
  1.3: 'Adaptable',
  1.4: 'Distinguishable',
  2.1: 'Keyboard Accessible',
  2.2: 'Enough Time',
  2.3: 'Seizures and Physical Reactions',
  2.4: 'Navigable',
  2.5: 'Input Modalities',
  3.1: 'Readable',
  3.2: 'Predictable',
  3.3: 'Input Assistance',
  4.1: 'Compatible'
});

module.exports = { WCAG_PRINCIPLES, WCAG_GUIDELINES };
