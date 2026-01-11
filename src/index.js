'use strict';

/**
 * a11y-core public API
 *
 * IMPORTANT:
 * - `runa11yCoreInPage` MUST be self-contained (no free vars),
 *   because it is executed via page.evaluate in real browsers.
 */

const core = require('./core.js'); // adjust path if your built output differs

module.exports = {
  ENGINE_TAG: core.ENGINE_TAG,

  // catalog helpers
  getRuleDefById: core.getRuleDefById,
  getRulesCatalog: core.getRulesCatalog,
  getRulesForRunOnly: core.getRulesForRunOnly,

  // in-page runners
  runDomRulesInPage: core.runDomRulesInPage,
  runa11yCoreInPage: core.runa11yCoreInPage
};
