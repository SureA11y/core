/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

// Derives a coarse structural signature from an occurrence's CSS selector, for
// grouping (see docs/ai-assisted-explanations.design.md §5's dedup-by-group-key).
// Strips positional/id parts (:nth-child(n), #foo) since those are per-page
// noise, not the structural shape an explanation should key off of; keeps tag
// names, classes, and attribute selectors (e.g. [role=button]), and keeps only
// the last two segments -- deep enough to distinguish "a>span[role=button]"
// from a bare "span[role=button]", shallow enough to still dedupe reliably
// across repeated widget instances on the same page.
function coarseStructuralSignature(selector) {
  if (typeof selector !== 'string' || !selector.trim()) return '';

  const segments = selector
    .split('>')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) =>
      segment
        .replace(/:nth-(?:child|of-type)\(\s*\d+\s*\)/g, '')
        .replace(/#[^\s.[:]+/g, '')
        .trim()
    )
    .filter(Boolean);

  return segments.slice(-2).join('>');
}

module.exports = { coarseStructuralSignature };
