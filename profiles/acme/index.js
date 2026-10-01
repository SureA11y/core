/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * ACME, as a profile: its registry entry (see ENTRY SHAPE in
 * src/coverage/standards.js), its rules and its dictionaries. Created by
 * scripts/profile-new.js. ACME is a made-up standard that tests the profile
 * model (DESIGN.md); it is never merged.
 */

const path = require('path');

const { VERSIONS } = require('./requirements');
const { mappingsFor, composites, validate, wcagTagsOf } = require('./mappings');

const standard = {
  key: 'acme',
  standard: 'ACME',
  versions: VERSIONS.map((v) => v.version),
  // One conformance target per version: WCAG's rules, every rule the version
  // maps (mappedRules) and the standard's own rules (its tag).
  profiles: {
    'acme-1.0': {
      version: '1.0',
      tags: wcagTagsOf('1.0').concat(['acme']),
      mappedRules: true
    },
    'acme-2.0': {
      version: '2.0',
      tags: wcagTagsOf('2.0').concat(['acme']),
      mappedRules: true,
      // B6: ACME 2.0 waives WCAG 3.3.8 for internal tools.
      exclude: { criteria: ['3.3.8'] }
    }
  },
  ruleTag: 'acme',
  ruleMapped: true,
  // Part A restates WCAG one criterion at a time, as EN 301 549 does, so a
  // rollup names it whatever rule decided (finding F3, DESIGN.md).
  restatedPrefixes: ['A.'],
  mappingsFor,
  composites,
  validate,
  report: { noteKey: 'report_acmeRollup_note' }
};

// The profile's own rules, in automatic/ and manual/, compiled with core's.
const rulesDir = path.join(__dirname, 'rules');

// Their messages, one <locale>.json per locale, added to core's.
const i18nDir = path.join(__dirname, 'i18n');

module.exports = { standard, rulesDir, i18nDir };
