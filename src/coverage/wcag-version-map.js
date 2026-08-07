/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Canonical WCAG-version-introduction map for Success Criteria.
 *
 * PURPOSE
 * -------
 * WCAG 2.1 and 2.2 are each a superset of the version before them -- they add new
 * Success Criteria, never remove or renumber existing ones (with the sole exception
 * of 4.1.1 Parsing, deprecated/removed in 2.2, which this engine does not implement
 * as a rule either way). This module lists exactly which SCs were newly introduced in
 * each version; every SC not listed here is WCAG 2.0 baseline.
 *
 * This is the single source of truth used by the rule-authoring consistency test
 * (`tests/coverage/wcag-version-tags.test.js`) to verify every rule's `meta.tags`
 * carries the version-correct `wcag2*`/`wcag21*`/`wcag22*` prefix for its `wcagSc`.
 *
 * `src/core/dom-runner.js`'s `buildCompositeDef` needs the identical list to compute
 * composite tags, but has to keep its own literal copy rather than import this module --
 * `runCore` is inlined into `core.js` via `Function.prototype.toString()`, so it cannot
 * reference anything outside its own function body at runtime. If you change the lists
 * below, update that literal too.
 *
 * SOURCE: W3C WCAG 2.1 and 2.2 "Success Criteria" tables (each SC's own "Introduced in
 * version" note). Each SC belongs to exactly one origin version, which is the model
 * this file encodes.
 */

// SCs newly introduced in WCAG 2.1 (not present in WCAG 2.0).
const WCAG21_NEW_SCS = [
  '1.3.4',  // Orientation (AA)
  '1.3.5',  // Identify Input Purpose (AA)
  '1.3.6',  // Identify Purpose (AAA)
  '1.4.10', // Reflow (AA)
  '1.4.11', // Non-text Contrast (AA)
  '1.4.12', // Text Spacing (AA)
  '1.4.13', // Content on Hover or Focus (AA)
  '2.1.4',  // Character Key Shortcuts (A)
  '2.2.6',  // Timeouts (AAA)
  '2.3.3',  // Animation from Interactions (AAA)
  '2.5.1',  // Pointer Gestures (A)
  '2.5.2',  // Pointer Cancellation (A)
  '2.5.3',  // Label in Name (A)
  '2.5.4',  // Motion Actuation (A)
  '2.5.5',  // Target Size -- Enhanced (AAA)
  '2.5.6',  // Concurrent Input Mechanisms (AAA)
  '4.1.3'   // Status Messages (AA)
];

// SCs newly introduced in WCAG 2.2 (not present in WCAG 2.0 or 2.1).
const WCAG22_NEW_SCS = [
  '2.4.11', // Focus Not Obscured (Minimum) (AA)
  '2.4.12', // Focus Not Obscured (Enhanced) (AAA)
  '2.4.13', // Focus Appearance (AAA)
  '2.5.7',  // Dragging Movements (AA)
  '2.5.8',  // Target Size (Minimum) (AA)
  '3.2.6',  // Consistent Help (A)
  '3.3.7',  // Redundant Entry (A)
  '3.3.8',  // Accessible Authentication (Minimum) (AA)
  '3.3.9'   // Accessible Authentication (Enhanced) (AAA)
];

function introducedInVersion(sc) {
  const s = String(sc || '').trim();
  if (WCAG22_NEW_SCS.includes(s)) return '2.2';
  if (WCAG21_NEW_SCS.includes(s)) return '2.1';
  return '2.0';
}

// Given a rule/composite's wcagSc list, returns the runOnly.tags prefix
// ('wcag2' | 'wcag21' | 'wcag22') it should be tagged with -- a 2.2-origin SC wins
// over a 2.1-origin one if a rule/composite ever spans both (rare; none do today).
function versionTagPrefixForScs(wcagScList) {
  const list = Array.isArray(wcagScList) ? wcagScList.map(String) : [];
  if (list.some((sc) => WCAG22_NEW_SCS.includes(sc))) return 'wcag22';
  if (list.some((sc) => WCAG21_NEW_SCS.includes(sc))) return 'wcag21';
  return 'wcag2';
}

module.exports = { WCAG21_NEW_SCS, WCAG22_NEW_SCS, introducedInVersion, versionTagPrefixForScs };
