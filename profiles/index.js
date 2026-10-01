/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The profiles built into the engine, in registry order. Each one is a
 * standard whose verdicts are not WCAG's renumbered (see profiles/README.md),
 * and exports `standard`, its registry entry, which src/coverage/standards.js
 * appends after the standards core keeps for itself, `rulesDir`, the folder
 * of its own rules, which the build compiles with core's, and `i18nDir`, the
 * folder of its dictionaries, which the build adds to core's.
 */

module.exports = [require('./rgaa')];
