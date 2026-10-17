'use strict';

/**
 * A standard that restates WCAG one criterion at a time, as a pack: each
 * Level A and AA criterion of the WCAG version a version is built on is a
 * requirement numbered `R` + the criterion's own number (WCAG 1.4.3 is
 * R1.4.3). Version 1.0 is built on WCAG 2.1, so it keeps 4.1.1 Parsing, and
 * version 2.0 on WCAG 2.2, so it has 2.5.8 and not 4.1.1. It is not mapped
 * rule by rule: a rule names the requirements of its WCAG criteria, and a
 * rollup names them whichever rules decided it.
 *
 * Core has no such standard of its own; this is the shape a pack like EN 301
 * 549's takes, for the tests of what core does with one.
 */

const { definePack, wcagTags } = require('../../../src/pack.js');
const { wcagCriteria } = require('../../../src/wcag.js');

const VERSIONS = [
  { version: '1.0', wcagVersion: '2.1' },
  { version: '2.0', wcagVersion: '2.2' }
];

// Per version, the criteria it restates with their titles: { '1.4.3': title }.
const CRITERIA = Object.fromEntries(
  VERSIONS.map(({ version, wcagVersion }) => [
    version,
    Object.fromEntries(
      wcagCriteria(wcagVersion, { levels: ['A', 'AA'] }).map((c) => [c.sc, c.title])
    )
  ])
);

// Every requirement that restates one of these criteria, one per version
// that has it, in table order.
function mappingsFor({ wcagSc }) {
  const out = [];
  for (const sc of Array.isArray(wcagSc) ? wcagSc : []) {
    for (const { version } of VERSIONS) {
      const title = CRITERIA[version][String(sc)];
      if (!title) continue;
      out.push({
        standard: 'Restating Standard',
        version,
        requirement: 'R' + sc,
        title,
        wcagSc: [String(sc)]
      });
    }
  }
  return out;
}

const standard = {
  key: 'restating',
  standard: 'Restating Standard',
  versions: VERSIONS.map((v) => v.version),
  profiles: Object.fromEntries(
    VERSIONS.map(({ version, wcagVersion }) => [
      'restating-' + version,
      { version, tags: wcagTags(wcagVersion).concat(['restating']) }
    ])
  ),
  ruleTag: 'restating',
  mappingsFor
};

module.exports = definePack({
  name: 'restating-pack',
  version: '1.0.0',
  namespace: 'restating',
  core: '>=1.10.0',
  standard
});
