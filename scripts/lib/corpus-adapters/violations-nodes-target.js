/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Adapter for other-engine-corpus-check.js: interprets a scan result shaped
 * like { violations: [{ id, nodes: [{ target }] }] }, a common shape several
 * DOM accessibility scanners share, and returns the flagged nodes as
 * { selector, findingId } pairs the driver resolves back to a fixture case.
 * findingId (the violation's own rule id) lets a gap be filtered by whether
 * it plausibly concerns the same thing the compared rule does, rather than
 * every one of the other tool's rules being treated as equally relevant.
 *
 * A node's target is usually a single selector, or an array ending in one
 * (a multi-frame target carries the frame chain first); the last entry is
 * what resolves against the current document.
 *
 * This file's source is inlined and evaluated inside the scanned page (see
 * other-engine-corpus-check.js), so it must stay a plain, self-contained
 * function: no closures over anything outside its own argument, no
 * require()/import.
 */
module.exports = function adaptViolationsNodesTarget(rawResult) {
  const violations = (rawResult && rawResult.violations) || [];
  const findings = [];

  for (const violation of violations) {
    const findingId = (violation && violation.id) || null;
    const nodes = (violation && violation.nodes) || [];
    for (const node of nodes) {
      const target = node && node.target;
      let selector = null;
      if (typeof target === 'string') {
        selector = target;
      } else if (Array.isArray(target) && target.length) {
        const last = target[target.length - 1];
        if (typeof last === 'string') selector = last;
        else if (Array.isArray(last) && last.length) selector = last[last.length - 1];
      }
      if (selector) findings.push({ selector, findingId });
    }
  }

  return findings;
};
