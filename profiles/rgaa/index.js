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

const { wcagTags } = require('../../src/wcag.js');
const { RGAA_VERSIONS } = require('./map');
const { rgaaMappingsFor, rgaaComposites, validateRgaaRuleTests } = require('./mappings');

// The WCAG A and AA tags of the WCAG version an RGAA version is built on.
const wcagTagsOf = (version) =>
  wcagTags(RGAA_VERSIONS.find((v) => v.version === version).wcagVersion);

const standard = {
  key: 'rgaa',
  standard: 'RGAA',
  versions: RGAA_VERSIONS.map((v) => v.version),
  // The profile also runs the opt-in rules for RGAA's own requirements.
  profiles: {
    'rgaa-4.1.2': {
      version: '4.1.2',
      tags: wcagTagsOf('4.1.2').concat(['rgaa']),
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

// The messages of those rules and of the entry (report.noteKey), one
// <locale>.json per locale like src/i18n/. The build adds them to core's.
const i18nDir = path.join(__dirname, 'i18n');

module.exports = { standard, rulesDir, i18nDir };
