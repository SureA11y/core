'use strict';

/**
 * A pack standing in for @surea11y/pack-en301549: a standard with the key and
 * name of core's built-in EN 301 549 (deprecated), its V4.1.1 profile, and
 * the clauses of core's own table, each entry marked `fromPack: true` so a
 * test can tell whose entries a result carries. Core's tests can't depend on
 * the real pack.
 */

const { definePack, wcagTags } = require('../../../src/pack.js');
const { en301549ClausesForSc } = require('../../../src/coverage/en301549-map.js');

function mappingsFor({ wcagSc }) {
  return (Array.isArray(wcagSc) ? wcagSc : []).flatMap((sc) =>
    en301549ClausesForSc(sc).map((c) => ({
      standard: 'EN 301 549',
      version: c.version,
      requirement: c.clause,
      title: c.title,
      wcagSc: [String(sc)],
      fromPack: true
    }))
  );
}

module.exports = definePack({
  name: 'en301549-stand-in',
  version: '1.0.0',
  namespace: 'en301549',
  core: '*',
  standard: {
    key: 'en301549',
    standard: 'EN 301 549',
    versions: ['V3.2.1', 'V4.1.1'],
    profiles: { 'en301549-v4.1.1': { version: 'V4.1.1', tags: wcagTags('2.2') } },
    mappingsFor
  }
});
