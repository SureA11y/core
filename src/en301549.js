/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The EN 301 549 chapter 9 clause for each WCAG Success Criterion, per
 * version of the standard (docs/WCAG_CONFORMANCE.md#en-301-549). The same
 * table the engine uses to add EN 301 549 entries to every result's
 * `meta.normativeMappings`, published so tools can ask the reverse question:
 * which criteria a given version requires, and which of them a scan never
 * covered.
 *
 * The objects are frozen: they are the engine's own table, not copies.
 */

const {
  EN301549_VERSIONS,
  EN301549_CLAUSES,
  en301549ClausesForSc
} = require('./coverage/en301549-map.js');

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}

deepFreeze(EN301549_VERSIONS);
deepFreeze(EN301549_CLAUSES);

module.exports = { EN301549_VERSIONS, EN301549_CLAUSES, en301549ClausesForSc };
