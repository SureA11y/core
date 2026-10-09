/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Which member expressions must go through the safe DOM accessors
 * (src/core/safe-dom.js). The test lives with the lint rule in
 * src/eslint-plugin.js; the rewrite in use-safe-dom.js uses it from here, so
 * the two always agree.
 */

const { isUnsafeDomMember, NAMES } = require('../../src/eslint-plugin');

module.exports = { isUnsafeDomMember, NAMES };
