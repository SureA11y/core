/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Which of ACME's requirements each rule checks, per version:
 * RULE_REQUIREMENTS[version][ruleId] = { requirements: [id...], note }.
 *
 * Any rule may be listed: a core rule (WCAG's or best practice's) or one of
 * the profile's own (rules/). A rule maps to a requirement when its failure,
 * or for a manual rule the question it raises, is direct evidence about what
 * the requirement asks. `note` says why, for review. The build rejects an
 * unknown rule or requirement (mappings.js, validate).
 */

// B4 makes two of core's best-practice rules mandatory; B5 reuses one of
// RGAA's own rules (stress points 6 and 7 of DESIGN.md).
const ROWS = {
  'acme-contrast-uniform': {
    requirements: ['B2'],
    note: "ACME's variant of contrast-minimum: 4.5:1 for all text."
  },
  'acme-statement-link': {
    requirements: ['B3'],
    note: "ACME's own rule: a link to the statement, by text or URL, in the footer under 2.0."
  },
  'heading-order': {
    requirements: ['B4'],
    note: 'Core best-practice rule: heading levels that skip.'
  },
  region: {
    requirements: ['B4'],
    note: 'Core best-practice rule: content outside every landmark.'
  },
  'skip-link-present': {
    requirements: ['B5'],
    note: "RGAA's rule (tag rgaa): a page whose navigation comes before its main content has no skip link."
  }
};

const RULE_REQUIREMENTS = {
  '1.0': { ...ROWS },
  '2.0': { ...ROWS }
};

module.exports = { RULE_REQUIREMENTS };
