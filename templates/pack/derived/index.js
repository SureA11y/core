'use strict';

/**
 * __TITLE__: a standard for @surea11y/core, built on __BASE__.
 *
 * standard-data.js derives the standard from the base pack's data: its
 * requirements and tests, and the rules that check each, as the base has
 * them, with the changes this standard makes. The pack runs the base pack's
 * rules as its own standard maps them (uses), so a scan passes both packs:
 *
 *   runDomRulesInPage(url, null, { packs: [base, pack], profile: '__NAMESPACE__-1.0' })
 *
 * Standard data, derivation and uses are experimental in core: a later minor
 * may change them, so `core` takes no later minor (README.md).
 */

const { definePack, standardFromData } = require('@surea11y/core/pack');
const base = require('__BASE__');
const { name, version } = require('./package.json');
const { STANDARD_DATA } = require('./standard-data');

module.exports = definePack({
  name,
  version,
  namespace: '__NAMESPACE__', // every rule, rollup and profile id starts with "__NAMESPACE__-"
  core: '__CORE__', // the core versions the pack works with

  // The packs this one builds on: a scan runs it only with them, at the
  // version it was made with.
  uses: [base],

  // Rules of its own, if the standard needs a check the base has none for.
  rules: [],

  standard: standardFromData(STANDARD_DATA)
});
