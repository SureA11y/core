/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * The laws' helpers the registry (src/coverage/standards.js), which the
 * report bundle carries, reads without the rest of src/laws.js.
 */

// A language tag in its canonical case (BCP 47): the language lower case, a
// script title case, a region upper case: 'fr-CA', 'zh-Hant-TW'. Tags are
// compared without regard to case; this is how one is given back.
function canonicalTag(tag) {
  return String(tag)
    .split('-')
    .map((part, i) => {
      if (i === 0) return part.toLowerCase();
      if (/^[a-z]{4}$/i.test(part)) return part[0].toUpperCase() + part.slice(1).toLowerCase();
      if (/^([a-z]{2}|\d{3})$/i.test(part)) return part.toUpperCase();
      return part.toLowerCase();
    })
    .join('-');
}

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

module.exports = { appliesUnder, canonicalTag };
