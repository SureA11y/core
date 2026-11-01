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
const {
  listProceduresFrom,
  procedureChecklistFrom,
  procedureLanguagesFrom,
  proceduresFrom,
  relatedRequirements,
  renderProceduresFrom
} = require('./procedures-core.js');

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
 * How a person assesses a WCAG 2.2 criterion ('1.4.12'), the best practices
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

/**
 * Every requirement of a standard, in its order and groups, as
 * proceduresFor gives each: WCAG's criteria (options.standard 'wcag', the
 * default) in options.version at options.levels, the best practices, or a
 * pack's standard (options.packs); options.tools, options.automation and
 * options.rules keep only the facets that match. null for a standard or
 * version none of them has.
 */
function listProcedures(options) {
  return listProceduresFrom(dictionary, options);
}

/**
 * What a person does to assess a standard by hand, once each: one item per
 * general procedure, with the requirements it serves and the facets it
 * covers. Takes listProcedures' options.
 */
function procedureChecklist(options) {
  return procedureChecklistFrom(dictionary, options);
}

/**
 * The languages a standard's procedures can be read in, its own first:
 * [{ locale, complete, missing }], from the dictionaries core ships and the
 * packs'. Takes listProcedures' standard, version and packs.
 */
function procedureLanguages(options) {
  const opts = options && typeof options === 'object' ? options : {};
  return procedureLanguagesFrom(dictionary, {
    standard: opts.standard,
    version: opts.version,
    packs: opts.packs,
    locales: shippedLocales()
  });
}

// The locales core ships procedures for: the dictionaries on disk.
let shipped;
function shippedLocales() {
  if (!shipped) {
    let files;
    try {
      files = fs.readdirSync(PROCEDURES_DIR);
    } catch {
      files = [];
    }
    shipped = files
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.slice(0, -'.json'.length))
      .sort();
  }
  return shipped;
}

/**
 * Procedures as a document: what listProcedures, procedureChecklist or
 * proceduresFor gives, as an HTML page or Markdown (options.format), in
 * the locale the procedures were read in (docs/PROCEDURES.md#rendering-them).
 */
function renderProcedures(input, options) {
  return renderProceduresFrom(dictionary, input, options);
}

module.exports = {
  listProcedures,
  procedureChecklist,
  procedureLanguages,
  proceduresFor,
  relatedRequirements,
  renderProcedures
};
