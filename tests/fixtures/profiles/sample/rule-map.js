/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

// Which of the sample standard's requirements each rule checks: core's rules
// for images and headings, its own for the rest.
const ROWS = {
  'img-alt-present': { requirements: ['S1'], note: 'An image with no alternative fails S1.' },
  'area-alt-present': { requirements: ['S2'], note: 'An unnamed area fails S2.' },
  'img-alt-decorative': { requirements: ['S3'], note: 'Asks whether an empty alt is right.' },
  'heading-order': { requirements: ['S4'], note: 'A skipped level fails S4.' },
  'sample-title-length': { requirements: ['S5'], note: 'Its own rule.' },
  'sample-statement-link': { requirements: ['S6'], note: 'Its own rule.' },
  'sample-contrast-enhanced': { requirements: ['S7'], note: 'Its own variant.' },
  'aria-hidden-body': { requirements: ['S8'], note: 'A hidden body fails S8.' }
};

const RULE_REQUIREMENTS = { '1.0': { ...ROWS }, '2.0': { ...ROWS } };

module.exports = { RULE_REQUIREMENTS };
