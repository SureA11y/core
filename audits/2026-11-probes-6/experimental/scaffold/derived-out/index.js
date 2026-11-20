'use strict';

/**
 * Derived Standard: a standard for @surea11y/core, built on base-pack.
 *
 * standard-data.js derives the standard from the base pack's data: its
 * requirements and tests, and the rules that check each, as the base has
 * them, with the changes this standard makes. The pack runs the base pack's
 * rules as its own standard maps them (uses), so a scan passes both packs:
 *
 *   runDomRulesInPage(url, null, { packs: [base, pack], profile: 'derived-1.0' })
 *
 * Standard data, derivation and uses are experimental in core: a later minor
 * may change them, so `core` takes no later minor (README.md).
 */

const { definePack, standardFromData } = require('@surea11y/core/pack');
const base = require('base-pack');
const { name, version } = require('./package.json');
const { STANDARD_DATA } = require('./standard-data');

module.exports = definePack({
  name,
  version,
  namespace: 'derived', // every rule, rollup and profile id starts with "derived-"
  core: '~1.17.0', // the core versions the pack works with

  // The packs this one builds on: a scan runs it only with them, at the
  // version it was made with.
  uses: [base],

  // Rules of its own, if the standard needs a check the base has none for.
  rules: [],

  standard: standardFromData(STANDARD_DATA)
});
