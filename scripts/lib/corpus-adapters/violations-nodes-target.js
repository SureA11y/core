/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * Adapter for other-engine-corpus-check.js: interprets a scan result shaped
 * like { violations: [{ nodes: [{ target }] }] }, a common shape several DOM
 * accessibility scanners share, and returns the flagged nodes as CSS
 * selectors the driver can resolve back to a fixture case.
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
  const selectors = [];

  for (const violation of violations) {
    const nodes = (violation && violation.nodes) || [];
    for (const node of nodes) {
      const target = node && node.target;
      if (typeof target === 'string') {
        selectors.push(target);
        continue;
      }
      if (!Array.isArray(target) || !target.length) continue;
      const last = target[target.length - 1];
      if (typeof last === 'string') selectors.push(last);
      else if (Array.isArray(last) && last.length) selectors.push(last[last.length - 1]);
    }
  }

  return selectors;
};
