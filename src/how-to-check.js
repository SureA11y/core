/* SPDX-License-Identifier: MPL-2.0 */

'use strict';

/**
 * How a person answers an undecided finding: the steps a core rule gives for
 * each reason code that can be cantTell (its meta.review), in a locale.
 *
 * The steps are kept out of the in-page engine, which is injected into every
 * page and frame a scan opens and has no use for them. A result gains them
 * here, in Node, after the scan: runDomRulesInPage does it for its own
 * results, and a binding that runs runa11yCoreInPage in a page calls
 * addHowToCheck on what comes back. See docs/OUTPUT_SCHEMA.md, "How to check".
 *
 * The work is src/how-to-check-core.js's, which needs no file system and is
 * published as @surea11y/core/how-to-check for a binding whose code runs in
 * a browser; this module gives it the review dictionaries from disk.
 */

const fs = require('node:fs');
const path = require('node:path');
const { applyHowToCheck, howToCheckFrom } = require('./how-to-check-core.js');

const REVIEW_DIR = path.join(__dirname, 'i18n', 'review');

const dictionaries = new Map(); // locale -> { key: text } | null
function dictionary(locale) {
  if (!dictionaries.has(locale)) {
    let dict = null;
    if (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(locale)) {
      try {
        dict = JSON.parse(fs.readFileSync(path.join(REVIEW_DIR, `${locale}.json`), 'utf8'));
      } catch {
        dict = null;
      }
    }
    dictionaries.set(locale, dict);
  }
  return dictionaries.get(locale);
}

const prefixOf = (titleKey) =>
  typeof titleKey === 'string' && titleKey.endsWith('_title')
    ? titleKey.slice(0, -'_title'.length)
    : null;

// A rule's prefix and, for a variant, its base rule's id: a pack's rule or
// variant first, then core's.
function ruleOf(ruleId, packs) {
  for (const pack of Array.isArray(packs) ? packs : []) {
    if (!pack || typeof pack !== 'object') continue;
    const all = [].concat(
      Array.isArray(pack.rules) ? pack.rules : [],
      Array.isArray(pack.variants) ? pack.variants : []
    );
    const rule = all.find((r) => r && typeof r === 'object' && r.id === ruleId);
    if (!rule) continue;
    if (Array.isArray(pack.overrides) && pack.overrides.includes(ruleId)) return null;
    const meta = rule.meta && typeof rule.meta === 'object' ? rule.meta : {};
    return {
      prefix: prefixOf(meta.i18n && meta.i18n.titleKey),
      variantOf: typeof rule.from === 'string' ? rule.from : null
    };
  }
  const def = typeof ruleId === 'string' ? require('./core').getCheckDefById(ruleId) : null;
  if (!def) return null;
  return {
    prefix: prefixOf(def.i18n && def.i18n.titleKey),
    variantOf: def.variant && typeof def.variant.of === 'string' ? def.variant.of : null
  };
}

/**
 * The steps for one finding: { steps, passWhen, failWhen } in the locale
 * (English where it has no translation), or null when the rule gives none
 * for that reason code. A variant without steps of its own for the code has
 * its base rule's. With options.packs, a pack's rules and variants are
 * known too, their own steps in English.
 */
function howToCheckFor(ruleId, reasonCode, locale, options) {
  const packs = options && typeof options === 'object' ? options.packs : null;
  const rule = ruleOf(ruleId, packs);
  if (!rule) return null;
  const base = rule.variantOf ? ruleOf(rule.variantOf, packs) : null;
  for (const prefix of [rule.prefix, base && base.prefix]) {
    if (!prefix) continue;
    const how = howToCheckFrom(dictionary, prefix, reasonCode, locale, { packs });
    if (how) return how;
  }
  return null;
}

/**
 * A copy of a scan result, a cross-frame result or a binding's frames result
 * in which each undecided finding of a core rule carries howToCheck, in the
 * scan's locale; a variant's, its base rule's where it has none of its own.
 * With options.packs, the packs the scan ran, a pack rule's finding gets the
 * steps of its meta.review, in English. Findings that already have one, and
 * decided ones, are left as they are. With options.locale, the steps are in
 * that locale instead, those a finding already has included.
 */
function addHowToCheck(result, options) {
  const opts = options && typeof options === 'object' ? options : {};
  return applyHowToCheck(result, dictionary, { packs: opts.packs, locale: opts.locale });
}

module.exports = { addHowToCheck, howToCheckFor };
