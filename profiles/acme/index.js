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
const { mappingsFor, composites, validate } = require('./mappings');

// The WCAG version each ACME version builds on, as the tags of its A and AA
// rules.
const WCAG21_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const WCAG22_AA_TAGS = WCAG21_AA_TAGS.concat(['wcag22a', 'wcag22aa']);

const standard = {
  key: 'acme',
  standard: 'ACME',
  versions: VERSIONS.map((v) => v.version),
  // One conformance target per version: WCAG's rules, every rule the version
  // maps (mappedRules) and the standard's own rules (its tag).
  profiles: {
    'acme-1.0': {
      version: '1.0',
      tags: WCAG21_AA_TAGS.concat(['acme']),
      mappedRules: true
    },
    'acme-2.0': {
      version: '2.0',
      tags: WCAG22_AA_TAGS.concat(['acme']),
      mappedRules: true
    }
  },
  ruleTag: 'acme',
  ruleMapped: true,
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
