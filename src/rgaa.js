/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * RGAA, the French accessibility standard: its themes, criteria and tests per
 * version, with RGAA's own correspondence to WCAG
 * (docs/WCAG_CONFORMANCE.md#rgaa). Published for tools that need to work in
 * RGAA's terms: list the criteria an audit rates, show a test's wording, or
 * find which criteria RGAA relates to a given WCAG Success Criterion.
 *
 * The text is RGAA's own French wording (DINUM, Licence Ouverte 2.0). The
 * objects are frozen: they are the engine's own table, not copies.
 */

const {
  RGAA_VERSIONS,
  RGAA_THEMES,
  RGAA_CRITERIA,
  RGAA_TESTS,
  rgaaCriteriaForSc
} = require('./coverage/rgaa-map.js');

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) deepFreeze(v);
  }
  return value;
}

deepFreeze(RGAA_VERSIONS);
deepFreeze(RGAA_THEMES);
deepFreeze(RGAA_CRITERIA);
deepFreeze(RGAA_TESTS);

module.exports = { RGAA_VERSIONS, RGAA_THEMES, RGAA_CRITERIA, RGAA_TESTS, rgaaCriteriaForSc };
