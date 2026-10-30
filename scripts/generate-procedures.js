'use strict';

/**
 * Generate, from the procedures (src/procedures/registry.js and the text in
 * src/i18n/procedures/<locale>.json):
 *
 * - the review dictionaries (src/i18n/review/<locale>.json, published as
 *   @surea11y/core/review/<locale>): each holds the steps of every variant
 *   the registry lists, in the order the text has them, so that a result's
 *   howToCheck reads them by its rule's prefix and reason code, in Node or
 *   in a browser;
 * - src/procedures/rules.json: each core rule's prefix, the criteria it
 *   tests and the facets it claims, which @surea11y/core/procedures reads
 *   without the rules (src/procedures-core.js).
 *
 * Usage:
 *   npm run procedures          write them
 *   npm run procedures:check    exit 1 if any of them is out of date
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PROCEDURES_DIR = path.join(ROOT, 'src', 'i18n', 'procedures');
const REVIEW_DIR = path.join(ROOT, 'src', 'i18n', 'review');
const RULES_FILE = path.join(ROOT, 'src', 'procedures', 'rules.json');

const { PROCEDURES } = require('../src/procedures/registry.js');

const serialize = (dict) => JSON.stringify(dict, null, 2) + '\n';

const readDict = (dir, locale) =>
  JSON.parse(fs.readFileSync(path.join(dir, `${locale}.json`), 'utf8'));

function locales() {
  return fs
    .readdirSync(PROCEDURES_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.slice(0, -'.json'.length))
    .sort();
}

// Every variant the registry lists: { group, criterion, facet, ruleId, code },
// criterion null in a group that has none (best-practice).
function variants() {
  const out = [];
  for (const [group, entries] of Object.entries(PROCEDURES)) {
    const visit = (criterion, facets) => {
      for (const [facet, entry] of Object.entries(facets)) {
        for (const [ruleId, codes] of Object.entries(entry.variants || {})) {
          for (const code of codes) out.push({ group, criterion, facet, ruleId, code });
        }
      }
    };
    if (group === 'wcag') {
      for (const [criterion, facets] of Object.entries(entries)) visit(criterion, facets);
    } else visit(null, entries);
  }
  return out;
}

// A core rule's prefix: its i18n.titleKey without `_title`.
function prefixOf(ruleId) {
  const def = require('../src/core.js').getCheckDefById(ruleId);
  const titleKey = def && def.i18n && def.i18n.titleKey;
  if (typeof titleKey !== 'string' || !titleKey.endsWith('_title')) {
    throw new Error(`src/procedures/registry.js: ${ruleId} is not a core rule with a titleKey`);
  }
  return titleKey.slice(0, -'_title'.length);
}

// The key stem of each variant: `<prefix>_review_<CODE>_`.
function variantStems() {
  const stems = new Set();
  for (const { ruleId, code } of variants()) stems.add(`${prefixOf(ruleId)}_review_${code}_`);
  return stems;
}

const SUFFIX = /^(step[1-9][0-9]*|pass|fail)$/;

function isVariantKey(key, stems) {
  const at = key.indexOf('_review_');
  if (at < 0) return false;
  const rest = key.slice(at + '_review_'.length);
  const sep = rest.lastIndexOf('_');
  return (
    sep > 0 &&
    SUFFIX.test(rest.slice(sep + 1)) &&
    stems.has(key.slice(0, key.length - rest.length + sep + 1))
  );
}

// locale -> the review dictionary's text: the variants' keys of the
// procedures, in their order there.
function reviewDictionaries() {
  const stems = variantStems();
  const en = readDict(PROCEDURES_DIR, 'en');
  for (const stem of stems) {
    for (const suffix of ['step1', 'pass', 'fail']) {
      if (typeof en[stem + suffix] !== 'string') {
        throw new Error(`src/i18n/procedures/en.json has no ${stem + suffix}`);
      }
    }
  }
  const out = {};
  for (const locale of locales()) {
    const dict = readDict(PROCEDURES_DIR, locale);
    const review = {};
    for (const [key, text] of Object.entries(dict))
      if (isVariantKey(key, stems)) review[key] = text;
    out[locale] = serialize(review);
  }
  return out;
}

// rules.json: by rule id, in id order, the rule's prefix, the criteria it
// tests (wcagSc) and the facets it claims (meta.coverage.facetsBySc).
function rulesIndex() {
  const out = {};
  const catalog = require('../src/core.js')
    .getChecksCatalog()
    .slice()
    .sort((a, b) => (a.ruleId < b.ruleId ? -1 : a.ruleId > b.ruleId ? 1 : 0));
  for (const rule of catalog) {
    const titleKey = rule.i18n && rule.i18n.titleKey;
    const facetsBySc = (rule.coverage && rule.coverage.facetsBySc) || {};
    out[rule.ruleId] = {
      prefix: typeof titleKey === 'string' ? titleKey.replace(/_title$/, '') : null,
      criteria: Array.isArray(rule.wcagSc) ? rule.wcagSc.slice() : [],
      facets: facetsBySc
    };
  }
  return serialize(out);
}

function main(argv) {
  const check = argv.includes('--check');
  const want = reviewDictionaries();
  const rules = rulesIndex();
  const have = fs
    .readdirSync(REVIEW_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.slice(0, -'.json'.length));
  const stale = [];
  for (const [locale, text] of Object.entries(want)) {
    const file = path.join(REVIEW_DIR, `${locale}.json`);
    const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (current === text) continue;
    stale.push(path.relative(ROOT, file));
    if (!check) fs.writeFileSync(file, text);
  }
  const currentRules = fs.existsSync(RULES_FILE) ? fs.readFileSync(RULES_FILE, 'utf8') : null;
  if (currentRules !== rules) {
    stale.push(path.relative(ROOT, RULES_FILE));
    if (!check) fs.writeFileSync(RULES_FILE, rules);
  }
  for (const locale of have.filter((l) => !(l in want))) {
    const file = path.join(REVIEW_DIR, `${locale}.json`);
    stale.push(path.relative(ROOT, file));
    if (!check) fs.unlinkSync(file);
  }
  if (check && stale.length) {
    console.error(
      `Out of date: ${stale.join(', ')}. They are made from src/procedures and the rules: run \`npm run procedures\`.`
    );
    return 1;
  }
  console.log(
    stale.length
      ? `Wrote ${stale.join(', ')}`
      : 'The review dictionaries and src/procedures/rules.json are up to date.'
  );
  return 0;
}

module.exports = {
  reviewDictionaries,
  rulesIndex,
  variants,
  prefixOf,
  serialize,
  PROCEDURES_DIR,
  REVIEW_DIR,
  RULES_FILE
};

if (require.main === module) process.exitCode = main(process.argv.slice(2));
