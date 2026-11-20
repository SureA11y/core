'use strict';

/**
 * __TITLE__ as standard data (core's format surea11y-standard/1), derived
 * from __BASE__'s with core's deriveStandard.
 *
 * As generated, it is the base as it is: every requirement of the base's
 * latest version, each based on the base's (basedOn), with its tests and
 * the rules that check them. Change it where your standard differs:
 *
 * - A requirement or test with fields of its own (a title in your wording,
 *   other WCAG criteria) keeps its basedOn and replaces those fields.
 * - A requirement of your own has no basedOn, and is `partial: true` until
 *   a rule checks all of it.
 * - A base requirement you leave out is not in your standard, nor are its
 *   tests or the rule-map rows that reached only it.
 * - The rule map comes from the base through basedOn. OWN_ROWS changes it:
 *   a row of your own replaces the base's for that rule, and null drops it.
 *   Give each change a page in tests/standard.test.js that the base's row
 *   would get wrong.
 */

const { deriveStandard, standardDataOf } = require('@surea11y/core/pack');
const base = require('__BASE__');

const BASE = standardDataOf(base.standard);
// The base version this one is built on: the base's latest.
const BASE_VERSION = BASE.versions.at(-1);
const baseTables = BASE.data[BASE_VERSION.version];

const VERSION = '1.0';
const NAMESPACE = '__NAMESPACE__';

// A row of the base's rule map, to change rather than write anew.
function baseRow(ruleId, change) {
  const row = baseTables.ruleMap[ruleId];
  if (!row) throw new Error(`__BASE__ has no rule-map row for ${ruleId}`);
  return change(JSON.parse(JSON.stringify(row)));
}

// Where this standard says something different from the base, rule by rule,
// each with the reason. For example:
//
//   'some-rule': null,                                   // checks nothing this standard asks
//   'other-rule': baseRow('other-rule', (row) => ({      // a failure becomes a question
//     ...row,
//     reasonCodes: { ...row.reasonCodes, SOME_CODE: { outcome: 'cantTell' } },
//     note: 'Why, in this standard’s words.'
//   })),
//   'a-core-rule': { requirements: ['1.2'], note: 'Why.' } // a rule linked anew
const OWN_ROWS = {};

// The base's profile for that version, for the WCAG version and Parsing.
const baseProfile =
  Object.values(BASE.profiles || {}).find((p) => p.version === BASE_VERSION.version) || {};

const STANDARD_DATA = deriveStandard([BASE], {
  format: 'surea11y-standard/1',
  key: NAMESPACE,
  standard: '__TITLE__',
  lang: BASE.lang,
  options: BASE.options,
  versions: [
    {
      version: VERSION,
      wcagVersion: BASE_VERSION.wcagVersion,
      basedOn: [{ standard: BASE.key, version: BASE_VERSION.version }]
    }
  ],
  data: {
    [VERSION]: {
      ...(baseTables.groups ? { groups: baseTables.groups } : {}),
      requirements: Object.fromEntries(
        Object.keys(baseTables.requirements).map((id) => [
          id,
          { basedOn: [{ standard: BASE.key, id }] }
        ])
      ),
      ruleMap: OWN_ROWS
    }
  },
  // The profile runs the rules the map links to a requirement, the base
  // pack's and core's, and reports this standard's requirements alone. A
  // profile can name the law it is used for (`law`, with `laws` beside
  // `profiles`): its name, jurisdiction and official link only.
  profiles: {
    [`${NAMESPACE}-${VERSION}`]: {
      version: VERSION,
      tags: [NAMESPACE],
      mappedRules: true,
      wcagVersion: BASE_VERSION.wcagVersion,
      ...(baseProfile.keepsParsing ? { keepsParsing: true } : {})
    }
  }
});

module.exports = { STANDARD_DATA, OWN_ROWS };
