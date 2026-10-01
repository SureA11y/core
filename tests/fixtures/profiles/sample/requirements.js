/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

// The sample standard's requirements, the same in both versions.
const VERSIONS = [
  { version: '1.0', wcagVersion: '2.1' },
  { version: '2.0', wcagVersion: '2.2' }
];

const REQS = {
  S1: { title: 'Images have a text alternative', wcagSc: ['1.1.1'] },
  S2: { title: 'Image map areas are named', wcagSc: ['1.1.1'] },
  S3: { title: 'Decorative images are marked as such', wcagSc: ['1.1.1'] },
  S4: { title: 'Headings are in order', wcagSc: [] },
  S5: { title: 'Page titles are short', wcagSc: [] },
  S6: { title: 'Every page links to the accessibility statement', wcagSc: [] },
  S7: { title: 'Text reaches a contrast ratio of 7:1', wcagSc: ['1.4.6'] },
  S8: { title: 'The page body is never hidden', wcagSc: ['4.1.2'] }
};

const REQUIREMENTS = { '1.0': { ...REQS }, '2.0': { ...REQS } };

module.exports = { VERSIONS, REQUIREMENTS };
