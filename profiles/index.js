/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The profiles built into the engine, in registry order. Each one is a
 * standard whose verdicts are not WCAG's renumbered (see profiles/README.md);
 * the registry in src/coverage/standards.js appends their `standard` entries
 * after the standards core keeps for itself.
 */

module.exports = [require('./rgaa')];
