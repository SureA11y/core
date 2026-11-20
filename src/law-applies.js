/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Whether a requirement of standard.procedures applies under a profile's
 * law: one that names no laws applies under every profile; one that names
 * some (experimental, src/experimental.js), under a profile whose law is one
 * of them. On its own, with nothing else, so the registry
 * (src/coverage/standards.js), which the report bundle carries, reads it
 * without the rest of src/laws.js.
 */
function appliesUnder(entry, law) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry) || !Array.isArray(entry.laws)) {
    return true;
  }
  return typeof law === 'string' && entry.laws.includes(law);
}

module.exports = { appliesUnder };
