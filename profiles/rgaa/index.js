/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The RGAA profile: RGAA 4.1.2, the French accessibility standard, as a
 * standard of the registry (src/coverage/standards.js, where ENTRY SHAPE
 * describes each field).
 *
 * RGAA does not restate WCAG criterion by criterion, so the profile brings
 * its own parts: the criteria and tests (map.js, generated from data/), the
 * tests each rule checks (rule-map.js), the entries and per-criterion rollups
 * built from them (mappings.js), and opt-in rules for RGAA's own
 * requirements, tagged `rgaa` (rules/).
 */

const path = require('path');

const { RGAA_VERSIONS } = require('./map');
const { rgaaMappingsFor, rgaaComposites, validateRgaaRuleTests } = require('./mappings');

// RGAA 4.1.2 is built on WCAG 2.1 A and AA.
const WCAG21_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const standard = {
  key: 'rgaa',
  standard: 'RGAA',
  versions: RGAA_VERSIONS.map((v) => v.version),
  // The profile also runs the opt-in rules for RGAA's own requirements.
  profiles: {
    'rgaa-4.1.2': {
      version: '4.1.2',
      tags: WCAG21_AA_TAGS.concat(['rgaa']),
      mappedRules: true
    }
  },
  ruleTag: 'rgaa',
  ruleMapped: true,
  // Mapped rule by rule (rule-map.js): RGAA's criteria are its own, related
  // to WCAG many to many.
  mappingsFor: rgaaMappingsFor,
  composites: rgaaComposites,
  validate: validateRgaaRuleTests,
  report: { noteKey: 'report_rgaaRollup_note', titleLang: 'fr' }
};

// The profile's rules, in automatic/ and manual/ like src/checks/. The build
// compiles them into the engine with core's.
const rulesDir = path.join(__dirname, 'rules');

module.exports = { standard, rulesDir };
