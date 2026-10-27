'use strict';

/**
 * The restating test pack with its version 1.0 profile (WCAG 2.1) keeping
 * 4.1.1 Parsing as written (keepsParsing), as EN 301 549 V3.2.1 does in its
 * pack: a duplicate id still fails under it.
 */

const { definePack } = require('../../../src/pack.js');
const restating = require('./restating.js');

const profiles = restating.standard.profiles;

module.exports = definePack({
  ...restating,
  name: 'restating-keeps-parsing-pack',
  standard: {
    ...restating.standard,
    profiles: {
      ...profiles,
      'restating-1.0': { ...profiles['restating-1.0'], keepsParsing: true }
    }
  }
});
