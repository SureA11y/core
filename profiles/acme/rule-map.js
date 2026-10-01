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

const RULE_REQUIREMENTS = {
  '1.0': {},
  '2.0': {}
};

module.exports = { RULE_REQUIREMENTS };
