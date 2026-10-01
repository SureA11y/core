/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The sample profile: a made-up standard that core's tests build into a copy
 * of the engine (tests/helpers/sampleEngine.js), so that what profiles do is
 * tested without depending on any real standard. It is never shipped.
 *
 * Two versions, built on WCAG 2.1 and 2.2. Its requirements are mapped rule
 * by rule (src/profile-kit.js): core rules for its images and headings, its
 * own opt-in rules (tag `sample`) for the rest, one of them a variant of
 * contrast-minimum and one that differs by version through ctx.standard.
 * Version 2.0 waives WCAG 3.3.8 (exclude). It offers English and French.
 */

const path = require('path');

const { ruleMappedStandard } = require('../../src/profile-kit.js');
const { VERSIONS, REQUIREMENTS } = require('./requirements');
const { RULE_REQUIREMENTS } = require('./rule-map');

const { mappingsFor, composites, validate, wcagTagsOf } = ruleMappedStandard({
  standard: 'Sample Standard',
  tag: 'sample',
  versions: VERSIONS,
  requirements: REQUIREMENTS,
  ruleMap: RULE_REQUIREMENTS
});

const standard = {
  key: 'sample',
  standard: 'Sample Standard',
  versions: VERSIONS.map((v) => v.version),
  profiles: {
    'sample-1.0': {
      version: '1.0',
      tags: wcagTagsOf('1.0').concat(['sample']),
      mappedRules: true
    },
    'sample-2.0': {
      version: '2.0',
      tags: wcagTagsOf('2.0').concat(['sample']),
      mappedRules: true,
      exclude: { criteria: ['3.3.8'] }
    }
  },
  ruleTag: 'sample',
  ruleMapped: true,
  mappingsFor,
  composites,
  validate,
  report: { noteKey: 'report_sampleRollup_note' }
};

const rulesDir = path.join(__dirname, 'rules');
const i18nDir = path.join(__dirname, 'i18n');

module.exports = { standard, rulesDir, i18nDir };
