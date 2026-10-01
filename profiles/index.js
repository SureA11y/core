/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The profiles built into the engine, in registry order. Each one is a
 * standard whose verdicts are not WCAG's renumbered (see profiles/README.md),
 * and exports `standard`, its registry entry, which src/coverage/standards.js
 * appends after the standards core keeps for itself, and `rulesDir`, the
 * folder of its own rules, which the build compiles with core's.
 */

module.exports = [require('./rgaa')];
