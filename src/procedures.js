/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * How a person assesses a criterion by hand (docs/PROCEDURES.md), in Node:
 * src/procedures-core.js's, published as @surea11y/core/procedures for code
 * that runs in a browser, with the procedures' dictionaries read from disk
 * (src/i18n/procedures/<locale>.json).
 */

const fs = require('node:fs');
const path = require('node:path');
const { proceduresFrom } = require('./procedures-core.js');

const PROCEDURES_DIR = path.join(__dirname, 'i18n', 'procedures');

const dictionaries = new Map(); // locale -> { key: text } | null
function dictionary(locale) {
  if (!dictionaries.has(locale)) {
    let dict = null;
    if (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(locale)) {
      try {
        dict = JSON.parse(fs.readFileSync(path.join(PROCEDURES_DIR, `${locale}.json`), 'utf8'));
      } catch {
        dict = null;
      }
    }
    dictionaries.set(locale, dict);
  }
  return dictionaries.get(locale);
}

/**
 * How a person assesses a WCAG 2.2 criterion ('1.4.13'), the best practices
 * ('best-practice'), or, with options.packs, a requirement of a pack's
 * standard (options.standard, options.version), by hand, in options.locale
 * (English where it has no translation); null for a requirement none of
 * them knows.
 */
function proceduresFor(requirement, options) {
  const opts = options && typeof options === 'object' ? options : {};
  return proceduresFrom(dictionary, requirement, {
    locale: opts.locale,
    packs: opts.packs,
    standard: opts.standard,
    version: opts.version
  });
}

module.exports = { proceduresFor };
